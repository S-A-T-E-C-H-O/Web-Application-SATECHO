<template>
  <div class="parcels-view">
    <div class="header-section">
      <h1>Parcels & Clients</h1>
      <p>Manage the client parcels you supervise and access each individual parcel dashboard.</p>
    </div>

    <!-- Top KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <small>CLIENTS</small>
        <strong>{{ store.parcelKPIs.clients }}</strong>
      </div>
      <div class="kpi-card">
        <small>LINKED PARCELS</small>
        <strong>{{ store.parcelKPIs.linkedParcels }}</strong>
      </div>
      <div class="kpi-card">
        <small>PENDING INVITATIONS</small>
        <strong>{{ store.parcelKPIs.pendingInvitations }}</strong>
      </div>
      <div class="kpi-card alert-card">
        <small>PARCELS AT RISK <span class="material-symbols-outlined">warning</span></small>
        <strong>{{ store.parcelKPIs.atRisk }} <span>Requires action</span></strong>
      </div>
    </div>

    <div class="main-layout">
      <!-- Left Column: Filter & Table -->
      <div class="left-col">
        
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search by client, parcel, crop, or location">
          </div>
          <div class="filter-dropdowns">
            <button class="filter-btn"><span class="material-symbols-outlined">eco</span> Crop <span class="material-symbols-outlined">arrow_drop_down</span></button>
            <button class="filter-btn"><span class="material-symbols-outlined">bar_chart</span> Status <span class="material-symbols-outlined">arrow_drop_down</span></button>
            <button class="filter-btn"><span class="material-symbols-outlined">location_on</span> Location <span class="material-symbols-outlined">arrow_drop_down</span></button>
          </div>
        </div>

        <!-- Supervised Parcels Table -->
        <div class="table-container">
          <div class="table-header">
            <h2>Supervised Parcels</h2>
            <button class="icon-btn"><span class="material-symbols-outlined">more_vert</span></button>
          </div>
          <table class="supervised-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Parcel / Crop</th>
                <th>Location</th>
                <th>Status</th>
                <th>Devices</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="parcel in store.supervisedParcels" :key="parcel.id" 
                  @click="openParcelDetail(parcel)" 
                  class="clickable-row"
                  :class="{ 'row-active': selectedParcel?.id === parcel.id }">
                <td>
                  <div class="client-cell">
                    <div class="avatar" :style="{ backgroundColor: parcel.clientColor, color: parcel.clientText }">
                      {{ parcel.clientInitials }}
                    </div>
                    <strong>{{ parcel.clientName }}</strong>
                  </div>
                </td>
                <td>
                  <div class="stack-cell">
                    <strong>{{ parcel.parcelName }}</strong>
                    <small>{{ parcel.crop }}</small>
                  </div>
                </td>
                <td>{{ parcel.location }}</td>
                <td>
                  <span class="status-badge" :class="parcel.status.toLowerCase().replace(' ', '-')">
                    <span class="dot"></span>
                    {{ parcel.status }}
                  </span>
                </td>
                <td>
                  <div class="stack-cell">
                    <strong v-if="parcel.devicesTotal > 0">
                      {{ parcel.devicesOnline }} online<span v-if="parcel.devicesTotal - parcel.devicesOnline > 0" class="offline-text">, {{ parcel.devicesTotal - parcel.devicesOnline }} offline</span>
                    </strong>
                    <strong v-else class="pending-text">Pending setup</strong>
                    <small>Last: {{ parcel.lastUpdate }}</small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column: Summary & Map -->
      <div class="right-col">
        <div class="summary-card">
          <h2>Portfolio<br>Summary</h2>
          <p>Overview of your agronomic supervision.</p>

          <div class="summary-list">
            <div class="summary-item">
              <span>Total clients</span>
              <strong>{{ store.portfolioSummary.totalClients }}</strong>
            </div>
            <div class="summary-item">
              <span>Active parcels</span>
              <strong class="text-green">{{ store.portfolioSummary.activeParcels }}</strong>
            </div>
            <div class="summary-item">
              <span>Pending invitations</span>
              <strong>{{ store.portfolioSummary.pendingInvitations }}</strong>
            </div>
            <div class="summary-item">
              <span>Critical parcels</span>
              <strong class="text-red">{{ store.portfolioSummary.criticalParcels }}</strong>
            </div>
          </div>

          <div class="map-box">
            <button class="map-btn">View Map Overview</button>
          </div>

          <button class="invite-btn" @click="isDrawerOpen = true">
            <span class="material-symbols-outlined">person_add</span>
            Invite Client
          </button>
        </div>
      </div>
    </div>

    <!-- Right Side Drawer (Invite Client) -->
    <div v-if="isDrawerOpen" class="drawer-overlay" @click.self="isDrawerOpen = false">
      <div class="drawer">
        <div class="drawer-header">
          <h2>Invite Farmer</h2>
          <button class="close-btn" @click="isDrawerOpen = false"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="drawer-content">
          <p>Send an invitation to a farmer to join AgroSafe and link their parcels to your supervision.</p>
          
          <div class="form-group">
            <label>Farmer Email Address</label>
            <input type="email" placeholder="farmer@example.com" v-model="inviteEmail">
          </div>

          <button class="send-invite-btn" @click="sendInvite">
            <span class="material-symbols-outlined">send</span> Send Invitation
          </button>

          <div v-if="inviteSent" class="success-message">
            <span class="material-symbols-outlined">check_circle</span>
            Invitation sent to {{ inviteEmail }}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Parcel Detail Drawer -->
    <div v-if="selectedParcel" class="drawer-overlay custom-blur" @click.self="closeParcelDetail">
      <div class="drawer parcel-detail-drawer">
        <header class="panel-header">
          <div class="header-content">
            <h1>Quick Parcel Detail</h1>
            <p>Review key metrics and recent activity before taking action.</p>
          </div>
          <button class="close-btn" @click="closeParcelDetail">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        <div class="panel-body custom-scrollbar">
          
          <section class="summary-card-modern">
            <div class="summary-top">
              <div>
                <h2>{{ selectedParcel.clientName }}</h2>
                <p>{{ selectedParcel.parcelName }} • {{ selectedParcel.crop }} • {{ selectedParcel.location }}</p>
              </div>
              <span class="status-badge-modern" :class="selectedParcel.status.toLowerCase().replace(' ', '-')">
                {{ selectedParcel.status }}
              </span>
            </div>
            <div class="summary-bottom">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Last Reading: {{ selectedParcel.lastUpdate }}
            </div>
          </section>

          <section class="metrics-section">
            <h3 class="section-title-modern">Key Metrics</h3>
            <div class="metrics-grid-modern" v-if="selectedParcel.metrics">
              <div class="metric-card-modern" v-for="(metric, key) in selectedParcel.metrics" :key="key" :class="{ 'metric-alert-modern': metric.isAlert }">
                <div class="metric-card-top">
                  <span class="material-symbols-outlined" :class="{ 'text-primary': key === 'temp' }">
                    {{ key === 'soilMoisture' ? 'water_drop' : key === 'ec' ? 'bolt' : key === 'ph' ? 'science' : 'device_thermostat' }}
                  </span>
                  <span class="metric-title" :class="{ 'text-primary': key === 'temp' }">
                    {{ key === 'soilMoisture' ? 'Soil Moisture' : key === 'ec' ? 'EC' : key === 'ph' ? 'pH' : 'Temperature' }}
                  </span>
                </div>
                <div class="metric-value" :class="{ 'alert-value': metric.isAlert }">{{ metric.value }}</div>
                <div v-if="metric.isAlert" class="metric-badge-alert">{{ metric.label }}</div>
                <div v-else class="metric-label">{{ metric.label }}</div>
              </div>
            </div>
            <div class="info-card-modern" v-else>
              <p>No metrics data available for this parcel.</p>
            </div>
          </section>

          <section class="activity-section">
            <div class="section-header-modern">
              <h3 class="section-title-modern">Recent Activity</h3>
              <button class="view-all-btn">View All</button>
            </div>
            <div class="activity-card-modern">
              <div class="timeline-modern" v-if="selectedParcel.recentActivity && selectedParcel.recentActivity.length > 0">
                <div class="timeline-item-modern" v-for="activity in selectedParcel.recentActivity" :key="activity.id">
                  <div class="timeline-dot-modern" :class="activity.type"></div>
                  <div class="timeline-content-modern">
                    <p class="activity-title">{{ activity.title }}</p>
                    <p class="activity-time">{{ activity.timeAgo }}</p>
                  </div>
                </div>
              </div>
              <div v-else>
                <p class="no-data-text">No recent activity to display.</p>
              </div>
            </div>
          </section>

          <section class="device-section">
            <h3 class="section-title-modern">Device Status</h3>
            <div class="device-card-modern">
              <div class="device-row">
                <span>Connected devices</span>
                <strong>{{ selectedParcel.devicesOnline }} online</strong>
              </div>
              <div class="device-row">
                <span>Last telemetry sync</span>
                <strong>{{ selectedParcel.lastUpdate }}</strong>
              </div>
              <div class="device-row">
                <span>Signal status</span>
                <strong class="text-green-modern">Stable</strong>
              </div>
            </div>
          </section>
        </div>

        <footer class="panel-footer-modern">
          <button class="primary-btn-modern" @click="navigateToFullDashboard">
            Open Full Dashboard
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
            </svg>
          </button>
          
          <div class="secondary-actions-modern">
            <button class="outline-btn-modern">Send Recommendation</button>
            <button class="outline-btn-modern">Adjust Thresholds</button>
          </div>

          <div class="suggested-action-modern">
            <div class="lightbulb-icon-container">
              <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <h4>Suggested Action</h4>
              <p>Review irrigation thresholds and send a preventive recommendation to the farmer.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const router = useRouter()
