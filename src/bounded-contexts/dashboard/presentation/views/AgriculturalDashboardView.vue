<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import { useDashboardStore } from '@/bounded-contexts/dashboard/application/stores/dashboard.store'
import { useBillingStore } from '@/bounded-contexts/billing/application/stores/billing.store'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const billingStore = useBillingStore()

const irrigationTab = ref('control')
const securityTab = ref('events')
const notificationsTab = ref('channels')
const selectedDuration = ref(15)
const historyArea = ref('all')
const deviceStatus = ref('all')
const deviceType = ref('all')
const isEditingProfile = ref(false)
const isUserMenuOpen = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const profileForm = ref({
  fullName: '',
  email: '',
  phone: '',
  location: '',
  propertyName: '',
  sizeHectares: '',
})
const isZoneDialogOpen = ref(false)
const savingZone = ref(false)
const zoneForm = ref({ id: null, name: '', areaHectares: '', cropType: '' })
const isEdgeDialogOpen = ref(false)
const claimingEdge = ref(false)
const claimingDemoEdge = ref(false)
const edgeForm = ref({
  serialNumber: 'SEN-SAT-0401',
  deviceCode: 'edge-shared-secret-change-me',
  zoneId: '',
  linkToZone: true,
})

const planLabel = computed(() => {
  const labels = { FREE: 'Free', BASIC: 'Basic', PRO: 'Professional' }
  return labels[billingStore.currentTier] || billingStore.currentTier
})
const memberSince = computed(() => {
  const accounts = JSON.parse(
      localStorage.getItem(
          'satecho.auth.accounts'
      ) || '[]'
  )

  const account = accounts.find(
      item => item.id === authStore.user?.id
  )

  if (!account?.createdAt) {
    return 'Unknown'
  }

  return new Date(
      account.createdAt
  ).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
      }
  )
})

const changePlan = async (tier) => {
  if (tier === billingStore.currentTier) {
    dashboardStore.setFeedback('You are already using this plan.')
    return
  }
  const confirmed = window.confirm(`Switch to the ${tier} plan?`)
  if (!confirmed) return
  try {
    await billingStore.subscribe(tier)
    dashboardStore.setFeedback(`Plan changed to ${tier} successfully.`)
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Could not change plan — it may exceed your current device usage.')
  }
}

