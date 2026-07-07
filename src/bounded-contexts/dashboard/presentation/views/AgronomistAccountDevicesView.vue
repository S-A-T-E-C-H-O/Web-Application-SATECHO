<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import { useBillingStore } from '@/bounded-contexts/billing/application/stores/billing.store'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const authStore = useAuthStore()
const billingStore = useBillingStore()

const account = ref(null)
const devices = ref([])
const clients = ref([])
const activeSessions = ref([])
const isLoading = ref(true)
const error = ref('')

const deviceSearch = ref('')
const deviceStatusFilter = ref('all')

const memberSince = computed(() => {
  const accounts = JSON.parse(localStorage.getItem('satecho.auth.accounts') || '[]')
  const acct = accounts.find((item) => item.id === authStore.user?.id)
  if (!acct?.createdAt) return 'Unknown'
  return new Date(acct.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

const planLabel = computed(() => {
  const tier = billingStore.subscription?.tierName || billingStore.subscription?.planType || 'FREE'
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
})

const filteredDevices = computed(() => {
  let result = devices.value
  if (deviceStatusFilter.value !== 'all') {
    result = result.filter((d) => d.status === deviceStatusFilter.value)
  }
  if (deviceSearch.value.trim()) {
    const term = deviceSearch.value.toLowerCase()
    result = result.filter((d) =>
      (d.serialNumber || '').toLowerCase().includes(term) ||
      (d.clientName || '').toLowerCase().includes(term) ||
      (d.zoneName || '').toLowerCase().includes(term)
    )
  }
  return result
})

const lastActivityLabel = (device) => {
  const iso = device.lastHeartbeatAt || device.lastTelemetryAt
  if (!iso) return 'No activity'
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

const sessionElapsed = (session) => {
  if (!session.startedAt) return '—'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.round(minutes / 60)}h ${minutes % 60}m`
}

async function loadData() {
  isLoading.value = true
  error.value = ''
  try {
    billingStore.load()

    const [meResp, devicesResp, clientsResp] = await Promise.all([
      apiRequest({ method: 'GET', url: '/api/v1/me' }),
      apiRequest({ method: 'GET', url: '/api/v1/devices' }),
      apiRequest({ method: 'GET', url: '/api/v1/agronomist/clients/detailed' }),
    ])

    account.value = meResp?.data || null

    const rawDevices = Array.isArray(devicesResp?.data) ? devicesResp.data : []
    const rawClients = Array.isArray(clientsResp?.data) ? clientsResp.data : []
    clients.value = rawClients

    const clientMap = {}
    rawClients.forEach((c) => {
      clientMap[c.farmerId || c.id] = c.farmerName || `Farmer ${c.farmerId || c.id}`
    })

    devices.value = rawDevices.map((d) => ({
      id: d.id,
      serialNumber: d.serialNumber || `ESP-${d.id}`,
      type: (d.type || 'SENSOR').charAt(0).toUpperCase() + (d.type || 'SENSOR').slice(1).toLowerCase(),
      status: (d.status || 'inactive').toLowerCase(),
      online: d.online || false,
      batteryLevel: d.batteryLevel,
      lastHeartbeatAt: d.lastHeartbeatAt,
      lastTelemetryAt: d.lastTelemetryAt,
      firmwareVersion: d.firmwareVersion || '—',
      healthStatus: d.healthStatus || 'UNKNOWN',
      zoneName: d.zoneName || '—',
      clientName: clientMap[d.userId] || '—',
    }))

    await loadActiveSessions()
  } catch (e) {
    error.value = e.message || 'Could not load account data.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadData())

async function loadActiveSessions() {
  const sessions = []
  for (const client of clients.value) {
    if (!client.farmId) continue
    try {
      const zonesResp = await apiRequest({ method: 'GET', url: `/api/v1/farms/${client.farmId}/zones` })
      const zones = Array.isArray(zonesResp?.data) ? zonesResp.data : []
      for (const zone of zones) {
        try {
          const activeResp = await apiRequest({ method: 'GET', url: `/api/v1/zones/${zone.id}/irrigation/active` })
          if (activeResp?.data && activeResp.data.status === 'ACTIVE') {
            sessions.push({
              id: activeResp.data.id,
              zoneName: zone.name || `Zone ${zone.id}`,
              clientName: client.farmerName || `Farmer ${client.farmerId}`,
              cropType: zone.cropType || client.cropType || '—',
              startedAt: activeResp.data.startedAt,
              status: activeResp.data.status || 'ACTIVE',
              duration: sessionElapsed(activeResp.data),
            })
          }
        } catch {
          // no active session for this zone
        }
      }
    } catch {
      // skip this client's zones
    }
  }
  activeSessions.value = sessions
}
</script>

<template>
  <div class="account-devices-view">
    <div class="header-section">
      <h1>Account & Devices</h1>
      <p>Manage your account details and monitor client IoT devices and irrigation sessions.</p>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <!-- Account Info Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header">
          <span>ACCOUNT</span>
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="account-detail">
          <strong>{{ account?.fullName || authStore.user?.fullName || 'Agronomist' }}</strong>
          <small>{{ account?.email || authStore.user?.email || '—' }}</small>
          <small class="role-badge">Agronomist</small>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span>MEMBER SINCE</span>
          <span class="material-symbols-outlined">calendar_today</span>
        </div>
        <div class="kpi-value kpi-value-sm">{{ memberSince }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span>CURRENT PLAN</span>
          <span class="material-symbols-outlined">workspace_premium</span>
        </div>
        <div class="kpi-value kpi-value-sm">{{ planLabel }}</div>
        <small class="kpi-sub">Devices: {{ devices.length }} registered</small>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span>ACTIVE CLIENTS</span>
          <span class="material-symbols-outlined">group</span>
        </div>
        <div class="kpi-value">{{ clients.length }}</div>
      </div>
    </div>

    <!-- Client Devices Section -->
    <section class="content-card">
      <div class="card-header-row">
        <div>
          <h2>My Clients' Devices</h2>
          <p>IoT devices deployed across all supervised parcels.</p>
        </div>
        <button class="icon-btn" title="Refresh" @click="loadData" :disabled="isLoading">
          <span class="material-symbols-outlined">{{ isLoading ? 'hourglass_top' : 'sync' }}</span>
        </button>
      </div>

      <div class="filter-row">
        <div class="search-box">
          <span class="material-symbols-outlined">search</span>
          <input v-model="deviceSearch" type="text" placeholder="Search by serial, client, or zone...">
        </div>
        <div class="filter-chips">
          <button v-for="s in ['all', 'active', 'inactive', 'decommissioned']" :key="s"
            class="chip" :class="{ active: deviceStatusFilter === s }"
            @click="deviceStatusFilter = s">
            {{ s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1) }}
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Device Serial</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Connection</th>
              <th>Battery</th>
              <th>Zone</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredDevices.length === 0">
              <td colspan="7" class="empty-cell">No client devices registered yet.</td>
            </tr>
            <tr v-for="device in filteredDevices" :key="device.id">
              <td>
                <div class="device-cell">
                  <span class="material-symbols-outlined device-icon">sensors</span>
                  <div>
                    <strong>{{ device.serialNumber }}</strong>
                    <small>{{ device.firmwareVersion }}</small>
                  </div>
                </div>
              </td>
              <td>{{ device.type }}</td>
              <td>
                <span class="status-chip" :class="{ online: device.online, offline: !device.online }">
                  <span class="dot"></span>
                  {{ device.status.replace(/_/g, ' ') }}
                </span>
              </td>
              <td>{{ lastActivityLabel(device) }}</td>
              <td>
                <span :class="{ 'low-battery': (device.batteryLevel ?? 100) < 25 }">
                  <span class="material-symbols-outlined tiny">battery_full</span>
                  {{ device.batteryLevel != null ? `${device.batteryLevel}%` : '—' }}
                </span>
              </td>
              <td>{{ device.zoneName }}</td>
              <td>{{ device.clientName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Active Irrigation Sessions -->
    <section class="content-card">
      <div class="card-header-row">
        <div>
          <h2>Active Irrigation Sessions</h2>
          <p>Ongoing irrigation across all supervised parcels.</p>
        </div>
      </div>

      <div v-if="activeSessions.length === 0" class="empty-section">
        <span class="material-symbols-outlined">water_drop</span>
        <p>No active irrigation sessions right now.</p>
      </div>

      <div v-else class="sessions-grid">
        <div v-for="session in activeSessions" :key="session.id" class="session-card">
          <div class="session-header">
            <div class="session-title">
              <span class="material-symbols-outlined active-dot">circle</span>
              <strong>{{ session.zoneName }}</strong>
            </div>
            <span class="session-status active">Active</span>
          </div>
          <div class="session-body">
            <div class="session-row">
              <span>Client</span>
              <strong>{{ session.clientName }}</strong>
            </div>
            <div class="session-row">
              <span>Crop</span>
              <strong>{{ typeof session.cropType === 'string' ? session.cropType.charAt(0).toUpperCase() + session.cropType.slice(1).toLowerCase() : session.cropType }}</strong>
            </div>
            <div class="session-row">
              <span>Started</span>
              <strong>{{ session.startedAt ? new Date(session.startedAt).toLocaleString() : '—' }}</strong>
            </div>
            <div class="session-row">
              <span>Elapsed</span>
              <strong>{{ session.duration }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.account-devices-view {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h1 {
  font-size: 28px;
  color: #111;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.header-section p {
  color: #666;
  font-size: 15px;
  margin: 0;
}

.error-banner {
  background: #fff5f5;
  color: #c62828;
  padding: 14px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  border: 1px solid #eaeaea;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.kpi-header .material-symbols-outlined {
  color: #7A9A7A;
  font-size: 20px;
}

.kpi-value {
  font-size: 36px;
  font-weight: 700;
  color: #111;
}

.kpi-value-sm {
  font-size: 24px;
}

.kpi-sub {
  display: block;
  color: #888;
  font-size: 12px;
  margin-top: 4px;
}

.account-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-detail strong {
  font-size: 18px;
  color: #111;
}

.account-detail small {
  font-size: 13px;
  color: #666;
}

.role-badge {
  display: inline-block;
  width: fit-content;
  background: #edf2ed;
  color: #456c4c;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

/* Content Cards */
.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  margin-bottom: 32px;
  overflow: hidden;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 0;
}

.card-header-row h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #111;
}

.card-header-row p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filter Row */
.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 8px 12px;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 14px;
}

.search-box .material-symbols-outlined {
  color: #888;
  font-size: 20px;
}

.filter-chips {
  display: flex;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.chip.active {
  background: #7A9A7A;
  color: white;
  border-color: #7A9A7A;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px 24px;
  font-size: 12px;
  color: #666;
  font-weight: 600;
  border-bottom: 1px solid #eaeaea;
  background: #fcfcfc;
}

td {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: #888;
  padding: 40px 24px !important;
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  color: #7A9A7A;
}

.device-cell strong {
  display: block;
  color: #111;
  font-size: 14px;
}

.device-cell small {
  color: #888;
  font-size: 12px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-chip.online {
  background: #edf2ed;
  color: #456c4c;
}

.status-chip.offline {
  background: #f5f5f5;
  color: #888;
}

.status-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-chip.online .dot { background: #456c4c; }
.status-chip.offline .dot { background: #888; }

.low-battery {
  color: #c62828;
}

.tiny {
  font-size: 14px;
  vertical-align: middle;
}

/* Empty */
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 12px;
  color: #888;
}

.empty-section .material-symbols-outlined {
  font-size: 40px;
  color: #ccc;
}

.empty-section p {
  margin: 0;
  font-size: 14px;
}

/* Sessions Grid */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 0 24px 24px;
}

.session-card {
  background: #fafafa;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 20px;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-dot {
  font-size: 12px;
  color: #16a34a;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.session-title strong {
  font-size: 16px;
  color: #111;
}

.session-status.active {
  background: #dcfce7;
  color: #16a34a;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.session-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-row span {
  font-size: 13px;
  color: #888;
}

.session-row strong {
  font-size: 13px;
  color: #333;
}
</style>
