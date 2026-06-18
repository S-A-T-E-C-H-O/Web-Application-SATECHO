<script setup>
import { ref, computed } from 'vue'

/*
|--------------------------------------------------------------------------
| MOCK DEVICES
|--------------------------------------------------------------------------
*/

const devices = ref([
  {
    id: 'SAT-TM-1180',
    type: 'Telemetry Node',
    location: 'Parcel B-North',

    status: 'Online',

    battery: 23,
    signal: -105,

    lastSeen: '2 min ago',

    telemetry: {
      moisture: '18%',
      ec: '1.8 mS/cm',
      ph: '5.9',
      temperature: '31°C'
    },

    notes: [
      'Device has not reported recent telemetry. Connection timed out.',
      'Battery level is below operational threshold (23%).'
    ],

    maintenance: {
      priority: 'High',
      due: 'Today'
    },

    events: [
      {
        title: 'Telemetry received',
        time: '2 min ago'
      },
      {
        title: 'Signal degraded',
        time: '3 hrs ago'
      },
      {
        title: 'Battery alert generated',
        time: '12 hrs ago'
      }
    ]
  },

  {
    id: 'SAT-TM-1179',
    type: 'Telemetry Node',
    location: 'Parcel A-East',

    status: 'Error',

    battery: 12,
    signal: -120,

    lastSeen: '14 hrs ago',

    telemetry: {
      moisture: '12%',
      ec: '2.1 mS/cm',
      ph: '5.4',
      temperature: '35°C'
    },

    notes: [
      'Critical communication error detected.',
      'Device requires immediate inspection.'
    ],

    maintenance: {
      priority: 'Critical',
      due: 'Today'
    },

    events: [
      {
        title: 'Communication lost',
        time: '14 hrs ago'
      },
      {
        title: 'Battery warning',
        time: '18 hrs ago'
      }
    ]
  },

  {
    id: 'SAT-TM-1178',
    type: 'Telemetry Node',
    location: 'Parcel C-West',

    status: 'Disconnected',

    battery: 56,
    signal: -115,

    lastSeen: '1 day ago',

    telemetry: {
      moisture: '22%',
      ec: '1.5 mS/cm',
      ph: '6.1',
      temperature: '29°C'
    },

    notes: [
      'Device disconnected from network.'
    ],

    maintenance: {
      priority: 'Medium',
      due: 'Tomorrow'
    },

    events: [
      {
        title: 'Device disconnected',
        time: '1 day ago'
      }
    ]
  },

  {
    id: 'SAT-TM-1177',
    type: 'Telemetry Node',
    location: 'Parcel D-South',

    status: 'Online',

    battery: 78,
    signal: -89,

    lastSeen: '5 min ago',

    telemetry: {
      moisture: '31%',
      ec: '1.2 mS/cm',
      ph: '6.4',
      temperature: '27°C'
    },

    notes: [],

    maintenance: {
      priority: 'Low',
      due: 'Next Week'
    },

    events: [
      {
        title: 'Telemetry received',
        time: '5 min ago'
      }
    ]
  },

  {
    id: 'SAT-TM-1176',
    type: 'Telemetry Node',
    location: 'Parcel E-Central',

    status: 'Online',

    battery: 81,
    signal: -80,

    lastSeen: '12 min ago',

    telemetry: {
      moisture: '28%',
      ec: '1.4 mS/cm',
      ph: '6.0',
      temperature: '26°C'
    },

    notes: [],

    maintenance: {
      priority: 'Low',
      due: 'Next Week'
    },

    events: [
      {
        title: 'Telemetry received',
        time: '12 min ago'
      }
    ]
  },

  {
    id: 'SAT-TM-1175',
    type: 'Telemetry Node',
    location: 'Parcel F-North',

    status: 'Disconnected',

    battery: 18,
    signal: -118,

    lastSeen: '2 days ago',

    telemetry: {
      moisture: '15%',
      ec: '2.0 mS/cm',
      ph: '5.6',
      temperature: '33°C'
    },

    notes: [
      'Device offline for more than 48 hours.'
    ],

    maintenance: {
      priority: 'High',
      due: 'Today'
    },

    events: [
      {
        title: 'Device offline',
        time: '2 days ago'
      }
    ]
  }
])

/*
|--------------------------------------------------------------------------
| UI STATE
|--------------------------------------------------------------------------
*/

const selectedDevice = ref(devices.value[0])

const search = ref('')

const selectedStatusFilter = ref('All')

const showMaintenanceModal = ref(false)

const isLoadingTelemetry = ref(false)

const isPinging = ref(false)

