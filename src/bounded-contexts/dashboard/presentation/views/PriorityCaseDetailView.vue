<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriorityCasesStore } from '../../application/stores/priorityCases.store'

const route = useRoute()
const router = useRouter()
const store = usePriorityCasesStore()

const caseId = computed(() => route.params.id)

const caseItem = computed(() => {
  return store.cases.find(c => c.id === caseId.value)
})

onMounted(() => {
  if (!caseItem.value) {
    router.push('/dashboard/agronomist/priority-cases')
  }
})

const goBack = () => {
  router.push('/dashboard/agronomist/priority-cases')
}
</script>

<template>
  <div class="priority-case-detail-view" v-if="caseItem && caseItem.details">
    
    <!-- Top Nav & Header -->
    <div class="view-header">
      <nav class="breadcrumbs">
        <router-link to="/dashboard/agronomist/priority-cases" class="breadcrumb-link">Priority Cases</router-link>
        <span class="separator material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-text">Critical Alert</span>
        <span class="separator material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-current">{{ caseItem.sectionName }}</span>
      </nav>

      <div class="title-row">
        <h1>Critical Alert Detail</h1>
        <p class="subtitle">Review the alert context, sensor history, and recommended agronomic action before contacting the farmer.</p>
      </div>
    </div>

    <div class="content-grid">
      <!-- Left Column -->
      <div class="left-col">
        
        <!-- Summary Card -->
        <section class="card summary-card">
          <div class="summary-top">
            <div class="summary-titles">
              <h2>{{ caseItem.parcelName }}</h2>
              <p class="meta">{{ caseItem.sectionName }} • {{ caseItem.crop }} • {{ caseItem.location }}</p>
            </div>
            <div class="badges">
              <span class="badge critical-badge"><span class="material-symbols-outlined icon-xs">error</span> Critical</span>
              <span class="badge new-badge">New</span>
            </div>
          </div>
          
          <div class="alert-box">
            <div class="alert-title">
              <span class="material-symbols-outlined text-red">warning</span>
              <strong>Alert Type</strong>
            </div>
            <p>{{ caseItem.details.subtitle }} combined with low soil moisture.</p>
          </div>
        </section>

        <!-- Metrics Grid -->
        <section class="metrics-grid">
          <div class="metric-card" v-for="(metric, key) in caseItem.details.metrics" :key="key">
            <div class="metric-header">
              <span class="material-symbols-outlined">
                {{ key === 'moisture' ? 'water_drop' : key === 'ec' ? 'science' : key === 'ph' ? 'water_ph' : 'device_thermostat' }}
              </span>
              <span class="title">{{ key.toUpperCase() }}</span>
            </div>
            <div class="metric-value">
              <strong :class="{'text-red': metric.isAlert, 'text-orange': metric.label === 'Slightly high'}">{{ metric.value }}</strong>
              <span class="unit">{{ metric.unit }}</span>
              <span class="material-symbols-outlined trend-icon" :class="{'text-red': metric.isAlert}">
                {{ metric.trend === 'up' ? 'trending_up' : 'trending_down' }}
              </span>
            </div>
            <div class="metric-footer" :class="{'text-red': metric.isAlert, 'text-orange': metric.label === 'Slightly high'}">
              {{ metric.label }}
            </div>
          </div>
        </section>

        <!-- Historical Context Card -->
        <section class="card historical-card">
          <div class="historical-header">
            <span class="material-symbols-outlined">history</span>
            <h3>Historical Context</h3>
          </div>
          <div class="historical-body">
            <div class="chart-area">
              <span class="chart-title">7-Day Trend (EC & Moisture)</span>
              <div class="chart-placeholder">
                Chart Visualization Placeholder
              </div>
            </div>
            <div class="stats-area">
              <div class="stat-row">
                <span>Previous alerts</span>
                <strong>{{ caseItem.details.historicalContext?.previousAlerts || '0' }}</strong>
              </div>
              <div class="stat-row">
                <span>Last rec sent</span>
                <strong>{{ caseItem.details.historicalContext?.lastRecSent || '--' }}</strong>
              </div>
              <div class="stat-row">
                <span>Farmer response</span>
                <span class="response-badge">{{ caseItem.details.historicalContext?.farmerResponse || 'None' }}</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- Right Column -->
      <div class="right-col">
        
        <!-- Recommendation Card -->
        <section class="card rec-card">
          <div class="rec-header">
            <div class="rec-title">
              <span class="material-symbols-outlined">edit_note</span>
              <h3>Recommendation</h3>
            </div>
            <div class="confidence-badge">
              <small>CONFIDENCE:</small>
              <strong>{{ caseItem.details.confidence || 'HIGH' }}</strong>
            </div>
          </div>
          
          <div class="rec-box">
            <p>{{ caseItem.details.suggestedAction }}</p>
          </div>
          
          <div class="rec-actions">
            <button class="btn-primary full-width">
              <span class="material-symbols-outlined">send</span> Send Recommendation
            </button>
            <button class="btn-outline full-width">Save Draft</button>
          </div>
        </section>

        <!-- Contact Card -->
        <section class="card contact-card" v-if="caseItem.details.farmerContact">
          <div class="avatar">{{ caseItem.details.farmerContact.initials }}</div>
          <div class="contact-info">
            <strong>{{ caseItem.details.farmerContact.name }}</strong>
            <p>{{ caseItem.details.farmerContact.methods }} • {{ caseItem.details.farmerContact.lastContact }}</p>
          </div>
          <button class="icon-btn"><span class="material-symbols-outlined">forum</span></button>
        </section>

        <!-- Timeline Card -->
        <section class="card timeline-card">
          <h3>Timeline</h3>
          <div class="timeline">
            <div class="timeline-item" v-for="act in caseItem.details.activity" :key="act.id">
              <div class="timeline-ring" :class="{'current': act.isCurrent}">
                <div class="timeline-dot"></div>
              </div>
              <div class="timeline-content">
                <strong>{{ act.title }}</strong>
                <small>{{ act.meta }}</small>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>

    <!-- Sticky Footer -->
    <div class="sticky-footer">
      <button class="btn-text" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span> Back to Priority Cases
      </button>
      <div class="footer-actions">
        <button class="btn-outline">Save Review</button>
        <button class="btn-primary">Send Recommendation</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.priority-case-detail-view {
  font-family: 'Manrope', sans-serif;
  background-color: #faf9f5;
  min-height: 100vh;
  padding: 32px 40px 100px 40px; /* bottom padding for footer */
  color: #111827;
  position: relative;
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 24px;
}
.breadcrumb-link { color: #4b5563; text-decoration: none; font-weight: 600; }
.breadcrumb-link:hover { color: #111827; }
.separator { font-size: 16px; margin: 0 4px; }
.breadcrumb-current { font-weight: 700; color: #111827; }

/* Header */
.title-row { margin-bottom: 32px; }
.title-row h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.025em; }
.subtitle { font-size: 15px; color: #6b7280; margin: 0; }

/* Layout Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}
.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Global Card Style */
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}

/* Summary Card */
.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.summary-titles h2 { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; }
.meta { color: #6b7280; font-size: 14px; margin: 0; }

.badges { display: flex; gap: 8px; }
.badge { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
.critical-badge { background: #fee2e2; color: #dc2626; }
.new-badge { background: #f3f4f6; color: #4b5563; }
.icon-xs { font-size: 14px; }

.alert-box {
  background: #fffafa; /* very light red tint */
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}
.alert-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.alert-title strong { color: #dc2626; font-size: 14px; font-weight: 700; }
.alert-box p { margin: 0; color: #374151; font-size: 14px; }

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.metric-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  padding: 16px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}
.metric-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; color: #6b7280; }
.metric-header .material-symbols-outlined { font-size: 16px; }
.metric-header .title { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }

.metric-value { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
.metric-value strong { font-size: 28px; font-weight: 800; color: #111827; }
.metric-value .unit { font-size: 14px; color: #6b7280; font-weight: 600; }
.trend-icon { font-size: 20px; color: #9ca3af; margin-left: auto; }

.metric-footer { font-size: 12px; font-weight: 700; color: #6b7280; }

.text-red { color: #dc2626 !important; }
.text-orange { color: #d97706 !important; }

/* Historical Card */
.historical-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.historical-header h3 { font-size: 18px; font-weight: 800; margin: 0; }

.historical-body { display: grid; grid-template-columns: 1fr 200px; gap: 32px; }
.chart-area { display: flex; flex-direction: column; gap: 12px; }
.chart-title { font-size: 12px; font-weight: 700; color: #6b7280; }
.chart-placeholder {
  background: #f3f4f6;
  border-radius: 8px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
}

.stats-area { display: flex; flex-direction: column; gap: 16px; justify-content: center; }
.stat-row { display: flex; justify-content: space-between; align-items: center; }
.stat-row span { font-size: 13px; color: #6b7280; }
.stat-row strong { font-size: 13px; color: #111827; font-weight: 700; }
.response-badge { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }

/* Recommendation Card */
.rec-card { border-top: 4px solid #7A9A7A; } /* specific top border for rec */
.rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rec-title { display: flex; align-items: center; gap: 8px; }
.rec-title h3 { font-size: 18px; font-weight: 800; margin: 0; color: #111827; }
.confidence-badge { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 6px; }
.confidence-badge small { font-size: 10px; color: #6b7280; font-weight: 700; }
.confidence-badge strong { font-size: 11px; color: #456c4c; }

.rec-box { background: #faf9f5; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.rec-box p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }

.rec-actions { display: flex; flex-direction: column; gap: 12px; }
.full-width { width: 100%; justify-content: center; }

/* Contact Card */
.contact-card { display: flex; align-items: center; gap: 16px; padding: 16px 24px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #4b5563; }
.contact-info { flex: 1; }
.contact-info strong { font-size: 14px; color: #111827; display: block; margin-bottom: 2px; }
.contact-info p { font-size: 12px; color: #6b7280; margin: 0; }
.icon-btn { background: none; border: none; color: #4b5563; cursor: pointer; display: flex; }

/* Timeline Card */
.timeline-card h3 { font-size: 16px; font-weight: 800; margin: 0 0 20px 0; }
.timeline { display: flex; flex-direction: column; gap: 20px; position: relative; }
.timeline::before { content: ''; position: absolute; left: 7px; top: 10px; bottom: 10px; width: 2px; background: #e5e7eb; }

.timeline-item { display: flex; gap: 16px; position: relative; z-index: 1; }
.timeline-ring { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.timeline-ring.current { border-color: #7A9A7A; }
.timeline-ring.current .timeline-dot { width: 6px; height: 6px; background: #7A9A7A; border-radius: 50%; }

.timeline-content { display: flex; flex-direction: column; }
.timeline-content strong { font-size: 13px; font-weight: 700; color: #111827; }
.timeline-content small { font-size: 11px; color: #9ca3af; margin-top: 2px; }

/* Sticky Footer */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 250px; /* offset for sidebar */
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02);
}

.btn-text { background: none; border: none; color: #4b5563; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; }
.footer-actions { display: flex; gap: 16px; }

/* Buttons */
.btn-primary { background: #456c4c; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: background 0.2s; }
.btn-primary:hover { background: #37563d; }
.btn-outline { background: white; border: 1px solid #9ca3af; color: #4b5563; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: background 0.2s; }
.btn-outline:hover { background: #f9fafb; }
</style>
