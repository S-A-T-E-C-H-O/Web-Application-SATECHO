<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '@/shared/infrastructure/http/api-client'
import { useDashboardAgronomistStore } from '../../application/stores/dashboardAgronomist.store'

const store = useDashboardAgronomistStore()

const presets = ref([])
const zones = ref([])
const selectedFarmId = ref('')
const selectedZoneId = ref('')
const form = ref({ minMoisture: 0, maxMoisture: 0, minEc: 0, maxEc: 0, minPh: 0, maxPh: 0, minTemperature: 0, maxTemperature: 0 })
const isSaving = ref(false)
const feedback = ref('')
const error = ref('')

onMounted(async () => {
  if (store.status === 'idle') store.loadDashboard()
  try {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/crops/types' })
    presets.value = Array.isArray(response.data) ? response.data : []
  } catch {
    presets.value = []
  }
})

const clients = computed(() => store.supervisedParcels)

const applyPreset = (preset) => {
  form.value = {
    minMoisture: preset.minMoisture,
    maxMoisture: preset.maxMoisture,
    minEc: preset.minEc,
    maxEc: preset.maxEc,
    minPh: preset.minPh,
    maxPh: preset.maxPh,
    minTemperature: preset.minTemperature,
    maxTemperature: preset.maxTemperature,
  }
  feedback.value = `Loaded "${preset.displayName}" defaults — review and save to apply.`
}

const loadZones = async () => {
  selectedZoneId.value = ''
  zones.value = []
  if (!selectedFarmId.value) return
  try {
    const response = await apiRequest({ method: 'GET', url: `/api/v1/farms/${selectedFarmId.value}/zones` })
    zones.value = Array.isArray(response.data) ? response.data : []
  } catch {
    zones.value = []
  }
}

const saveThresholds = async () => {
  if (!selectedZoneId.value) {
    error.value = 'Select a zone first.'
    return
  }
  isSaving.value = true
  error.value = ''
  try {
    await apiRequest({
      method: 'PATCH',
      url: `/api/v1/zones/${selectedZoneId.value}/thresholds`,
      data: form.value,
    })
    feedback.value = 'Thresholds applied to the zone.'
  } catch (e) {
    error.value = e.message || 'Could not save thresholds.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="thresholds-page">
    <section class="page-header">
      <div>
        <h1>Crop Threshold Presets</h1>
        <p>Recommended growing parameters per crop — apply them directly to a client's zone.</p>
      </div>
    </section>

    <p v-if="feedback" class="feedback-text">{{ feedback }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>

    <section class="content-grid">
      <div class="main-column">
        <section class="card">
          <div class="card-header">
            <h2>Presets by crop</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Crop</th>
                <th>Moisture</th>
                <th>EC</th>
                <th>pH</th>
                <th>Temp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="preset in presets" :key="preset.name">
                <td>{{ preset.displayName }}</td>
                <td>{{ preset.minMoisture }}–{{ preset.maxMoisture }}%</td>
                <td>{{ preset.minEc }}–{{ preset.maxEc }} dS/m</td>
                <td>{{ preset.minPh }}–{{ preset.maxPh }}</td>
                <td>{{ preset.minTemperature }}–{{ preset.maxTemperature }}°C</td>
                <td><button class="ghost-button" @click="applyPreset(preset)">Use</button></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="card">
          <div class="card-header"><h2>Apply to a zone</h2></div>
          <div class="editor-section">
            <div class="form-grid">
              <label class="field-group">
                <span>Client</span>
                <select v-model="selectedFarmId" @change="loadZones">
                  <option value="">Select a client</option>
                  <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.clientName }} — {{ c.parcelName }}</option>
                </select>
              </label>
              <label class="field-group">
                <span>Zone</span>
                <select v-model="selectedZoneId" :disabled="!zones.length">
                  <option value="">Select a zone</option>
                  <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.name }}</option>
                </select>
              </label>
            </div>
          </div>

          <div class="editor-section">
            <small class="section-label">SOIL MOISTURE (%)</small>
            <div class="form-grid">
              <label class="field-group"><span>Min</span><input v-model.number="form.minMoisture" type="number"></label>
              <label class="field-group"><span>Max</span><input v-model.number="form.maxMoisture" type="number"></label>
            </div>
          </div>
          <div class="editor-section">
            <small class="section-label">EC (dS/m)</small>
            <div class="form-grid">
              <label class="field-group"><span>Min</span><input v-model.number="form.minEc" type="number" step="0.1"></label>
              <label class="field-group"><span>Max</span><input v-model.number="form.maxEc" type="number" step="0.1"></label>
            </div>
          </div>
          <div class="editor-section">
            <small class="section-label">PH</small>
            <div class="form-grid">
              <label class="field-group"><span>Min</span><input v-model.number="form.minPh" type="number" step="0.1"></label>
              <label class="field-group"><span>Max</span><input v-model.number="form.maxPh" type="number" step="0.1"></label>
            </div>
          </div>
          <div class="editor-section">
            <small class="section-label">TEMPERATURE (°C)</small>
            <div class="form-grid">
              <label class="field-group"><span>Min</span><input v-model.number="form.minTemperature" type="number"></label>
              <label class="field-group"><span>Max</span><input v-model.number="form.maxTemperature" type="number"></label>
            </div>
          </div>

          <div class="editor-actions">
            <button class="primary-btn" :disabled="isSaving" @click="saveThresholds">
              {{ isSaving ? 'Saving...' : 'Save Thresholds' }}
            </button>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.thresholds-page{
  padding:32px;
  background:#f7f8f5;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  gap:24px;
}

