<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '@/shared/infrastructure/http/api-client'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const store = useDashboardAgronomistStore()
const events = ref([])
const isLoading = ref(true)
const error = ref('')

const relativeTime = (isoString) => {
  if (!isoString) return ''
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000))
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

const load = async () => {
  isLoading.value = true
  error.value = ''
  try {
    if (store.status === 'idle') await store.loadDashboard()
    const farmIds = [...new Set(store.supervisedParcels.map((p) => p.farmId).filter(Boolean))]
    const results = await Promise.allSettled(
      farmIds.map((farmId) => apiRequest({ method: 'GET', url: `/api/v1/farms/${farmId}/security/events` }))
    )
    const clientByFarmId = new Map(store.supervisedParcels.map((p) => [p.farmId, p.clientName]))
    events.value = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r, i) => (Array.isArray(r.value?.data) ? r.value.data : []).map((e) => ({
        ...e,
        clientName: clientByFarmId.get(farmIds[i]) || 'Client',
      })))
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
  } catch (e) {
    error.value = e.message || 'Could not load security events.'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const isPerson = (event) => event.classification === 'PERSON'
</script>

<template>
  <main class="security-page">
    <div class="page-heading">
      <h1>Client Security Events</h1>
      <p>Perimeter security activity across your assigned clients' farms.</p>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="isLoading" class="loading">Loading…</div>
    <div v-else-if="events.length === 0" class="empty-state">
      <span class="material-symbols-outlined">shield</span>
      <p>No security events reported for your clients.</p>
    </div>
    <div v-else class="events-list">
      <article v-for="event in events" :key="event.id" class="event-card" :class="{ danger: isPerson(event) }">
        <span class="material-symbols-outlined">{{ isPerson(event) ? 'directions_walk' : 'warning_amber' }}</span>
        <div class="event-body">
          <strong>{{ event.classification }} detected — {{ event.clientName }}</strong>
          <p>{{ event.locationDescription || 'Unknown location' }} • {{ relativeTime(event.detectedAt) }}</p>
        </div>
        <span class="severity-badge" :class="(event.severity || '').toLowerCase()">{{ event.severity }}</span>
      </article>
    </div>
  </main>
</template>

<style scoped>
.security-page {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f7f8f5;
  min-height: 100vh;
}

.page-heading h1 { margin: 0 0 6px; font-size: 32px; color: #1f2937; }
.page-heading p { margin: 0; color: #7a7a7a; }

.error-text { color: #c62828; font-weight: 600; }
.loading { color: #888; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: white;
  border-radius: 16px;
  border: 1px solid #ececec;
  color: #9ca3af;
}
.empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 12px; }

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #ececec;
  border-left: 4px solid #d97706;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.event-card.danger {
  border-left-color: #dc2626;
}

.event-body { flex: 1; }
.event-body strong { display: block; margin-bottom: 4px; }
.event-body p { margin: 0; color: #6b7280; font-size: 13px; }

.severity-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.severity-badge.critical { background: #fee2e2; color: #dc2626; }
.severity-badge.high { background: #ffedd5; color: #ea580c; }
.severity-badge.medium,
.severity-badge.low { background: #f3f4f6; color: #4b5563; }
</style>
