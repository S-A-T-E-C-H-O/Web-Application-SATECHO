<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import { useOnboardingAgronomistStore } from '@/bounded-contexts/onboarding/application/stores/onboardingAgronomist.store'

const router = useRouter()
const authStore = useAuthStore()
const store = useOnboardingAgronomistStore()

const steps = [
  { id: 1, label: 'Professional Profile', summaryTitle: 'Setup Summary' },
  { id: 2, label: 'Client Portfolio', summaryTitle: 'Portfolio Summary' },
  { id: 3, label: 'Technical Protocols', summaryTitle: 'Protocol Summary' },
  { id: 4, label: 'Control Room', summaryTitle: 'Control Room Summary' }
]

const currentStep = computed(() => store.currentStep)
const setup = computed(() => store.setup)
const currentUserId = computed(() => authStore.user?.id || 'guest')

const clientAddMode = ref('import')
const newInviteEmail = ref('')
const invitedFarmers = ref([])

const manualRows = ref([
  { client: '', parcel: '', crop: '', location: '', isEditing: true }
])

watch(manualRows, (rows) => {
  const lastRow = rows[rows.length - 1]
  if (lastRow && (lastRow.client || lastRow.parcel || lastRow.crop || lastRow.location)) {
    rows.push({ client: '', parcel: '', crop: '', location: '', isEditing: true })
  }
}, { deep: true })

const sendInvite = () => {
  if (newInviteEmail.value && newInviteEmail.value.includes('@')) {
    invitedFarmers.value.push({ email: newInviteEmail.value })
    newInviteEmail.value = ''
  }
}

const goNext = () => {
  if (currentStep.value < 4) {
    store.currentStep++
  } else {
    completeOnboarding()
  }
}

const goBack = () => {
  if (currentStep.value > 1) store.currentStep--
}

const saveForLater = () => {
  store.persistDraft()
}

const completeOnboarding = async () => {
  try {
    await store.complete(currentUserId.value)
    router.push('/dashboard')
  } catch {
    return
  }
}

// Step 1 Check
const isStep1Valid = computed(() => {
  return setup.value.profile.fullName && setup.value.profile.licenseId && setup.value.profile.experience
})

// Step 2 functions
const importClients = () => {
  // Mock action
}

// Step 3 settings
const templates = ref([
  {
    id: Date.now(),
    isEditingInfo: true,
    info: { name: '', crop: '', description: '' },
    isEditingSensors: true,
    sensors: { moisture: '', ec: '', ph: '', temp: '' },
    applyTo: 'Specific crop type'
  }
])

const addTemplate = () => {
  templates.value.push({
    id: Date.now(),
    isEditingInfo: true,
    info: { name: '', crop: '', description: '' },
    isEditingSensors: true,
    sensors: { moisture: '', ec: '', ph: '', temp: '' },
    applyTo: 'Specific crop type'
  })
}

// Step 4 settings
const reportFrequency = ref('Weekly Technical Report')

const urgencyLevels = ref(['Preventive', 'Warning', 'Critical (Required)'])
const toggleUrgency = (level) => {
  if (level === 'Critical (Required)') return
  const index = urgencyLevels.value.indexOf(level)
  if (index === -1) urgencyLevels.value.push(level)
  else urgencyLevels.value.splice(index, 1)
}

const notificationChannels = ref(['Email', 'WhatsApp', 'In-app Notification'])
const toggleChannel = (channel) => {
  const index = notificationChannels.value.indexOf(channel)
  if (index === -1) notificationChannels.value.push(channel)
  else notificationChannels.value.splice(index, 1)
}

const supervisionRules = ref({
  notifyCritical: true,
  escalateAlerts: false,
  includeTrend: true,
  includeShortcut: true
})

const availableSpecialties = ['Soils', 'Irrigation', 'Crop Health', 'Fertigation', 'Crop Monitoring']

const toggleSpecialty = (spec) => {
  const index = setup.value.profile.specialties.indexOf(spec)
  if (index === -1) {
    setup.value.profile.specialties.push(spec)
  } else {
    setup.value.profile.specialties.splice(index, 1)
  }
}

// File upload mockup
const handleDocUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    setup.value.profile.document = file
  }
}

const handleFileUpload = (event) => {
  // Mock file upload
}

onMounted(() => {
  // Pre-fill name from auth if available
  if (!setup.value.profile.fullName && authStore.user?.fullName) {
    setup.value.profile.fullName = authStore.user.fullName
  }
})
</script>

