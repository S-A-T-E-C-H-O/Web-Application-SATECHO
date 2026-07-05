<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const route = useRoute()
const router = useRouter()
const store = useDashboardAgronomistStore()

const caseId = computed(() => route.params.id)
const caseItem = computed(() => store.priorityCases.find((c) => c.id === caseId.value))

onMounted(async () => {
  if (store.status === 'idle') await store.loadDashboard()
  if (!caseItem.value) {
    router.push('/dashboard/agronomist/priority-cases')
    return
  }
  loadZones()
})

const goBack = () => router.push('/dashboard/agronomist/priority-cases')

/*
|--------------------------------------------------------------------------
| RECOMMENDATION FORM (EP-009-US004)
|--------------------------------------------------------------------------
*/

const zones = ref([])
const form = ref({ zoneId: '', title: '', description: '', recommendedActions: '', priority: 'MEDIUM' })
const isSending = ref(false)
const sendError = ref('')
const sendSuccess = ref(false)

const loadZones = async () => {
  const farmId = caseItem.value?.farmId
  if (!farmId) return
  try {
    const response = await apiRequest({ method: 'GET', url: `/api/v1/farms/${farmId}/zones` })
    zones.value = Array.isArray(response.data) ? response.data : []
    if (zones.value.length) form.value.zoneId = zones.value[0].id
  } catch {
    zones.value = []
  }
}

const sendRecommendation = async () => {
  if (!form.value.zoneId || !form.value.title || !form.value.description) {
    sendError.value = 'Zone, title, and description are required.'
    return
  }
  isSending.value = true
  sendError.value = ''
  try {
    await apiRequest({
      method: 'POST',
      url: '/api/v1/recommendations',
      data: {
        farmerId: caseItem.value.farmerId,
        zoneId: form.value.zoneId,
        title: form.value.title,
        description: form.value.description,
        recommendedActions: form.value.recommendedActions,
        priority: form.value.priority,
      },
    })
    sendSuccess.value = true
  } catch (error) {
    sendError.value = error.message || 'Could not send the recommendation.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="priority-case-detail-view" v-if="caseItem">
    <div class="view-header">
      <nav class="breadcrumbs">
        <router-link to="/dashboard/agronomist/priority-cases" class="breadcrumb-link">Priority Cases</router-link>
        <span class="separator material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-current">{{ caseItem.parcelName }}</span>
      </nav>

      <div class="title-row">
        <h1>{{ caseItem.title }}</h1>
        <p class="subtitle">{{ caseItem.subtitle }} — {{ caseItem.timeAgo }}</p>
      </div>
    </div>

    <div class="content-grid">
      <div class="left-col">
        <section class="card summary-card">
          <div class="summary-top">
            <div class="summary-titles">
              <h2>{{ caseItem.parcelName }}</h2>
            </div>
            <div class="badges">
              <span class="badge" :class="caseItem.type === 'critical' ? 'critical-badge' : 'warning-badge'">
                <span class="material-symbols-outlined icon-xs">{{ caseItem.type === 'critical' ? 'error' : 'warning' }}</span>
                {{ caseItem.type === 'critical' ? 'Critical' : 'Warning' }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div class="right-col">
        <section class="card rec-card">
          <div class="rec-header">
            <div class="rec-title">
              <span class="material-symbols-outlined">edit_note</span>
              <h3>Send Recommendation</h3>
            </div>
          </div>

          <div v-if="sendSuccess" class="success-box">
            Recommendation sent to the farmer.
          </div>

          <form v-else class="rec-form" @submit.prevent="sendRecommendation">
            <label class="form-field">
              <span>Zone</span>
              <select v-model="form.zoneId" required>
                <option v-if="!zones.length" value="">No zones found</option>
                <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Title</span>
              <input v-model.trim="form.title" required>
            </label>
            <label class="form-field">
              <span>Description</span>
              <textarea v-model.trim="form.description" rows="3" required></textarea>
            </label>
            <label class="form-field">
              <span>Recommended actions</span>
              <textarea v-model.trim="form.recommendedActions" rows="2"></textarea>
            </label>
            <label class="form-field">
              <span>Priority</span>
              <select v-model="form.priority">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <p v-if="sendError" class="error-text">{{ sendError }}</p>
            <button type="submit" class="btn-primary full-width" :disabled="isSending">
              <span class="material-symbols-outlined">send</span> {{ isSending ? 'Sending...' : 'Send Recommendation' }}
            </button>
          </form>
        </section>
      </div>
    </div>

    <div class="sticky-footer">
      <button class="btn-text" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span> Back to Priority Cases
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.priority-case-detail-view {
  font-family: 'Manrope', sans-serif;
  background-color: #faf9f5;
  min-height: 100vh;
  padding: 32px 40px 100px 40px;
  color: #111827;
  position: relative;
}

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
.breadcrumb-current { font-weight: 700; color: #111827; text-transform: capitalize; }

.title-row { margin-bottom: 32px; }
.title-row h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.025em; text-transform: capitalize; }
.subtitle { font-size: 15px; color: #6b7280; margin: 0; }

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.summary-titles h2 { font-size: 24px; font-weight: 800; margin: 0; }

.badges { display: flex; gap: 8px; }
.badge { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
.critical-badge { background: #fee2e2; color: #dc2626; }
.warning-badge { background: #ffedd5; color: #ea580c; }
.icon-xs { font-size: 14px; }

.rec-card { border-top: 4px solid #7A9A7A; }
.rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rec-title { display: flex; align-items: center; gap: 8px; }
.rec-title h3 { font-size: 18px; font-weight: 800; margin: 0; color: #111827; }

.rec-form { display: flex; flex-direction: column; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #4b5563; font-weight: 600; }
.form-field input,
.form-field select,
.form-field textarea {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 14px;
}

.error-text { color: #dc2626; font-size: 13px; margin: 0; }
.success-box { background: #dcfce7; color: #166534; border-radius: 8px; padding: 16px; font-weight: 600; }

.full-width { width: 100%; justify-content: center; }

.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 250px;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 40px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02);
}

.btn-text { background: none; border: none; color: #4b5563; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: inherit; }

.btn-primary { background: #456c4c; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: background 0.2s; }
.btn-primary:hover { background: #37563d; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