.page-header h1{
  font-size:38px;
  line-height:1.1;
  margin:0 0 8px;
  color:#1f2937;
}

.page-header p{
  margin:0;
  color:#7a7a7a;
  font-size:15px;
}

.feedback-text { color: #456c4c; font-weight: 600; }
.error-text { color: #c62828; font-weight: 600; }

.content-grid{
  display:grid;
  gap:24px;
}

.main-column{
  display:flex;
  flex-direction:column;
  gap:24px;
}

.card{
  background:white;
  border-radius:20px;
  border:1px solid #ececec;
  overflow:hidden;
}

.card-header{
  padding:24px;
  border-bottom:1px solid #f1f1f1;
}

.card-header h2{
  margin:0;
  font-size:20px;
  color:#1f2937;
}

table{
  width:100%;
  border-collapse:collapse;
}

thead{
  background:#fafafa;
}

th{
  text-align:left;
  padding:14px 24px;
  color:#7a7a7a;
  font-size:13px;
  font-weight:600;
}

td{
  padding:16px 24px;
  border-top:1px solid #f2f2f2;
  vertical-align:middle;
}

.editor-section{
  padding:20px 24px;
  border-bottom:1px solid #f4f4f4;
}

.section-label{
  display:block;
  margin-bottom:14px;
  color:#8a8a8a;
  font-size:12px;
  font-weight:700;
  letter-spacing:.4px;
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
}

.field-group{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.field-group span{
  font-size:13px;
  color:#666;
  font-weight:500;
}

.field-group input,
.field-group select{
  height:44px;
  border:1px solid #dddddd;
  border-radius:12px;
  padding:0 14px;
  background:white;
  font-size:14px;
  outline:none;
}

.editor-actions{
  padding:24px;
  display:flex;
  justify-content:flex-end;
  background:#fafafa;
}

.primary-btn,
.ghost-button{
  border:none;
  border-radius:12px;
  padding:10px 18px;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
}

.primary-btn{
  background:#456c4c;
  color:white;
}
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ghost-button{
  background:#f4f4f4;
  color:#555;
}
.ghost-button:hover{ background:#ebebeb; }

@media (max-width:768px){
  .form-grid{ grid-template-columns:1fr; }
}
</style>
