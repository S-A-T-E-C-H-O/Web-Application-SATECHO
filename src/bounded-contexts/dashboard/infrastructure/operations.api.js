import { apiRequest } from '@/shared/infrastructure/http/api-client'

const getFirstFarm = async () => {
  const resp = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
  const farms = Array.isArray(resp?.data) ? resp.data : []
  return farms[0] || null
}

export const operationsApi = {
  async getSecurityEvents(filter = 'all') {
    const farm = await getFirstFarm()
    if (!farm) return { items: [] }

    const params = { limit: 50 }
    if (filter !== 'all') params.severity = filter.toUpperCase()

    const resp = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farm.id}/security/events`,
      params,
    })
    const events = Array.isArray(resp?.data) ? resp.data : []

    const items = events.map((e) => ({
      id: String(e.id),
      type: String(e.classification || 'Motion detected').replace(/_/g, ' '),
      trust: e.confidenceLevel != null ? Math.round(e.confidenceLevel * 100) : 100,
      note: '',
      location: e.locationDescription || 'Unknown',
      time: e.detectedAt ? new Date(e.detectedAt).toLocaleString() : 'Unknown',
      device: e.deviceId ? `PIR-${e.deviceId}` : 'PIR-001',
      priority: (e.severity || 'INFO').toLowerCase(),
      reviewed: Boolean(e.acknowledged),
      icon: 'sensors',
    }))

    return { items }
  },

  async getSecuritySettings() {
    const farm = await getFirstFarm()
    if (!farm) return null

    const resp = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farm.id}/security/settings`,
    })

    return resp?.data || null
  },

  async saveSecuritySettings(settings) {
    const farm = await getFirstFarm()
    if (!farm) return null

    const resp = await apiRequest({
      method: 'PUT',
      url: `/api/v1/farms/${farm.id}/security/settings`,
      data: settings,
    })

    return resp?.data || null
  },

  async acknowledgeSecurityEvent(eventId, acknowledgedBy) {
    if (!eventId || Number.isNaN(Number(eventId))) return null

    const resp = await apiRequest({
      method: 'PATCH',
      url: `/api/v1/security/events/${eventId}`,
      data: { acknowledgedBy: Number(acknowledgedBy) || null },
    })

    return resp?.data || null
  },

  async registerIrrigationAction(action) {
    const zoneId = action.zoneId
    if (!zoneId || isNaN(Number(zoneId))) return {}

    const farm = await getFirstFarm()
    if (!farm) return {}

    const zonesResp = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farm.id}/zones`,
    })
    const zones = Array.isArray(zonesResp?.data) ? zonesResp.data : []
    const zone = zones.find((z) => String(z.id) === String(zoneId))
    const deviceId = zone?.deviceId || null

    const isOpen = action.action === 'open' || action.action === 'start'
    if (isOpen && !deviceId) {
      throw new Error('The selected zone does not have a linked actuator.')
    }
    const url = isOpen
      ? `/api/v1/zones/${zoneId}/irrigation/start`
      : `/api/v1/zones/${zoneId}/irrigation/stop`
    const data = isOpen
      ? {
          farmId: farm.id,
          deviceId,
          triggeredBy: action.user || 'user',
          durationMinutes: action.durationMinutes || 15,
        }
      : { flowRateLitersPerMinute: 10 }

    const resp = await apiRequest({ method: 'POST', url, data })
    return resp?.data || {}
  },

  async saveNotificationPreferences(preferences) {
    const resp = await apiRequest({
      method: 'PUT',
      url: '/api/v1/notifications/preferences',
      data: preferences,
    })
    return resp?.data || {}
  },

  async getNotificationPreferences() {
    const resp = await apiRequest({ method: 'GET', url: '/api/v1/notifications/preferences' })
    return Array.isArray(resp?.data) ? resp.data : []
  },
}
