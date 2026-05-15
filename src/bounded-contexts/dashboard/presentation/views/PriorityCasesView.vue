<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriorityCasesStore } from '../../application/stores/priorityCases.store'

const store = usePriorityCasesStore()
const router = useRouter()

const cases = computed(() => store.cases)
const selectedCase = computed(() => store.cases.find(c => c.id === store.selectedCaseId))

const selectCase = (id) => {
  store.selectCase(id)
}

const goToFullDashboard = () => {
  if (selectedCase.value && selectedCase.value.id) {
    router.push(`/dashboard/agronomist/priority-cases/${selectedCase.value.id}`)
  }
}
</script>

<template>
  <div class="priority-cases-view">
    <div class="header-section">
      <h1>Priority Cases</h1>
      <p>Manage and resolve critical agronomic alerts.</p>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <div class="filter-dropdowns">
        <button class="filter-btn">Severity <span class="material-symbols-outlined icon-small">expand_more</span></button>
        <button class="filter-btn">Client <span class="material-symbols-outlined icon-small">expand_more</span></button>
        <button class="filter-btn">Crop <span class="material-symbols-outlined icon-small">expand_more</span></button>
        <button class="filter-btn">Alert Type <span class="material-symbols-outlined icon-small">expand_more</span></button>
        <button class="filter-btn">Time Range <span class="material-symbols-outlined icon-small">expand_more</span></button>
      </div>
      <div class="search-box">
        <span class="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search cases...">
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card alert-kpi">
        <div class="kpi-top">
          <div class="icon-wrapper red">
            <span class="material-symbols-outlined">warning</span>
          </div>
          <strong class="count">{{ store.kpis.criticalCases }}</strong>
        </div>
        <span class="label">Critical Cases</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="icon-wrapper orange">
            <span class="material-symbols-outlined">landscape</span>
          </div>
          <strong class="count">{{ store.kpis.highRiskParcels }}</strong>
        </div>
        <span class="label">High Risk Parcels</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="icon-wrapper blue">
            <span class="material-symbols-outlined">assignment</span>
          </div>
          <strong class="count">{{ store.kpis.pendingRecommendations }}</strong>
        </div>
        <span class="label">Pending Recommendations</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="icon-wrapper green">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <strong class="count">{{ store.kpis.resolvedToday }}</strong>
        </div>
        <span class="label">Resolved Today</span>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-layout">
      <!-- Left Column: Queue -->
      <div class="queue-col">
        <div class="queue-header">
          <h2>Critical Alert Queue</h2>
          <button class="mark-read-btn">Mark All Read</button>
        </div>
        
        <div class="queue-list">
          <div class="queue-item" 
               v-for="c in cases" 
               :key="c.id" 
               :class="{'active': store.selectedCaseId === c.id}"
               @click="selectCase(c.id)">
            
            <div class="item-header">
              <div class="item-title-group">
                <span class="dot" :class="c.id === 'c4' ? 'gray' : (c.id === 'c2' ? 'brown' : 'red')"></span>
                <strong>{{ c.parcelName }}</strong>
                <span class="alert-badge" :class="c.alertBadge.includes('Yield') ? 'gray' : 'red'">{{ c.alertBadge }}</span>
              </div>
              <span class="time">{{ c.timeAgo }}</span>
            </div>
            
            <p class="description">{{ c.description }}</p>
            
            <div class="tags" v-if="c.tags && c.tags.length > 0 && store.selectedCaseId === c.id">
              <span class="tag" v-for="(tag, index) in c.tags" :key="index">
                <span class="material-symbols-outlined">{{ tag.icon }}</span>
                {{ tag.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Detail -->
      <div class="detail-col">
        <div class="detail-card" v-if="selectedCase && selectedCase.details">
          
          <div class="detail-header">
            <div class="detail-header-top">
              <span class="critical-alert-badge">CRITICAL ALERT</span>
              <button class="icon-btn" @click="goToFullDashboard" title="Open Full Dashboard"><span class="material-symbols-outlined">open_in_new</span></button>
            </div>
            <h2>{{ selectedCase.details.title }}</h2>
            <p>{{ selectedCase.details.subtitle }}</p>
          </div>

          <div class="map-placeholder">
            <span class="material-symbols-outlined map-icon">map</span>
            <div class="sensor-node-badge">{{ selectedCase.details.sensorNode }}</div>
          </div>

          <div class="metrics-row">
            <div class="metric">
              <span class="metric-label">Current EC</span>
              <div class="metric-val">
                <strong class="text-red">{{ selectedCase.details.metrics.ec.value }}</strong>
                <span class="unit">{{ selectedCase.details.metrics.ec.unit }}</span>
              </div>
            </div>
            <div class="metric">
              <span class="metric-label">Moisture</span>
              <div class="metric-val">
                <strong class="text-red">{{ selectedCase.details.metrics.moisture.value }}</strong>
                <span class="unit">{{ selectedCase.details.metrics.moisture.unit }}</span>
              </div>
            </div>
          </div>

          <div class="action-box">
            <div class="action-header">
              <span class="material-symbols-outlined">psychology</span>
              <strong>Suggested Action</strong>
            </div>
            <p>{{ selectedCase.details.suggestedAction }}</p>
            <div class="action-buttons">
              <button class="btn-primary">Apply Recommendation</button>
              <button class="btn-outline">Ignore</button>
            </div>
          </div>

          <div class="activity-section">
            <h3>Recent Case Activity</h3>
            <div class="timeline">
              <div class="timeline-item" v-for="act in selectedCase.details.activity" :key="act.id">
                <div class="timeline-ring" :class="{'current': act.isCurrent, 'alert': act.isAlert}">
                  <div class="timeline-dot"></div>
                </div>
                <div class="timeline-content">
                  <strong>{{ act.title }}</strong>
                  <small>{{ act.meta }}</small>
                </div>
              </div>
            </div>
          </div>

        </div>
        <div class="empty-state" v-else>
          <span class="material-symbols-outlined">inbox</span>
          <p>Select a case from the queue to view details.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.priority-cases-view {
  font-family: 'Manrope', sans-serif;
  background-color: #faf9f5;
  min-height: 100%;
  padding: 32px 40px;
  color: #111827;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
}

.header-section p {
  color: #6b7280;
  font-size: 15px;
  margin: 0;
}

/* Filters */
.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-dropdowns {
  display: flex;
  gap: 12px;
}

.filter-btn {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.filter-btn:hover { background: #f9fafb; }
.icon-small { font-size: 16px; }

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 8px;
  width: 300px;
}
.search-box .material-symbols-outlined { color: #9ca3af; font-size: 20px; }
.search-box input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  font-family: inherit;
}

/* KPIs */
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
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-card.alert-kpi {
  border-color: #fecaca;
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrapper.red { background: #fee2e2; color: #dc2626; }
.icon-wrapper.orange { background: #ffedd5; color: #ea580c; }
.icon-wrapper.blue { background: #f1f5f9; color: #475569; }
.icon-wrapper.green { background: #dcfce7; color: #16a34a; }

.count {
  font-size: 24px;
  font-weight: 800;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

/* Main Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* Left Queue */
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.queue-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.mark-read-btn {
  background: none;
  border: none;
  color: #7A9A7A;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-item {
  background: white;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.queue-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.queue-item.active {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.queue-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #b91c1c; /* Red highlight */
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.red { background: #dc2626; }
.dot.brown { background: #92400e; }
.dot.gray { background: #4b5563; }

.item-title-group strong {
  font-size: 16px;
  font-weight: 700;
}

.alert-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}
.alert-badge.red { background: #fee2e2; color: #dc2626; }
.alert-badge.gray { background: #f3f4f6; color: #4b5563; }

.time {
  font-size: 13px;
  color: #6b7280;
}

.description {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
}
.tag .material-symbols-outlined { font-size: 14px; }

/* Right Detail Column */
.detail-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  padding: 32px;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
}

.detail-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.critical-alert-badge {
  background: #fee2e2;
  color: #dc2626;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.icon-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
}

.detail-header h2 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.detail-header p {
  color: #4b5563;
  font-size: 15px;
  margin: 0 0 24px 0;
}

.map-placeholder {
  height: 200px;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 24px;
}

.map-icon {
  font-size: 48px;
  color: #d1d5db;
}

.sensor-node-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.metrics-row {
  display: flex;
  gap: 48px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  display: block;
}

.metric-val {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-val strong {
  font-size: 24px;
  font-weight: 800;
}

.metric-val .unit {
  font-size: 14px;
  color: #6b7280;
}

.text-red { color: #dc2626 !important; }

/* Suggested Action Box */
.action-box {
  margin-bottom: 32px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.action-header .material-symbols-outlined { color: #4b5563; }
.action-header strong { font-size: 15px; font-weight: 700; color: #111827; }

.action-box p {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: #7A9A7A;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-primary:hover { background: #688568; }

.btn-outline {
  background: white;
  border: 1px solid #9ca3af;
  color: #4b5563;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-outline:hover { background: #f9fafb; }

/* Timeline */
.activity-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #f3f4f6;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.timeline-ring {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.timeline-ring.current { border-color: #9ca3af; }
.timeline-ring.current .timeline-dot { width: 6px; height: 6px; background: #9ca3af; border-radius: 50%; }

.timeline-ring.alert { border-color: #dc2626; }
.timeline-ring.alert .timeline-dot { width: 6px; height: 6px; background: #dc2626; border-radius: 50%; }

.timeline-content {
  display: flex;
  flex-direction: column;
}

.timeline-content strong {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.timeline-content small {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  color: #9ca3af;
}

.empty-state .material-symbols-outlined {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