const isRebooting = ref(false)

/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

const statusOptions = [
  'All',
  'Online',
  'Disconnected',
  'Error'
]

const filteredDevices = computed(() => {
  let result = devices.value

  if (selectedStatusFilter.value !== 'All') {
    result = result.filter(
        device => device.status === selectedStatusFilter.value
    )
  }

  if (search.value.trim()) {
    const term = search.value.toLowerCase()

    result = result.filter(device =>
        device.id.toLowerCase().includes(term)
    )
  }

  return result
})

/*
|--------------------------------------------------------------------------
| SUMMARY CARDS
|--------------------------------------------------------------------------
*/

const totalFleet = computed(() => {
  return devices.value.length
})

const onlineDevices = computed(() => {
  return devices.value.filter(
      device => device.status === 'Online'
  ).length
})

const disconnectedDevices = computed(() => {
  return devices.value.filter(
      device => device.status === 'Disconnected'
  ).length
})

const lowBatteryDevices = computed(() => {
  return devices.value.filter(
      device => device.battery < 25
  ).length
})

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const batteryStatus = computed(() => {
  const battery = selectedDevice.value.battery

  if (battery <= 25) return 'Critical Level'

  if (battery <= 50) return 'Moderate'

  return 'Healthy'
})

const signalStatus = computed(() => {
  const signal = selectedDevice.value.signal

  if (signal <= -105) return 'Weak'

  if (signal <= -90) return 'Moderate'

  return 'Strong'
})

const isOnline = computed(() => {
  return selectedDevice.value.status === 'Online'
})

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

const selectDevice = (device) => {
  selectedDevice.value = device
}

const scheduleMaintenance = () => {
  showMaintenanceModal.value = true

  console.log(
      'Maintenance scheduled for:',
      selectedDevice.value.id
  )
}

const closeMaintenanceModal = () => {
  showMaintenanceModal.value = false
}

const rebootDevice = async () => {
  try {
    isRebooting.value = true

    console.log(
        'Reboot requested:',
        selectedDevice.value.id
    )

    await new Promise(resolve =>
        setTimeout(resolve, 1500)
    )

    alert(
        `Reboot command sent to ${selectedDevice.value.id}`
    )
  } finally {
    isRebooting.value = false
  }
}

const pingDevice = async () => {
  try {
    isPinging.value = true

    console.log(
        'Ping requested:',
        selectedDevice.value.id
    )

    await new Promise(resolve =>
        setTimeout(resolve, 1000)
    )

    alert(
        `${selectedDevice.value.id} responded successfully`
    )
  } finally {
    isPinging.value = false
  }
}

const requestTelemetry = async () => {
  try {
    isLoadingTelemetry.value = true

    console.log(
        'Telemetry requested:',
        selectedDevice.value.id
    )

    await new Promise(resolve =>
        setTimeout(resolve, 2000)
    )

    alert(
        `Fresh telemetry requested from ${selectedDevice.value.id}`
    )
  } finally {
    isLoadingTelemetry.value = false
  }
}

/*
|--------------------------------------------------------------------------
| BADGE CLASSES
|--------------------------------------------------------------------------
*/

const getStatusClass = (status) => {
  switch (status) {
    case 'Online':
      return 'online'

    case 'Disconnected':
      return 'disconnected'

    case 'Error':
      return 'error'

    default:
      return ''
  }
}
</script>

