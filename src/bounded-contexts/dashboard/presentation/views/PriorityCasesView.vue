<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const store = useDashboardAgronomistStore()
const router = useRouter()

onMounted(() => {
  if (store.status === 'idle') store.loadDashboard()
})

const selectedCaseId = ref(null)

const cases = computed(() => store.priorityCases)
const selectedCase = computed(() => cases.value.find((c) => c.id === selectedCaseId.value) || cases.value[0] || null)

const selectCase = (id) => {
  selectedCaseId.value = id
}

const goToFullDashboard = () => {
  if (selectedCase.value?.id) {
    router.push(`/dashboard/agronomist/priority-cases/${selectedCase.value.id}`)
  }
}
</script>

<template>
  <div class="priority-cases-view">
    <div class="header-section">
      <h1>Priority Cases</h1>
      <p>Review critical agronomic alerts across your assigned clients.</p>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card alert-kpi">
        <div class="kpi-top">
          <div class="icon-wrapper red">
            <span class="material-symbols-outlined">warning</span>
          </div>
          <strong class="count">{{ store.kpis.criticalAlerts }}</strong>
        </div>
        <span class="label">Critical Alerts</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="icon-wrapper orange">
            <span class="material-symbols-outlined">landscape</span>
          </div>
          <strong class="count">{{ store.kpis.atRisk }}</strong>
        </div>
        <span class="label">Parcels At Risk</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="icon-wrapper green">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <strong class="count">{{ store.kpis.normalParcels }}</strong>
        </div>
        <span class="label">Normal Parcels</span>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-layout">
      <!-- Left Column: Queue -->
      <div class="queue-col">
        <div class="queue-header">
          <h2>Critical Alert Queue</h2>
        </div>

        <div class="queue-list">
          <div class="queue-item"
               v-for="c in cases"
               :key="c.id"
               :class="{'active': selectedCase && selectedCase.id === c.id}"
               @click="selectCase(c.id)">

            <div class="item-header">
              <div class="item-title-group">
                <span class="dot" :class="c.type === 'critical' ? 'red' : 'brown'"></span>
                <strong>{{ c.parcelName }}</strong>
                <span class="alert-badge" :class="c.type === 'critical' ? 'red' : 'gray'">{{ c.title }}</span>
              </div>
              <span class="time">{{ c.timeAgo }}</span>
            </div>

            <p class="description">{{ c.subtitle }}</p>
          </div>

          <div v-if="cases.length === 0" class="empty-state inline">
            <span class="material-symbols-outlined">inbox</span>
            <p>No critical cases right now.</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Detail -->
      <div class="detail-col">
        <div class="detail-card" v-if="selectedCase">
          <div class="detail-header">
            <div class="detail-header-top">
              <span class="critical-alert-badge">{{ selectedCase.type === 'critical' ? 'CRITICAL ALERT' : 'WARNING' }}</span>
              <button class="icon-btn" @click="goToFullDashboard" title="Open Full Detail"><span class="material-symbols-outlined">open_in_new</span></button>
            </div>
            <h2>{{ selectedCase.title }}</h2>
            <p>{{ selectedCase.subtitle }}</p>
            <p class="meta-line">{{ selectedCase.parcelName }} • {{ selectedCase.timeAgo }}</p>
          </div>

          <button class="btn-primary full-width" @click="goToFullDashboard">
            <span class="material-symbols-outlined">edit_note</span> Review & Send Recommendation
          </button>
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

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  background-color: #b91c1c;
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

.item-title-group strong {
  font-size: 16px;
  font-weight: 700;
}

.alert-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
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
  margin: 0;
}

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
  text-transform: capitalize;
}

.detail-header p {
  color: #4b5563;
  font-size: 15px;
  margin: 0 0 8px 0;
}

.meta-line {
  color: #9ca3af !important;
  font-size: 13px !important;
  margin-bottom: 24px !important;
}

.btn-primary {
  background: #7A9A7A;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:hover { background: #688568; }
.full-width { width: 100%; }

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

.empty-state.inline {
  height: 200px;
}

.empty-state .material-symbols-outlined {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
