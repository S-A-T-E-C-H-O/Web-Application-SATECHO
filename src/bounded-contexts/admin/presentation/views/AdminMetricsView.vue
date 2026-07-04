<script setup>
import { computed, onMounted } from 'vue'
import { useAdminStore } from '@/bounded-contexts/admin/application/stores/admin.store'

const store = useAdminStore()

onMounted(() => store.loadMetrics())

const maxTrendValue = computed(() =>
  Math.max(1, ...store.registrationsTrend.map((p) => p.farmerCount + p.agronomistCount))
)

const barHeight = (value) => Math.round((value / maxTrendValue.value) * 100)
</script>

<template>
  <div class="content-page">
    <div class="page-heading">
      <h1>Platform metrics</h1>
      <p>Real-time platform health and growth.</p>
    </div>

    <p v-if="store.error" class="error-text">{{ store.error }}</p>

    <div v-if="store.metrics" class="metric-grid">
      <article class="metric-card">
        <span class="material-symbols-outlined">group</span>
        <strong>{{ store.metrics.totalUsers }}</strong>
        <p>Total users</p>
      </article>
      <article class="metric-card">
        <span class="material-symbols-outlined">sensors</span>
        <strong>{{ store.metrics.onlineDevices }} / {{ store.metrics.totalDevices }}</strong>
        <p>Devices online</p>
      </article>
      <article class="metric-card">
        <span class="material-symbols-outlined">show_chart</span>
        <strong>{{ store.metrics.readingsPerMinute.toFixed(1) }}</strong>
        <p>Readings / min (last 5 min)</p>
      </article>
      <article class="metric-card">
        <span class="material-symbols-outlined">agriculture</span>
        <strong>{{ store.metrics.activeFarms }} / {{ store.metrics.totalFarms }}</strong>
        <p>Active farms</p>
      </article>
      <article class="metric-card">
        <span class="material-symbols-outlined">block</span>
        <strong>{{ store.metrics.blockedUserCount }}</strong>
        <p>Blocked users</p>
      </article>
    </div>

    <section class="surface-card trend-card">
      <h2>New registrations (last 30 days)</h2>
      <div class="trend-legend">
        <span><i class="dot farmer"></i> Farmer</span>
        <span><i class="dot agronomist"></i> Agronomist</span>
      </div>
      <div class="trend-chart">
        <div v-for="point in store.registrationsTrend" :key="point.date" class="trend-bar-group" :title="point.date">
          <div class="trend-bar farmer" :style="{ height: barHeight(point.farmerCount) + '%' }"></div>
          <div class="trend-bar agronomist" :style="{ height: barHeight(point.agronomistCount) + '%' }"></div>
        </div>
        <p v-if="store.registrationsTrend.length === 0" class="empty-cell">No registration data yet.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.content-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-heading h1 {
  margin: 0 0 6px;
  font-size: 24px;
}

.page-heading p {
  margin: 0;
  color: #666;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.metric-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-card strong {
  font-size: 22px;
}

.metric-card p {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.surface-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
}

.trend-legend {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #555;
  margin: 8px 0 16px;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot.farmer {
  background: #456c4c;
}

.dot.agronomist {
  background: #c98366;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 160px;
}

.trend-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  gap: 1px;
}

.trend-bar {
  width: 100%;
  min-height: 1px;
}

.trend-bar.farmer {
  background: #456c4c;
}

.trend-bar.agronomist {
  background: #c98366;
}

.error-text {
  color: #c62828;
}

.empty-cell {
  text-align: center;
  color: #888;
}
</style>