<template>
  <div class="device-fleet-view">

    <!-- ===================================================== -->
    <!-- LEFT PANEL -->
    <!-- ===================================================== -->

    <section class="fleet-panel">

      <div class="panel-header">
        <h2>Fleet Status</h2>

        <button class="icon-btn">
          <span class="material-symbols-outlined">
            filter_list
          </span>
        </button>
      </div>

      <!-- Search -->

      <div class="search-wrapper">
        <span class="material-symbols-outlined">
          search
        </span>

        <input
            v-model="search"
            type="text"
            placeholder="Search device..."
        >
      </div>

      <!-- Status Filter -->

      <div class="filter-wrapper">

        <button
            v-for="status in statusOptions"
            :key="status"
            class="filter-chip"
            :class="{
            active: selectedStatusFilter === status
          }"
            @click="selectedStatusFilter = status"
        >
          {{ status }}
        </button>

      </div>

      <!-- Fleet Summary -->

      <div class="summary-grid">

        <div class="summary-card">

          <div class="summary-icon">
            <span class="material-symbols-outlined">
              sensors
            </span>
          </div>

          <div>
            <h3>{{ totalFleet }}</h3>
            <p>Total Fleet</p>
          </div>

        </div>

        <div class="summary-card success">

          <div class="summary-icon">
            <span class="material-symbols-outlined">
              check_circle
            </span>
          </div>

          <div>
            <h3>{{ onlineDevices }}</h3>
            <p>Online</p>
          </div>

        </div>

        <div class="summary-card warning">

          <div class="summary-icon">
            <span class="material-symbols-outlined">
              portable_wifi_off
            </span>
          </div>

          <div>
            <h3>{{ disconnectedDevices }}</h3>
            <p>Offline</p>
          </div>

        </div>

        <div class="summary-card danger">

          <div class="summary-icon">
            <span class="material-symbols-outlined">
              battery_alert
            </span>
          </div>

          <div>
            <h3>{{ lowBatteryDevices }}</h3>
            <p>Low Battery</p>
          </div>

        </div>

      </div>

      <!-- Table -->

      <div class="table-wrapper">

        <table class="devices-table">

          <thead>
          <tr>
            <th>Device ID</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th></th>
          </tr>
          </thead>

          <tbody>

          <tr
              v-for="device in filteredDevices"
              :key="device.id"
              :class="{
                selected: selectedDevice.id === device.id
              }"
              @click="selectDevice(device)"
          >

            <td class="device-id">
              {{ device.id }}
            </td>

            <td>

              <div class="status-cell">

                  <span
                      class="status-dot"
                      :class="getStatusClass(device.status)"
                  />

                <span
                    class="status-badge"
                    :class="getStatusClass(device.status)"
                >
                    {{ device.status }}
                  </span>

              </div>

            </td>

            <td>
              {{ device.lastSeen }}
            </td>

            <td>

              <button class="row-action">

                  <span class="material-symbols-outlined">
                    arrow_forward_ios
                  </span>

              </button>

            </td>

          </tr>

          </tbody>

        </table>

      </div>

    </section>

    <!-- ===================================================== -->
    <!-- RIGHT PANEL -->
    <!-- ===================================================== -->

    <section class="detail-panel">

      <!-- HEADER -->

      <div class="device-header">

        <div>

          <div class="title-row">

            <h1>
              {{ selectedDevice.id }}
            </h1>

            <span
                v-if="isOnline"
                class="live-indicator"
            >
              ● LIVE
            </span>

          </div>

          <div class="device-meta">

            <span>
              {{ selectedDevice.type }}
            </span>

            <span>•</span>

            <span>
              {{ selectedDevice.location }}
            </span>

          </div>

        </div>

      </div>

      <!-- DEVICE HEALTH -->

      <div class="section-title">
        Device Health
      </div>

      <div class="health-grid">

        <!-- Battery -->

        <div class="health-card battery-card">

          <div class="health-icon">

            <span class="material-symbols-outlined">
              battery_alert
            </span>

          </div>

          <div>

            <p>Battery</p>

            <h2>
              {{ selectedDevice.battery }}%
            </h2>

            <span class="critical-text">
              {{ batteryStatus }}
            </span>

          </div>

        </div>

        <!-- Signal -->

        <div class="health-card signal-card">

          <div class="health-icon">

            <span class="material-symbols-outlined">
              network_cell
            </span>

          </div>

          <div>

            <p>Signal</p>

            <h2>
              {{ selectedDevice.signal }} dBm
            </h2>

            <span class="warning-text">
              {{ signalStatus }}
            </span>

          </div>

        </div>

      </div>

      <!-- QUICK ACTIONS -->

      <div class="section-title">
        Device Actions
      </div>

      <div class="action-buttons">

        <button
            class="action-btn"
            :disabled="isRebooting"
            @click="rebootDevice"
        >

          <span class="material-symbols-outlined">
            restart_alt
          </span>

          {{ isRebooting ? 'Rebooting...' : 'Reboot Device' }}

        </button>

        <button
            class="action-btn"
            :disabled="isPinging"
            @click="pingDevice"
        >

          <span class="material-symbols-outlined">
            wifi_tethering
          </span>

          {{ isPinging ? 'Pinging...' : 'Ping Device' }}

        </button>

        <button
            class="action-btn"
            :disabled="isLoadingTelemetry"
            @click="requestTelemetry"
        >

          <span class="material-symbols-outlined">
            sync
          </span>

          {{
            isLoadingTelemetry
                ? 'Loading...'
                : 'Request Telemetry'
          }}

        </button>

      </div>

      <!-- TELEMETRY -->

      <div class="telemetry-header">

        <h3>
          Last Known Telemetry
        </h3>

        <span>
          {{ selectedDevice.lastSeen }}
        </span>

      </div>

      <div class="telemetry-grid">

        <div class="metric-card">

          <small>Soil Moist.</small>

          <strong>
            {{ selectedDevice.telemetry.moisture }}
          </strong>

        </div>

        <div class="metric-card">

          <small>Soil EC</small>

          <strong>
            {{ selectedDevice.telemetry.ec }}
          </strong>

        </div>

        <div class="metric-card">

          <small>Soil pH</small>

          <strong>
            {{ selectedDevice.telemetry.ph }}
          </strong>

        </div>

        <div class="metric-card">

          <small>Temperature</small>

          <strong>
            {{ selectedDevice.telemetry.temperature }}
          </strong>

        </div>

      </div>

      <!-- SYSTEM NOTES -->

      <div class="notes-card">

        <h3>
          System Notes
        </h3>

        <template v-if="selectedDevice.notes.length">

          <div
              v-for="(note, index) in selectedDevice.notes"
              :key="index"
              class="note-item"
          >

            <span
                class="material-symbols-outlined warning-icon"
            >
              warning
            </span>

            <span>
              {{ note }}
            </span>

          </div>

        </template>

        <div
            v-else
            class="empty-state"
        >
          No active warnings.
        </div>

      </div>

      <!-- EVENTS -->

      <div class="events-card">

        <h3>
          Recent Events
        </h3>

        <div
            v-for="(event, index) in selectedDevice.events"
            :key="index"
            class="event-row"
        >

          <span>
            {{ event.title }}
          </span>

          <small>
            {{ event.time }}
          </small>

        </div>

      </div>

      <!-- MAINTENANCE -->

      <div class="maintenance-card">

        <h3>
          Maintenance Required
        </h3>

        <p>
          Schedule maintenance and notify farmer for
          physical inspection and battery replacement.
        </p>

        <div class="maintenance-tags">

          <div class="tag-box">

            <small>
              PRIORITY
            </small>

            <strong>
              {{ selectedDevice.maintenance.priority }}
            </strong>

          </div>

          <div class="tag-box">

            <small>
              DUE
            </small>

            <strong>
              {{ selectedDevice.maintenance.due }}
            </strong>

          </div>

        </div>

      </div>

      <!-- MAIN ACTION -->

      <button
          class="maintenance-button"
          @click="scheduleMaintenance"
      >

        <span class="material-symbols-outlined">
          build
        </span>

        Schedule Maintenance

      </button>

    </section>

    <!-- ===================================================== -->
    <!-- MODAL -->
    <!-- ===================================================== -->

    <div
        v-if="showMaintenanceModal"
        class="modal-overlay"
    >

      <div class="modal-card">

        <h3>
          Maintenance Scheduled
        </h3>

        <p>
          Maintenance order created for
          <strong>
            {{ selectedDevice.id }}
          </strong>
        </p>

        <button
            class="modal-button"
            @click="closeMaintenanceModal"
        >
          Close
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* ===================================================== */
/* ROOT */
/* ===================================================== */

