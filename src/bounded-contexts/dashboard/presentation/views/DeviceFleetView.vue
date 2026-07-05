<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/bounded-contexts/admin/application/stores/admin.store'

const store = useAdminStore()

onMounted(() => store.loadDevices())

/*
|--------------------------------------------------------------------------
| UI STATE
|--------------------------------------------------------------------------
*/

const selectedDeviceId = ref(null)
const search = ref('')
const selectedStatusFilter = ref('All')

const statusOptions = ['All', 'Online', 'Offline']

const statusLabel = (device) => (device.online ? 'Online' : 'Offline')
const statusClass = (device) => (device.online ? 'online' : 'disconnected')

const filteredDevices = computed(() => {
  let result = store.devices

  if (selectedStatusFilter.value !== 'All') {
    result = result.filter((device) => statusLabel(device) === selectedStatusFilter.value)
  }

  if (search.value.trim()) {
    const term = search.value.toLowerCase()
    result = result.filter((device) => (device.serialNumber || '').toLowerCase().includes(term))
  }

  return result
})

const selectedDevice = computed(() =>
  store.devices.find((d) => d.id === selectedDeviceId.value) || filteredDevices.value[0] || null
)

const selectDevice = (device) => {
  selectedDeviceId.value = device.id
}

/*
|--------------------------------------------------------------------------
| SUMMARY CARDS
|--------------------------------------------------------------------------
*/

const totalFleet = computed(() => store.devices.length)
const onlineDevices = computed(() => store.devices.filter((d) => d.online).length)
const offlineDevices = computed(() => store.devices.filter((d) => !d.online).length)
const lowBatteryDevices = computed(() => store.devices.filter((d) => (d.batteryLevel ?? 100) < 25).length)

const lastActivityLabel = (device) => {
  const iso = device?.lastHeartbeatAt || device?.lastTelemetryAt
  if (!iso) return 'No activity yet'
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}
</script>

<template>
  <div class="device-fleet-view">
    <section class="fleet-panel">
      <div class="panel-header">
        <h2>Fleet Status</h2>
      </div>

      <div class="search-wrapper">
        <span class="material-symbols-outlined">search</span>
        <input v-model="search" type="text" placeholder="Search device serial...">
      </div>

      <div class="filter-wrapper">
        <button
          v-for="status in statusOptions"
          :key="status"
          class="filter-chip"
          :class="{ active: selectedStatusFilter === status }"
          @click="selectedStatusFilter = status"
        >
          {{ status }}
        </button>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon"><span class="material-symbols-outlined">sensors</span></div>
          <div><h3>{{ totalFleet }}</h3><p>Total Fleet</p></div>
        </div>
        <div class="summary-card success">
          <div class="summary-icon"><span class="material-symbols-outlined">check_circle</span></div>
          <div><h3>{{ onlineDevices }}</h3><p>Online</p></div>
        </div>
        <div class="summary-card warning">
          <div class="summary-icon"><span class="material-symbols-outlined">portable_wifi_off</span></div>
          <div><h3>{{ offlineDevices }}</h3><p>Offline</p></div>
        </div>
        <div class="summary-card danger">
          <div class="summary-icon"><span class="material-symbols-outlined">battery_alert</span></div>
          <div><h3>{{ lowBatteryDevices }}</h3><p>Low Battery</p></div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="devices-table">
          <thead>
            <tr>
              <th>Serial number</th>
              <th>Status</th>
              <th>Last activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in filteredDevices"
              :key="device.id"
              :class="{ selected: selectedDevice && selectedDevice.id === device.id }"
              @click="selectDevice(device)"
            >
              <td class="device-id">{{ device.serialNumber }}</td>
              <td>
                <div class="status-cell">
                  <span class="status-dot" :class="statusClass(device)" />
                  <span class="status-badge" :class="statusClass(device)">{{ statusLabel(device) }}</span>
                </div>
              </td>
              <td>{{ lastActivityLabel(device) }}</td>
              <td>
                <button class="row-action"><span class="material-symbols-outlined">arrow_forward_ios</span></button>
              </td>
            </tr>
            <tr v-if="!store.isLoading && filteredDevices.length === 0">
              <td colspan="4" class="empty-cell">No devices found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="selectedDevice" class="detail-panel">
      <div class="device-header">
        <div>
          <div class="title-row">
            <h1>{{ selectedDevice.serialNumber }}</h1>
            <span v-if="selectedDevice.online" class="live-indicator">● LIVE</span>
          </div>
          <div class="device-meta">
            <span>{{ selectedDevice.type }}</span>
            <span>•</span>
            <span>Owner user #{{ selectedDevice.userId }}</span>
          </div>
        </div>
      </div>

      <div class="section-title">Device Health</div>

      <div class="health-grid">
        <div class="health-card battery-card">
          <div class="health-icon"><span class="material-symbols-outlined">battery_alert</span></div>
          <div>
            <p>Battery</p>
            <h2>{{ selectedDevice.batteryLevel != null ? `${selectedDevice.batteryLevel}%` : '—' }}</h2>
          </div>
        </div>
        <div class="health-card signal-card">
          <div class="health-icon"><span class="material-symbols-outlined">memory</span></div>
          <div>
            <p>Firmware</p>
            <h2>{{ selectedDevice.firmwareVersion || 'Unknown' }}</h2>
          </div>
        </div>
      </div>

      <div class="section-title">Identity</div>

      <div class="notes-card">
        <div class="event-row"><span>MAC / API key</span><small>{{ selectedDevice.apiKey || '—' }}</small></div>
        <div class="event-row"><span>Health status</span><small>{{ selectedDevice.healthStatus || '—' }}</small></div>
        <div class="event-row"><span>Last heartbeat</span><small>{{ selectedDevice.lastHeartbeatAt ? new Date(selectedDevice.lastHeartbeatAt).toLocaleString() : '—' }}</small></div>
        <div class="event-row"><span>Last telemetry</span><small>{{ selectedDevice.lastTelemetryAt ? new Date(selectedDevice.lastTelemetryAt).toLocaleString() : '—' }}</small></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.device-fleet-view {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 24px;
  min-height: 100vh;
  background: #f5f7f4;
}

