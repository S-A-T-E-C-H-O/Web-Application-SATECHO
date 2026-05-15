<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const route = useRoute()
const router = useRouter()
const store = useDashboardAgronomistStore()

const parcelId = computed(() => route.params.id)

const parcel = computed(() => {
  return store.supervisedParcels.find(p => p.id === parcelId.value)
})

onMounted(() => {
  if (!parcel.value) {
    // If not found (e.g. invalid ID), go back to parcels list
    router.push('/dashboard/agronomist/parcels')
  }
})
</script>

<template>
  <div class="parcel-dashboard-view" v-if="parcel">
    <header class="dashboard-header">
      <nav class="breadcrumbs">
        <router-link to="/dashboard/agronomist/parcels" class="breadcrumb-link">Parcels</router-link>
        <span class="separator material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-text">{{ parcel.clientName }}</span>
        <span class="separator material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-current">{{ parcel.parcelName }}</span>
      </nav>
      <h1>Parcel Dashboard</h1>
      <p class="subtitle">Review detailed soil conditions, sensor readings, trends, and recommendations for this client parcel.</p>
    </header>

    <div class="dashboard-content">
      <!-- Top Summary Bar -->
      <section class="summary-card">
        <div class="summary-info">
          <div class="title-row">
            <h2>{{ parcel.parcelName }}</h2>
            <span class="status-badge" :class="parcel.status.toLowerCase().replace(' ', '-')">
              {{ parcel.status === 'Critical' ? 'At Risk' : parcel.status }}
            </span>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <label>CLIENT</label>
              <strong>{{ parcel.clientName }}</strong>
            </div>
            <div class="detail-item">
              <label>CROP</label>
              <strong>{{ parcel.crop }}</strong>
            </div>
            <div class="detail-item">
              <label>LOCATION</label>
              <strong class="flex-center"><span class="material-symbols-outlined icon-small">location_on</span> {{ parcel.location }}</strong>
            </div>
            <div class="detail-item status-detail">
              <label>STATUS</label>
              <strong class="flex-center"><span class="dot green"></span> {{ parcel.devicesOnline }} Devices Online</strong>
            </div>
            <div class="detail-item time-detail">
              <span>({{ parcel.lastUpdate }})</span>
            </div>
          </div>
        </div>
        
        <div class="summary-actions">
          <button class="btn-primary">
            <span class="material-symbols-outlined">send</span> Send Recommendation
          </button>
          <div class="secondary-actions">
            <button class="btn-outline">Adjust Thresholds</button>
            <button class="btn-outline icon-only">
              <span class="material-symbols-outlined">description</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Current Readings -->
      <section class="readings-section">
        <h3>Current Readings</h3>
        <div class="metrics-grid">
          <!-- Soil Moisture -->
          <div class="metric-card" :class="{'alert': parcel.metrics.soilMoisture.isAlert}">
            <div class="metric-header">
              <span class="title"><span class="material-symbols-outlined">water_drop</span> Soil Moisture</span>
              <span class="trend-icon material-symbols-outlined" :class="{'alert-text': parcel.metrics.soilMoisture.isAlert}">trending_down</span>
            </div>
            <div class="metric-value-row">
              <span class="value" :class="{'alert-text': parcel.metrics.soilMoisture.isAlert}">{{ parcel.metrics.soilMoisture.value.replace('%', '') }}<span class="unit">%</span></span>
            </div>
            <div class="metric-footer">
              <span class="badge" :class="{'alert-badge': parcel.metrics.soilMoisture.isAlert}">{{ parcel.metrics.soilMoisture.label }}</span>
              <span class="time">{{ parcel.lastUpdate }}</span>
            </div>
            <div class="metric-recommendation">Recommended: {{ parcel.recommendedRanges?.soilMoisture || '28% - 35%' }}</div>
          </div>

          <!-- EC -->
          <div class="metric-card" :class="{'alert': parcel.metrics.ec.isAlert}">
            <div class="metric-header">
              <span class="title"><span class="material-symbols-outlined">bolt</span> EC</span>
              <span class="trend-icon material-symbols-outlined" :class="{'alert-text': parcel.metrics.ec.isAlert}">trending_up</span>
            </div>
            <div class="metric-value-row">
              <span class="value" :class="{'alert-text': parcel.metrics.ec.isAlert}">{{ parcel.metrics.ec.value.split(' ')[0] }}<span class="unit"> dS/m</span></span>
            </div>
            <div class="metric-footer">
              <span class="badge" :class="{'alert-badge': parcel.metrics.ec.isAlert, 'warning-badge': !parcel.metrics.ec.isAlert && parcel.metrics.ec.label !== 'Optimal'}">{{ parcel.metrics.ec.label }}</span>
              <span class="time">{{ parcel.lastUpdate }}</span>
            </div>
            <div class="metric-recommendation">Recommended: {{ parcel.recommendedRanges?.ec || '1.0 - 1.5' }}</div>
          </div>

          <!-- pH -->
          <div class="metric-card" :class="{'alert': parcel.metrics.ph.isAlert}">
            <div class="metric-header">
              <span class="title"><span class="material-symbols-outlined">science</span> pH</span>
              <span class="trend-icon material-symbols-outlined">trending_flat</span>
            </div>
            <div class="metric-value-row">
              <span class="value" :class="{'alert-text': parcel.metrics.ph.isAlert}">{{ parcel.metrics.ph.value }}</span>
            </div>
            <div class="metric-footer">
              <span class="badge neutral-badge">{{ parcel.metrics.ph.label }}</span>
              <span class="time">{{ parcel.lastUpdate }}</span>
            </div>
            <div class="metric-recommendation">Recommended: {{ parcel.recommendedRanges?.ph || '5.5 - 6.5' }}</div>
          </div>

          <!-- Temperature -->
          <div class="metric-card" :class="{'alert': parcel.metrics.temp.isAlert}">
            <div class="metric-header">
              <span class="title"><span class="material-symbols-outlined">device_thermostat</span> Temperature</span>
              <span class="trend-icon material-symbols-outlined">trending_flat</span>
            </div>
            <div class="metric-value-row">
              <span class="value" :class="{'alert-text': parcel.metrics.temp.isAlert}">{{ parcel.metrics.temp.value.replace('°C', '') }}<span class="unit">°C</span></span>
            </div>
            <div class="metric-footer">
              <span class="badge neutral-badge">{{ parcel.metrics.temp.label }}</span>
              <span class="time">{{ parcel.lastUpdate }}</span>
            </div>
            <div class="metric-recommendation">Recommended: {{ parcel.recommendedRanges?.temp || '20° - 28°' }}</div>
          </div>
        </div>
      </section>

      <!-- Bottom Grid -->
      <div class="bottom-grid">
        <!-- Left Column -->
        <div class="left-col">
          <!-- Recent Alerts -->
          <section class="card-section">
            <h3><span class="material-symbols-outlined text-red">notifications_active</span> Recent Alerts</h3>
            <div class="alerts-list">
              <div class="alert-item" v-for="activity in parcel.recentActivity?.filter(a => a.type === 'danger' || a.type === 'warning')" :key="activity.id">
                <div class="alert-dot" :class="activity.type"></div>
                <div class="alert-content">
                  <strong>{{ activity.title }}</strong>
                  <div class="alert-meta">
                    <span :class="activity.type === 'danger' ? 'text-red' : 'text-orange'">{{ activity.type === 'danger' ? 'Warning' : 'Preventive' }}</span>
                    <span>• {{ activity.timeAgo }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!parcel.recentActivity?.some(a => a.type === 'danger' || a.type === 'warning')" class="no-alerts">
                No recent alerts.
              </div>
            </div>
          </section>

          <!-- Device Health -->
          <section class="card-section">
            <div class="section-header">
              <h3><span class="material-symbols-outlined">sensors</span> Device Health</h3>
              <span class="device-id">{{ parcel.deviceHealth?.deviceId || 'ID: Unknown' }}</span>
            </div>
            <div class="device-grid">
              <div class="device-stat">
                <label>Status</label>
                <strong><span class="dot" :class="parcel.deviceHealth?.status === 'Online' ? 'green' : 'red'"></span> {{ parcel.deviceHealth?.status || 'Unknown' }}</strong>
              </div>
              <div class="device-stat">
                <label>Battery</label>
                <strong><span class="material-symbols-outlined">battery_full</span> {{ parcel.deviceHealth?.battery || '--' }}</strong>
              </div>
              <div class="device-stat">
                <label>Signal</label>
                <strong><span class="material-symbols-outlined">signal_cellular_alt</span> {{ parcel.deviceHealth?.signal || '--' }}</strong>
              </div>
              <div class="device-stat">
                <label>Last Sync</label>
                <strong>{{ parcel.deviceHealth?.lastSync || '--' }}</strong>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column -->
        <div class="right-col">
          <!-- Agronomic Recommendation -->
          <section class="card-section recommendation-section">
            <h3><span class="material-symbols-outlined text-green">eco</span> Agronomic Recommendation</h3>
            <div class="recommendation-box">
              <p>"{{ parcel.agronomicRecommendation || 'No recommendation available for current conditions.' }}"</p>
            </div>
            <div class="recommendation-actions">
              <button class="btn-primary">
                <span class="material-symbols-outlined">send</span> Send to Farmer
              </button>
              <button class="btn-outline bg-white">
                <span class="material-symbols-outlined">edit</span> Edit Recommendation
              </button>
            </div>
          </section>

          <!-- 24h Trends -->
          <section class="card-section trends-section">
            <div class="section-header">
              <h3>24h Trends</h3>
              <button class="link-btn">View Full Chart</button>
            </div>
            <div class="trends-list">
              <div class="trend-row">
                <div class="trend-info">
                  <strong>Moisture</strong>
                  <span class="trend-down">↓ Dropping</span>
                </div>
                <div class="sparkline">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,5 Q25,5 50,10 T100,15" fill="none" stroke="#C38265" stroke-width="2"/>
                    <path d="M0,5 Q25,5 50,10 T100,15 L100,20 L0,20 Z" fill="rgba(195,130,101,0.1)"/>
                  </svg>
                </div>
              </div>
              <div class="trend-row">
                <div class="trend-info">
                  <strong>EC / pH</strong>
                  <span class="trend-up">↑ Rising EC</span>
                </div>
                <div class="sparkline">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,15 Q25,15 50,10 T100,5" fill="none" stroke="#d4a373" stroke-width="2"/>
                    <path d="M0,15 Q25,15 50,10 T100,5 L100,20 L0,20 Z" fill="rgba(212,163,115,0.1)"/>
                  </svg>
                </div>
              </div>
              <div class="trend-row">
                <div class="trend-info">
                  <strong>Temp</strong>
                  <span class="trend-neutral">→ Stable</span>
                </div>
                <div class="sparkline">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,10 L100,10" fill="none" stroke="#9ca3af" stroke-width="2"/>
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.parcel-dashboard-view {
  font-family: 'Manrope', sans-serif;
  background-color: #faf9f5;
  min-height: 100%;
  padding: 32px 40px;
  color: #111827;
}

/* Header & Breadcrumbs */
.dashboard-header {
  margin-bottom: 24px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.breadcrumb-link {
  color: #4b5563;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #111827;
}

.separator {
  font-size: 16px;
  margin: 0 4px;
}

.breadcrumb-current {
  font-weight: 700;
  color: #111827;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

/* General Layout */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Summary Card */
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.title-row h2 {
  font-size: 24px;
  font-weight: 800;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.normal { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.status-badge.at-risk, .status-badge.critical { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }

.details-grid {
  display: flex;
  gap: 32px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.detail-item strong {
  font-size: 15px;
  color: #111827;
}

.flex-center {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-small {
  font-size: 16px;
  color: #6b7280;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.green { background: #16a34a; }
.dot.red { background: #dc2626; }

.time-detail {
  justify-content: flex-end;
  color: #9ca3af;
  font-size: 13px;
  padding-bottom: 2px;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.secondary-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn-primary {
  background: #7A9A7A;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(122, 154, 122, 0.2);
  transition: background 0.2s;
  font-family: inherit;
}
.btn-primary:hover { background: #688568; }

.btn-outline {
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}
.btn-outline:hover { background: #f9fafb; }
.btn-outline.icon-only { padding: 10px; }

/* Readings Grid */
.readings-section h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.metric-card.alert {
  border: 1px solid #fee2e2;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}
.metric-header .title .material-symbols-outlined { font-size: 18px; }

.trend-icon {
  font-size: 24px;
  color: #d1d5db;
  opacity: 0.5;
}

.metric-value-row {
  margin-bottom: 12px;
}

.value {
  font-size: 40px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.unit {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.metric-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}
.alert-badge { background: #fef2f2; color: #dc2626; }
.warning-badge { background: #fffbeb; color: #d97706; }
.neutral-badge { background: #f3f4f6; color: #4b5563; }

.text-red { color: #dc2626 !important; }
.text-orange { color: #ea580c !important; }
.text-green { color: #16a34a !important; }
.alert-text { color: #dc2626 !important; }

.time {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}

.metric-recommendation {
  font-size: 11px;
  color: #6b7280;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.card-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
}

.device-id {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  background: #faf9f5;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
}
.alert-dot.danger { background: #dc2626; }
.alert-dot.warning { background: #ea580c; }

.alert-content strong {
  display: block;
  font-size: 14px;
  color: #111827;
  margin-bottom: 4px;
}

.alert-meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 6px;
}

/* Device Grid */
.device-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.device-stat {
  background: #faf9f5;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-stat label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.device-stat strong {
  font-size: 15px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Recommendation Section */
.recommendation-section {
  background: #f4fbf4; /* light green tint */
  border: 1px solid #dcfce7;
}

.recommendation-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.recommendation-box p {
  margin: 0;
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
  font-weight: 500;
}

.recommendation-actions {
  display: flex;
  gap: 12px;
}

.bg-white { background: white !important; }

/* Trends Section */
.link-btn {
  background: none;
  border: none;
  color: #7A9A7A;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.trends-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.trend-row:last-child { border-bottom: none; }

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trend-info strong {
  font-size: 14px;
  color: #111827;
}

.trend-down { font-size: 11px; color: #dc2626; font-weight: 600; }
.trend-up { font-size: 11px; color: #ea580c; font-weight: 600; }
.trend-neutral { font-size: 11px; color: #6b7280; font-weight: 600; }

.sparkline {
  width: 150px;
  height: 30px;
  background: #faf9f5;
  border-radius: 4px;
  overflow: hidden;
}
.sparkline svg {
  width: 100%;
  height: 100%;
}
</style>
