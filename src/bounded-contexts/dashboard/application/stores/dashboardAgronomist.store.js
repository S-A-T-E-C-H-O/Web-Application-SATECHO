import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const statusFromTelemetry = (soilHumidity) => {
  if (soilHumidity == null) return 'Normal'
  if (soilHumidity < 20) return 'Critical'
  if (soilHumidity < 35) return 'At Risk'
  return 'Normal'
}

const relativeTime = (isoString) => {
  if (!isoString) return 'Recently'
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

const mapClients = (clients) =>
  clients.map((c) => ({
    id: String(c.id),
    client: c.farmerName || `Farmer ${c.farmerId}`,
    name: c.farmName || 'Farm',
    crop: c.cropType
      ? c.cropType.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')
      : 'Unknown',
    status: statusFromTelemetry(c.soilHumidity),
    metrics: {
      soilMoisture: {
        value: c.soilHumidity ?? '--',
        unit: '%',
        trend: 'flat',
        isAlert: c.soilHumidity != null && c.soilHumidity < 35,
      },
      ec: {
        value: c.ec ?? '--',
        unit: 'dS/m',
        trend: 'flat',
        isAlert: c.ec != null && c.ec > 3,
      },
      ph: { value: '--', unit: '', trend: 'flat', isAlert: false },
      temp: {
        value: c.temperature ?? '--',
        unit: '°C',
        trend: 'flat',
        isAlert: false,
      },
    },
  }))

const mapSupervisedParcels = (clients) =>
  clients.map((c) => {
    const initials = (c.farmerName || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    const status = statusFromTelemetry(c.soilHumidity)
    return {
      id: String(c.id),
      farmerId: c.farmerId,
      clientInitials: initials,
      clientColor: '#e8f5e9',
      clientText: '#2e7d32',
      clientName: c.farmerName || `Farmer ${c.farmerId}`,
      parcelName: c.farmName || 'Farm',
      crop: c.cropType
        ? c.cropType.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')
        : 'Unknown',
      location: c.location || '',
      status,
      devicesOnline: 0,
      devicesTotal: 0,
      lastUpdate: 'Just updated',
      metrics: {
        soilMoisture: {
          value: c.soilHumidity != null ? `${c.soilHumidity}%` : '--',
          label: statusFromTelemetry(c.soilHumidity),
          isAlert: c.soilHumidity != null && c.soilHumidity < 35,
        },
        ec: {
          value: c.ec != null ? `${c.ec} dS/m` : '--',
          label: c.ec != null && c.ec > 3 ? 'Elevated' : 'Normal',
          isAlert: c.ec != null && c.ec > 3,
        },
        ph: { value: '--', label: 'No data', isAlert: false },
        temp: {
          value: c.temperature != null ? `${c.temperature}°C` : '--',
          label: 'Stable',
          isAlert: false,
        },
      },
      recommendedRanges: {
        soilMoisture: '30% - 60%',
        ec: '1.0 - 2.5',
        ph: '6.0 - 7.0',
        temp: '18° - 28°',
      },
      recentActivity: [],
      agronomicRecommendation: '',
    }
  })

export const useDashboardAgronomistStore = defineStore('dashboardAgronomist', () => {
  const kpis = ref({
    assignedParcels: 0,
    normalParcels: 0,
    atRisk: 0,
    criticalAlerts: 0,
  })

  const status = ref('idle')
  const error = ref('')

  const parcels = ref([])
  const priorityCases = ref([])

  const parcelKPIs = ref({
    clients: 0,
    linkedParcels: 0,
    pendingInvitations: 0,
    atRisk: 0,
  })

  const supervisedParcels = ref([])

  const portfolioSummary = ref({
    totalClients: 0,
    activeParcels: 0,
    pendingInvitations: 0,
    criticalParcels: 0,
  })

  async function loadDashboard() {
    status.value = 'loading'
    error.value = ''

    // There is no GET /api/v1/dashboard/agronomist in the backend — the KPIs
    // are derived from real endpoints instead: the device fleet
    // (GET /api/v1/devices) and the client roster (clients/detailed below).
    const tasks = await Promise.allSettled([
      apiRequest({ method: 'GET', url: '/api/v1/devices' }),
      apiRequest({ method: 'GET', url: '/api/v1/dashboard/priority-cases' }),
      apiRequest({ method: 'GET', url: '/api/v1/agronomist/clients/detailed' }),
    ])

    const devices = tasks[0].status === 'fulfilled' && Array.isArray(tasks[0].value?.data)
      ? tasks[0].value.data
      : []
    const clientRows = tasks[2].status === 'fulfilled' && Array.isArray(tasks[2].value?.data)
      ? tasks[2].value.data
      : []

    if (tasks[0].status === 'fulfilled' || tasks[2].status === 'fulfilled') {
      const onlineDevices = devices.filter((d) => d.online).length
      const offlineDevices = devices.length - onlineDevices
      const errorDevices = devices.filter(
        (d) => String(d.healthStatus || '').toUpperCase() === 'ERROR'
      ).length
      const lowBatteryDevices = devices.filter(
        (d) => d.batteryLevel != null && Number(d.batteryLevel) < 20
      ).length

      kpis.value = {
        assignedParcels: clientRows.length,
        normalParcels: onlineDevices,
        atRisk: offlineDevices + errorDevices,
        criticalAlerts: lowBatteryDevices,
      }
      portfolioSummary.value = {
        totalClients: clientRows.length,
        activeParcels: clientRows.length,
        pendingInvitations: 0,
        criticalParcels: clientRows.filter(
          (c) => c.soilHumidity != null && c.soilHumidity < 20
        ).length,
      }
    }

    // The backend returns the priority-case list directly (not wrapped in
    // `{ cases: [...] }`) — see PriorityCaseResource. Always overwrite, even
    // with an empty list, so the "no critical cases" empty state is real
    // (EP-009-US005 Scenario 2) instead of silently keeping stale data.
    if (tasks[1].status === 'fulfilled') {
      const cases = Array.isArray(tasks[1].value?.data) ? tasks[1].value.data : []
      priorityCases.value = cases.map((c) => ({
        id: String(c.alertId),
        farmerId: c.farmerUserId,
        farmId: c.farmId,
        parcelName: c.farmName || `Farmer ${c.farmerUserId}`,
        timeAgo: relativeTime(c.createdAt),
        title: (c.alertType || 'Alert').replace(/_/g, ' '),
        subtitle: `Farmer: ${c.farmerName || 'Unknown'}`,
        type: c.severity === 'CRITICAL' ? 'critical' : 'warning',
      }))
    }

    if (tasks[2].status === 'fulfilled') {
      const clients = Array.isArray(tasks[2].value?.data) ? tasks[2].value.data : []
      parcels.value = mapClients(clients)
      supervisedParcels.value = mapSupervisedParcels(clients)
      parcelKPIs.value = {
        clients: clients.length,
        linkedParcels: clients.length,
        pendingInvitations: 0,
        atRisk: clients.filter(
          (c) => c.soilHumidity != null && c.soilHumidity < 35
        ).length,
      }
    }

    const failed = tasks.filter((t) => t.status === 'rejected')
    status.value = failed.length ? 'partial' : 'success'
    if (failed.length) {
      error.value =
        failed[0].reason?.message || 'Some dashboard data could not be loaded.'
    }
  }

  return {
    kpis,
    parcels,
    priorityCases,
    parcelKPIs,
    supervisedParcels,
    portfolioSummary,
    status,
    error,
    loadDashboard,
  }
})