.fleet-panel,
.detail-panel {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.04),
      0 4px 12px rgba(16, 24, 40, 0.06);
}

.detail-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #182230;
}

.search-wrapper {
  position: relative;
  margin-top: 20px;
}

.search-wrapper input {
  width: 100%;
  height: 46px;
  border: 1px solid #d0d5dd;
  border-radius: 12px;
  padding-left: 42px;
  padding-right: 14px;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
}

.search-wrapper input:focus {
  border-color: #456c4c;
  box-shadow: 0 0 0 4px rgba(69,108,76,0.12);
}

.search-wrapper .material-symbols-outlined {
  position: absolute;
  top: 11px;
  left: 12px;
  color: #667085;
}

.filter-wrapper {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid #d0d5dd;
  background: white;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: #f8fafc;
}

.filter-chip.active {
  background: #456c4c;
  color: white;
  border-color: #456c4c;
}

.summary-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 12px;
}

.summary-card {
  border: 1px solid #eaecf0;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: 0.2s;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon .material-symbols-outlined {
  font-size: 24px;
}

.summary-card h3 {
  margin: 0;
  font-size: 28px;
  color: #101828;
}

.summary-card p {
  margin: 3px 0 0;
  color: #667085;
  font-size: 13px;
}

.success { background: #f6fef9; }
.success .summary-icon { color: #16a34a; }
.warning { background: #fff7ed; }
.warning .summary-icon { color: #ea580c; }
.danger { background: #fef2f2; }
.danger .summary-icon { color: #dc2626; }

.table-wrapper {
  margin-top: 22px;
  max-height: 650px;
  overflow-y: auto;
}

.devices-table {
  width: 100%;
  border-collapse: collapse;
}

.devices-table thead th {
  text-align: left;
  padding: 14px 0;
  font-size: 12px;
  font-weight: 700;
  color: #667085;
}

.devices-table tbody tr {
  cursor: pointer;
  transition: all 0.2s;
}

.devices-table tbody tr:hover {
  background: #f9fafb;
}

.devices-table td {
  padding: 18px 0;
  border-top: 1px solid #eaecf0;
}

.selected {
  background: #edf5ef !important;
}

.device-id {
  font-weight: 600;
  color: #101828;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.status-dot.online { background: #16a34a; }
.status-dot.disconnected { background: #ea580c; }

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.online { background: #dcfce7; color: #166534; }
.status-badge.disconnected { background: #ffedd5; color: #9a3412; }

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-row h1 {
  margin: 0;
  font-size: 40px;
  font-weight: 800;
  color: #101828;
}

.live-indicator {
  background: #dcfce7;
  color: #166534;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.device-meta {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  color: #667085;
}

.row-action {
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.row-action:hover {
  background: #edf5ef;
  color: #456c4c;
}

.selected .row-action {
  background: rgba(69, 108, 76, 0.08);
  color: #456c4c;
}

.section-title {
  margin-top: 32px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 16px;
}

.health-card {
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.battery-card { background: #efe5d3; }
.signal-card { background: #f2f4f7; }

.health-card p { margin: 0; color: #667085; }
.health-card h2 { margin: 8px 0; font-size: 32px; }

.notes-card {
  margin-top: 8px;
  border: 1px solid #eaecf0;
  border-radius: 20px;
  padding: 8px 22px;
}

.event-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid #eaecf0;
}

.event-row:first-of-type { border-top: none; }
.event-row small { color: #667085; }

.empty-cell {
  text-align: center;
  color: #888;
  padding: 24px;
}

@media (max-width: 1200px) {
  .device-fleet-view {
    grid-template-columns: 1fr;
  }
}
</style>
