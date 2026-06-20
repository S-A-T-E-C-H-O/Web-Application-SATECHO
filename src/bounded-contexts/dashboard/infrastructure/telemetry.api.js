import { apiRequest } from '@/shared/infrastructure/http/api-client'

const getFirstFarmAndZone = async () => {
  const farmsResp = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
  const farms = Array.isArray(farmsResp?.data) ? farmsResp.data : []
  if (!farms.length) return { farmId: null, farmZones: [], zoneId: null }

  const farmId = farms[0].id
  const zonesResp = await apiRequest({ method: 'GET', url: `/api/v1/farms/${farmId}/zones` })
  const farmZones = Array.isArray(zonesResp?.data) ? zonesResp.data : []
  return { farmId, farmZones, zoneId: farmZones[0]?.id || null }
}

export const telemetryApi = {
  async getCurrentReadings() {
    const { zoneId } = await getFirstFarmAndZone()
    if (!zoneId) throw new Error('No zone found')

    const resp = await apiRequest({
      method: 'GET',
      url: `/api/v1/telemetry/zones/${zoneId}/latest`,
    })
    const readings = Array.isArray(resp?.data) ? resp.data : []

    const result = {}
    for (const r of readings) {
      if (r.metricType === 'SOIL_MOISTURE') result.humidity_fc28 = r.value
      else if (r.metricType === 'ELECTRICAL_CONDUCTIVITY') result.salinity_hr202l = r.value
      else if (r.metricType === 'AMBIENT_TEMPERATURE') result.ambient_temp_dht11 = r.value
      else if (r.metricType === 'SOIL_TEMPERATURE') result.soil_temp_ds18b20 = r.value
    }
    result.security_pir_status = 'CLEAR'
    return result
  },

  async getSalinityHistory(period = '24h') {
    const { zoneId } = await getFirstFarmAndZone()
    if (!zoneId) throw new Error('No zone found')

    const hours = period === '7d' ? 168 : period === '48h' ? 48 : 24
    const from = new Date(Date.now() - hours * 3600 * 1000).toISOString()

    const resp = await apiRequest({
      method: 'GET',
      url: `/api/v1/telemetry/zones/${zoneId}/history`,
      params: { metric: 'ELECTRICAL_CONDUCTIVITY', from },
    })
    const readings = Array.isArray(resp?.data) ? resp.data : []

    return readings.map((r) => ({
      timestamp: r.timestamp
        ? new Date(r.timestamp).toISOString().slice(0, 16).replace('T', ' ')
        : '',
      salinity_hr202l: r.value,
    }))
  },

  async getPirEvents() {
    const { farmId } = await getFirstFarmAndZone()
    if (!farmId) throw new Error('No farm found')

    const resp = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farmId}/security/events`,
      params: { limit: 20 },
    })
    const events = Array.isArray(resp?.data) ? resp.data : []

    return events.map((e) => ({
      id: String(e.id),
      timestamp: e.detectedAt
        ? new Date(e.detectedAt).toISOString().slice(0, 16).replace('T', ' ')
        : '',
      status: e.acknowledged ? 'CLEAR' : 'DETECTED',
      zone: e.locationDescription || 'Perimeter',
    }))
  },

  async toggleIrrigation(irrigationState) {
    const { farmId, farmZones } = await getFirstFarmAndZone()
    if (!farmZones.length) return {}

    const zone = farmZones[0]
    const url = irrigationState.active
      ? `/api/v1/zones/${zone.id}/irrigation/start`
      : `/api/v1/zones/${zone.id}/irrigation/stop`
    const data = irrigationState.active
      ? {
          farmId,
          deviceId: zone.deviceId || null,
          triggeredBy: 'user',
          durationMinutes: 15,
        }
      : { flowRateLitersPerMinute: 10 }

    const resp = await apiRequest({ method: 'POST', url, data })
    return resp?.data || {}
  },
}
