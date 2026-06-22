import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const statusFromTelemetry = (soilHumidity) => {
  if (soilHumidity == null) return 'Normal'
  if (soilHumidity < 20) return 'Critical'
  if (soilHumidity < 35) return 'At Risk'
  return 'Normal'
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
  // KPI Data
  const kpis = ref({
    assignedParcels: 24,
    normalParcels: 16,
    atRisk: 6,
    criticalAlerts: 2
  })

  const status = ref('idle')
  const error = ref('')

  // Parcels List
  const parcels = ref([
    {
      id: 'p1',
      client: 'Agro Valle SAC',
      name: 'North Parcel',
      crop: 'Avocado',
      status: 'Normal',
      metrics: {
        soilMoisture: { value: 24, unit: '%', trend: 'flat', isAlert: false },
        ec: { value: 1.2, unit: 'dS/m', trend: 'flat', isAlert: false },
        ph: { value: 6.5, unit: '', trend: 'flat', isAlert: false },
        temp: { value: 22, unit: '°C', trend: 'flat', isAlert: false }
      }
    },
    {
      id: 'p2',
      client: 'Finca Santa Rosa',
      name: 'Sector A',
      crop: 'Blueberry',
      status: 'At Risk',
      metrics: {
        soilMoisture: { value: 12, unit: '%', trend: 'down', isAlert: true },
        ec: { value: 1.5, unit: 'dS/m', trend: 'flat', isAlert: false },
        ph: { value: 5.8, unit: '', trend: 'flat', isAlert: false },
        temp: { value: 25, unit: '°C', trend: 'flat', isAlert: false }
      }
    },
    {
      id: 'p3',
      client: 'Huerta Los Pinos',
      name: 'Greenhouse 2',
      crop: 'Tomato',
      status: 'Critical',
      metrics: {
        soilMoisture: { value: 28, unit: '%', trend: 'flat', isAlert: false },
        ec: { value: 3.8, unit: 'dS/m', trend: 'up', isAlert: true },
        ph: { value: 6.2, unit: '', trend: 'flat', isAlert: false },
        temp: { value: 28, unit: '°C', trend: 'flat', isAlert: false }
      }
    }
  ])

  // Priority Cases
  const priorityCases = ref([
    {
      id: 'c1',
      parcelName: 'Greenhouse 2',
      timeAgo: '12 min ago',
      title: 'High EC detected (3.8 dS/m).',
      subtitle: 'Critical risk to tomato crop.',
      type: 'critical'
    },
    {
      id: 'c2',
      parcelName: 'Sector A',
      timeAgo: '28 min ago',
      title: 'Moisture critically low (12%).',
      subtitle: 'Irrigation system check recommended.',
      type: 'warning'
    }
  ])

  // Parcels View Data
  const parcelKPIs = ref({
    clients: 12,
    linkedParcels: 24,
    pendingInvitations: 2,
    atRisk: 6
  })

  const supervisedParcels = ref([
    {
      id: 'sp1',
      clientInitials: 'AV',
      clientColor: '#e8f5e9',
      clientText: '#2e7d32',
      clientName: 'Agro Valle SAC',
      parcelName: 'North Parcel',
      crop: 'Avocado',
      location: 'Huaral',
      status: 'Normal',
      devicesOnline: 4,
      devicesTotal: 4,
      lastUpdate: '5 min ago',
      metrics: {
        soilMoisture: { value: '45%', label: 'Stable', isAlert: false },
        ec: { value: '1.2 dS/m', label: 'Optimal', isAlert: false },
        ph: { value: '6.5', label: 'Balanced', isAlert: false },
        temp: { value: '22°C', label: 'Stable', isAlert: false }
      },
      recommendedRanges: {
        soilMoisture: '30% - 50%',
        ec: '1.0 - 1.5',
        ph: '6.0 - 7.0',
        temp: '18° - 25°'
      },
      recentActivity: [
        { id: 1, title: 'Irrigation completed successfully', timeAgo: '1 hour ago', type: 'success' },
        { id: 2, title: 'Routine telemetry sync', timeAgo: '5 min ago', type: 'neutral' }
      ],
      agronomicRecommendation: 'Conditions are optimal. Continue standard irrigation schedule.',
      deviceHealth: {
        status: 'Online',
        battery: '95%',
        signal: 'Stable',
        lastSync: '5 min ago',
        deviceId: 'ID: SAT-AV-1042'
      }
    },
    {
      id: 'sp2',
      clientInitials: 'FS',
      clientColor: '#fff3e0',
      clientText: '#ef6c00',
      clientName: 'Finca Santa Rosa',
      parcelName: 'Sector A',
      crop: 'Blueberry',
      location: 'Cañete',
      status: 'At Risk',
      devicesOnline: 3,
      devicesTotal: 3,
      lastUpdate: '12 min ago',
      metrics: {
        soilMoisture: { value: '21%', label: 'Below recommended range', isAlert: true },
        ec: { value: '1.9 dS/m', label: 'Slightly elevated', isAlert: false },
        ph: { value: '5.6', label: 'Low', isAlert: false },
        temp: { value: '25°C', label: 'Stable', isAlert: false }
      },
      recommendedRanges: {
        soilMoisture: '28% - 35%',
        ec: '1.0 - 1.5',
        ph: '5.5 - 6.5',
        temp: '20° - 28°'
      },
      recentActivity: [
        { id: 1, title: 'Moisture dropped below threshold', timeAgo: '12 min ago', type: 'danger' },
        { id: 2, title: 'EC trend increased slightly', timeAgo: '35 min ago', type: 'warning' },
        { id: 3, title: 'Last recommendation sent', timeAgo: 'Yesterday', type: 'success' }
      ],
      agronomicRecommendation: 'Review irrigation schedule and apply a preventive watering adjustment for Sector A to address falling moisture levels and rising EC.',
      deviceHealth: {
        status: 'Online',
        battery: '82%',
        signal: 'Stable',
        lastSync: '12 min ago',
        deviceId: 'ID: SAT-BB-2041'
      }
    },
    {
      id: 'sp3',
      clientInitials: 'HL',
      clientColor: '#ffebee',
      clientText: '#c62828',
      clientName: 'Huerta Los Pinos',
      parcelName: 'Greenhouse 2',
      crop: 'Tomato',
      location: 'Pachacámac',
      status: 'Critical',
      devicesOnline: 2,
      devicesTotal: 3,
      lastUpdate: '3 min ago',
      metrics: {
        soilMoisture: { value: '28%', label: 'Stable', isAlert: false },
        ec: { value: '3.8 dS/m', label: 'Critical level', isAlert: true },
        ph: { value: '6.2', label: 'Stable', isAlert: false },
        temp: { value: '28°C', label: 'High', isAlert: true }
      },
      recommendedRanges: {
        soilMoisture: '25% - 35%',
        ec: '1.5 - 2.5',
        ph: '6.0 - 7.0',
        temp: '18° - 26°'
      },
      recentActivity: [
        { id: 1, title: 'Device disconnected', timeAgo: '3 min ago', type: 'danger' },
        { id: 2, title: 'EC reached critical threshold', timeAgo: '15 min ago', type: 'danger' }
      ],
      agronomicRecommendation: 'Urgent: Apply leaching fraction to reduce soil salinity. Verify greenhouse ventilation to lower temperature.',
      deviceHealth: {
        status: 'Offline',
        battery: '15%',
        signal: 'Weak',
        lastSync: '3 min ago',
        deviceId: 'ID: SAT-TM-3051'
      }
    },
    {
      id: 'sp4',
      clientInitials: 'CV',
      clientColor: '#f5f5f5',
      clientText: '#616161',
      clientName: 'Campo Verde',
      parcelName: 'Lettuce Block',
      crop: 'Lettuce',
      location: 'Lurín',
      status: 'Pending Acceptance',
      devicesOnline: 0,
      devicesTotal: 0,
      lastUpdate: 'Not available',
      metrics: {
        soilMoisture: { value: '--', label: 'No data', isAlert: false },
        ec: { value: '--', label: 'No data', isAlert: false },
        ph: { value: '--', label: 'No data', isAlert: false },
        temp: { value: '--', label: 'No data', isAlert: false }
      },
      recentActivity: [
        { id: 1, title: 'Invitation sent to client', timeAgo: '2 days ago', type: 'neutral' }
      ]
    }
  ])

  const portfolioSummary = ref({
    totalClients: 12,
    activeParcels: 24,
    pendingInvitations: 2,
    criticalParcels: 2
  })

  async function loadDashboard() {
    status.value = 'loading'
    error.value = ''

    const tasks = await Promise.allSettled([
      apiRequest({ method: 'GET', url: '/api/v1/dashboard/agronomist' }),
      apiRequest({ method: 'GET', url: '/api/v1/dashboard/priority-cases' }),
      apiRequest({ method: 'GET', url: '/api/v1/agronomist/clients/detailed' }),
    ])

    if (tasks[0].status === 'fulfilled') {
      const d = tasks[0].value?.data || {}
      kpis.value = {
        assignedParcels: d.totalFarms ?? kpis.value.assignedParcels,
        normalParcels: Number(d.onlineDevices ?? 0),
        atRisk: Number(d.offlineDevices ?? 0) + Number(d.errorDevices ?? 0),
        criticalAlerts: Number(d.lowBatteryDevices ?? 0),
      }
      portfolioSummary.value = {
        totalClients: d.totalFarms ?? portfolioSummary.value.totalClients,
        activeParcels: d.activeFarms ?? portfolioSummary.value.activeParcels,
        pendingInvitations: portfolioSummary.value.pendingInvitations,
        criticalParcels: Number(d.errorDevices ?? 0),
      }
    }

    if (tasks[1].status === 'fulfilled') {
      const d = tasks[1].value?.data || {}
      const cases = Array.isArray(d.cases) ? d.cases : []
      if (cases.length) {
        priorityCases.value = cases.map((c) => ({
          id: String(c.id),
          parcelName: c.serialNumber || `Device ${c.deviceId}`,
          timeAgo: 'Just now',
          title: c.issue || 'Device issue',
          subtitle: `Type: ${c.type || 'Unknown'} — Health: ${c.healthStatus || 'Unknown'}`,
          type: c.severity === 'HIGH' ? 'critical' : 'warning',
        }))
      }
    }

    if (tasks[2].status === 'fulfilled') {
      const clients = Array.isArray(tasks[2].value?.data) ? tasks[2].value.data : []
      if (clients.length) {
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
    }

    const failed = tasks.some((t) => t.status === 'rejected')
    status.value = failed ? 'partial' : 'success'
    if (failed) error.value = 'Some data loaded from cache.'
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