.device-fleet-view {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 24px;
  padding: 24px;
  min-height: 100vh;
  background: #f5f7f4;
}

/* ===================================================== */
/* PANELS */
/* ===================================================== */

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

/* ===================================================== */
/* HEADER */
/* ===================================================== */

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

.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.icon-btn:hover {
  background: #f2f4f7;
}

/* ===================================================== */
/* SEARCH */
/* ===================================================== */

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

/* ===================================================== */
/* FILTERS */
/* ===================================================== */

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

/* ===================================================== */
/* SUMMARY */
/* ===================================================== */

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

.summary-card:hover {
  transform: translateY(-2px);
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

.success {
  background: #f6fef9;
}

.success .summary-icon {
  color: #16a34a;
}

.warning {
  background: #fff7ed;
}

.warning .summary-icon {
  color: #ea580c;
}

.danger {
  background: #fef2f2;
}

.danger .summary-icon {
  color: #dc2626;
}

/* ===================================================== */
/* TABLE */
/* ===================================================== */

.table-wrapper {
  margin-top: 22px;
  max-height: 650px;
  overflow-y: auto;
}

.table-wrapper::-webkit-scrollbar {
  width: 6px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 999px;
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

/* ===================================================== */
/* STATUS */
/* ===================================================== */

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

.status-dot.online {
  background: #16a34a;
}

.status-dot.disconnected {
  background: #ea580c;
}

.status-dot.error {
  background: #dc2626;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.online {
  background: #dcfce7;
  color: #166534;
}

.status-badge.disconnected {
  background: #ffedd5;
  color: #9a3412;
}

.status-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

/* ===================================================== */
/* DETAIL HEADER */
/* ===================================================== */

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-row h1 {
  margin: 0;
  font-size: 52px;
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

/* ===================================================== */
/* ROW ACTION */
/* ===================================================== */

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

.row-action .material-symbols-outlined {
  font-size: 18px;
  font-weight: 600;
}

.selected .row-action {
  background: rgba(69, 108, 76, 0.08);
  color: #456c4c;
}

/* ===================================================== */
/* SECTION TITLE */
/* ===================================================== */

.section-title {
  margin-top: 32px;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

/* ===================================================== */
/* HEALTH */
/* ===================================================== */

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

.battery-card {
  background: #efe5d3;
}

.signal-card {
  background: #f2f4f7;
}

.health-icon .material-symbols-outlined {
  font-size: 28px;
}

.health-card p {
  margin: 0;
  color: #667085;
}

.health-card h2 {
  margin: 8px 0;
  font-size: 42px;
}

.critical-text {
  color: #dc2626;
  font-weight: 600;
}

.warning-text {
  color: #ea580c;
  font-weight: 600;
}

/* ===================================================== */
/* ACTIONS */
/* ===================================================== */

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  border: 1px solid #d0d5dd;
  background: white;
  padding: 12px 16px;
  border-radius: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  transition: 0.2s;
}

.action-btn:hover {
  border-color: #456c4c;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===================================================== */
/* TELEMETRY */
/* ===================================================== */

.telemetry-header {
  margin-top: 34px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.telemetry-header h3 {
  margin: 0;
  font-size: 32px;
}

.telemetry-header span {
  color: #667085;
}

.telemetry-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 14px;
}

.metric-card {
  border: 1px solid #eaecf0;
  border-radius: 18px;
  padding: 20px;
}

.metric-card small {
  color: #667085;
}

.metric-card strong {
  display: block;
  margin-top: 10px;
  font-size: 32px;
  color: #101828;
}

/* ===================================================== */
/* NOTES */
/* ===================================================== */

.notes-card {
  margin-top: 24px;
  border: 1px solid #eaecf0;
  border-radius: 20px;
  padding: 22px;
}

.notes-card h3 {
  margin-top: 0;
}

.note-item {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.warning-icon {
  color: #ea580c;
}

.empty-state {
  color: #667085;
}

/* ===================================================== */
/* EVENTS */
/* ===================================================== */

.events-card {
  margin-top: 24px;
  border: 1px solid #eaecf0;
  border-radius: 20px;
  padding: 22px;
}

.events-card h3 {
  margin-top: 0;
}

.event-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid #eaecf0;
}

.event-row:first-of-type {
  border-top: none;
}

.event-row small {
  color: #667085;
}

/* ===================================================== */
/* MAINTENANCE */
/* ===================================================== */

.maintenance-card {
  margin-top: 24px;
  background: #e9e2d6;
  border-radius: 20px;
  padding: 24px;
}

.maintenance-card h3 {
  margin-top: 0;
}

.maintenance-card p {
  color: #475467;
  line-height: 1.6;
}

.maintenance-tags {
  margin-top: 20px;
  display: flex;
  gap: 40px;
}

.tag-box {
  display: flex;
  flex-direction: column;
}

.tag-box small {
  color: #667085;
}

.tag-box strong {
  margin-top: 4px;
  font-size: 18px;
}

/* ===================================================== */
/* MAIN BUTTON */
/* ===================================================== */

.maintenance-button {
  margin-top: 24px;
  width: 100%;
  border: none;
  background: #456c4c;
  color: white;
  border-radius: 18px;
  height: 60px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  transition: 0.2s;
}

.maintenance-button:hover {
  background: #36533b;
}

/* ===================================================== */
/* MODAL */
/* ===================================================== */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(16,24,40,0.55);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 1000;
}

.modal-card {
  background: white;
  width: 420px;
  max-width: 95%;
  padding: 28px;
  border-radius: 20px;
}

.modal-card h3 {
  margin-top: 0;
}

.modal-button {
  margin-top: 20px;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #456c4c;
  color: white;
  cursor: pointer;
}

/* ===================================================== */
/* RESPONSIVE */
/* ===================================================== */

@media (max-width: 1400px) {

  .telemetry-grid {
    grid-template-columns: repeat(2,1fr);
  }

}

@media (max-width: 1200px) {

  .device-fleet-view {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 768px) {

  .health-grid {
    grid-template-columns: 1fr;
  }

  .telemetry-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .title-row h1 {
    font-size: 34px;
  }

  .panel-header h2 {
    font-size: 24px;
  }

}
</style>