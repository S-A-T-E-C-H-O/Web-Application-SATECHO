<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '@/shared/infrastructure/http/api-client'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const store = useDashboardAgronomistStore()

const selectedFarmId = ref('')
const zones = ref([])
const selectedZoneIds = ref([])
const comparison = ref([])
const isLoading = ref(false)
const error = ref('')

onMounted(() => {
  if (store.status === 'idle') store.loadDashboard()
})

const clients = computed(() => store.supervisedParcels)

const loadZones = async () => {
  selectedZoneIds.value = []
  comparison.value = []
  zones.value = []
  if (!selectedFarmId.value) return
  try {
    const response = await apiRequest({ method: 'GET', url: `/api/v1/farms/${selectedFarmId.value}/zones` })
    zones.value = Array.isArray(response.data) ? response.data : []
  } catch {
    zones.value = []
  }
}

const toggleZone = (zoneId) => {
  const index = selectedZoneIds.value.indexOf(zoneId)
  if (index !== -1) {
    selectedZoneIds.value.splice(index, 1)
    return
  }
  if (selectedZoneIds.value.length >= 4) {
    error.value = 'Maximum 4 parcels for comparison'
    return
  }
  error.value = ''
  selectedZoneIds.value.push(zoneId)
}

const runComparison = async () => {
  if (selectedZoneIds.value.length === 0) {
    error.value = 'Select at least one zone.'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const response = await apiRequest({
      method: 'GET',
      url: '/api/v1/analytics/parcels/compare',
      params: { zoneIds: selectedZoneIds.value.join(',') },
    })
    comparison.value = Array.isArray(response.data) ? response.data : []
  } catch (e) {
    error.value = e.message || 'Could not load comparison.'
  } finally {
    isLoading.value = false
  }
}

const averageMoisture = computed(() => {
  const values = comparison.value.map((c) => c.soilMoisture).filter((v) => v != null)
  if (!values.length) return null
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
})

const averageEc = computed(() => {
  const values = comparison.value.map((c) => c.electricalConductivity).filter((v) => v != null)
  if (!values.length) return null
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
})

const exportCsv = () => {
  const header = 'zoneName,cropType,soilMoisture,electricalConductivity,soilTemperature,areaHectares\n'
  const rows = comparison.value
    .map((c) => [c.zoneName, c.cropType, c.soilMoisture, c.electricalConductivity, c.soilTemperature, c.areaHectares].join(','))
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'parcel-comparison.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <main class="analysis-page">
    <section class="analysis-topbar">
      <div>
        <h1>Multi-Parcel Analysis</h1>
        <p>Compare soil metrics across up to 4 parcels of the same client.</p>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <h2>Select parcels</h2>
      </div>
      <div class="selector-row">
        <label class="field-group">
          <span>Client</span>
          <select v-model="selectedFarmId" @change="loadZones">
            <option value="">Select a client</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.clientName }} — {{ c.parcelName }}</option>
          </select>
        </label>
      </div>
      <div v-if="zones.length" class="zone-chips">
        <button
          v-for="zone in zones"
          :key="zone.id"
          class="zone-chip"
          :class="{ active: selectedZoneIds.includes(zone.id) }"
          @click="toggleZone(zone.id)"
        >
          {{ zone.name }}
        </button>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="primary-btn" :disabled="isLoading" @click="runComparison">
        {{ isLoading ? 'Loading...' : 'Compare' }}
      </button>
    </section>

    <section v-if="comparison.length" class="metrics-grid">
      <article class="metric-card">
        <small>Average Moisture</small>
        <h2>{{ averageMoisture ?? '—' }} <span>%</span></h2>
      </article>
      <article class="metric-card">
        <small>Average EC</small>
        <h2>{{ averageEc ?? '—' }} <span>dS/m</span></h2>
      </article>
      <article class="metric-card">
        <small>Parcels compared</small>
        <h2>{{ comparison.length }}</h2>
      </article>
    </section>

    <section v-if="comparison.length" class="table-card">
      <div class="table-header">
        <h2>Parcel Details</h2>
        <button class="export-btn" @click="exportCsv">Export CSV</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Parcel Name</th>
            <th>Crop Type</th>
            <th>Moisture</th>
            <th>EC</th>
            <th>Temperature</th>
            <th>Area (ha)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parcel in comparison" :key="parcel.zoneId">
            <td>{{ parcel.zoneName }}</td>
            <td>{{ parcel.cropType || '—' }}</td>
            <td>{{ parcel.soilMoisture != null ? `${parcel.soilMoisture}%` : '—' }}</td>
            <td>{{ parcel.electricalConductivity != null ? `${parcel.electricalConductivity} dS/m` : '—' }}</td>
            <td>{{ parcel.soilTemperature != null ? `${parcel.soilTemperature}°C` : '—' }}</td>
            <td>{{ parcel.areaHectares }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.analysis-page{
  padding:32px;
  display:flex;
  flex-direction:column;
  gap:24px;
  background:#f7f8f5;
  min-height:100vh;
}

.analysis-topbar h1{
  font-size:36px;
  color:#222;
  margin-bottom:6px;
}

.analysis-topbar p{
  color:#777;
}

.metrics-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:20px;
}

.metric-card{
  background:white;
  border-radius:18px;
  padding:24px;
  border:1px solid #ececec;
}

.metric-card small{ color:#777; }
.metric-card h2{ margin:18px 0 0; font-size:36px; color:#222; }
.metric-card h2 span{ font-size:16px; color:#777; }

.table-card{
  background:white;
  border-radius:20px;
  border:1px solid #ececec;
  overflow:hidden;
  padding-bottom: 16px;
}

.table-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:24px;
}

.selector-row {
  padding: 0 24px 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.field-group select {
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 14px;
  max-width: 360px;
}

.zone-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 24px 16px;
}

.zone-chip {
  border: 1px solid #ddd;
  background: white;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
}

.zone-chip.active {
  background: #456c4c;
  color: white;
  border-color: #456c4c;
}

.error-text {
  color: #c62828;
  padding: 0 24px;
  font-weight: 600;
}

.primary-btn {
  margin: 0 24px;
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  background: #456c4c;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.export-btn{
  border:none;
  background:transparent;
  color:#456c4c;
  font-weight:600;
  cursor:pointer;
}

table{
  width:100%;
  border-collapse:collapse;
}

th{
  text-align:left;
  padding:18px 24px;
  background:#fafafa;
  color:#777;
  font-size:14px;
}

td{
  padding:16px 24px;
  border-top:1px solid #f0f0f0;
}

@media (max-width:1200px){
  .metrics-grid{
    grid-template-columns:repeat(2,1fr);
  }
}

@media (max-width:768px){
  .analysis-topbar{
    flex-direction:column;
  }

  .metrics-grid{
    grid-template-columns:1fr;
  }
}
</style>
