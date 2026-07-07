import { apiRequest } from '@/shared/infrastructure/http/api-client'

const cropTypeLabel = (cropType) =>
  String(cropType || 'Unknown')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const toRelativeTime = (isoString) => {
  if (!isoString) return 'No readings yet'
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

const deviceTypeIcon = (type) => {
  const map = {
    SOIL_SENSOR: 'water_drop',
    VALVE_CONTROLLER: 'valve',
    WEATHER_STATION: 'air',
    PIR_SENSOR: 'sensors',
    ACTUATOR: 'settings_input_component',
  }
  return map[type] || 'developer_board'
}

const mapReadings = (readings = []) => {
  const result = {}
  readings.forEach((reading) => {
    if (reading.metricType === 'SOIL_MOISTURE') result.humidity = reading.value
    if (reading.metricType === 'ELECTRICAL_CONDUCTIVITY') result.ec = reading.value
    if (reading.metricType === 'SOIL_PH') result.ph = reading.value
    if (['AMBIENT_TEMPERATURE', 'SOIL_TEMPERATURE'].includes(reading.metricType)) {
      result.temp = reading.value
    }
    if (reading.timestamp && (!result.timestamp || reading.timestamp > result.timestamp)) {
      result.timestamp = reading.timestamp
    }
  })
  return result
}

const zoneStatus = (readings, thresholds = {}) => {
  if (!Object.keys(readings).some((key) => key !== 'timestamp')) return 'unknown'

  const checks = [
    ['humidity', thresholds.minMoisture, thresholds.maxMoisture],
    ['ec', thresholds.minEc, thresholds.maxEc],
    ['ph', thresholds.minPh, thresholds.maxPh],
    ['temp', thresholds.minTemperature, thresholds.maxTemperature],
  ]

  const outside = checks.some(([key, min, max]) =>
    readings[key] !== undefined && ((min !== undefined && readings[key] < min) || (max !== undefined && readings[key] > max))
  )
  return outside ? 'attention' : 'normal'
}

const getLatestReadingsByZone = async (zoneId) => {
  if (!zoneId) return {}

  try {
    const response = await apiRequest({
      method: 'GET',
      url: `/api/v1/telemetry/zones/${zoneId}/latest`,
    })

    return mapReadings(Array.isArray(response.data) ? response.data : [])
  } catch {
    return {}
  }
}

const getFarmContext = async () => {
  const farmsResponse = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
  const farms = Array.isArray(farmsResponse.data) ? farmsResponse.data : []
  const farm = farms[0] || null
  if (!farm) return { farm: null, zones: [] }

  const zonesResponse = await apiRequest({
    method: 'GET',
    url: `/api/v1/farms/${farm.id}/zones`,
  })
  return { farm, zones: Array.isArray(zonesResponse.data) ? zonesResponse.data : [] }
}

const getZoneSessions = async (zones) =>
  Promise.all(
    zones.map(async (zone) => {
      const [historyResult, activeResult] = await Promise.allSettled([
        apiRequest({ method: 'GET', url: `/api/v1/zones/${zone.id}/irrigation/history`, params: { limit: 20 } }),
        apiRequest({ method: 'GET', url: `/api/v1/zones/${zone.id}/irrigation/active` }),
      ])
      return {
        history:
          historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)
            ? historyResult.value.data
            : [],
        active: activeResult.status === 'fulfilled' ? activeResult.value.data : null,
      }
    })
  )

const sessionToHistoryItems = (zone, sessions) =>
  sessions.flatMap((session) => {
    const common = {
      area: zone.name,
      water: session.totalWaterUsedLiters == null ? '--' : String(Math.round(session.totalWaterUsedLiters)),
      user: session.triggeredBy || 'System',
    }
    const open = {
      ...common,
      id: `${session.id}-open`,
      dateTime: session.startedAt ? new Date(session.startedAt).toLocaleString() : '--',
      action: 'Open',
      duration: session.durationMinutes ? `${session.durationMinutes} min` : 'In progress',
    }
    if (!session.stoppedAt) return [open]
    return [
      open,
      {
        ...common,
        id: `${session.id}-close`,
        dateTime: new Date(session.stoppedAt).toLocaleString(),
        action: 'Close',
        duration: `${session.durationMinutes || 0} min`,
      },
    ]
  })

