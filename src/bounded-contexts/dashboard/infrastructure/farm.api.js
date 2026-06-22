import { apiRequest } from '@/shared/infrastructure/http/api-client'

const toRelativeTime = (isoString) => {
  if (!isoString) return 'Unknown'
  const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000)
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
    GATEWAY: 'router',
  }
  return map[type] || 'developer_board'
}

const mapReadings = (readings) => {
  const result = {}
  for (const r of readings) {
    if (r.metricType === 'SOIL_MOISTURE') result.humidity = r.value
    else if (r.metricType === 'ELECTRICAL_CONDUCTIVITY') result.ec = r.value
    else if (r.metricType === 'SOIL_PH') result.ph = r.value
    else if (r.metricType === 'AMBIENT_TEMPERATURE' || r.metricType === 'SOIL_TEMPERATURE')
      result.temp = r.value
  }
  return result
}

const zoneStatus = (readings) => {
  if (readings.humidity === undefined) return 'normal'
  if (readings.humidity < 30) return 'critical'
  if (readings.humidity < 50) return 'attention'
  return 'normal'
}

export const farmApi = {
  async getOverview() {
    const farmsResp = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
    const farms = Array.isArray(farmsResp?.data) ? farmsResp.data : []
    if (farms.length === 0) throw new Error('No farms found')

    const farm = farms[0]
    const zonesResp = await apiRequest({ method: 'GET', url: `/api/v1/farms/${farm.id}/zones` })
    const zones = Array.isArray(zonesResp?.data) ? zonesResp.data : []

    const zoneResults = await Promise.allSettled(
      zones.map((z) =>
        apiRequest({ method: 'GET', url: `/api/v1/telemetry/zones/${z.id}/latest` })
      )
    )

    const mappedZones = zones.map((z, i) => {
      const readings =
        zoneResults[i].status === 'fulfilled' &&
        Array.isArray(zoneResults[i].value?.data)
          ? mapReadings(zoneResults[i].value.data)
          : {}
      return {
        id: String(z.id),
        name: z.name,
        crop: z.cropType || farm.cropType || 'Unknown',
        areaHectares: z.areaHectares,
        humidity: readings.humidity ?? 50,
        ec: readings.ec ?? 1.5,
        ph: readings.ph ?? 6.5,
        temp: readings.temp ?? 22,
        waterUsed: Math.round((z.areaHectares || 1) * 90),
        lastWatering: 'No data',
        irrigating: false,
        status: zoneStatus(readings),
      }
    })

    const alerts = mappedZones
      .filter((z) => z.status !== 'normal')
      .map((z) => ({
        id: `alert-${z.id}`,
        level: z.status,
        badge: z.status.toUpperCase(),
        title: z.name,
        description:
          z.status === 'critical'
            ? `Critical humidity: ${z.humidity}% — irrigation required`
            : `Zone ${z.name}: humidity ${z.humidity}% near threshold`,
        time: 'Just now',
        action: z.status === 'critical' ? 'Open irrigation' : 'View details',
      }))

    return {
      farm: {
        name: farm.name,
        subtitle: `${farm.location || 'Property'} — ${farm.hectares} ha`,
        owner: '',
        role: 'Farmer',
        location: farm.location,
        sizeHectares: farm.hectares,
      },
      metrics: null,
      alerts,
      zones: mappedZones,
    }
  },

  async getIrrigationHistory(area = 'all') {
    const farmsResp = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
    const farms = Array.isArray(farmsResp?.data) ? farmsResp.data : []
    if (farms.length === 0) return { items: [] }

    const zonesResp = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farms[0].id}/zones`,
    })
    const zones = Array.isArray(zonesResp?.data) ? zonesResp.data : []

    const historyResults = await Promise.allSettled(
      zones.map((z) =>
        apiRequest({
          method: 'GET',
          url: `/api/v1/zones/${z.id}/irrigation/history`,
          params: { limit: 20 },
        })
      )
    )

    const items = zones.flatMap((z, i) => {
      if (historyResults[i].status !== 'fulfilled') return []
      const sessions = Array.isArray(historyResults[i].value?.data)
        ? historyResults[i].value.data
        : []
      return sessions.flatMap((s) => {
        const openEntry = {
          id: `${s.id}-open`,
          dateTime: s.startedAt
            ? new Date(s.startedAt).toISOString().slice(0, 16).replace('T', ' ')
            : '',
          area: z.name,
          action: 'Open',
          duration: s.durationMinutes ? `${s.durationMinutes} min` : 'In progress',
          water: s.totalWaterUsedLiters ? String(Math.round(s.totalWaterUsedLiters)) : '0',
          user: s.triggeredBy || 'System',
        }
        if (!s.stoppedAt) return [openEntry]
        return [
          openEntry,
          {
            id: `${s.id}-close`,
            dateTime: new Date(s.stoppedAt).toISOString().slice(0, 16).replace('T', ' '),
            area: z.name,
            action: 'Close',
            duration: `${s.durationMinutes || 0} min`,
            water: s.totalWaterUsedLiters ? String(Math.round(s.totalWaterUsedLiters)) : '0',
            user: s.triggeredBy || 'System',
          },
        ]
      })
    })

    return { items: items.sort((a, b) => b.dateTime.localeCompare(a.dateTime)) }
  },

  async getDevices(type = 'all', status = 'all') {
    const params = {}
    if (type !== 'all') params.type = type.toUpperCase()
    if (status !== 'all') params.status = status.toUpperCase()

    const resp = await apiRequest({ method: 'GET', url: '/api/v1/devices', params })
    const devices = Array.isArray(resp?.data) ? resp.data : []

    const items = devices.map((d) => ({
      id: String(d.id),
      name: d.serialNumber || `Device ${d.id}`,
      code: d.serialNumber || String(d.id),
      type: d.type || 'Unknown',
      zone: 'Unknown',
      status: d.online ? 'online' : 'offline',
      battery: d.batteryLevel ?? 100,
      signal: 90,
      firmware: d.firmwareVersion || 'v1.0.0',
      health: d.healthStatus || 'Healthy',
      lastReading: toRelativeTime(d.lastHeartbeatAt || d.lastTelemetryAt),
      icon: deviceTypeIcon(d.type),
    }))

    return { items }
  },
}
