<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import { useOnboardingStore } from '@/bounded-contexts/onboarding/application/stores/onboarding.store'

const router = useRouter()
const authStore = useAuthStore()
const onboardingStore = useOnboardingStore()

const crops = ['Wheat', 'Cherry Tomatoes', 'Avocado', 'Blueberries', 'Corn']

const steps = [
  {
    id: 1,
    label: 'Property Details',
    icon: 'location_on',
  },
  {
    id: 2,
    label: 'Irrigation Zones',
    icon: 'grass',
  },
  {
    id: 3,
    label: 'Sensors / Devices',
    icon: 'memory',
  },
  {
    id: 4,
    label: 'Basic Thresholds',
    icon: 'speed',
  },
]

const deviceOptions = [
  {
    key: 'groundSensor',
    title: 'Ground sensor',
    description: 'Humidity, EC, pH, temperature',
  },
  {
    key: 'valveController',
    title: 'Valve controller',
    description: 'Remote opening/closing',
  },
  {
    key: 'weatherStation',
    title: 'Weather station',
    description: 'Climate and environment',
  },
  {
    key: 'securityCamera',
    title: 'Security camera',
    description: 'Perimeter surveillance',
  },
]

const thresholdRows = [
  {
    key: 'soilMoisture',
    label: 'Soil moisture (%)',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  {
    key: 'electricalConductivity',
    label: 'Electrical conductivity (EC) - mS/cm',
    min: 0,
    max: 5,
    step: 0.1,
    unit: '',
  },
  {
    key: 'soilPh',
    label: 'soil pH',
    min: 0,
    max: 14,
    step: 0.1,
    unit: '',
  },
]

const setup = computed(() => onboardingStore.setup)
const currentStep = computed(() => onboardingStore.currentStep)
const currentZone = computed(() => setup.value.irrigationZones[0])
const primaryCrop = computed(() => currentZone.value.crop || 'Cherry Tomatoes')
const currentUserId = computed(() => authStore.user?.id || authStore.user?.email || 'guest')

const isPropertyStepValid = computed(() =>
  Boolean(
    setup.value.property.name &&
      setup.value.property.location &&
      setup.value.property.sizeHectares
  )
)

const isZoneStepValid = computed(() =>
  setup.value.irrigationZones.some(
    (zone) => zone.name && zone.areaHectares && zone.crop
  )
)

const canContinue = computed(() => {
  if (currentStep.value === 1) return isPropertyStepValid.value
  if (currentStep.value === 2) return isZoneStepValid.value

  return true
})

const addZone = () => {
  setup.value.irrigationZones.push({
    name: '',
    areaHectares: '',
    crop: '',
  })
}

const removeZone = (index) => {
  if (setup.value.irrigationZones.length <= 1) return

  setup.value.irrigationZones.splice(index, 1)
}

const updateThreshold = (key, index, value) => {
  const range = [...setup.value.thresholds[key]]
  range[index] = Number(value)

  if (range[0] > range[1]) {
    range[index === 0 ? 1 : 0] = range[index]
  }

  setup.value.thresholds[key] = range
}

const goNext = () => {
  if (!canContinue.value) return
  onboardingStore.currentStep += 1
}

const goBack = () => {
  if (currentStep.value === 1) return
  onboardingStore.currentStep -= 1
}

const saveForLater = () => {
  onboardingStore.persistDraft()
}

const completeOnboarding = async () => {
  try {
    await onboardingStore.complete(currentUserId.value)
    router.push('/dashboard')
  } catch {
    return
  }
}

onMounted(async () => {
  const result = await onboardingStore.loadStatus(currentUserId.value)

  if (result.completed) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <main class="onboarding-page">
    <section class="onboarding-shell">
      <header class="brand-header">
        <div class="brand-mark">
          <span class="material-symbols-outlined">eco</span>
        </div>
        <h1>AgroSafe</h1>
      </header>

      <nav class="stepper" aria-label="Onboarding progress">
        <template
            v-for="(step, index) in steps"
            :key="step.id"
        >
          <div
              class="stepper-item"
              :class="{
                active: currentStep === step.id,
                completed: currentStep > step.id,
              }"
          >
            <div class="stepper-icon">
              <span class="material-symbols-outlined">
                {{ currentStep > step.id ? 'check' : step.icon }}
              </span>
            </div>
            <span>{{ step.label }}</span>
          </div>
          <div
              v-if="index < steps.length - 1"
              class="stepper-line"
              :class="{ completed: currentStep > step.id }"
          />
        </template>
      </nav>

      <section class="onboarding-card">
        <Transition
            name="fade"
            mode="out-in"
        >
          <form
              v-if="currentStep === 1"
              key="property"
              class="step-form"
              @submit.prevent="goNext"
          >
            <div class="step-heading">
              <h2>Property details</h2>
              <p>Enter your property's basic information to begin</p>
            </div>

            <label class="field-group">
              <span>Property name</span>
              <input
                  v-model.trim="setup.property.name"
                  type="text"
                  placeholder="e.g. Mountain river"
                  required
              >
            </label>

            <label class="field-group">
              <span>Location</span>
              <input
                  v-model.trim="setup.property.location"
                  type="text"
                  placeholder="e.g. Valle del Colca, Peru"
                  required
              >
              <small>You can add exact coordinates later</small>
            </label>

            <label class="field-group">
              <span>Size (hectares)</span>
              <input
                  v-model.number="setup.property.sizeHectares"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 25"
                  required
              >
            </label>
          </form>

          <form
              v-else-if="currentStep === 2"
              key="zones"
              class="step-form"
              @submit.prevent="goNext"
          >
            <div class="step-heading">
              <h2>Irrigation zones</h2>
              <p>Define the irrigation zones of your property and the type of crop in each one.</p>
            </div>

            <div
                v-for="(zone, index) in setup.irrigationZones"
                :key="index"
                class="zone-panel"
            >
              <div class="zone-header">
                <h3>
                  Zone {{ index + 1 }}
                </h3>
                <button
                    v-if="setup.irrigationZones.length > 1"
                    type="button"
                    class="remove-zone-button"
                    @click="removeZone(index)"
                >
                  <span class="material-symbols-outlined">
                    delete
                  </span>
                  Remove
                </button>
              </div>
              <div class="zone-grid">
                <label class="field-group compact">
                  <span>Name</span>
                  <input
                      v-model.trim="zone.name"
                      type="text"
                      placeholder="e.g. North Zone"
                      required
                  >
                </label>

                <label class="field-group compact">
                  <span>Area (ha)</span>
                  <input
                      v-model.number="zone.areaHectares"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 5"
                      required
                  >
                </label>

                <label class="field-group compact">
                  <span>Crop</span>
                  <select
                      v-model="zone.crop"
                      required
                  >
                    <option value="" disabled>Selection</option>
                    <option
                        v-for="crop in crops"
                        :key="crop"
                        :value="crop"
                    >
                      {{ crop }}
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <button
                type="button"
                class="add-zone-button"
                @click="addZone"
            >
              <span class="material-symbols-outlined">add</span>
              Add another zone
            </button>
          </form>

          <section
              v-else-if="currentStep === 3"
              key="devices"
              class="step-form"
          >
            <div class="step-heading">
              <h2>Sensors and devices</h2>
              <p>Assign devices to each zone. You can skip this step if you don't have any hardware yet.</p>
            </div>

            <div class="devices-panel">
              <div class="zone-title">
                <span class="material-symbols-outlined">eco</span>
                <strong>{{ currentZone.name || 'Example' }}</strong>
                <span>({{ currentZone.crop || 'Wheat' }})</span>
              </div>

              <div class="devices-grid">
                <label
                    v-for="device in deviceOptions"
                    :key="device.key"
                    class="device-card"
                    :class="{ selected: setup.devices[device.key] }"
                >
                  <input
                      v-model="setup.devices[device.key]"
                      type="checkbox"
                  >
                  <strong>{{ device.title }}</strong>
                  <span>{{ device.description }}</span>
                </label>
              </div>
            </div>

            <div class="note-box">
              <strong>Note:</strong>
              You will be able to add and configure specific devices after completing the initial setup.
            </div>
          </section>

          <section
              v-else
              key="thresholds"
              class="step-form"
          >
            <div class="step-heading">
              <h2>Basic thresholds</h2>
              <p>Configure the alert ranges for your crops. You can adjust them by zone later.</p>
            </div>

            <button
                type="button"
                class="recommended-button"
                @click="setup.thresholds = {
                  soilMoisture: [50, 80],
                  electricalConductivity: [1.5, 3],
                  soilPh: [6, 7],
                }"
            >
              Use recommended values for {{ primaryCrop }}
            </button>

            <div class="thresholds-list">
              <div
                  v-for="row in thresholdRows"
                  :key="row.key"
                  class="threshold-row"
              >
                <div class="threshold-label">
                  <strong>{{ row.label }}</strong>
                  <span class="material-symbols-outlined">help</span>
                </div>
                <div class="range-grid">
                  <span>
                    {{ setup.thresholds[row.key][0] }}{{ row.unit }}
                  </span>
                  <input
                      :value="setup.thresholds[row.key][0]"
                      :min="row.min"
                      :max="row.max"
                      :step="row.step"
                      type="range"
                      @input="updateThreshold(row.key, 0, $event.target.value)"
                  >
                  <input
                      :value="setup.thresholds[row.key][1]"
                      :min="row.min"
                      :max="row.max"
                      :step="row.step"
                      type="range"
                      @input="updateThreshold(row.key, 1, $event.target.value)"
                  >
                  <span>
                    {{ setup.thresholds[row.key][1] }}{{ row.unit }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </Transition>

        <p
            v-if="onboardingStore.error"
            class="form-message error-message"
        >
          {{ onboardingStore.error }}
        </p>

        <p
            v-else-if="onboardingStore.feedback"
            class="form-message success-message"
        >
          {{ onboardingStore.feedback }}
        </p>

        <footer class="card-actions">
          <button
              v-if="currentStep > 1"
              type="button"
              class="back-button"
              @click="goBack"
          >
            <span class="material-symbols-outlined">chevron_left</span>
            Back
          </button>
          <span v-else />

          <div class="action-cluster">
            <button
                type="button"
                class="secondary-action"
                @click="saveForLater"
            >
              Save and continue later
            </button>
            <button
                v-if="currentStep < 4"
                type="button"
                class="primary-action"
                :disabled="!canContinue"
                @click="goNext"
            >
              Next
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <button
                v-else
                type="button"
                class="primary-action wide"
                :disabled="onboardingStore.isLoading"
                @click="completeOnboarding"
            >
              {{ onboardingStore.isLoading ? 'Completing...' : 'Complete configuration' }}
              <span class="material-symbols-outlined">check</span>
            </button>
          </div>
        </footer>
      </section>
    </section>
  </main>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: #f7f7f3;
  color: #202320;
  padding: 42px 24px 72px;
}

.onboarding-shell {
  width: min(100%, 860px);
  margin: 0 auto;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 40px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #456c4c;
  color: white;
  display: grid;
  place-items: center;
}

.brand-header h1 {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.stepper {
  display: grid;
  grid-template-columns: 84px 1fr 104px 1fr 104px 1fr 108px;
  align-items: start;
  gap: 22px;
  margin: 0 auto 52px;
}

.stepper-item {
  display: grid;
  justify-items: center;
  gap: 10px;
  color: #777b73;
  font-size: 13px;
  line-height: 1.15;
  text-align: center;
}

.stepper-icon {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #e8e9e5;
  color: #5c645a;
  display: grid;
  outline: 5px solid rgba(70, 108, 76, 0.05);
  place-items: center;
}

.stepper-icon span {
  font-size: 21px;
}

.stepper-item.active,
.stepper-item.completed {
  color: #243626;
  font-weight: 700;
}

.stepper-item.active .stepper-icon,
.stepper-item.completed .stepper-icon {
  background: #456c4c;
  color: white;
}

.stepper-line {
  height: 2px;
  background: #e1e2de;
  margin-top: 23px;
}

.stepper-line.completed {
  background: #456c4c;
}

.onboarding-card {
  width: min(100%, 768px);
  margin: 0 auto;
  background: white;
  border: 1px solid #eceee9;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(42, 48, 41, 0.08);
  padding: 40px;
}

.step-form {
  display: grid;
  gap: 24px;
}

.step-heading {
  display: grid;
  gap: 10px;
}

.step-heading h2 {
  font-size: 27px;
  font-weight: 800;
}

.step-heading p {
  color: #4e564d;
  font-size: 16px;
  line-height: 1.5;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-group span {
  color: #1f241f;
  font-size: 14px;
  font-weight: 700;
}

.field-group small {
  color: #555d53;
  font-size: 13px;
}

.field-group input,
.field-group select {
  width: 100%;
  height: 43px;
  border: 1px solid #c4cbc2;
  border-radius: 8px;
  background: white;
  color: #202320;
  font: inherit;
  outline: none;
  padding: 0 16px;
}

.field-group input:focus,
.field-group select:focus {
  border-color: #456c4c;
  box-shadow: 0 0 0 3px rgba(69, 108, 76, 0.1);
}

.field-group.compact {
  gap: 7px;
}

.field-group.compact span {
  font-size: 12px;
  color: #4e554c;
}

.zone-panel,
.devices-panel {
  background: #f7f7f4;
  border: 1px solid #e1e4de;
  border-radius: 10px;
  padding: 24px;
}

.zone-panel h3 {
  font-size: 15px;
  margin-bottom: 20px;
}

.zone-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}

.add-zone-button {
  width: 100%;
  height: 56px;
  border: 2px dashed #bec9bb;
  border-radius: 10px;
  background: transparent;
  color: #30372f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
}

.zone-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.zone-title .material-symbols-outlined {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #dfe9dc;
  color: #456c4c;
  display: grid;
  font-size: 17px;
  place-items: center;
}

.zone-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:1rem;
}

.remove-zone-button{
  display:flex;
  align-items:center;
  gap:.4rem;

  border:none;

  padding:.7rem 1rem;

  border-radius:12px;

  background:#f4e6e6;
  color:#9f3a3a;

  cursor:pointer;

  transition:.3s;
}

.remove-zone-button:hover{
  background:#e8d1d1;
  transform:translateY(-2px);
}

.remove-zone-button .material-symbols-outlined{
  font-size:18px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.device-card {
  min-height: 74px;
  border: 1px solid #dfe1dd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: grid;
  gap: 6px;
  padding: 16px;
}

.device-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.device-card strong {
  font-size: 15px;
}

.device-card span {
  color: #4e564d;
  font-size: 13px;
}

.device-card.selected {
  border-color: #456c4c;
  box-shadow: inset 0 0 0 1px #456c4c;
}

.note-box {
  background: #fff2ed;
  border: 1px solid #ffc9b7;
  border-radius: 8px;
  color: #2d2825;
  line-height: 1.5;
  padding: 18px;
}

.recommended-button {
  width: 100%;
  height: 54px;
  border: 1px solid #c4cbc2;
  border-radius: 12px;
  background: white;
  color: #3d443c;
  cursor: pointer;
  font: inherit;
}

.thresholds-list {
  display: grid;
  gap: 34px;
}

.threshold-row {
  display: grid;
  gap: 16px;
}

.threshold-label {
  display: flex;
  align-items: center;
  gap: 36px;
}

.threshold-label strong {
  font-size: 15px;
}

.threshold-label span {
  color: #687067;
  font-size: 18px;
}

.range-grid {
  display: grid;
  grid-template-columns: 46px 1fr 1fr 46px;
  align-items: center;
  gap: 12px;
}

.range-grid span {
  color: #4e564d;
  font-size: 14px;
}

.range-grid input {
  accent-color: #456c4c;
  width: 100%;
}

.form-message {
  margin-top: 24px;
}

.card-actions {
  border-top: 1px solid #edf0eb;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
}

.action-cluster {
  display: flex;
  gap: 16px;
}

.back-button,
.secondary-action,
.primary-action {
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: inherit;
  font-weight: 700;
  padding: 0 24px;
  white-space: nowrap;
}

.back-button {
  border: none;
  background: transparent;
  color: #30372f;
  padding: 0;
}

.secondary-action {
  border: 1px solid #aeb8aa;
  background: white;
  color: #30372f;
}

.primary-action {
  border: none;
  background: #456c4c;
  color: white;
}

.primary-action.wide {
  min-width: 220px;
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 820px) {
  .onboarding-page {
    padding: 32px 16px 48px;
  }

  .stepper {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .stepper-line {
    display: none;
  }

  .stepper-item {
    font-size: 11px;
  }

  .onboarding-card {
    padding: 28px 20px;
  }

  .zone-grid,
  .devices-grid {
    grid-template-columns: 1fr;
  }

  .range-grid {
    grid-template-columns: 40px 1fr 1fr 40px;
  }

  .card-actions,
  .action-cluster {
    flex-direction: column;
  }

  .back-button,
  .secondary-action,
  .primary-action,
  .primary-action.wide {
    width: 100%;
  }
}
</style>