const store = useDashboardAgronomistStore()
const isDrawerOpen = ref(false)
const inviteEmail = ref('')
const inviteSent = ref(false)

const selectedParcel = ref(null)

const openParcelDetail = (parcel) => {
  selectedParcel.value = parcel
}

const closeParcelDetail = () => {
  selectedParcel.value = null
}

const navigateToFullDashboard = () => {
  if (selectedParcel.value) {
    router.push(`/dashboard/agronomist/parcels/${selectedParcel.value.id}`)
  }
}

const sendInvite = () => {
  if (inviteEmail.value) {
    inviteSent.value = true
    setTimeout(() => {
      isDrawerOpen.value = false
      inviteSent.value = false
      inviteEmail.value = ''
    }, 2000)
  }
}
</script>

<style scoped>
.parcels-view {
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

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-card small {
  color: #888;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kpi-card strong {
  font-size: 28px;
  color: #7A9A7A;
}

.kpi-card.alert-card {
  border-color: #fbc2c4;
  background: #fffcfc;
}

.kpi-card.alert-card small {
  color: #c62828;
}

.kpi-card.alert-card strong {
  color: #c62828;
  display: flex;
  align-items: center;
  gap: 8px;
}

.kpi-card.alert-card strong span {
  font-size: 12px;
  font-weight: 500;
  color: #888;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  margin-bottom: 24px;
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

.filter-dropdowns {
  display: flex;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

.filter-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  overflow: hidden;
}

.table-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
}

.table-header h2 {
  margin: 0;
  font-size: 18px;
  color: #111;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
}

.supervised-table {
  width: 100%;
  border-collapse: collapse;
}

.supervised-table th {
  text-align: left;
  padding: 12px 20px;
  font-size: 12px;
  color: #666;
  font-weight: 600;
  border-bottom: 1px solid #eaeaea;
}

.supervised-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
  vertical-align: middle;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.2s;
}