<template>
  <main class="onboarding-page">
    
    <header class="topbar">
      <div class="brand">
        <h1 class="logo">SATECHO</h1>
        <span class="divider">|</span>
        <span class="page-title">Agronomist Setup</span>
      </div>
      <div class="user-actions">
        <span class="material-symbols-outlined icon-btn">notifications</span>
        <div class="avatar">
          <img src="https://i.pravatar.cc/150?img=11" alt="User Avatar" v-if="authStore.user" />
          <span class="material-symbols-outlined" v-else>account_circle</span>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      
      <!-- Stepper -->
      <nav class="stepper">
        <template v-for="(step, index) in steps" :key="step.id">
          <div class="step-item" :class="{ active: currentStep === step.id, completed: currentStep > step.id }">
            <div class="step-circle">
              <span v-if="currentStep > step.id" class="material-symbols-outlined check-icon">check</span>
              <span v-else>{{ step.id }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="step-line" :class="{ completed: currentStep > step.id }"></div>
        </template>
      </nav>

      <div class="main-layout">
        
        <!-- Left Side: Forms -->
        <section class="form-section">
          
          <div class="success-banner" v-if="currentStep > 1">
            <span class="material-symbols-outlined check-circle">check_circle</span>
            <div class="banner-text">
              <strong v-if="currentStep === 2">Professional profile completed successfully.</strong>
              <strong v-else-if="currentStep === 3">Client portfolio imported successfully.</strong>
              <strong v-else-if="currentStep === 4">Technical protocol created successfully.</strong>
              <span v-if="currentStep === 2">You can review or update your details below before proceeding.</span>
            </div>
          </div>

          <!-- STEP 1 -->
          <div class="card" v-if="currentStep === 1">
            <div class="card-header">
              <h2>Professional Profile</h2>
              <p>Set up your agronomist profile to manage clients and receive relevant insights.</p>
            </div>
            
            <div class="form-grid">
              <label class="field">
                <span>Full Name</span>
                <input type="text" v-model="setup.profile.fullName" placeholder="Dr. Mateo Vargas">
              </label>
              <label class="field">
                <span>License ID</span>
                <input type="text" v-model="setup.profile.licenseId" placeholder="AG-28491">
              </label>
              <label class="field">
                <span>Experience (Years)</span>
                <input type="text" v-model="setup.profile.experience" placeholder="8 years">
              </label>
              <label class="field">
                <span>Service Coverage</span>
                <input type="text" v-model="setup.profile.serviceCoverage" placeholder="Lima Norte and Huaral Valley">
              </label>
              <label class="field full-width">
                <span>Primary Crops</span>
                <input type="text" v-model="setup.profile.primaryCrops" placeholder="Avocado, Blueberry, Tomato">
              </label>
            </div>

            <div class="specialties-section">
              <span>Specialties</span>
              <div class="chips">
                <button 
                  v-for="spec in availableSpecialties" 
                  :key="spec"
                  class="chip" 
                  :class="{ active: setup.profile.specialties.includes(spec) }"
                  @click="toggleSpecialty(spec)"
                >
                  <span v-if="setup.profile.specialties.includes(spec)" class="material-symbols-outlined">check</span> 
                  {{ spec }}
                </button>
              </div>
            </div>

            <div class="document-section">
              <span>Certification Document</span>
              
              <div class="upload-area small-upload" v-if="!setup.profile.document" @click="$refs.docInput.click()">
                <span class="material-symbols-outlined cloud-icon-small">upload_file</span>
                <p>Click to browse or drag document</p>
                <input type="file" ref="docInput" style="display: none;" @change="handleDocUpload" accept=".pdf,.jpg,.png,.doc,.docx" />
              </div>

              <div class="upload-box-small" v-else>
                <div class="doc-info">
                  <span class="material-symbols-outlined file-icon">description</span>
                  <div>
                    <strong>{{ setup.profile.document.name }}</strong>
                    <small>{{ (setup.profile.document.size / 1024 / 1024).toFixed(1) }} MB</small>
                  </div>
                </div>
                <div class="status-badge">
                  <span class="material-symbols-outlined">check_circle</span> Document uploaded
                  <button class="remove-doc-btn" @click.stop="setup.profile.document = null">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2 -->
          <div v-if="currentStep === 2" class="step-container">
            <div class="step-header-text">
              <h2>Client Portfolio Setup</h2>
              <p>Import or add your clients to build your management portfolio.</p>
            </div>

            <div class="action-buttons">
              <button class="action-btn" :class="{ active: clientAddMode === 'import' }" @click="clientAddMode = 'import'">
                <span class="material-symbols-outlined">upload_file</span>
                Import Clients
              </button>
              <button class="action-btn" :class="{ active: clientAddMode === 'invite' }" @click="clientAddMode = 'invite'">
                <span class="material-symbols-outlined">person_add</span>
                Invite Farmer
              </button>
              <button class="action-btn" :class="{ active: clientAddMode === 'manual' }" @click="clientAddMode = 'manual'">
                <span class="material-symbols-outlined">note_add</span>
                Add Manually
              </button>
            </div>

            <template v-if="clientAddMode === 'import'">
              <div class="upload-area" v-if="!setup.portfolioFile" @click="$refs.portfolioInput.click()">
              <span class="material-symbols-outlined cloud-icon">cloud_upload</span>
              <p>Drag and drop your CSV or XLSX file here</p>
              <small>Max file size: 10MB</small>
              <button class="browse-btn" @click.stop="$refs.portfolioInput.click()">Browse Files</button>
              <input type="file" ref="portfolioInput" style="display: none;" @change="handlePortfolioUpload" accept=".csv,.xlsx" />
            </div>
            
            <div class="upload-box-small" v-else style="margin-bottom: 30px;">
              <div class="doc-info">
                <span class="material-symbols-outlined file-icon">table_view</span>
                <div>
                  <strong>{{ setup.portfolioFile.name }}</strong>
                  <small>{{ (setup.portfolioFile.size / 1024 / 1024).toFixed(1) }} MB</small>
                </div>
              </div>
              <div class="status-badge">
                <span class="material-symbols-outlined">check_circle</span> Portfolio uploaded
                <button class="remove-doc-btn" @click="setup.portfolioFile = null">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div class="clients-table">
              <h3>Imported Clients</h3>
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Parcel</th>
                    <th>Crop</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Agro Valle SAC</td>
                    <td>North Parcel</td>
                    <td>Avocado</td>
                    <td>Huaral</td>
                    <td><span class="badge linked">Linked</span></td>
                  </tr>
                  <tr>
                    <td>Finca Santa Rosa</td>
                    <td>Sector A</td>
                    <td>Blueberry</td>
                    <td>Cañete</td>
                    <td><span class="badge linked">Linked</span></td>
                  </tr>
                  <tr>
                    <td>Huerta Los Pinos</td>
                    <td>Greenhouse 2</td>
                    <td>Tomato</td>
                    <td>Pachacámac</td>
                    <td><span class="badge invitation">Invitation sent</span></td>
                  </tr>
                  <tr>
                    <td>Campo Verde</td>
                    <td>Lettuce Block</td>
                    <td>Lettuce</td>
                    <td>Lurín</td>
                    <td><span class="badge pending">Pending acceptance</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            </template>

            <template v-if="clientAddMode === 'invite'">
              <div class="invite-container">
                <div class="invite-form-wrapper">
                  <h3>Send Invitation</h3>
                  <p>Enter the farmer's email to send them a SATECHO invitation.</p>
                  <div class="invite-input-group">
                    <input type="email" v-model="newInviteEmail" placeholder="farmer@example.com" class="invite-input" />
                    <button class="send-btn" @click="sendInvite">
                      <span class="material-symbols-outlined">send</span> Send
                    </button>
                  </div>
                </div>

                <div class="clients-table mt-4" v-if="invitedFarmers.length > 0">
                  <h3>Sent Invitations</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Email Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="farmer in invitedFarmers" :key="farmer.email">
                        <td>{{ farmer.email }}</td>
                        <td><span class="badge pending">Pending</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>

            <template v-if="clientAddMode === 'manual'">
              <div class="invite-container">
                <div class="invite-form-wrapper" style="padding: 24px;">
                  <h3>Manual Entry</h3>
                  <p>Enter your client and parcel details manually.</p>
                  
                  <div class="clients-table manual-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Parcel</th>
                          <th>Crop</th>
                          <th>Location</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, index) in manualRows" :key="index">
                          <template v-if="row.isEditing">
                            <td><input type="text" v-model="row.client" placeholder="e.g. Agro Valle" class="table-input" /></td>
                            <td><input type="text" v-model="row.parcel" placeholder="e.g. North Parcel" class="table-input" /></td>
                            <td><input type="text" v-model="row.crop" placeholder="e.g. Avocado" class="table-input" /></td>
                            <td><input type="text" v-model="row.location" placeholder="e.g. Huaral" class="table-input" /></td>
                            <td style="width: 70px; text-align: right;">
                              <div class="row-actions">
                                <button class="icon-action-btn check" @click="row.isEditing = false" v-if="row.client || row.parcel" title="Save">
                                  <span class="material-symbols-outlined">check</span>
                                </button>
                                <button class="icon-action-btn delete" @click="manualRows.splice(index, 1)" v-if="manualRows.length > 1" title="Delete">
                                  <span class="material-symbols-outlined">delete</span>
                                </button>
                              </div>
                            </td>
                          </template>
                          <template v-else>
                            <td><span class="blue-text">{{ row.client }}</span></td>
                            <td><span class="blue-text">{{ row.parcel }}</span></td>
                            <td><span class="blue-text">{{ row.crop }}</span></td>
                            <td><span class="blue-text">{{ row.location }}</span></td>
                            <td style="width: 70px; text-align: right;">
                              <div class="row-actions">
                                <button class="icon-action-btn edit" @click="row.isEditing = true" title="Edit">
                                  <span class="material-symbols-outlined">edit</span>
                                </button>
                                <button class="icon-action-btn delete" @click="manualRows.splice(index, 1)" v-if="manualRows.length > 1" title="Delete">
                                  <span class="material-symbols-outlined">delete</span>
                                </button>
                              </div>
                            </td>
                          </template>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- STEP 3 -->
          <div v-if="currentStep === 3" class="step-container">
            <div class="card-header flex-header">
              <h2>Protocol Configuration</h2>
              <span class="badge template-ready">{{ templates.length }} TEMPLATE{{ templates.length > 1 ? 'S' : '' }}</span>
            </div>

            <div v-for="(template, index) in templates" :key="template.id" class="template-block" :style="index < templates.length - 1 ? 'margin-bottom: 40px; padding-bottom: 40px; border-bottom: 2px dashed #eee;' : 'margin-bottom: 10px;'">
              <h3 style="margin-bottom: 20px; color: #456c4c; font-size: 16px; font-weight: 700;" v-if="templates.length > 1">Template #{{ index + 1 }}</h3>
              
              <div class="template-info" style="margin-bottom: 32px;">
                <div class="template-header" style="justify-content: space-between; display: flex; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined">description</span>
                    <span>TEMPLATE INFO</span>
                  </div>
                  <button class="edit-btn" @click="template.isEditingInfo = !template.isEditingInfo">
                    {{ template.isEditingInfo ? 'Save' : 'Edit' }}
                  </button>
                </div>
                <div class="template-grid">
                  <div>
                    <small>Template Name</small>
                    <strong v-if="!template.isEditingInfo">{{ template.info.name || '-' }}</strong>
                    <input v-else type="text" v-model="template.info.name" placeholder="e.g. Avocado Irrigation Protocol" class="table-input" style="margin-top: 4px;">
                  </div>
                  <div>
                    <small>Target Crop</small>
                    <strong v-if="!template.isEditingInfo">{{ template.info.crop || '-' }}</strong>
                    <input v-else type="text" v-model="template.info.crop" placeholder="e.g. Avocado" class="table-input" style="margin-top: 4px;">
                  </div>
                  <div class="full-width">
                    <small>Description</small>
                    <p v-if="!template.isEditingInfo">{{ template.info.description || '-' }}</p>
                    <textarea v-else v-model="template.info.description" placeholder="Standard protocol description..." class="table-input" style="margin-top: 4px; min-height: 60px; resize: vertical; font-family: inherit;"></textarea>
                  </div>
                </div>
              </div>

              <div class="sensors-section">
                <div class="section-title">
                  <div><span class="material-symbols-outlined">sensors</span> SENSOR THRESHOLDS</div>
                  <button class="edit-btn" @click="template.isEditingSensors = !template.isEditingSensors">
                    {{ template.isEditingSensors ? 'Save' : 'Edit' }}
                  </button>
                </div>
                <div class="sensors-grid">
                  <div class="sensor-card">
                    <div class="sensor-title"><span class="material-symbols-outlined moisture-icon">water_drop</span> Soil Moisture</div>
                    <div class="sensor-value" v-if="!template.isEditingSensors">{{ template.sensors.moisture || '-' }} <span>%</span></div>
                    <div class="sensor-edit" v-else>
                      <input type="text" v-model="template.sensors.moisture" placeholder="25-45" class="sensor-input"> <span>%</span>
                    </div>
                  </div>
                  <div class="sensor-card">
                    <div class="sensor-title"><span class="material-symbols-outlined ec-icon">bolt</span> EC Limit</div>
                    <div class="sensor-value" v-if="!template.isEditingSensors">{{ template.sensors.ec || '-' }} <span>dS/m</span></div>
                    <div class="sensor-edit" v-else>
                      <input type="text" v-model="template.sensors.ec" placeholder="1.8" class="sensor-input"> <span>dS/m</span>
                    </div>
                  </div>
                  <div class="sensor-card">
                    <div class="sensor-title"><span class="material-symbols-outlined ph-icon">science</span> pH Level</div>
                    <div class="sensor-value" v-if="!template.isEditingSensors">{{ template.sensors.ph || '-' }}</div>
                    <div class="sensor-edit" v-else>
                      <input type="text" v-model="template.sensors.ph" placeholder="5.8-7.0" class="sensor-input">
                    </div>
                  </div>
                  <div class="sensor-card">
                    <div class="sensor-title"><span class="material-symbols-outlined temp-icon">device_thermostat</span> Temperature</div>
                    <div class="sensor-value" v-if="!template.isEditingSensors">{{ template.sensors.temp || '-' }} <span>°C</span></div>
                    <div class="sensor-edit" v-else>
                      <input type="text" v-model="template.sensors.temp" placeholder="16-28" class="sensor-input"> <span>°C</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rules-section">
                <div class="rules-col">
                  <div class="section-title"><span class="material-symbols-outlined">notifications_active</span> ALERT RULES</div>
                  <div class="rule-chips">
                    <button class="chip warning"><span class="material-symbols-outlined">warning</span> Warning</button>
                    <button class="chip critical"><span class="material-symbols-outlined">error</span> Critical</button>
                    <button class="chip info">Info</button>
                  </div>
                </div>
                <div class="rules-col">
                  <div class="section-title"><span class="material-symbols-outlined">assignment_ind</span> APPLY TO</div>
                  <div class="radio-group">
                    <label class="radio-label" :class="{ active: template.applyTo === 'Specific crop type' }">
                      <input type="radio" :name="'apply_' + template.id" value="Specific crop type" v-model="template.applyTo" style="display: none;">
                      <div class="custom-radio"></div>
                      <span>Specific crop type</span>
                    </label>
                    <label class="radio-label" :class="{ active: template.applyTo === 'All active clients' }">
                      <input type="radio" :name="'apply_' + template.id" value="All active clients" v-model="template.applyTo" style="display: none;">
                      <div class="custom-radio"></div>
                      <span>All active clients</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button class="browse-btn" style="display: flex; align-items: center; gap: 6px; padding: 12px 16px; border: 2px dashed #456c4c; color: #456c4c; background: #fdfdf9; width: 100%; justify-content: center; margin-top: 10px; font-size: 15px;" @click="addTemplate">
              <span class="material-symbols-outlined" style="font-size: 22px;">add</span> Add Another Template
            </button>
          </div>

          <!-- STEP 4 -->
          <div v-if="currentStep === 4" class="step-container">
            <div class="step-header-text">
              <h2>Control Room Setup</h2>
              <p>Configure reporting frequency, urgency levels, and notification channels for the parcels you supervise.</p>
            </div>

            <div class="setup-section">
              <h3>Report Frequency</h3>
              <div class="chips-group">
                <button class="chip-large" :class="{ active: reportFrequency === 'Daily Summary' }" @click="reportFrequency = 'Daily Summary'">Daily Summary</button>
                <button class="chip-large" :class="{ active: reportFrequency === 'Weekly Technical Report' }" @click="reportFrequency = 'Weekly Technical Report'">Weekly Technical Report</button>
                <button class="chip-large" :class="{ active: reportFrequency === 'Monthly Client Report' }" @click="reportFrequency = 'Monthly Client Report'">Monthly Client Report</button>
              </div>
            </div>

            <div class="setup-section">
              <h3>Urgency Levels</h3>
              <div class="chips-group">
                <button class="chip-large" :class="{ active: urgencyLevels.includes('Preventive') }" @click="toggleUrgency('Preventive')">
                  <span class="material-symbols-outlined" v-if="urgencyLevels.includes('Preventive')">check</span> Preventive
                </button>
                <button class="chip-large" :class="{ active: urgencyLevels.includes('Warning') }" @click="toggleUrgency('Warning')">
                  <span class="material-symbols-outlined" v-if="urgencyLevels.includes('Warning')">check</span> Warning
                </button>
                <button class="chip-large critical-active" @click="toggleUrgency('Critical (Required)')" style="cursor: default;">
                  <span class="material-symbols-outlined">check</span> Critical (Required)
                </button>
              </div>
            </div>

            <div class="setup-section">
              <h3>Notification Channels</h3>
              <div class="chips-group channels">
                <button class="chip-large" :class="{ active: notificationChannels.includes('Email') }" @click="toggleChannel('Email')">
                  <span class="material-symbols-outlined">mail</span> Email
                </button>
                <button class="chip-large" :class="{ active: notificationChannels.includes('WhatsApp') }" @click="toggleChannel('WhatsApp')">
                  <span class="material-symbols-outlined">chat</span> WhatsApp
                </button>
                <button class="chip-large" :class="{ active: notificationChannels.includes('SMS') }" @click="toggleChannel('SMS')">
                  <span class="material-symbols-outlined">sms</span> SMS
                </button>
                <button class="chip-large" :class="{ active: notificationChannels.includes('In-app Notification') }" @click="toggleChannel('In-app Notification')">
                  <span class="material-symbols-outlined">notifications</span> In-app Notification
                </button>
              </div>
            </div>

            <div class="setup-section">
              <h3>Supervision Rules</h3>
              <div class="toggle-list">
                <label class="toggle-row" @click.prevent="supervisionRules.notifyCritical = !supervisionRules.notifyCritical">
                  <span>Notify me when a parcel becomes critical</span>
                  <div class="toggle" :class="{ active: supervisionRules.notifyCritical }"></div>
                </label>
                <label class="toggle-row" @click.prevent="supervisionRules.escalateAlerts = !supervisionRules.escalateAlerts">
                  <span>Escalate alerts after 30 minutes without response</span>
                  <div class="toggle" :class="{ active: supervisionRules.escalateAlerts }"></div>
                </label>
                <label class="toggle-row" @click.prevent="supervisionRules.includeTrend = !supervisionRules.includeTrend">
                  <span>Include EC/pH trend context in alerts</span>
                  <div class="toggle" :class="{ active: supervisionRules.includeTrend }"></div>
                </label>
                <label class="toggle-row" @click.prevent="supervisionRules.includeShortcut = !supervisionRules.includeShortcut">
                  <span>Include farmer contact shortcut</span>
                  <div class="toggle" :class="{ active: supervisionRules.includeShortcut }"></div>
                </label>
              </div>
            </div>
          </div>

        </section>

        <!-- Right Side: Summary Card -->
        <aside class="summary-section">
          <div class="summary-card">
            <h3>{{ steps[currentStep-1].summaryTitle }}</h3>
            
            <div class="summary-content" v-if="currentStep === 1">
              <div class="summary-row">
                <span>Step</span>
                <strong>1 of 4</strong>
              </div>
              <div class="summary-row">
                <span>Selected specialties</span>
                <strong>{{ setup.profile.specialties.length }}</strong>
              </div>
              <div class="summary-row">
                <span>Certification status</span>
                <strong class="success-text" v-if="setup.profile.document">
                  <span class="material-symbols-outlined">check_circle</span> Uploaded
                </strong>
                <strong v-else style="color: #888;">
                  Pending
                </strong>
              </div>
              <div class="summary-row">
                <span>Service coverage</span>
                <strong>{{ setup.profile.serviceCoverage ? 'Configured' : 'Pending' }}</strong>
              </div>
            </div>

            <div class="summary-content" v-if="currentStep === 2">
              <div class="summary-row">
                <span>Progress</span>
                <strong>Step 2 of 4</strong>
              </div>
              <div class="summary-row">
                <span>Clients added</span>
                <strong>5</strong>
              </div>
              <div class="summary-row">
                <span>Parcels linked</span>
                <strong>8</strong>
              </div>
              <div class="summary-row">
                <span>Invitations pending</span>
                <strong>2</strong>
              </div>
            </div>

            <div class="summary-content" v-if="currentStep === 3">
              <div class="summary-row">
                <span>Progress</span>
                <strong>Step 3 of 4</strong>
              </div>
              <div class="summary-row">
                <span>Templates created</span>
                <strong>{{ templates.length }}</strong>
              </div>
              <div class="summary-row">
                <span>Crop types assigned</span>
                <strong>{{ Array.from(new Set(templates.map(t => t.info.crop).filter(c => c))).length || 0 }}</strong>
              </div>
              <div class="summary-row">
                <span>Active alert rules</span>
                <strong>{{ templates.length * 2 }}</strong>
              </div>
            </div>

            <div class="summary-content" v-if="currentStep === 4">
              <div class="summary-row">
                <span>Step</span>
                <strong>4 of 4</strong>
              </div>
              <div class="summary-row">
                <span>Report frequency</span>
                <strong>{{ reportFrequency.split(' ')[0] }}</strong>
              </div>
              <div class="summary-row">
                <span>Urgency levels</span>
                <strong>{{ urgencyLevels.length }} configured</strong>
              </div>
              <div class="summary-row">
                <span>Channels</span>
                <strong>{{ notificationChannels.length }} active</strong>
              </div>
              <div class="summary-row">
                <span>Dashboard access</span>
                <strong class="success-text">Ready</strong>
              </div>
            </div>

            <div class="next-step-box" v-if="currentStep < 4">
              <small>Next Step</small>
              <strong>{{ steps[currentStep].label }} <span class="material-symbols-outlined">arrow_forward</span></strong>
              <p v-if="currentStep === 3">Configure your dashboard widgets and monitoring views.</p>
            </div>
          </div>
        </aside>

      </div>
    </div>

    <!-- Bottom Footer Actions -->
    <footer class="bottom-actions">
      <button class="back-btn" @click="goBack" v-if="currentStep > 1">
        <span class="material-symbols-outlined">arrow_back</span>
        Back
      </button>
      <div v-else></div> <!-- Spacer -->

      <div class="action-group">
        <button class="save-btn" @click="saveForLater">
          <span class="material-symbols-outlined">save</span>
          Save Draft
        </button>
        <button class="continue-btn" @click="goNext">
          {{ currentStep === 4 ? 'Go to Dashboard' : 'Continue' }}
          <span class="material-symbols-outlined" v-if="currentStep < 4">arrow_forward</span>
          <span class="material-symbols-outlined" v-else>dashboard</span>
        </button>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: #fdfdf9;
  color: #2c3328;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: transparent;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 24px;
  font-weight: 800;
  color: #456c4c;
  letter-spacing: 0.5px;
}

