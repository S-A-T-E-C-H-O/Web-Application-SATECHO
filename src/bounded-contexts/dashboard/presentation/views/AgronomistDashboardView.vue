<template>
  <div class="dashboard-content">
    <div class="header-section">
      <h1>Multi-Parcel Dashboard</h1>
      <p>Monitor assigned parcels, detect risks, and prioritize agronomic actions in real time.</p>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header">
          <span>ASSIGNED PARCELS</span>
          <span class="material-symbols-outlined">map</span>
        </div>
        <div class="kpi-value">{{ store.kpis.assignedParcels }}</div>
      </div>
      <div class="kpi-card normal">
        <div class="kpi-header">
          <span>NORMAL PARCELS</span>
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <div class="kpi-value">{{ store.kpis.normalParcels }}</div>
      </div>
      <div class="kpi-card risk">
        <div class="kpi-header">
          <span>AT RISK</span>
          <span class="material-symbols-outlined">warning</span>
        </div>
        <div class="kpi-value">{{ store.kpis.atRisk }}</div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-header">
          <span>CRITICAL ALERTS</span>
          <span class="material-symbols-outlined">error</span>
        </div>
        <div class="kpi-value">{{ store.kpis.criticalAlerts }}</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <button class="filter-btn">Client: All <span class="material-symbols-outlined">expand_more</span></button>
      <button class="filter-btn">Crop: All <span class="material-symbols-outlined">expand_more</span></button>
      <button class="filter-btn">Status: All <span class="material-symbols-outlined">expand_more</span></button>
      <button class="filter-btn">Zone: All <span class="material-symbols-outlined">expand_more</span></button>
      <button class="filter-btn"><span class="material-symbols-outlined">calendar_today</span> Date Range</button>
    </div>

    <!-- Main Grid -->
    <div class="main-grid">
      
      <!-- Left Column: Parcels List -->
      <div class="parcels-column">
        <div v-for="parcel in store.parcels" :key="parcel.id" class="parcel-card" :class="parcel.status.toLowerCase().replace(' ', '-')">
          <div class="parcel-header">
            <div class="parcel-title">
              <h2>{{ parcel.client }} <span>({{ parcel.name }})</span></h2>
              <div class="tags">
                <span class="tag"><span class="material-symbols-outlined">local_florist</span> {{ parcel.crop }}</span>
                <span class="tag status-tag" :class="parcel.status.toLowerCase().replace(' ', '-')">
                  <span class="material-symbols-outlined" v-if="parcel.status === 'Normal'">check_circle</span>
                  <span class="material-symbols-outlined" v-if="parcel.status === 'At Risk'">warning</span>
                  <span class="material-symbols-outlined" v-if="parcel.status === 'Critical'">error</span>
                  {{ parcel.status }}
                </span>
              </div>
            </div>
            <button class="icon-btn"><span class="material-symbols-outlined">more_vert</span></button>
          </div>

          <div class="metrics-grid">
            <div class="metric-box" :class="{ alert: parcel.metrics.soilMoisture.isAlert }">
              <small>Soil Moisture <span v-if="parcel.metrics.soilMoisture.trend === 'down'" class="material-symbols-outlined trend">arrow_downward</span></small>
              <strong>{{ parcel.metrics.soilMoisture.value }}<span>{{ parcel.metrics.soilMoisture.unit }}</span></strong>
            </div>
            <div class="metric-box" :class="{ alert: parcel.metrics.ec.isAlert }">
              <small>EC <span v-if="parcel.metrics.ec.trend === 'up'" class="material-symbols-outlined trend">arrow_upward</span></small>
              <strong>{{ parcel.metrics.ec.value }} <span>{{ parcel.metrics.ec.unit }}</span></strong>
            </div>
            <div class="metric-box" :class="{ alert: parcel.metrics.ph.isAlert }">
              <small>pH</small>
              <strong>{{ parcel.metrics.ph.value }}</strong>
            </div>
            <div class="metric-box" :class="{ alert: parcel.metrics.temp.isAlert }">
              <small>Temp</small>
              <strong>{{ parcel.metrics.temp.value }}<span>{{ parcel.metrics.temp.unit }}</span></strong>
            </div>
          </div>

          <div class="parcel-actions">
            <button v-if="parcel.status === 'Normal'" class="btn-outline">View Details</button>
            <template v-else-if="parcel.status === 'At Risk'">
              <button class="btn-text">Adjust Thresholds</button>
              <button class="btn-solid warning">Send Recommendation</button>
            </template>
            <template v-else-if="parcel.status === 'Critical'">
              <button class="btn-text">Adjust Thresholds</button>
              <button class="btn-solid critical">Urgent Action Required</button>
            </template>
          </div>
        </div>
      </div>

      <!-- Right Column: Side Widgets -->
      <div class="side-column">
        
        <!-- Priority Cases Widget -->
        <div class="widget-card">
          <div class="widget-header">
            <h3><span class="material-symbols-outlined">assignment_late</span> Priority Cases</h3>
          </div>
          <div class="priority-list">
            <div v-for="caseItem in store.priorityCases" :key="caseItem.id" class="priority-item" :class="caseItem.type">
              <div class="priority-icon">
                <span class="material-symbols-outlined" v-if="caseItem.type === 'critical'">error</span>
                <span class="material-symbols-outlined" v-if="caseItem.type === 'warning'">warning</span>
              </div>
              <div class="priority-content">
                <div class="priority-top">
                  <strong>{{ caseItem.parcelName }}</strong>
                  <small>{{ caseItem.timeAgo }}</small>
                </div>
                <p class="priority-title">{{ caseItem.title }}</p>
                <p class="priority-desc">{{ caseItem.subtitle }}</p>
                <a href="#" class="priority-link">{{ caseItem.type === 'critical' ? 'Review Now' : 'View Sector' }} &rarr;</a>
              </div>
            </div>
          </div>
          <a href="#" class="view-all-link">View all priority cases</a>
        </div>

        <!-- Regional Insights Widget -->
        <div class="widget-card">
          <div class="widget-header">
            <h3><span class="material-symbols-outlined">show_chart</span> Regional Insights</h3>
          </div>
          <div class="chart-container">
            <div class="bar-chart">
              <div class="bar" style="height: 40%; background: #d0d9d0;"></div>
              <div class="bar" style="height: 60%; background: #c2cec2;"></div>
              <div class="bar" style="height: 55%; background: #b5c4b5;"></div>
              <div class="bar" style="height: 80%; background: #e0b4b4;"></div>
              <div class="bar" style="height: 100%; background: #e09f9f;"></div>
              <div class="bar" style="height: 70%; background: #96a996;"></div>
            </div>
          </div>
          <p class="chart-desc">Average EC levels are trending upward across Southern Zone parcels over the last 48 hours.</p>
          <button class="btn-outline full-width">View Analysis &rarr;</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const store = useDashboardAgronomistStore()