.clickable-row:hover {
  background: #fdfdfd;
}

.row-active {
  background: #f0f7f0 !important;
  box-shadow: inset 4px 0 0 #456c4c;
}

.supervised-table tr:last-child td {
  border-bottom: none;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.stack-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stack-cell strong {
  font-size: 14px;
  color: #111;
}

.stack-cell small {
  font-size: 12px;
  color: #888;
}

.offline-text { color: #c62828; }
.pending-text { color: #888; font-weight: normal; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f5f5f5;
  color: #555;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #888;
}

.status-badge.normal .dot { background: #456c4c; }
.status-badge.normal { color: #456c4c; background: #edf2ed; }

.status-badge.at-risk .dot { background: #c08552; }
.status-badge.at-risk { color: #c08552; background: #fdf2e9; }

.status-badge.critical .dot { background: #c62828; }
.status-badge.critical { color: #c62828; background: #ffebee; }

/* Right Column Summary */
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #eaeaea;
}

.summary-card h2 {
  font-size: 22px;
  line-height: 1.2;
  margin: 0 0 8px 0;
  color: #111;
}

.summary-card p {
  color: #666;
  font-size: 13px;
  margin: 0 0 24px 0;
  line-height: 1.4;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.summary-item span {
  font-size: 14px;
  color: #555;
}

.summary-item strong {
  font-size: 14px;
  color: #111;
}

.text-green { color: #7A9A7A !important; }
.text-red { color: #c62828 !important; }

.map-box {
  background: #e0e0e0;
  height: 140px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.map-btn {
  background: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.invite-btn {
  width: 100%;
  background: #7A9A7A;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.invite-btn:hover {
  background: #628062;
}

.invite-btn .material-symbols-outlined {
  font-size: 18px;
}

/* Right Drawer Overlay */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #555;
  padding: 4px;
}

.drawer-content {
  padding: 24px;
  flex: 1;
}

.drawer-content p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

.send-invite-btn {
  width: 100%;
  background: #7A9A7A;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: #edf2ed;
  color: #456c4c;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

/* Quick Parcel Detail Drawer Styles */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.custom-blur {
  backdrop-filter: blur(4px);
  background-color: rgba(0, 0, 0, 0.2);
}

.parcel-detail-drawer {
  width: 550px;
  background: #faf9f5;
  font-family: 'Manrope', sans-serif;
  display: flex;
  flex-direction: column;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dadad6;
  border-radius: 10px;
}

.panel-header {
  padding: 24px;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content h1 {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.025em;
  margin: 0;
}

.header-content p {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.close-btn {
  padding: 8px;
  border-radius: 9999px;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.close-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}
.close-btn svg {
  height: 24px;
  width: 24px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-card-modern {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.summary-top h2 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  margin: 0;
}
.summary-top p {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 4px 0 0 0;
}

.status-badge-modern {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-badge-modern.normal {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #dcfce7;
}
.status-badge-modern.at-risk {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
}
.status-badge-modern.critical {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fee2e2;
}

.summary-bottom {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}
.summary-bottom svg {
  height: 16px;
  width: 16px;
}

.section-title-modern {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 4px;
  margin: 0 0 16px 0;
}

.metrics-grid-modern {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric-card-modern {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-alert-modern {
  border-left: 4px solid #C38265;
}

.metric-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  margin-bottom: 4px;
}
.metric-card-top .material-symbols-outlined {
  font-size: 18px;
}
.metric-title {
  font-size: 14px;
  font-weight: 500;
}
.text-primary {
  color: #7A9A7A !important;
}

.metric-value {
  font-size: 30px;
  font-weight: 700;
  color: #111827;
}
.alert-value {
  color: #C38265;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}
.metric-badge-alert {
  display: inline-block;
  width: fit-content;
  padding: 4px 8px;
  background: rgba(195, 130, 101, 0.1);
  color: #C38265;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
}

.info-card-modern {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 20px;
}
.info-card-modern p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.section-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  margin-bottom: 12px;
}
.section-header-modern .section-title-modern {
  margin: 0;
}
.view-all-btn {
  font-size: 12px;
  font-weight: 700;
  color: #7A9A7A;
  background: none;
  border: none;
  cursor: pointer;
}
.view-all-btn:hover {
  text-decoration: underline;
}

.activity-card-modern {
  background: white;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.timeline-modern {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.timeline-item-modern {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.timeline-item-modern:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 24px;
  bottom: -24px;
  width: 1px;
  background: #f3f4f6;
}

.timeline-dot-modern {
  z-index: 10;
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.timeline-dot-modern.danger { background-color: #C38265; }
.timeline-dot-modern.warning { background-color: #AECFAC; }
.timeline-dot-modern.success { background-color: #476649; }
.timeline-dot-modern.neutral { background-color: #9ca3af; }

.timeline-content-modern {
  display: flex;
  flex-direction: column;
}
.activity-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.25;
  margin: 0;
}
.activity-time {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0 0 0;
}
.no-data-text {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.device-card-modern {
  background: #f4f4ef;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.device-row span {
  font-size: 14px;
  color: #4b5563;
}
.device-row strong {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}
.text-green-modern {
  color: #16a34a !important;
}

.panel-footer-modern {
  padding: 24px;
  border-top: 1px solid #f3f4f6;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.primary-btn-modern {
  width: 100%;
  padding: 12px 16px;
  background: #7A9A7A;
  color: white;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(122, 154, 122, 0.2);
  transition: background-color 0.2s;
  font-size: 15px;
}
.primary-btn-modern:hover {
  background: #688568;
}

.primary-btn-modern svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.secondary-actions-modern {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.outline-btn-modern {
  padding: 12px 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.outline-btn-modern:hover {
  background: #f9fafb;
}

.suggested-action-modern {
  padding: 16px;
  background: rgba(122, 154, 122, 0.05);
  border: 1px solid rgba(122, 154, 122, 0.1);
  border-radius: 16px;
  display: flex;
  gap: 12px;
}

.lightbulb-icon-container {
  background: rgba(122, 154, 122, 0.1);
  padding: 8px;
  border-radius: 9999px;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbulb-icon-container svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.suggested-action-modern h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}
.suggested-action-modern p {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}
</style>