.divider {
  color: #c4c4c4;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #444;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-btn {
  color: #666;
  cursor: pointer;
}

.avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.content-wrapper {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  padding: 40px 20px;
}

/* Stepper */
.stepper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 60px;
  margin-bottom: 50px;
  position: relative;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.stepper::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #e8eae6;
  z-index: 1;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
  flex: 1;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8eae6;
  color: #888;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  border: 6px solid #fdfdf9;
  box-sizing: content-box;
}

.step-item.active .step-circle {
  background: #456c4c;
  color: white;
}

.step-item.completed .step-circle {
  background: #456c4c;
  color: white;
}

.check-icon {
  font-size: 18px;
}

.step-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.step-item.active .step-label,
.step-item.completed .step-label {
  color: #456c4c;
  font-weight: 600;
}

.step-line {
  display: none;
}

/* Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
}

@media (max-width: 900px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

.success-banner {
  background: #edf5eb;
  border: 1px solid #c7e1c5;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

.check-circle {
  color: #456c4c;
  margin-top: 2px;
}

.banner-text strong {
  display: block;
  color: #2c3328;
  font-size: 15px;
  margin-bottom: 4px;
}

.banner-text span {
  color: #556250;
  font-size: 14px;
}

/* Form Sections */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  padding: 32px;
  border: 1px solid #eee;
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-header-text h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1a;
  margin-bottom: 8px;
}