export const farmApi = {
  async getOverview() {
    const { farm, zones } = await getFarmContext()
    if (!farm) return { farm: null, zones: [], alerts: [] }

    const [readingResults, sessionResults] = await Promise.all([
      Promise.allSettled(
        zones.map((zone) => apiRequest({ method: 'GET', url: `/api/v1/telemetry/zones/${zone.id}/latest` }))
      ),
      getZoneSessions(zones),
    ])

    const mappedZones = zones.map((zone, index) => {
      const readings =
        readingResults[index].status === 'fulfilled'
          ? mapReadings(readingResults[index].value.data)
          : {}
      const active = sessionResults[index].active
      const history = sessionResults[index].history
      const lastSession = history[0]
      const status = zoneStatus(readings, zone.thresholds)
      return {
        id: String(zone.id),
        name: zone.name,
        crop: cropTypeLabel(zone.cropType || farm.cropType),
        cropType: zone.cropType || farm.cropType,
        areaHectares: zone.areaHectares,
        deviceId: zone.deviceId || null,
        thresholds: zone.thresholds || {},
        humidity: readings.humidity ?? '--',
        ec: readings.ec ?? '--',
        ph: readings.ph ?? '--',
        temp: readings.temp ?? '--',
        lastReading: toRelativeTime(readings.timestamp),
        waterUsed: lastSession?.totalWaterUsedLiters == null ? '--' : Math.round(lastSession.totalWaterUsedLiters),
        lastWatering: active?.startedAt
          ? `In progress since ${new Date(active.startedAt).toLocaleTimeString()}`
          : lastSession?.stoppedAt
            ? new Date(lastSession.stoppedAt).toLocaleString()
            : 'No irrigation history',
        irrigating: Boolean(active?.id),
        irrigationStartedAt: active?.startedAt ? new Date(active.startedAt).getTime() : null,
        status,
      }
    })

    const alerts = mappedZones
      .filter((zone) => zone.status === 'attention')
      .map((zone) => ({
        id: `alert-${zone.id}`,
        level: 'attention',
        badge: 'ATTENTION',
        title: zone.name,
        description: 'Current readings are outside the configured zone thresholds.',
        time: zone.lastReading,
        action: 'View details',
      }))

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        subtitle: `${farm.location || 'Property'} - ${farm.hectares || 0} ha`,
        owner: '',
        role: 'Farmer',
        location: farm.location,
        sizeHectares: farm.hectares,
        cropType: farm.cropType,
      },
      zones: mappedZones,
      alerts,
    }
  },

  async getIrrigationHistory() {
    const { zones } = await getFarmContext()
    const sessions = await getZoneSessions(zones)
    const items = zones
      .flatMap((zone, index) => sessionToHistoryItems(zone, sessions[index].history))
      .sort((left, right) => String(right.dateTime).localeCompare(String(left.dateTime)))
    return { items }
  },

  async getDevices(type = 'all', status = 'all') {
    const { zones } = await getFarmContext()

    const zoneByDeviceId = new Map(
        zones.filter((zone) => zone.deviceId).map((zone) => [String(zone.deviceId), zone])
    )

    const params = {}
    if (type !== 'all') params.type = type
    if (status !== 'all') params.status = status

    const response = await apiRequest({
      method: 'GET',
      url: '/api/v1/devices',
      params,
    })

    const devices = Array.isArray(response.data) ? response.data : []

    const items = await Promise.all(
        devices.map(async (device) => {
          const zone = zoneByDeviceId.get(String(device.id))
          const readings = await getLatestReadingsByZone(zone?.id)

          const hasRecentReading = Boolean(readings.timestamp)

          return {
            id: String(device.id),
            name: device.serialNumber || `Device ${device.id}`,
            code: device.serialNumber || String(device.id),
            type: device.type || 'SOIL_SENSOR',
            zone: zone?.name || 'Not assigned',
            zoneId: zone?.id || null,

            status: String(device.status || (hasRecentReading ? 'ACTIVE' : 'INACTIVE')).toLowerCase(),
            online: Boolean(device.online || hasRecentReading),

            battery: device.batteryLevel ?? '--',
            firmware: device.firmwareVersion || 'v3.0',
            health: device.healthStatus || (hasRecentReading ? 'HEALTHY' : '--'),

            lastReading: toRelativeTime(device.lastHeartbeatAt || device.lastTelemetryAt || readings.timestamp),
            icon: deviceTypeIcon(device.type || 'SOIL_SENSOR'),

            moisture: readings.humidity ?? '--',
            ec: readings.ec ?? '--',
            ph: readings.ph ?? '--',
            temperature: readings.temp ?? '--',
          }
        })
    )

    return { items }
  },

  async getDeviceStatus(deviceId) {
    const response = await apiRequest({ method: 'GET', url: `/api/v1/devices/${deviceId}/status` })
    return response.data || {}
  },

  async getZoneLatestTelemetry(zoneId) {
    const response = await apiRequest({ method: 'GET', url: `/api/v1/telemetry/zones/${zoneId}/latest` })
    return mapReadings(Array.isArray(response.data) ? response.data : [])
  },

  async claimEdgeDevice({ serialNumber, deviceCode, farmId, zoneId, linkToZone = true }) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/edge/devices/claim',
      data: {
        serial_number: serialNumber,
        device_code: deviceCode,
        farm_id: Number(farmId),
        zone_id: Number(zoneId),
        link_to_zone: Boolean(linkToZone),
      },
    })
    return response.data || {}
  },

  async deactivateDevice(deviceId) {
    const response = await apiRequest({ method: 'POST', url: `/api/v1/devices/${deviceId}/deactivate` })
    return response.data || {}
  },

  async createZone(farmId, zone) {
    const response = await apiRequest({
      method: 'POST',
      url: `/api/v1/farms/${farmId}/zones`,
      data: zone,
    })
    return response.data || {}
  },

  async updateFarm(farmId, farm) {
    const response = await apiRequest({
      method: 'PUT',
      url: `/api/v1/farms/${farmId}`,
      data: farm,
    })
    return response.data || {}
  },

  async updateZone(zoneId, zone) {
    const response = await apiRequest({
      method: 'PATCH',
      url: `/api/v1/zones/${zoneId}`,
      data: zone,
    })
    return response.data || {}
  },

  async getCropTypes() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/crops/types' })
    const crops = Array.isArray(response.data) ? response.data : []
    return crops.map((crop) => ({ value: crop.name, label: crop.displayName || cropTypeLabel(crop.name) }))
  },
}