const exportSecurityCsv = async () => {
  const farmId = overview.value.farm.id
  if (!farmId) {
    dashboardStore.setFeedback('No property configured yet.')
    return
  }
  try {
    const response = await apiRequest({
      method: 'GET',
      url: `/api/v1/farms/${farmId}/security/events/export`,
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-events-farm-${farmId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Could not export security events.')
  }
}

const downloadWaterReport = async (zoneId) => {
  const toDate = new Date()
  const fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  try {
    const response = await apiRequest({
      method: 'GET',
      url: `/api/v1/zones/${zoneId}/irrigation/reports/water-consumption`,
      params: { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() },
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `water-consumption-zone-${zoneId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Could not generate the report.')
  }
}

const cancelSubscription = async () => {
  const confirmed = window.confirm('Cancel your subscription? It stays active until the end of the current period, then downgrades to Free.')
  if (!confirmed) return
  try {
    await billingStore.cancel()
    dashboardStore.setFeedback('Subscription cancelled.')
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Could not cancel subscription.')
  }
}

const addEmergencyContact = () => {
  preferences.value.emergencyContacts.push({
    id: Date.now(),
    name: '',
    phone: '',
  })
}
const removeEmergencyContact = (id) => {
  preferences.value.emergencyContacts =
      preferences.value.emergencyContacts.filter(
          contact => contact.id !== id
      )
}

const userInitials = computed(() => {
  const fullName =
      authStore.user?.fullName ||
      overview.value.farm.owner ||
      ''

  return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(name => name[0])
      .join('')
      .toUpperCase()
})

const viewSubscriptionPlan = () => {
  goTo('subscription')
}

const downloadAccountReport = () => {
  const report = `
Account Report
Name: ${authStore.user?.fullName}
Email: ${authStore.user?.email}
Farm: ${overview.value.farm.name}
Devices: ${dashboardStore.devices.length}
Security Events:
${dashboardStore.securityEvents.length}
  `
  const blob = new Blob(
      [report],
      { type: 'text/plain' }
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'account-report.txt'
  link.click()
  URL.revokeObjectURL(url)
  dashboardStore.setFeedback(
      'Account report downloaded.'
  )
}

const irrigationElapsed = (zone) => {
  if (!zone.irrigating || !zone.irrigationStartedAt) {
    return ''
  }

  const minutes = Math.floor(
      (Date.now() - zone.irrigationStartedAt) / 60000
  )

  return `${minutes} min`
}

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'irrigation', label: 'Zones and Irrigation', icon: 'water_drop' },
  { key: 'security', label: 'Security', icon: 'shield' },
  { key: 'devices', label: 'Devices', icon: 'sensors' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
]

const accountNavigation = [
  { key: 'account', label: 'My profile', icon: 'person' },
  { key: 'subscription', label: 'Subscription', icon: 'receipt_long' },
  { key: 'configuration', label: 'Configuration', icon: 'settings' },
]

const section = computed(() => route.params.section || 'dashboard')
const overview = computed(() => dashboardStore.overview)
const zones = computed(() => overview.value.zones)
const alerts = computed(() => overview.value.alerts)
const preferences = computed(() => dashboardStore.notificationPreferences)
if (!preferences.value.quietHours) {
  preferences.value.quietHours = {
    start: '22:00',
    end: '06:00',
  }
}

if (!preferences.value.alertSeverity) {
  preferences.value.alertSeverity = {
    criticalOnly: true,
    deviceFailures: true,
    securityEvents: true,
    informational: false,
  }
}

const deviceTypes = computed(() => [
  'all',
  ...new Set(dashboardStore.devices.map((device) => device.type)),
])
const filteredHistory = computed(() => {
  if (historyArea.value === 'all') return dashboardStore.sortedHistory

  return dashboardStore.sortedHistory.filter((item) => item.area === historyArea.value)
})
const filteredDevices = computed(() =>
  dashboardStore.devices.filter((device) => {
    const matchesStatus = deviceStatus.value === 'all' || device.status === deviceStatus.value
    const matchesType = deviceType.value === 'all' || device.type === deviceType.value

    return matchesStatus && matchesType
  })
)
const canClaimEdgeDevice = computed(() => Boolean(overview.value.farm.id && zones.value.length))
const hasZoneReadings = computed(() =>
  zones.value.some((zone) =>
    [zone.humidity, zone.ec, zone.ph, zone.temp].some((value) => value !== undefined && value !== null && value !== '--')
  )
)
const shouldShowDemoEsp32Cta = computed(() => !dashboardStore.devices.length || !hasZoneReadings.value)

const cropOptions = computed(() =>
  dashboardStore.cropTypes.length
    ? dashboardStore.cropTypes
    : [
        { value: 'CORN', label: 'Corn' },
        { value: 'TOMATO', label: 'Tomato' },
        { value: 'AVOCADO', label: 'Avocado' },
        { value: 'BLUEBERRY', label: 'Blueberry' },
        { value: 'WHEAT', label: 'Wheat' },
        { value: 'LETTUCE', label: 'Lettuce' },
      ]
)

const openCreateZone = () => {
  zoneForm.value = { id: null, name: '', areaHectares: '', cropType: cropOptions.value[0]?.value || '' }
  isZoneDialogOpen.value = true
}

const openEditZone = (zone) => {
  zoneForm.value = {
    id: zone.id,
    name: zone.name,
    areaHectares: zone.areaHectares,
    cropType: zone.cropType,
  }
  isZoneDialogOpen.value = true
}

const saveZone = async () => {
  savingZone.value = true
  try {
    await dashboardStore.saveZone(zoneForm.value)
    isZoneDialogOpen.value = false
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Zone could not be saved.')
  } finally {
    savingZone.value = false
  }
}

const openEdgeDialog = () => {
  edgeForm.value = {
    serialNumber: edgeForm.value.serialNumber || 'SEN-SAT-0401',
    deviceCode: edgeForm.value.deviceCode || 'edge-shared-secret-change-me',
    zoneId: zones.value[0]?.id || '',
    linkToZone: true,
  }
  isEdgeDialogOpen.value = true
}

const claimEdgeDevice = async () => {
  claimingEdge.value = true
  try {
    await dashboardStore.claimEdgeDevice({
      serialNumber: edgeForm.value.serialNumber,
      deviceCode: edgeForm.value.deviceCode,
      farmId: overview.value.farm.id,
      zoneId: edgeForm.value.zoneId,
      linkToZone: edgeForm.value.linkToZone,
    })
    isEdgeDialogOpen.value = false
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'ESP32 could not be linked.')
  } finally {
    claimingEdge.value = false
  }
}

const connectDemoEsp32 = async () => {
  claimingDemoEdge.value = true
  try {
    await dashboardStore.claimDemoEdgeDevice({
      farmId: overview.value.farm.id,
      zoneId: edgeForm.value.zoneId || zones.value[0]?.id,
    })
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'ESP32 demo could not be connected.')
  } finally {
    claimingDemoEdge.value = false
  }
}


const goTo = (key) => {
  router.push(`/dashboard/${key === 'dashboard' ? '' : key}`.replace(/\/$/, ''))
}

const statusLabel = (status) => {
  if (status === 'critical') return 'Critical'
  if (status === 'attention') return 'Attention'
  if (status === 'unknown') return 'No readings'
  return 'Normal'
}

const toggleMatrix = (alertKey, channel) => {
  if (!preferences.value.matrix[alertKey]) return

  preferences.value.matrix[alertKey][channel] =
      !preferences.value.matrix[alertKey][channel]
}

const exportHistory = () => {
  const rows = filteredHistory.value.map((item) =>
    `${item.dateTime},${item.area},${item.action},${item.duration},${item.water},${item.user}`
  )

  navigator.clipboard?.writeText(`dateTime,area,action,duration,water,user\n${rows.join('\n')}`)
  dashboardStore.setFeedback('Irrigation history copied as CSV.')
}

const viewAllAlerts = () => {
  goTo('security')
}

const handleAlertAction = async (alert) => {
  if (alert.action === 'Open irrigation') {
    const zone = zones.value.find((z) => z.name === alert.title)

    if (zone) {
      await dashboardStore.toggleIrrigation(zone.id, selectedDuration.value)
    }

    return
  }

  if (alert.action === 'View details') {
    goTo('irrigation')
    return
  }

  if (alert.action === 'View event') {
    goTo('security')
  }
}

const viewSecurityEvent = (event) => {
  dashboardStore.setFeedback(
      `${event.type} detected in ${event.location} (${event.trust}% confidence)`
  )

  if (!event.reviewed) {
    dashboardStore.markSecurityReviewed(event.id)
  }
}

const syncProfileForm = () => {
  profileForm.value = {
    fullName: authStore.user?.fullName || overview.value.farm.owner || '',
    email: authStore.user?.email || '',
    phone: authStore.user?.phone || '',
    location: overview.value.farm.location || authStore.user?.location || '',
    propertyName: overview.value.farm.name || '',
    sizeHectares: overview.value.farm.sizeHectares || '',
  }
}

const saveProfile = async () => {
  try {
    await authStore.updateProfile({
      fullName: profileForm.value.fullName,
      email: profileForm.value.email,
      phone: profileForm.value.phone,
      location: profileForm.value.location,
    })
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Profile could not be updated.')
    return
  }
  try {
    await dashboardStore.updateFarmProfile(profileForm.value)
  } catch (error) {
    dashboardStore.setFeedback(error.message || 'Property details could not be updated.')
    return
  }
  dashboardStore.overview.farm.owner = profileForm.value.fullName
  isEditingProfile.value = false
  dashboardStore.setFeedback(
      'Profile updated successfully.'
  )
}

const updatePassword = async () => {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = passwordForm.value
  if (!currentPassword) {dashboardStore.setFeedback('Current password is required.')
    return
  }
  if (newPassword.length < 8) {dashboardStore.setFeedback('Password must contain at least 8 characters.')
    return
  }
  if (newPassword !== confirmPassword) {dashboardStore.setFeedback('Passwords do not match.')
    return
  }
  if (currentPassword === newPassword) {dashboardStore.setFeedback('New password must be different from the current password.')
    return
  }
  try {
    await authStore.changePassword(currentPassword, newPassword)
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    dashboardStore.setFeedback('Password updated successfully.')
  } catch (error) {dashboardStore.setFeedback(error.message)}
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const profilePhoto = ref('')

function handleProfilePhoto(event) {
  const file = event.target.files?.[0]

  if (!file) return

  if (file.size > 1024 * 1024) {
    dashboardStore.setFeedback(
        'Please upload an image smaller than 1 MB.'
    )
    return
  }

  const reader = new FileReader()

  reader.onload = () => {
    profilePhoto.value = reader.result

    localStorage.setItem(
        `profilePhoto_${authStore.user.id}`,
        reader.result
    )
  }

  reader.readAsDataURL(file)
}

const closeSession = () => {
  authStore.logout()
  isUserMenuOpen.value = false
  router.push('/login')
}

const viewFullHistory = () => {
  goTo('notifications')
}

const deleteAccount = () => {
  const confirmed = window.confirm(
      'Account deletion is not yet available from the web app.\n\nThis will sign you out and clear locally saved preferences on this device, but your farm data and account remain on the server. Contact support to request full account deletion.\n\nDo you want to continue?'
  )
  if (!confirmed) return
  authStore.deleteAccount()
  router.push('/login')
}

let dashboardRefreshInterval = null

onMounted(async () => {
  billingStore.load()

  if (!preferences.value.whatsappPhone && authStore.user?.phone) {
    preferences.value.whatsappPhone =
        `${authStore.user.countryCode} ${authStore.user.phone}`
  }

  profilePhoto.value =
      localStorage.getItem(`profilePhoto_${authStore.user?.id}`) || ''

  await dashboardStore.loadDashboard()
  syncProfileForm()

  dashboardRefreshInterval = window.setInterval(() => {
    dashboardStore.loadDashboard()
  }, 10000)
})

onUnmounted(() => {
  if (dashboardRefreshInterval) {
    window.clearInterval(dashboardRefreshInterval)
  }
})
</script>

<template>
  <main class="agro-app">
    <aside class="agro-sidebar">
      <button class="brand-button" @click="goTo('dashboard')">
        <span class="material-symbols-outlined">eco</span>
        <strong>SATECHO</strong>
      </button>

      <nav class="sidebar-nav" aria-label="Main navigation">
        <button
          v-for="item in navigation"
          :key="item.key"
          class="nav-item"
          :class="{ active: section === item.key || (section === 'dashboard' && item.key === 'dashboard') }"
          @click="goTo(item.key)"
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>

      <div class="nav-group-label">ACCOUNT</div>
      <nav class="sidebar-nav compact" aria-label="Account navigation">
        <button
          v-for="item in accountNavigation"
          :key="item.key"
          class="nav-item"
          :class="{ active: section === item.key }"
          @click="goTo(item.key)"
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <section class="app-panel">
      <header class="topbar">
        <span />
        <div class="topbar-actions">
          <button class="icon-button has-dot" aria-label="Notifications" @click="goTo('notifications')">
            <span class="material-symbols-outlined">
              notifications
            </span>
          </button>
          <div class="topbar-user">
            <button class="topbar-user-trigger" @click="toggleUserMenu">
              <span class="avatar-button">
                <img v-if="profilePhoto" :src="profilePhoto" class="topbar-avatar">
                <span v-else>
                  {{ userInitials }}
                </span>
              </span>
              <div class="user-meta">
                <strong>
                  {{ authStore.user?.fullName || overview.farm.owner }}
                </strong>
                <small>
                  {{ authStore.user?.role || 'Farmer' }}
                </small>
              </div>
              <span class="material-symbols-outlined top-chevron" :class="{ rotated: isUserMenuOpen }">
                expand_more
              </span>
            </button>
            <div v-if="isUserMenuOpen" class="topbar-dropdown">
              <button class="dropdown-item" @click=" goTo('account'); isUserMenuOpen = false ">
                <span class="material-symbols-outlined">
                  person
                </span>
                My profile
              </button>
              <button class="dropdown-item" @click=" goTo('subscription'); isUserMenuOpen = false ">
                <span class="material-symbols-outlined"> workspace_premium </span>
                Subscription
              </button>
              <button class="dropdown-item danger" @click="closeSession">
                <span class="material-symbols-outlined">
                  logout
                </span>
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <p v-if="dashboardStore.feedback" class="toast-message">
        {{ dashboardStore.feedback }}
      </p>

      <section v-if="section === 'dashboard'" class="content-page">
        <div class="page-heading row-heading">
          <div>
            <h1>{{ overview.farm.name }}</h1>
            <p>{{ overview.farm.subtitle }}</p>
          </div>
          <button class="outline-button" @click="dashboardStore.loadDashboard" :disabled="dashboardStore.status === 'loading'">
            <span class="material-symbols-outlined">
              {{ dashboardStore.status === 'loading' ? 'hourglass_top' : 'sync' }}
            </span>
            {{ dashboardStore.status === 'loading'
              ? 'Updating...'
              : 'Update' }}
          </button>
        </div>

        <div class="metric-grid four">
          <article v-for="metric in overview.metrics" :key="metric.key" class="metric-card">
            <div>
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.detail }}</small>
            </div>
            <span class="metric-icon material-symbols-outlined">{{ metric.icon }}</span>
            <div v-if="metric.progress" class="progress-track">
              <span :style="{ width: `${metric.progress}%` }" />
            </div>
          </article>
        </div>

        <section v-if="shouldShowDemoEsp32Cta" class="surface-card edge-cta-card">
          <span class="material-symbols-outlined">developer_board</span>
          <div>
            <h2>Conectar ESP32 demo</h2>
            <p>Activa un ESP32 demo con la granja y zona reales de esta cuenta para empezar a ver telemetria.</p>
          </div>
          <button class="primary-action" :disabled="claimingDemoEdge || !canClaimEdgeDevice" @click="connectDemoEsp32">
            {{ claimingDemoEdge ? 'Conectando...' : 'Conectar ESP32 demo' }}
          </button>
        </section>

        <div v-if="dashboardStore.farmerKpis" class="metric-grid three crop-health-row">
          <article class="metric-card" :class="{ 'crop-health-critical': dashboardStore.farmerKpis.criticalMoisture }">
            <div>
              <span>Avg. moisture (7d)</span>
              <strong>{{ dashboardStore.farmerKpis.avgMoisture7d != null ? `${dashboardStore.farmerKpis.avgMoisture7d.toFixed(1)}%` : '—' }}</strong>
              <small>{{ dashboardStore.farmerKpis.criticalMoisture ? 'Below healthy range' : 'Healthy range' }}</small>
            </div>
            <span class="metric-icon material-symbols-outlined">water_drop</span>
          </article>
          <article class="metric-card">
            <div>
              <span>Avg. EC (7d)</span>
              <strong>{{ dashboardStore.farmerKpis.avgEc7d != null ? `${dashboardStore.farmerKpis.avgEc7d.toFixed(2)} dS/m` : '—' }}</strong>
            </div>
            <span class="metric-icon material-symbols-outlined">bolt</span>
          </article>
          <article class="metric-card">
            <div>
              <span>Irrigation (7d)</span>
              <strong>{{ dashboardStore.farmerKpis.weeklyIrrigationHours != null ? `${dashboardStore.farmerKpis.weeklyIrrigationHours.toFixed(1)}h` : '—' }}</strong>
            </div>
            <span class="metric-icon material-symbols-outlined">schedule</span>
          </article>
        </div>

        <section class="surface-card alert-list">
          <header class="card-title-row">
            <div>
              <h2><span class="material-symbols-outlined warning">warning</span> Critical alerts now</h2>
              <p>{{ alerts.length ? `${alerts.length} zone alert${alerts.length === 1 ? '' : 's'} need attention` : 'No active alerts from your connected zones.' }}</p>
            </div>
            <button class="link-button" @click="viewAllAlerts">View all<span class="material-symbols-outlined">chevron_right</span>
            </button>
          </header>
          <p v-if="!alerts.length" class="empty-state">No threshold alerts are available yet.</p>
          <article v-for="alert in alerts" :key="alert.id" class="alert-row">
            <span class="status-badge" :class="alert.level">{{ alert.badge }}</span>
            <div>
              <strong>{{ alert.title }}</strong>
              <p>{{ alert.description }}</p>
              <small>{{ alert.time }}</small>
            </div>
            <button class="outline-button compact" @click="handleAlertAction(alert)">{{ alert.action }}</button>
          </article>
        </section>

        <header class="section-title-row">
          <h2>Irrigation zones</h2>
          <button class="link-button" @click="goTo('irrigation')">
            View irrigation control <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </header>
        <p v-if="!zones.length" class="empty-state">Create your first irrigation zone to begin monitoring your property.</p>
        <div class="zone-mini-grid">
          <article v-for="zone in zones" :key="zone.id" class="zone-mini-card" :class="zone.status">
            <header>
              <div>
                <strong>{{ zone.name }}</strong>
                <small>{{ zone.crop }}</small>
              </div>
              <span class="dot-label" :class="zone.status">{{ statusLabel(zone.status) }}</span>
            </header>
            <dl>
              <div><dt><span class="material-symbols-outlined">water_drop</span> Humidity</dt><dd>{{ zone.humidity === '--' ? '--' : `${zone.humidity}%` }}</dd></div>
              <div><dt><span class="material-symbols-outlined">bolt</span> EC</dt><dd>{{ zone.ec === '--' ? '--' : `${zone.ec} mS/cm` }}</dd></div>
              <div><dt><span class="material-symbols-outlined">science</span> pH</dt><dd>{{ zone.ph }}</dd></div>
              <div><dt><span class="material-symbols-outlined">device_thermostat</span> Temp</dt><dd>{{ zone.temp }}C</dd></div>
            </dl>
            <footer>
              <small>{{ zone.lastReading }}</small>
              <span v-if="zone.irrigating">Active irrigation</span>
            </footer>
          </article>
        </div>

        <h2 class="section-title">Quick action</h2>
        <div class="quick-actions">
          <button @click="goTo('irrigation')"><span class="material-symbols-outlined">water_drop</span>Irrigation control</button>
          <button @click="goTo('security')"><span class="material-symbols-outlined">shield</span>Perimeter security</button>
          <button @click="goTo('devices')"><span class="material-symbols-outlined">developer_board</span>IoT Devices</button>
        </div>
      </section>

      <section v-else-if="section === 'irrigation'" class="content-page">
        <div class="page-heading row-heading">
          <div>
            <h1>Irrigation Zones and Control</h1>
            <p>Monitor and control the irrigation of each area of your property</p>
          </div>
          <div class="segmented-control">
            <button :class="{ active: irrigationTab === 'control' }" @click="irrigationTab = 'control'">Irrigation control</button>
            <button :class="{ active: irrigationTab === 'history' }" @click="irrigationTab = 'history'">historical</button>
          </div>
        </div>

        <div class="toolbar-row">
          <p class="inline-note">Zones are stored in your property configuration.</p>
          <button class="outline-button compact" @click="openCreateZone"><span class="material-symbols-outlined">add</span> Add zone</button>
        </div>

        <div v-if="irrigationTab === 'control'" class="irrigation-grid">
          <article v-for="zone in zones" :key="zone.id" class="irrigation-card" :class="zone.status">
            <header>
              <div>
                <h2>{{ zone.name }} <span class="pill" :class="zone.status">{{ statusLabel(zone.status) }}</span></h2>
                <p>{{ zone.crop }}</p>
              </div>
              <span v-if="zone.irrigating" class="active-pill">
                <span class="material-symbols-outlined">water_drop</span>
                Active irrigation ·
                {{ irrigationElapsed(zone) }}
              </span>
              <button class="icon-button" title="Download water consumption report (PDF)" @click="downloadWaterReport(zone.id)">
                <span class="material-symbols-outlined">picture_as_pdf</span>
              </button>
            </header>
            <div class="sensor-grid">
              <div><span class="material-symbols-outlined">water_drop</span><strong>{{ zone.humidity }}%</strong><small>Humidity</small></div>
              <div><span class="material-symbols-outlined">bolt</span><strong>{{ zone.ec }}</strong><small>EC</small></div>
              <div><span class="material-symbols-outlined">science</span><strong>{{ zone.ph }}</strong><small>pH</small></div>
              <div><span class="material-symbols-outlined">device_thermostat</span><strong>{{ zone.temp }}C</strong><small>Temp</small></div>
            </div>
            <div class="watering-meta">
              <span>
                <span class="material-symbols-outlined">schedule</span>
                Last watering:
                {{ zone.lastWatering }} |
              </span>
              <span>
                Next irrigation:
                {{ zone.nextWatering || 'No schedule configured' }}</span>
              <span>
                {{ zone.waterUsed === '--' ? 'No water measurement' : `${zone.waterUsed} L used` }}
              </span>
            </div>
            <div v-if="zone.status === 'critical'" class="critical-banner">
              Humidity below recommended threshold.
              Irrigation is recommended.
            </div>
            <div class="irrigation-actions">
              <select v-model.number="selectedDuration" :disabled="zone.irrigating">
                <option :value="15">15 minutes</option>
                <option :value="20">20 minutes</option>
                <option :value="25">25 minutes</option>
              </select>
              <button
                class="primary-action"
                :class="{ danger: zone.irrigating }"
                :disabled="!zone.irrigating && !zone.deviceId"
                @click="dashboardStore.toggleIrrigation(zone.id, selectedDuration)"
              >
                <span class="material-symbols-outlined">{{ zone.irrigating ? 'stop_circle' : 'play_circle' }}</span>
                {{ zone.irrigating ? 'Stop irrigation' : 'Open valve' }}
              </button>
              <button class="outline-button compact" @click="openEditZone(zone)">
                <span class="material-symbols-outlined">edit</span> Edit zone
              </button>
            </div>
            <p v-if="!zone.deviceId && !zone.irrigating" class="inline-note">Link an actuator to enable irrigation control.</p>
          </article>
        </div>

        <section v-else class="surface-card table-card">
          <header class="card-title-row padded">
            <div>
              <h2>Irrigation history</h2>
              <p>Record of all irrigation actions</p>
            </div>
            <div class="table-tools">
              <label class="select-filter">
                <span class="material-symbols-outlined">filter_list</span>
                <select v-model="historyArea">
                  <option value="all">All areas</option>
                  <option v-for="zone in zones" :key="zone.id" :value="zone.name">{{ zone.name }}</option>
                </select>
              </label>
              <button class="outline-button compact" @click="exportHistory"><span class="material-symbols-outlined">download</span> Export</button>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Area</th>
                <th>Action</th>
                <th>Duration</th>
                <th>Water (L)</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredHistory.length"><td colspan="6" class="empty-table">No irrigation history is available yet.</td></tr>
              <tr v-for="item in filteredHistory" :key="item.id">
                <td>{{ item.dateTime }}</td>
                <td>{{ item.area }}</td>
                <td><span class="action-chip"><span class="material-symbols-outlined">{{ item.action === 'Open' ? 'play_circle' : 'stop_circle' }}</span>{{ item.action }}</span></td>
                <td>{{ item.duration }}</td>
                <td>{{ item.water }}</td>
                <td>{{ item.user }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>

      <section v-else-if="section === 'security'" class="content-page">
        <div class="page-heading row-heading">
          <div>
            <h1>Perimeter Security</h1>
            <p>Monitoring and security events on your property</p>
          </div>
          <div class="row-heading-actions">
            <button class="outline-button compact" @click="exportSecurityCsv"><span class="material-symbols-outlined">download</span> Export CSV</button>
            <span class="soft-danger-pill">{{ dashboardStore.unreadSecurityEvents }} unreviewed event</span>
          </div>
        </div>

        <div class="metric-grid three">
          <article class="status-card danger"><span class="material-symbols-outlined">sensors</span><strong>{{ dashboardStore.securityEvents.length }}</strong><p>Motion events detected</p></article>
          <article class="status-card warning"><span class="material-symbols-outlined">error</span><strong>{{ dashboardStore.unreadSecurityEvents }}</strong><p>Events pending review</p></article>
          <article class="status-card success"><span class="material-symbols-outlined">shield</span><strong>{{ dashboardStore.securitySettings ? 'Configured' : 'Not configured' }}</strong><p>{{ dashboardStore.securitySettings ? 'Settings loaded from Azure' : 'No security settings found' }}</p></article>
        </div>

        <div class="toolbar-row">
          <div class="segmented-control compact">
            <button :class="{ active: securityTab === 'events' }" @click="securityTab = 'events'">Events <span class="counter-dot">{{ dashboardStore.unreadSecurityEvents }}</span></button>
            <button :class="{ active: securityTab === 'settings' }" @click="securityTab = 'settings'">Configuration</button>
          </div>
        </div>

        <div v-if="securityTab === 'events'" class="security-list">
          <p v-if="!dashboardStore.securityEvents.length" class="empty-state">No perimeter events have been reported yet.</p>
          <article v-for="event in dashboardStore.securityEvents" :key="event.id" class="security-event" :class="event.priority">
            <span class="event-icon material-symbols-outlined">{{ event.icon }}</span>
            <div class="event-body">
              <header>
                <strong>{{ event.type }}</strong>
                <span class="trust" :class="event.priority">
                  {{ event.trust }}%
                </span>
                <span v-if="event.note" class="small-chip">
                  {{ event.note }}
                </span>
              </header>
              <p>
                <span class="material-symbols-outlined">location_on</span>
                {{ event.location }}
                <span class="material-symbols-outlined">schedule</span>
                {{ event.time }}
                <span class="material-symbols-outlined">sensors</span>
                {{ event.device }}
              </p>
              <div v-if="event.priority === 'critical' && !event.reviewed" class="critical-note">
                Motion detected in a protected area.
                Verify the perimeter and review the event.
              </div>
            </div>
            <button class="icon-button" @click="viewSecurityEvent(event)"><span class="material-symbols-outlined">visibility</span></button>
          </article>
        </div>

        <div v-else class="settings-stack">
          <section class="surface-card settings-card">
            <h2>Detection sensitivity</h2>
            <p>Adjust the sensitivity of the detection system. Higher sensitivity detects more events but may generate more false positives.</p>
            <div class="range-labels"><span>Low</span><strong>{{ preferences.security.sensitivity }}%</strong><span>High</span></div>
            <input v-model.number="preferences.security.sensitivity" type="range" min="30" max="100" class="wide-range">
            <div class="note-panel">
              <strong>What does this mean?</strong>
              <p>- Low sensitivity (30-50%): Only detects very clear events.</p>
              <p>- Medium sensitivity (50-75%): Balance between detection and accuracy.</p>
              <p>- High sensitivity (75-100%): Detects almost all movement.</p>
            </div>
          </section>

          <section class="surface-card settings-card">
            <h2>Motion detection notifications</h2>
            <p>Select how the system should notify you when motion is detected by PIR sensors.</p>
            <div v-for="(enabled, key) in preferences.security.types" :key="key" class="switch-row">
              <span>
                {{ key === 'movement' ? 'Motion detection' : key }}
              </span>
              <button
                  class="switch" :class="{ on: enabled }"
                  @click=" preferences.security.types[key] = !enabled; dashboardStore.setFeedback('Motion detection configuration updated.') ">
                <span />
              </button>
            </div>
          </section>

          <section class="surface-card settings-card">
            <h2>Active monitoring schedule push/WhatsApp.</h2>
            <p>Define when the system should send notifications.</p>
            <div v-for="day in preferences.security.schedule" :key="day.day" class="schedule-row">
              <button class="switch small" :class="{ on: day.enabled }" @click="day.enabled = !day.enabled"><span /></button>
              <strong>{{ day.day }}</strong>
              <span>{{ day.start }} a {{ day.end }}</span>
            </div>
            <p class="inline-note"><strong>Note:</strong> Events outside active hours will be recorded in history but will not trigger notifications.</p>
          </section>

          <button class="save-button" @click="dashboardStore.saveSecuritySettings">Save settings</button>
        </div>
      </section>

      <section v-else-if="section === 'devices'" class="content-page">
        <div class="page-heading row-heading">
          <div>
            <h1>IoT Devices</h1>
            <p>Devices are provisioned by SATECHO — view status here once your hardware is connected.</p>
          </div>
          <div class="row-heading-actions">
            <button class="primary-action" :disabled="!canClaimEdgeDevice" @click="openEdgeDialog">
              <span class="material-symbols-outlined">add_link</span>
              Vincular dispositivo Edge/ESP32
            </button>
          </div>
        </div>


        <section v-if="shouldShowDemoEsp32Cta" class="surface-card edge-cta-card">
          <span class="material-symbols-outlined">developer_board</span>
          <div>
            <h2>Conectar ESP32 demo</h2>
            <p>Usa el flujo demo para reclamar un ESP32 con la granja y zona reales de tu cuenta.</p>
          </div>
          <button class="primary-action" :disabled="claimingDemoEdge || !canClaimEdgeDevice" @click="connectDemoEsp32">
            {{ claimingDemoEdge ? 'Conectando...' : 'Conectar ESP32 demo' }}
          </button>
        </section>
        <div class="metric-grid three">
          <article class="status-card success"><span class="material-symbols-outlined">wifi</span><strong>{{ dashboardStore.onlineDevices }}</strong><p>Online devices</p></article>
          <article class="status-card danger"><span class="material-symbols-outlined">wifi_off</span><strong>{{ dashboardStore.offlineDevices }}</strong><p>Offline devices</p></article>
          <article class="status-card warning"><span class="material-symbols-outlined">battery_alert</span><strong>{{ dashboardStore.lowBatteryDevices }}</strong><p>Low battery</p></article>
        </div>

        <section class="surface-card table-card">
          <div class="table-toolbar">
            <label class="select-filter">
              <span class="material-symbols-outlined">filter_alt</span>
              <select v-model="deviceStatus">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_activation">Pending activation</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </label>
            <label class="select-filter">
              <span class="material-symbols-outlined">memory</span>
              <select v-model="deviceType">
                <option v-for="type in deviceTypes" :key="type" :value="type">
                  {{ type === 'all' ? 'All types' : type }}
                </option>
              </select>
            </label>
          </div>
          <table>
            <thead>
            <tr>
              <th>Device</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Health</th>
              <th>Moisture</th>
              <th>EC</th>
              <th>Temp</th>
              <th>Last reading</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredDevices.length">
                <td colspan="10" class="empty-table">
                  No devices are registered for this account.
                  <button v-if="shouldShowDemoEsp32Cta" class="inline-link-button" :disabled="claimingDemoEdge || !canClaimEdgeDevice" @click="connectDemoEsp32">
                    Conectar ESP32 demo
                  </button>
                </td>
              </tr>
              <tr v-for="device in filteredDevices" :key="device.id">
                <td>
                  <div class="device-cell">
                    <span class="device-icon material-symbols-outlined">
                      {{ device.icon }}
                    </span>
                    <div class="device-info">
                      <strong>{{ device.name }}</strong>
                      <small>
                        {{ device.code }}
                        • {{ device.type }}
                      </small>
                      <small>
                        Firmware {{ device.firmware }}
                        • Signal {{ device.signal ?? '--' }}%
                      </small>
                    </div>
                  </div>
                </td>
                <td>{{ device.zone }}</td>
                <td><span class="online-chip" :class="{ online: device.online, offline: !device.online }"><span class="material-symbols-outlined">{{ device.online ? 'wifi' : 'wifi_off' }}</span>{{ device.status.replace(/_/g, ' ') }}</span></td>
                <td><span :class="{ dangerText: Number(device.battery) <= 20 }"><span class="material-symbols-outlined tiny">battery_full</span> {{ device.battery === '--' ? '--' : `${device.battery}%` }}</span></td>
                <td><span class="health-chip" :class="device.health?.toLowerCase()">{{ device.health }}</span></td>
                <td>{{ device.moisture === '--' ? '--' : `${device.moisture}%` }}</td>
                <td>{{ device.ec === '--' ? '--' : `${device.ec} dS/m` }}</td>
                <td>{{ device.temperature === '--' ? '--' : `${device.temperature} °C` }}</td>
                <td><span class="material-symbols-outlined tiny">schedule</span> {{ device.lastReading }}</td>
                <td>
                  <div class="row-actions">
                    <button class="ghost-icon" title="Refresh device status" @click="dashboardStore.refreshDeviceStatus(device.id)">
                      <span class="material-symbols-outlined">sync</span>
                    </button>
                    <button v-if="device.status === 'active'" class="ghost-icon" title="Deactivate device" @click="dashboardStore.deactivateDevice(device.id)">
                      <span class="material-symbols-outlined">power_settings_new</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>

      <section v-else-if="section === 'notifications'" class="content-page">
        <div class="page-heading">
          <h1>Notifications</h1>
          <p>Configure how and when you want to receive alerts</p>
        </div>

        <div class="segmented-control compact">
          <button :class="{ active: notificationsTab === 'channels' }" @click="notificationsTab = 'channels'">Channels by alert</button>
          <button :class="{ active: notificationsTab === 'config' }" @click="notificationsTab = 'config'">Configuration</button>
        </div>

        <section v-if="notificationsTab === 'channels'" class="surface-card preferences-card">
          <header>
            <h2>Notification preferences</h2>
            <p>Select which channels to use for each type of alert</p>
          </header>
          <div class="preferences-grid header">
            <strong>Type of alert</strong>
            <span>Push</span>
            <span>WhatsApp</span>
            <span>SMS</span>
            <span>Email</span>
          </div>
          <div class="preference-group-label">Irrigation and soil</div>
          <div v-for="row in [
            ['criticalHumidity', 'Critical humidity', 'water_drop'],
            ['humidity', 'Low/high humidity', 'humidity_low'],
          ]" :key="row[0]" class="preferences-grid">
            <strong><span class="material-symbols-outlined">{{ row[2] }}</span>{{ row[1] }}</strong>
            <button v-for="channel in ['push', 'whatsapp', 'sms', 'email']" :key="channel" class="check-dot" :class="{ on: preferences.matrix?.[row[0]]?.[channel] }" @click="toggleMatrix(row[0], channel)">
              <span class="material-symbols-outlined">check</span>
            </button>
          </div>
          <div class="preference-group-label">Security</div>
          <div v-for="row in [['movement', 'Motion detection', 'motion_sensor_active'],]" :key="row[0]" class="preferences-grid">
            <strong>
              <span class="material-symbols-outlined">
                {{ row[2] }}
              </span>
              {{ row[1] }}
            </strong>
            <button v-for="channel in ['push', 'whatsapp', 'sms', 'email']" :key="channel" class="check-dot" :class="{ on: preferences.matrix?.[row[0]]?.[channel] }" @click="toggleMatrix(row[0], channel)">
              <span class="material-symbols-outlined">
                check
              </span>
            </button>
          </div>
          <div class="preference-group-label">Devices</div>
          <div v-for="row in [
            ['offline', 'Offline device', 'wifi_off'],
            ['battery', 'Low battery', 'battery_alert'],
          ]" :key="row[0]" class="preferences-grid">
            <strong><span class="material-symbols-outlined">{{ row[2] }}</span>{{ row[1] }}</strong>
            <button v-for="channel in ['push', 'whatsapp', 'sms', 'email']" :key="channel" class="check-dot" :class="{ on: preferences.matrix?.[row[0]]?.[channel] }" @click="toggleMatrix(row[0], channel)">
              <span class="material-symbols-outlined">check</span>
            </button>
          </div>
          <p class="info-strip"><span class="material-symbols-outlined">info</span><strong>Note:</strong> WhatsApp messages may include direct links to critical actions.</p>
          <button class="save-button" @click="dashboardStore.saveNotificationPreferences">Save changes</button>
        </section>

        <div v-else class="settings-stack">
          <section class="surface-card settings-card bordered">
            <h2>
              <span class="material-symbols-outlined">
                chat
              </span>
              WhatsApp Alerts
            </h2>
            <p>
              Configure the phone number used to receive critical notifications.
            </p>
            <label class="input-line">
              <span>Phone number</span>
              <div class="inline-input-action">
                <input v-model="preferences.whatsappPhone">
                <button class="verified-button">
                  <span class="material-symbols-outlined">
                    check_circle
                  </span>
                  Verified
                </button>
              </div>
            </label>
            <div class="configuration-info">
              <span class="material-symbols-outlined">
                info
              </span>
              <p>
                Critical alerts such as irrigation failures,
                offline sensors and security events will be sent
                to this number.
              </p>
            </div>
          </section>
          <section class="surface-card settings-card bordered">
            <h2>
              <span class="material-symbols-outlined">
                schedule
              </span>
              Daily Summary
            </h2>
            <p>
              Receive a daily report with farm activity and alerts.
            </p>
            <div class="switch-row large">
              <div>
                <strong>Enable daily summary</strong>
                <p>
                  Includes irrigation activity,
                  sensor status,
                  security events,
                  and weather conditions.
                </p>
              </div>
              <button class="switch" :class="{ on: preferences.dailySummary }" @click="preferences.dailySummary = !preferences.dailySummary">
                <span />
              </button>
            </div>
            <label class="input-line short">
              <span>Delivery time</span>
              <select v-model="preferences.dailyTime">
                <option>06:00 AM</option>
                <option>08:00 AM</option>
                <option>12:00 PM</option>
                <option>06:00 PM</option>
                <option>09:00 PM</option>
              </select>
            </label>
          </section>
          <section class="surface-card settings-card bordered">
            <h2>
              <span class="material-symbols-outlined">
                bedtime
              </span>
              Quiet Hours
            </h2>
            <p>
              Reduce non-critical notifications during selected hours.
            </p>
            <div class="quiet-hours-grid">
              <label>
                <span>Start</span>
                <input type="time" v-model="preferences.quietHours.start">
              </label>
              <label>
                <span>End</span>
                <input type="time" v-model="preferences.quietHours.end">
              </label>
            </div>
            <div class="configuration-info">
              <span class="material-symbols-outlined">
                notifications_active
              </span>
              <p>
                Critical alerts will still be delivered immediately.
              </p>
            </div>
          </section>
          <div class="contact-list">
            <div v-for="contact in preferences.emergencyContacts" :key="contact.id" class="contact-row">
              <input v-model="contact.name" placeholder="Contact name">
              <input v-model="contact.phone" placeholder="+51 999999999">
              <button class="danger-button" @click="removeEmergencyContact(contact.id)">
                Remove
              </button>
            </div>
          </div>
          <button class="secondary-wide" @click="addEmergencyContact">
            Add contact
          </button>
          <section class="surface-card settings-card bordered">
            <h2>
              <span class="material-symbols-outlined">
                warning
              </span>
              Alert Severity
            </h2>
            <p>
              Choose which events should interrupt your workflow.
            </p>
            <div class="severity-list">
              <label>
                <input type="checkbox" v-model="preferences.alertSeverity.criticalOnly">
                Critical alerts only
              </label>
              <label>
                <input type="checkbox" v-model="preferences.alertSeverity.deviceFailures">
                Device failures
              </label>
              <label>
                <input type="checkbox" v-model="preferences.alertSeverity.securityEvents">
                Security events
              </label>
              <label>
                <input type="checkbox" v-model="preferences.alertSeverity.informational">
                Informational notifications
              </label>
            </div>
          </section>
          <button class="save-button" @click="dashboardStore.saveNotificationPreferences">Save changes</button>
        </div>
      </section>

      <section v-else-if="section === 'subscription'" class="content-page subscription-page">
        <div class="page-heading">
          <h1>Subscription & Billing</h1>
          <p>
            Manage your current plan, limits and billing.
          </p>
        </div>
        <p v-if="billingStore.error" class="error-text">{{ billingStore.error }}</p>
        <div class="metric-grid three">
          <article class="status-card success">
      <span class="material-symbols-outlined">
        workspace_premium
      </span>
            <strong>
              {{ billingStore.currentTier }}
            </strong>
            <p>Current plan</p>
          </article>
          <article class="status-card">
      <span class="material-symbols-outlined">
        sensors
      </span>
            <strong>
              {{ dashboardStore.devices.length }}
            </strong>
            <p>Connected devices</p>
          </article>
          <article class="status-card warning">
      <span class="material-symbols-outlined">
        agriculture
      </span>
            <strong>
              {{ overview.farm.sizeHectares || 0 }}
            </strong>
            <p>Hectares managed</p>
          </article>
        </div>

        <!-- Current Plan -->
        <section class="surface-card table-card">
          <div class="page-heading">
            <h2>Current Plan</h2>
          </div>
          <p>
            You are currently subscribed to the
            <strong>{{ billingStore.currentTier }}</strong>
            plan.
            <span v-if="billingStore.subscription?.status">Status: {{ billingStore.subscription.status }}</span>
          </p>
          <button
              v-if="billingStore.subscription && billingStore.currentTier !== 'FREE'"
              class="ghost-button"
              @click="cancelSubscription"
          >
            Cancel subscription
          </button>
        </section>

        <!-- Available Plans -->
        <section class="surface-card table-card">
          <div class="page-heading">
            <h2>Available Plans</h2>
          </div>
          <div class="plan-actions">
            <button
                v-for="plan in billingStore.plans"
                :key="plan.tier"
                class="plan-button"
                :class="{ active: billingStore.currentTier === plan.tier }"
                @click="changePlan(plan.tier)"
            >
              <strong>{{ plan.name }}</strong>
              <small>${{ plan.priceMonthly }} / month</small>
              <small v-if="plan.maxDevices">Up to {{ plan.maxDevices }} devices</small>
              <small v-if="plan.maxFarms">Up to {{ plan.maxFarms }} farms</small>
            </button>
          </div>
        </section>

        <!-- Billing History -->
        <section class="surface-card table-card">
          <div class="page-heading">
            <h2>Billing History</h2>
          </div>

          <table class="billing-table">
            <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
            </thead>

            <tbody>
            <tr
                v-for="item in billingStore.invoices"
                :key="item.id"
            >
              <td>{{ item.issuedAt ? new Date(item.issuedAt).toLocaleDateString() : '—' }}</td>
              <td>{{ item.description }}</td>
              <td>{{ item.currency }} {{ item.amount }}</td>
              <td>
          <span class="status-paid">
            {{ item.status }}
          </span>
              </td>
            </tr>
            <tr v-if="billingStore.invoices.length === 0">
              <td colspan="4">No billing history yet.</td>
            </tr>
            </tbody>
          </table>
        </section>
      </section>

      <section v-else class="content-page account-page">
        <div class="page-heading">
          <h1>My account</h1>
          <p>Manage your profile and account settings</p>
        </div>
        <div class="account-grid">
          <div class="settings-stack">
            <section class="surface-card account-card">
              <header class="row-heading">
                <div>
                  <h2><span class="material-symbols-outlined">person</span> Profile information</h2>
                  <p>Basic information about your account</p>
                </div>
                <button class="outline-button compact" @click="isEditingProfile = !isEditingProfile">
                  <span class="material-symbols-outlined">{{ isEditingProfile ? 'close' : 'edit' }}</span>
                  {{ isEditingProfile ? 'Cancel' : 'Edit' }}
                </button>
              </header>
              <div v-if="!isEditingProfile" class="profile-summary">
                <div class="profile-avatar-container">
                  <img v-if="profilePhoto" :src="profilePhoto" class="profile-photo">
                  <div v-else class="large-avatar">
                    {{ userInitials }}
                  </div>
                  <label class="upload-photo-btn">
                    <span class="material-symbols-outlined">
                      photo_camera
                    </span>
                    <input type="file" accept="image/*" hidden @change="handleProfilePhoto">
                  </label>
                </div>
                <dl><dt>Full name</dt><dd>{{ authStore.user?.fullName || overview.farm.owner }}</dd></dl>
                <dl><dt>Email</dt><dd>{{ authStore.user?.email || 'No email registered' }}</dd></dl>
              </div>
              <form v-else class="profile-edit-grid" @submit.prevent="saveProfile">
                <label>
                  <span>Full name</span>
                  <input v-model.trim="profileForm.fullName" required>
                </label>
                <label>
                  <span>Email</span>
                  <input v-model.trim="profileForm.email" type="email" required>
                </label>
                <label>
                  <span>Phone</span>
                  <input v-model.trim="profileForm.phone">
                </label>
                <label>
                  <span>Property name</span>
                  <input v-model.trim="profileForm.propertyName" required>
                </label>
                <label>
                  <span>Location</span>
                  <input v-model.trim="profileForm.location" required>
                </label>
                <label>
                  <span>Size (ha)</span>
                  <input v-model.number="profileForm.sizeHectares" type="number" min="0" step="0.1">
                </label>
                <button class="primary-action">Save profile</button>
              </form>
              <div class="profile-meta">
                <span><small>Language</small> {{ authStore.user?.language || 'English' }}</span>
                <span><small>Time zone</small> {{ authStore.user?.timeZone || 'Bogota (GMT-5)' }}</span>
                <span><small>Property</small> {{ overview.farm.name }}</span>
                <span><small>Location</small> {{ overview.farm.location || 'Not configured' }}</span>
              </div>
            </section>
            <section class="surface-card account-card">
              <h2><span class="material-symbols-outlined">lock</span> Security</h2>
              <p>Access and password management</p>
              <div class="password-grid">
                <div class="form-stack">
                  <label><span>Current password</span><input v-model="passwordForm.currentPassword" type="password"></label>
                  <label><span>New password</span><input v-model="passwordForm.newPassword" type="password"></label>
                  <label><span>Confirm new password</span><input v-model="passwordForm.confirmPassword" type="password"></label>
                  <button type="button" class="primary-action" @click="updatePassword">Update password</button>
                </div>
                <div class="note-panel">
                  <strong>Password requirements:</strong>
                  <p>Minimum 8 characters</p>
                  <p>At least one capital letter</p>
                  <p>At least one lowercase letter</p>
                  <p>At least one number</p>
                </div>
              </div>
            </section>
          </div>
          <aside class="account-side">
            <section class="surface-card mini-panel">
              <h3>ACCOUNT SUMMARY</h3>
              <p>
                <span class="material-symbols-outlined">
                  workspace_premium
                </span>
                <strong>
                  Current plan
                  <br>
                  {{ planLabel }}
                  <span class="plan-badge">
                    Active
                  </span>
                </strong>
                <button class="link-button" @click="viewSubscriptionPlan">View plan</button>
              </p>
              <p>
                <span class="material-symbols-outlined">
                  calendar_month
                </span>
                <strong>
                  Member since
                  <br>
                  {{ memberSince }}
                </strong>
              </p>
              <p>
                <span class="material-symbols-outlined">
                  sensors
                </span>
                <strong>
                  Active devices
                  <br>
                  {{ dashboardStore.onlineDevices }}
                  /
                  {{ dashboardStore.devices.length }}
                </strong>
              </p>
              <p>
                <span class="material-symbols-outlined">
                  agriculture
                </span>
                <strong>
                  Farm size
                  <br>
                  {{ overview.farm.sizeHectares || 0 }}
                  ha
                </strong>
              </p>
              <button class="secondary-wide" @click="downloadAccountReport">Download account report</button>
            </section>
            <section class="surface-card mini-panel">
              <h3>RECENT ACTIVITY</h3>
              <p class="empty-state">Account activity history is not available from the backend yet.</p>
            </section>
            <section class="danger-zone">
              <strong>Danger zone</strong>
              <p>Deleting your account will permanently erase all your agricultural data and settings.</p>
              <button @click="deleteAccount">Delete my account</button>
            </section>
          </aside>
        </div>
      </section>
    </section>

    <div v-if="isZoneDialogOpen" class="dialog-backdrop" @click.self="isZoneDialogOpen = false">
      <form class="dialog-panel" @submit.prevent="saveZone">
        <header class="dialog-header">
          <div><h2>{{ zoneForm.id ? 'Edit irrigation zone' : 'Add irrigation zone' }}</h2><p>These details are saved to your property in Azure.</p></div>
          <button type="button" class="icon-button" aria-label="Close" @click="isZoneDialogOpen = false"><span class="material-symbols-outlined">close</span></button>
        </header>
        <label class="form-field"><span>Zone name</span><input v-model.trim="zoneForm.name" required></label>
        <label class="form-field"><span>Area (ha)</span><input v-model.number="zoneForm.areaHectares" type="number" min="0.1" step="0.1" required></label>
        <label class="form-field"><span>Crop</span><select v-model="zoneForm.cropType" required><option v-for="crop in cropOptions" :key="crop.value" :value="crop.value">{{ crop.label }}</option></select></label>
        <footer class="dialog-actions"><button type="button" class="outline-button" @click="isZoneDialogOpen = false">Cancel</button><button class="primary-action" :disabled="savingZone">{{ savingZone ? 'Saving...' : 'Save zone' }}</button></footer>
      </form>
    </div>

    <div v-if="isEdgeDialogOpen" class="dialog-backdrop" @click.self="isEdgeDialogOpen = false">
      <form class="dialog-panel" @submit.prevent="claimEdgeDevice">
        <header class="dialog-header">
          <div>
            <h2>Vincular dispositivo Edge/ESP32</h2>
            <p>El dispositivo quedara asociado a la cuenta autenticada y a la zona seleccionada.</p>
          </div>
          <button type="button" class="icon-button" aria-label="Close" @click="isEdgeDialogOpen = false"><span class="material-symbols-outlined">close</span></button>
        </header>
        <label class="form-field">
          <span>Serial</span>
          <input v-model.trim="edgeForm.serialNumber" required>
        </label>
        <label class="form-field">
          <span>Device code</span>
          <input v-model.trim="edgeForm.deviceCode" required>
        </label>
        <label class="form-field">
          <span>Zona</span>
          <select v-model="edgeForm.zoneId" required>
            <option disabled value="">Selecciona una zona</option>
            <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
          </select>
        </label>
        <label class="checkbox-line">
          <input v-model="edgeForm.linkToZone" type="checkbox">
          <span>Vincular este ESP32 a la zona seleccionada</span>
        </label>
        <p v-if="!canClaimEdgeDevice" class="inline-note">Completa el onboarding y crea al menos una zona para vincular un ESP32.</p>
        <footer class="dialog-actions">
          <button type="button" class="outline-button" @click="isEdgeDialogOpen = false">Cancel</button>
          <button type="button" class="outline-button" :disabled="claimingDemoEdge || !canClaimEdgeDevice" @click="connectDemoEsp32">
            {{ claimingDemoEdge ? 'Conectando...' : 'Conectar demo' }}
          </button>
          <button class="primary-action" :disabled="claimingEdge || !canClaimEdgeDevice">{{ claimingEdge ? 'Vinculando...' : 'Vincular ESP32' }}</button>
        </footer>
      </form>
    </div>

  </main>
</template>

<style scoped>
.agro-app {
  min-height: 100vh;
  background: #f7f6f2;
  color: #151b16;
  display: grid;
  grid-template-columns: 256px 1fr;
}

.agro-sidebar {
  min-height: 100vh;
  background: #f3f4ef;
  border-right: 1px solid #e1e4dd;
  display: flex;
  flex-direction: column;
  padding: 22px 8px 0;
  position: sticky;
  top: 0;
  left: 0;
  height: 100vh;
}

.brand-button,
.nav-item,
.sidebar-user,
button {
  font: inherit;
}

.brand-button {
  border: 0;
  background: transparent;
  color: #172016;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 42px;
  text-align: left;
}

.brand-button .material-symbols-outlined {
  color: #456c4c;
  font-size: 28px;
}

.brand-button strong {
  font-size: 20px;
  font-weight: 800;
}

.sidebar-nav {
  display: grid;
  gap: 6px;
}

.sidebar-nav.compact {
  margin-bottom: auto;
}

.nav-item {
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5b6675;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  text-align: left;
}

.nav-item .material-symbols-outlined {
  font-size: 20px;
}

.nav-item.active {
  background: #e2e7dd;
  color: #456c4c;
  font-weight: 800;
  box-shadow: inset 4px 0 0 #456c4c;
}

.nav-group-label {
  color: #9aa4b2;
  font-size: 12px;
  letter-spacing: .08em;
  margin: 36px 16px 14px;
  text-transform: uppercase;
}

.sidebar-user {
  min-height: 72px;
  border: 0;
  border-top: 1px solid #e0e2dc;
  background: transparent;
  cursor: pointer;
  display: grid;
  grid-template-columns: 36px 1fr 18px;
  align-items: center;
  gap: 12px;
  padding: 16px;
  text-align: left;
}

.sidebar-user-wrapper {
  position: relative;
}

.sidebar-user-menu {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 84px;
  background: #fff;
  border: 1px solid #e0e2dc;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  z-index: 12;
  padding: 6px;
}

.sidebar-user-menu-item {
  width: 100%;
  min-height: 38px;
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #ad1f1f;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
}

.sidebar-user-menu-item:hover {
  background: #f8ecec;
}

.sidebar-user > span:first-child,
.avatar-button,
.large-avatar {
  background: #456c4c;
  color: white;
  border-radius: 999px;
  display: grid;
  place-items: center;
}

.sidebar-user > span:first-child,
.avatar-button {
  width: 32px;
  height: 32px;
  font-size: 13px;
}

.sidebar-user strong,
.sidebar-user small {
  display: block;
}

.sidebar-user small,
.page-heading p,
.metric-card small,
.metric-card span,
td,
.settings-card p,
.account-card p {
  color: #667085;
}

.app-panel {
  min-width: 0;
}

.topbar {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e6e8e1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  left: auto;
  padding: 0 24px;
  position: sticky;
  top: 0;
  width: auto;
  z-index: 8;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.topbar-user {
  position: relative;
}

.topbar-user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.topbar-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-photo {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 50%;
}

.user-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-meta strong {
  font-size: 0.9rem;
}

.user-meta small {
  font-size: 0.75rem;
  opacity: 0.7;
}

.topbar-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 220px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 40px rgba(0,0,0,.12);
  overflow: hidden;
  z-index: 100;
}

.dropdown-item {
  width: 100%;
  border: none;
  background: transparent;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f7fa;
}

.dropdown-item.danger {
  color: #dc2626;
}

.top-chevron {
  transition: transform .2s ease;
}

.top-chevron.rotated {
  transform: rotate(180deg);
}

.icon-button,
.ghost-icon {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5b6675;
  cursor: pointer;
  display: grid;
  place-items: center;
  position: relative;
}

.has-dot::after {
  width: 7px;
  height: 7px;
  border: 2px solid white;
  border-radius: 999px;
  background: #cf1f1f;
  content: '';
  position: absolute;
  right: 7px;
  top: 5px;
}

.avatar-button {
  border: 0;
}

.top-chevron {
  color: #98a2b3;
  font-size: 18px;
}

.content-page {
  width: min(100%, 1060px);
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.inline-input-action {
  display: flex;
  gap: 12px;
  align-items: center;
}

.inline-input-action input {
  flex: 1;
}

.configuration-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  background: #f7f9f8;
  border: 1px solid #eceee9;
}

.configuration-info .material-symbols-outlined {
  color: #456c4c;
}

.configuration-info p {
  margin: 0;
}

.quiet-hours-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 16px;
}

.quiet-hours-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;

  padding: 14px;
  border: 1px solid #eceee9;
  border-radius: 12px;
  background: #fafbfa;
}

.contact-row input {
  width: 100%;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.severity-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.severity-list label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-card h2 {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-card h2 .material-symbols-outlined {
  color: #456c4c;
}

.subscription-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.subscription-page .table-card {
  padding: 28px;
}

.subscription-page .table-card + .table-card {
  margin-top: 24px;
}

.subscription-page .page-heading h2 {
  font-size: 22px;
  margin-bottom: 6px;
}

.subscription-page .page-heading {
  margin-bottom: 20px;
}

.subscription-benefits {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  padding: 0;
  list-style: none;
}

.subscription-benefits li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #f8faf8;
  border: 1px solid #e4ece6;
  border-radius: 12px;
  font-size: 14px;
}

.subscription-benefits li strong {
  color: #456c4c;
  font-size: 15px;
}

.subscription-features {
  display: grid;
  gap: 14px;
}

.feature-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-radius: 12px;
  background: #f8faf8;
  border: 1px solid #e4ece6;
}

.usage-list {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.usage-item {
  display: grid;
  gap: 10px;
}

.usage-item span {
  color: #5b6770;
  font-size: 14px;
  font-weight: 600;
}

.usage-item strong {
  font-size: 16px;
  color: #1f2937;
}

.usage-item progress {
  width: 100%;
  height: 10px;
  border: none;
  border-radius: 999px;
  overflow: hidden;
}

.usage-item progress::-webkit-progress-bar {
  background: #edf2ee;
  border-radius: 999px;
}

.usage-item progress::-webkit-progress-value {
  background: #456c4c;
  border-radius: 999px;
}

.billing-table {
  width: 100%;
  border-collapse: collapse;
}

.billing-table th {
  text-align: left;
  padding: 14px;
  background: #f4f7f5;
  font-weight: 700;
}

.billing-table td {
  padding: 14px;
  border-top: 1px solid #e5ebe7;
}

.billing-table tr:hover {
  background: #fafcfa;
}

.status-paid {
  padding: 4px 10px;
  border-radius: 999px;
  background: #e8f7ee;
  color: #2c7a4b;
  font-weight: 600;
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.configuration-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}

.quiet-hours-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.severity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.inline-input-action {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-heading {
  margin-bottom: 30px;
}

.page-heading h1 {
  font-size: 30px;
  line-height: 1.15;
  margin-bottom: 6px;
}

.row-heading,
.card-title-row,
.section-title-row,
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.row-heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.metric-grid.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card,
.surface-card,
.status-card,
.irrigation-card {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
}

.metric-card {
  min-height: 126px;
  display: grid;
  grid-template-columns: 1fr 36px;
  gap: 12px;
  padding: 16px;
}

.crop-health-row {
  margin-top: 16px;
}

.metric-card.crop-health-critical {
  border: 1px solid #dc2626;
  background: #fef2f2;
}

.metric-card.crop-health-critical strong {
  color: #dc2626;
}

.metric-card strong {
  display: block;
  font-size: 25px;
  margin: 24px 0 2px;
}

.metric-icon,
.device-icon,
.event-icon,
.status-card > .material-symbols-outlined {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #eef0ec;
  color: #5b6675;
  display: grid;
  place-items: center;
}

.progress-track {
  height: 8px;
  background: #e5e7e2;
  border-radius: 999px;
  grid-column: 1 / -1;
  overflow: hidden;
}

.progress-track span {
  height: 100%;
  background: #456c4c;
  display: block;
}

.alert-list {
  overflow: hidden;
  margin-bottom: 26px;
}

.card-title-row {
  padding: 16px;
}

.card-title-row.padded {
  padding: 28px 24px;
}

.card-title-row h2,
.section-title-row h2,
.section-title {
  font-size: 16px;
}

.card-title-row p {
  color: #ef8f00;
  font-size: 13px;
}

.card-title-row p strong:first-child {
  color: #d42121;
}

.warning {
  color: #f59e0b;
  font-size: 22px;
  vertical-align: -5px;
}

.alert-row {
  border-top: 1px solid #f0f1ee;
  display: grid;
  grid-template-columns: 64px 1fr 140px;
  align-items: center;
  gap: 12px;
  min-height: 92px;
  padding: 16px;
}

.alert-row p,
.alert-row small {
  color: #5b6675;
  display: block;
  margin-top: 3px;
}

.status-badge,
.pill,
.active-pill,
.soft-danger-pill,
.trust,
.small-chip,
.online-chip,
.action-chip {
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
  white-space: nowrap;
}

.status-badge {
  color: white;
  font-size: 10px;
  font-weight: 800;
  justify-content: center;
  min-width: 58px;
  padding: 6px 8px;
}

.status-badge.critical {
  background: #c91f1f;
}

.status-badge.attention {
  background: #f59e0b;
}

.status-badge.info {
  background: #3f4840;
}

.outline-button,
.link-button,
.primary-action,
.save-button,
.secondary-wide,
.verified-button {
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
}

.outline-button {
  border: 1px solid #d5dbd2;
  background: white;
  color: #1d251e;
}

.outline-button.compact {
  min-height: 34px;
  padding: 0 12px;
}

.link-button {
  border: 0;
  background: transparent;
  color: #4d5a67;
  min-height: 30px;
  padding: 0;
}

.section-title-row {
  margin: 8px 0 16px;
}

.zone-mini-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 26px;
}

.zone-mini-card {
  min-height: 230px;
  background: white;
  border: 1px solid #eceee9;
  border-radius: 12px;
  display: grid;
  gap: 14px;
  padding: 16px;
}

.zone-mini-card.attention {
  border-color: #f4bc65;
}

.zone-mini-card.critical {
  border-color: #ef8a8a;
}

.zone-mini-card header,
.zone-mini-card footer,
.watering-meta,
.device-cell,
.profile-summary,
.profile-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.zone-mini-card small,
.dot-label,
.watering-meta,
.profile-meta small,
.mini-panel small {
  color: #667085;
  display: block;
}

.health-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.health-chip.healthy {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.health-chip.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.health-chip.critical {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-info strong {
  font-size: 0.95rem;
}

.device-info small {
  color: #6b7280;
  font-size: 0.75rem;
}

.critical-banner {
  margin: 12px 0;
  padding: 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  font-weight: 600;
}

.dot-label {
  font-size: 12px;
}

.dot-label::before {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #456c4c;
  content: '';
  display: inline-block;
  margin-right: 5px;
}

.dot-label.attention::before {
  background: #f59e0b;
}

.dot-label.critical::before {
  background: #c91f1f;
}

.zone-mini-card dl {
  display: grid;
  gap: 10px;
}

.zone-mini-card dl div {
  display: flex;
  justify-content: space-between;
}

dt {
  color: #667085;
}

dt .material-symbols-outlined,
.tiny {
  font-size: 16px;
  vertical-align: -3px;
}

dd {
  font-weight: 800;
}

.zone-mini-card footer {
  border-top: 1px solid #f0f1ee;
  padding-top: 10px;
}

.zone-mini-card footer span {
  background: #ecece8;
  color: #555d53;
  font-size: 11px;
  padding: 4px 8px;
}

.plan-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
}

.plan-button {
  padding: 22px;
  border-radius: 16px;
  border: 2px solid #d9e5dc;
  background: white;
  cursor: pointer;
  text-align: center;
}

.plan-button strong {
  display: block;
  font-size: 20px;
  margin-bottom: 8px;
}

.plan-button small {
  display: block;
  color: #64748b;
}

.plan-button.active {
  border-color: #456c4c;
  background: #f3f8f4;
}

.error-text {
  color: #c62828;
  font-weight: 600;
}

.ghost-button {
  margin-top: 12px;
  border: 1px solid #ccc;
  background: white;
  color: #4b5563;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.plan-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e7f5ea;
  color: #2f7d4f;
  font-size: 12px;
  font-weight: 700;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.quick-actions button {
  height: 100px;
  border: 1px solid #eceee9;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #1d251e;
}

.quick-actions span {
  color: #5b6675;
}

.segmented-control {
  background: #f2f3f0;
  border-radius: 8px;
  display: inline-flex;
  gap: 4px;
  padding: 4px;
}

.segmented-control button {
  min-width: 132px;
  min-height: 36px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4d5a67;
  cursor: pointer;
  padding: 0 14px;
}

.segmented-control.compact button {
  min-width: 118px;
}

.segmented-control button.active {
  background: white;
  color: #101828;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.12);
}

.irrigation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.irrigation-card {
  min-height: 294px;
  padding: 24px;
}

.irrigation-card.critical {
  border-color: #ff8b8b;
  box-shadow: inset 4px 0 0 #d91f1f;
}

.irrigation-card header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.irrigation-card h2 {
  font-size: 18px;
}

.pill {
  font-size: 12px;
  font-weight: 600;
  margin-left: 6px;
  padding: 5px 8px;
}

.pill.normal {
  background: #d7ecd8;
  color: #456c4c;
}

.pill.attention {
  background: #fff0bd;
  color: #8a5b00;
}

.pill.critical {
  background: #d21f1f;
  color: white;
}

.active-pill {
  background: #e8f1ff;
  color: #1b63eb;
  font-size: 12px;
  height: 26px;
  padding: 0 10px;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.sensor-grid div {
  min-height: 84px;
  background: #f2f1ed;
  border-radius: 8px;
  display: grid;
  place-items: center;
  padding: 10px;
}

.sensor-grid span {
  color: #98a2b3;
}

.sensor-grid strong,
.sensor-grid small {
  display: block;
}

.sensor-grid small {
  color: #667085;
}

.watering-meta {
  color: #667085;
  font-size: 13px;
  margin-bottom: 12px;
}

.irrigation-actions {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 12px;
}

.irrigation-actions select,
.input-line input,
.input-line select,
.form-stack input {
  border: 1px solid #cfd6cc;
  border-radius: 8px;
  background: white;
  color: #2e352e;
  min-height: 40px;
  padding: 0 12px;
}

.primary-action,
.save-button {
  border: 0;
  background: #456c4c;
  color: white;
}

.primary-action.danger {
  border: 1px solid #d91f1f;
  background: white;
  color: #d91f1f;
}

.primary-action.slim {
  min-width: 150px;
}

.primary-action.muted {
  background: #9daf9f;
  width: 168px;
}

.table-card {
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.edge-cta-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.edge-cta-card > .material-symbols-outlined {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e5eee3;
  color: #456c4c;
  display: grid;
  place-items: center;
}

.edge-cta-card h2,
.edge-cta-card p {
  margin: 0;
}

.edge-cta-card p {
  margin-top: 4px;
}

.inline-link-button {
  border: 0;
  background: transparent;
  color: #456c4c;
  cursor: pointer;
  font-weight: 800;
  margin-left: 8px;
}

.inline-link-button:disabled {
  color: #98a2b3;
  cursor: not-allowed;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #344054;
  font-size: 0.95rem;
}

.table-tools {
  display: flex;
  gap: 12px;
}

.table-card table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.table-card th {
  text-align: left;
  padding: 16px;
  background: #f7f9f8;
  color: #456c4c;
  font-weight: 700;
}

.table-card td {
  padding: 16px;
  border-top: 1px solid #eef2ef;
}

.billing-status {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e7f6ea;
  color: #2f7d43;
  font-size: 13px;
  font-weight: 600;
}

.select-filter {
  min-height: 34px;
  border: 1px solid #d5dbd2;
  border-radius: 8px;
  background: white;
  color: #1d251e;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
}

.select-filter .material-symbols-outlined {
  font-size: 18px;
}

.select-filter select {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  outline: 0;
}

.row-actions {
  display: flex;
  gap: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f0efeb;
  color: #667085;
  font-size: 12px;
  letter-spacing: .04em;
  padding: 18px 24px;
  text-align: left;
  text-transform: uppercase;
}

td {
  border-top: 1px solid #eef0ed;
  padding: 18px 24px;
}

.action-chip {
  border: 1px solid #dbe1d8;
  color: #4d5a67;
  font-size: 13px;
  padding: 5px 10px;
}

.status-card {
  min-height: 100px;
  display: grid;
  grid-template-columns: 48px 44px 1fr;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.status-card strong {
  font-size: 24px;
}

.status-card.danger > span {
  background: #ffd4d1;
  color: #d91f1f;
}

.status-card.warning > span {
  background: #fff4ca;
  color: #c17a00;
}

.status-card.success > span {
  background: #cceecf;
  color: #456c4c;
}

.soft-danger-pill {
  background: #ffd9d6;
  color: #d91f1f;
  padding: 8px 12px;
}

.toolbar-row {
  margin: 34px 0;
}

.counter-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #c91f1f;
  color: white;
  display: inline-grid;
  font-size: 11px;
  place-items: center;
}

.security-list,
.settings-stack {
  display: grid;
  gap: 16px;
}

.security-event {
  min-height: 96px;
  background: white;
  border: 1px solid #eceee9;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 44px 1fr auto 36px;
  gap: 12px;
  align-items: start;
  padding: 24px;
}

.security-event.critical {
  background: #fff4f2;
  border-color: #ffb4ae;
  box-shadow: inset 4px 0 0 #d91f1f;
}

.event-icon {
  background: #ffd9d6;
  color: #d91f1f;
}

.event-body header,
.event-body p {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.event-body p {
  color: #667085;
  margin-top: 8px;
}

.event-body p .material-symbols-outlined {
  font-size: 16px;
}

.trust {
  background: #ffe1df;
  color: #d91f1f;
  font-size: 12px;
  padding: 5px 8px;
}

.trust.warning {
  background: #fff4ca;
  color: #a96b00;
}

.small-chip {
  border: 1px solid #d7ddd4;
  color: #667085;
  font-size: 12px;
  padding: 5px 8px;
}

.critical-note {
  background: #ffd2ce;
  border-radius: 8px;
  color: #d91f1f;
  font-weight: 800;
  margin-top: 16px;
  padding: 14px;
}

.settings-card,
.preferences-card,
.account-card,
.mini-panel {
  padding: 24px;
}

.settings-card h2,
.preferences-card h2,
.account-card h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 28px;
  color: #667085;
}

.range-labels strong {
  color: #456c4c;
}

.wide-range {
  width: 100%;
  accent-color: #456c4c;
}

.note-panel,
.info-strip,
.inline-note {
  background: #f1f0ec;
  border-radius: 6px;
  color: #3f4840;
  margin-top: 16px;
  padding: 16px;
}

.switch-row,
.schedule-row {
  min-height: 52px;
  background: #f2f1ed;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
  padding: 0 10px;
}

.switch {
  width: 36px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  background: #e0e1dd;
  cursor: pointer;
  padding: 3px;
}

.switch span {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: white;
  display: block;
}

.switch.on {
  background: #456c4c;
}

.switch.on span {
  margin-left: auto;
}

.switch.small {
  width: 30px;
  height: 18px;
}

.switch.small span {
  width: 12px;
  height: 12px;
}

.save-button {
  justify-self: end;
  min-width: 136px;
}

.online-chip {
  background: #456c4c;
  color: white;
  min-width: 80px;
  justify-content: center;
  padding: 7px 10px;
  text-transform: capitalize;
}

.online-chip.offline {
  background: #c91f1f;
}

.dangerText {
  color: #c91f1f;
}

.device-cell {
  justify-content: flex-start;
}

.device-cell strong,
.device-cell small {
  display: block;
}

.preferences-card {
  margin-top: 30px;
}

.preferences-grid {
  display: grid;
  grid-template-columns: 1fr repeat(4, 120px);
  align-items: center;
  border-top: 1px solid #edf0eb;
  min-height: 64px;
}

.preferences-grid.header {
  color: #667085;
  font-size: 12px;
  letter-spacing: .08em;
  margin-top: 28px;
  text-transform: uppercase;
}

.preferences-grid strong {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preferences-grid span {
  justify-self: center;
}

.preference-group-label {
  color: #456c4c;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  margin-top: 18px;
  text-transform: uppercase;
}

.check-dot {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 999px;
  background: #e1e2de;
  color: transparent;
  cursor: pointer;
  justify-self: center;
}

.check-dot.on {
  background: #456c4c;
  color: white;
}

.check-dot span {
  font-size: 15px;
}

.info-strip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-card.bordered {
  border-color: #bdc7b8;
}

.input-line {
  display: grid;
  gap: 10px;
  margin-top: 28px;
}

.input-line > span {
  font-weight: 800;
}

.input-line div {
  display: flex;
  gap: 16px;
}

.input-line input {
  width: min(100%, 452px);
}

.input-line.short select {
  width: 320px;
}

.verified-button {
  border: 1px solid #d5dbd2;
  background: #f7f8f5;
  color: #456c4c;
  font-weight: 800;
}

.switch-row.large {
  background: transparent;
  border-bottom: 1px solid #d5dbd2;
  min-height: 108px;
  padding: 0;
}

.account-page {
  width: min(100%, 960px);
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 282px;
  gap: 24px;
}

.large-avatar {
  width: 96px;
  height: 96px;
  font-size: 46px;
  font-weight: 800;
  position: relative;
}

.large-avatar span {
  width: 28px;
  height: 28px;
  border: 3px solid white;
  border-radius: 999px;
  background: #456c4c;
  bottom: 2px;
  display: grid;
  font-size: 16px;
  place-items: center;
  position: absolute;
  right: 2px;
}

.profile-summary {
  border-bottom: 1px solid #edf0eb;
  margin-top: 24px;
  padding-bottom: 28px;
}

.profile-summary dl {
  min-width: 170px;
}

.profile-summary dt {
  font-size: 12px;
}

.profile-summary dd {
  font-size: 16px;
  margin-top: 5px;
}

.profile-meta {
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 24px 70px;
  margin-top: 14px;
}

.profile-edit-grid {
  border-bottom: 1px solid #edf0eb;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
  padding-bottom: 24px;
}

.profile-edit-grid label {
  display: grid;
  gap: 7px;
}

.profile-edit-grid label span {
  color: #667085;
  font-size: 12px;
}

.profile-edit-grid input {
  min-height: 40px;
  border: 1px solid #cfd6cc;
  border-radius: 8px;
  padding: 0 12px;
}

.profile-edit-grid button {
  align-self: end;
}

.password-grid {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 40px;
  margin-top: 26px;
}

.form-stack {
  display: grid;
  gap: 14px;
}

.form-stack label {
  display: grid;
  gap: 6px;
}

.form-stack label span {
  color: #667085;
  font-size: 12px;
}

.account-side {
  display: grid;
  gap: 24px;
  align-content: start;
}

.mini-panel h3 {
  font-size: 14px;
  margin-bottom: 22px;
}

.mini-panel p {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.mini-panel p > span {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #e0e1dd;
  color: #4d5a67;
  display: grid;
  place-items: center;
}

.secondary-wide {
  width: 100%;
  border: 0;
  background: #dedfd9;
  color: #3f4840;
  margin-top: 10px;
}

.danger-button {
  white-space: nowrap;
}

.danger-zone {
  border: 1px solid #ffb4ae;
  border-radius: 12px;
  color: #d91f1f;
  padding: 24px;
}

.danger-zone p {
  font-size: 13px;
  margin: 14px 0 18px;
}

.danger-zone button {
  border: 0;
  background: transparent;
  color: #d91f1f;
  cursor: pointer;
}

.toast-message {
  position: fixed;
  right: 22px;
  top: 76px;
  z-index: 20;
  background: #456c4c;
  color: white;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(20, 28, 20, .18);
}

.empty-state,
.empty-table {
  color: #687067;
  padding: 22px;
  text-align: center;
}

.dialog-backdrop {
  align-items: center;
  background: rgba(20, 28, 20, 0.42);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 20px;
  position: fixed;
  z-index: 40;
}

.dialog-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 24px 64px rgba(20, 28, 20, 0.24);
  display: grid;
  gap: 18px;
  max-width: 520px;
  padding: 26px;
  width: min(100%, 520px);
}

.dialog-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.dialog-header h2,
.dialog-header p {
  margin: 0;
}

.dialog-header p {
  color: #687067;
  font-size: 14px;
  margin-top: 6px;
}

.form-field {
  display: grid;
  gap: 7px;
  font-size: 14px;
  font-weight: 700;
}

.form-field input,
.form-field select {
  border: 1px solid #cfd5cc;
  border-radius: 6px;
  font: inherit;
  min-height: 44px;
  padding: 0 12px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 1040px) {
  .agro-app {
    grid-template-columns: 1fr;
  }

  .agro-sidebar {
    min-height: auto;
    position: static;
  }

  .sidebar-user {
    display: none;
  }

  .metric-grid.four,
  .zone-mini-grid,
  .metric-grid.three,
  .irrigation-grid,
  .account-grid {
    grid-template-columns: 1fr;
  }

  .preferences-grid {
    grid-template-columns: 1fr repeat(4, 54px);
  }
}

@media (max-width: 720px) {
  .content-page {
    padding: 24px 14px 36px;
  }

  .row-heading,
  .card-title-row,
  .toolbar-row,
  .section-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .alert-row,
  .security-event,
  .password-grid,
  .profile-edit-grid,
  .irrigation-actions {
    grid-template-columns: 1fr;
  }

  table {
    min-width: 820px;
  }

  .table-card {
    overflow-x: auto;
  }

  .sensor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