.step-header-text p {
  color: #666;
  font-size: 15px;
}

.card-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.card-header p {
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
}

.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field span {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.field input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.field input:focus {
  border-color: #456c4c;
  outline: none;
  box-shadow: 0 0 0 3px rgba(69, 108, 76, 0.1);
}

.specialties-section, .document-section {
  margin-top: 24px;
}

.specialties-section > span, .document-section > span {
  font-size: 13px;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  display: block;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 8px 16px;
  border-radius: 20px;
  background: #f0f0f0;
  border: 1px solid transparent;
  color: #555;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  user-select: none;
}

.chip.active {
  background: #edf5eb;
  border-color: #c7e1c5;
  color: #456c4c;
}

.chip .material-symbols-outlined {
  font-size: 16px;
}

.upload-box-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 32px;
  color: #999;
}

.doc-info strong {
  display: block;
  font-size: 14px;
  color: #333;
}

.doc-info small {
  color: #888;
  font-size: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #456c4c;
  font-size: 13px;
  font-weight: 600;
  background: #edf5eb;
  padding: 6px 12px;
  border-radius: 20px;
}

.remove-doc-btn {
  background: none;
  border: none;
  color: #456c4c;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  margin-left: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}

.remove-doc-btn:hover {
  background: rgba(69, 108, 76, 0.1);
}

.remove-doc-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Step 2 specific */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  color: #555;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #456c4c;
  background: #fafafa;
}