onMounted(() => store.loadDashboard())
</script>

<style scoped>
.dashboard-content {
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

/* KPI Grid */
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
}

.kpi-card.normal .material-symbols-outlined { color: #456c4c; }
.kpi-card.risk .material-symbols-outlined { color: #c08552; }
.kpi-card.critical .material-symbols-outlined,
.kpi-card.critical .kpi-value { color: #c62828; }

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

.kpi-value {
  font-size: 36px;
  font-weight: 700;
  color: #111;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  font-weight: 500;
}

.filter-btn .material-symbols-outlined {
  font-size: 18px;
  color: #888;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

/* Parcels Column */
.parcels-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parcel-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #eaeaea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  position: relative;
}

.parcel-card.critical {
  border-color: #c62828;
  border-left: 4px solid #c62828;
}

.parcel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.parcel-title h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #111;
}

.parcel-title h2 span {
  font-weight: 400;
  color: #666;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f5f5f5;
  color: #555;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag .material-symbols-outlined {
  font-size: 14px;
}

.status-tag.normal { background: #edf2ed; color: #456c4c; }
.status-tag.at-risk { background: #fdf2e9; color: #c08552; }
.status-tag.critical { background: #ffebee; color: #c62828; }

.icon-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.metric-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-box.alert {
  background: #fff5f5;
  color: #c62828;
}

.metric-box small {
  color: #888;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-box.alert small {
  color: #c62828;
}

.metric-box strong {
  font-size: 18px;
  color: #111;
}

.metric-box.alert strong {
  color: #c62828;
}

.metric-box strong span {
  font-size: 14px;
  font-weight: 500;
  margin-left: 2px;
}

.trend {
  font-size: 14px;
  font-weight: bold;
}

/* Actions */
.parcel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  align-items: center;
}

.btn-outline {
  padding: 8px 16px;
  background: white;
  border: 1px solid #7A9A7A;
  color: #7A9A7A;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn-text {
  background: transparent;
  border: none;
  color: #555;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn-solid {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  color: white;
}

.btn-solid.warning { background: #7A9A7A; }
.btn-solid.critical { background: #c62828; }

/* Side Widgets */
.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.widget-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #eaeaea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.widget-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #111;
}

.widget-header .material-symbols-outlined {
  color: #456c4c;
}

/* Priority List */
.priority-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.priority-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #eee;
}

.priority-item.critical {
  background: #fffafa;
  border-color: #ffcdd2;
}

.priority-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.critical .priority-icon {
  background: #ffebee;
  color: #c62828;
}

.critical .priority-icon .material-symbols-outlined { font-size: 14px; }

.warning .priority-icon {
  background: #fdf2e9;
  color: #c08552;
}

.warning .priority-icon .material-symbols-outlined { font-size: 14px; }


.priority-content {
  flex: 1;
}

.priority-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.priority-top strong {
  font-size: 13px;
  color: #111;
}

.priority-top small {
  font-size: 11px;
  color: #888;
}

.priority-title {
  margin: 0 0 2px 0;
  font-size: 13px;
  font-weight: 500;
}

.critical .priority-title { color: #c62828; }
.warning .priority-title { color: #c08552; }

.priority-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.priority-link {
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.critical .priority-link { color: #c62828; }
.warning .priority-link { color: #c08552; }

.view-all-link {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #888;
  text-decoration: none;
  margin-top: 16px;
}

/* Regional Insights Chart */
.chart-container {
  height: 120px;
  display: flex;
  align-items: flex-end;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
}

.chart-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 20px;
}

.full-width {
  width: 100%;
}
</style>