.action-btn.active {
  border-color: #456c4c;
  background: #fdfdf9;
  color: #456c4c;
}

.action-btn .material-symbols-outlined {
  font-size: 28px;
  color: #456c4c;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #456c4c;
}

.upload-area.small-upload {
  padding: 20px;
  flex-direction: row;
  justify-content: center;
  gap: 12px;
}

.cloud-icon-small {
  font-size: 24px;
  color: #666;
}

.upload-area.small-upload p {
  margin: 0;
  font-size: 14px;
  color: #555;
}

.cloud-icon {
  font-size: 48px;
  color: #666;
  margin-bottom: 16px;
}

.upload-area p {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.upload-area small {
  color: #888;
  margin-bottom: 20px;
}

.browse-btn {
  padding: 10px 24px;
  border: 1px solid #aaa;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.clients-table h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.clients-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.clients-table th {
  text-align: left;
  padding: 14px 16px;
  background: #fafafa;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.clients-table td {
  padding: 14px 16px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.linked { background: #edf5eb; color: #456c4c; }
.badge.invitation { background: #f5f5f5; color: #666; }
.badge.pending { background: #fff3e0; color: #e65100; }

.mt-4 { margin-top: 24px; }

/* Invite Form */
.invite-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.invite-form-wrapper {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 32px;
}

.invite-form-wrapper h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
}

.invite-form-wrapper p {
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
}

.invite-input-group {
  display: flex;
  gap: 12px;
}

.invite-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.invite-input:focus {
  border-color: #456c4c;
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  background: #456c4c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover {
  background: #36563c;
}

/* Manual Table */
.manual-table td {
  padding: 8px;
}

.table-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: white;
}

.table-input:focus {
  border-color: #456c4c;
}

.blue-text {
  color: #0056b3;
  font-size: 14px;
  font-weight: 500;
}

.row-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.icon-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.icon-action-btn:hover {
  background: #f0f0f0;
}

.icon-action-btn.check { color: #456c4c; }
.icon-action-btn.edit { color: #0056b3; }
.icon-action-btn.delete { color: #c62828; }

.icon-action-btn .material-symbols-outlined {
  font-size: 18px;
}

/* Step 3 specific */
.badge.template-ready {
  background: #edf5eb;
  color: #456c4c;
  padding: 6px 12px;
}

.template-info {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.template-grid small {
  color: #888;
  display: block;
  margin-bottom: 4px;
}

.template-grid strong {
  font-size: 15px;
  color: #333;
}

.template-grid p {
  font-size: 14px;
  color: #555;
  margin: 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #666;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.section-title div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-btn {
  color: #456c4c;
  background: none;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.sensors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sensor-card {
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
  background: white;
}

.sensor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.moisture-icon { color: #8d6e63; }
.ec-icon { color: #9e9e9e; }
.ph-icon { color: #81c784; }
.temp-icon { color: #ff9800; }

.sensor-value {
  font-size: 24px;
  font-weight: 800;
  color: #333;
}

.sensor-value span {
  font-size: 14px;
  color: #888;
  font-weight: 500;
}

.sensor-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sensor-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
}

.sensor-input:focus {
  border-color: #456c4c;
}

.sensor-edit span {
  font-size: 14px;
  color: #888;
  font-weight: 500;
}

.rules-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.rule-chips {
  display: flex;
  gap: 10px;
}

.chip.warning { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
.chip.critical { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
.chip.info { background: #f5f5f5; color: #666; }

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.radio-label.active {
  color: #333;
}

.custom-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ddd;
  position: relative;
  transition: all 0.2s;
}

.radio-label.active .custom-radio {
  border-color: #456c4c;
}

.radio-label.active .custom-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #456c4c;
  border-radius: 50%;
}

/* Step 4 specific */
.setup-section {
  margin-bottom: 10px;
}

.setup-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
}

.chips-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chip-large {
  padding: 12px 24px;
  border-radius: 24px;
  border: 1px solid #ddd;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.chip-large.active {
  background: #7A9A7A;
  color: white;
  border-color: #7A9A7A;
}

.chip-large.critical-active {
  background: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
}

.chips-group.channels .chip-large.active {
  background: #7A9A7A;
  color: white;
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #333;
  cursor: pointer;
}

.toggle {
  width: 44px;
  height: 24px;
  background: #ddd;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle.active {
  background: #7A9A7A;
}

.toggle.active::after {
  transform: translateX(20px);
}

/* Right Side Summary */
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  position: sticky;
  top: 24px;
}

.summary-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1a1c1a;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.summary-row span {
  color: #666;
}

.summary-row strong {
  color: #333;
}

.success-text {
  color: #456c4c !important;
  display: flex;
  align-items: center;
  gap: 4px;
}

.success-text .material-symbols-outlined {
  font-size: 16px;
}

.next-step-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.next-step-box small {
  color: #888;
  display: block;
  margin-bottom: 4px;
}

.next-step-box strong {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #333;
  font-size: 14px;
}

.next-step-box p {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  line-height: 1.4;
}

/* Footer Actions */
.bottom-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: white;
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #555;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
}

.action-group {
  display: flex;
  gap: 16px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 8px;
  color: #555;
  font-weight: 600;
  cursor: pointer;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #456c4c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.continue-btn:hover {
  background: #36563c;
}
</style>
