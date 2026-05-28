<script setup>
import { computed, ref } from 'vue'

const successMessage = ref(
    'Crop threshold template created successfully.'
)

const templates = ref([
  {
    id: 1,
    name: 'Avocado Hass - Optimal',
    crop: 'Avocado',
    status: 'Ready',
    modified: 'Just now',
  },
  {
    id: 2,
    name: 'Corn - Early Stage',
    crop: 'Corn',
    status: 'Applied',
    modified: '2 days ago',
  },
  {
    id: 3,
    name: 'Soybean - Drought Tolerance',
    crop: 'Soybean',
    status: 'Draft',
    modified: '5 days ago',
  },
])

const saveTemplate = () => {
  if (!templateForm.value.name || !templateForm.value.crop) {
    successMessage.value = 'Complete required fields.'
    return
  }
  if (editingTemplateId.value) {
    const index = templates.value.findIndex(
        template => template.id === editingTemplateId.value
    )
    templates.value[index] = {
      ...templateForm.value,
      modified: 'Just now',
      status: 'Ready',
    }
  } else {
    templates.value.unshift({
      ...templateForm.value,
      modified: 'Just now',
      status: 'Ready',
    })
  }
  successMessage.value =
      'Template saved successfully.'
  isEditorOpen.value = false
}

const duplicateTemplate = () => {

  templates.value.push({
    id: Date.now(),
    name: `${templateForm.value.name} Copy`,
    crop: editor.value.cropType,
    status: 'Draft',
    modified: 'Just now',
  })

  successMessage.value =
      'Template duplicated successfully.'

}

const applyTemplate = () => {

  successMessage.value =
      'Template applied to parcels.'

}

const isEditorOpen = ref(false)
const editingTemplateId = ref(null)

const emptyTemplate = () => ({
  id: Date.now(),
  name: '',
  crop: '',
  moistureMin: '',
  moistureOptimal: '',
  moistureMax: '',
  phMin: '',
  phMax: '',
  tempLow: '',
  tempOptimal: '',
  tempHigh: '',
  rules: [],
  status: 'Draft',
  updatedAt: 'Just now',
})

const templateForm = ref(emptyTemplate())

const openNewTemplate = () => {
  editingTemplateId.value = null
  templateForm.value = emptyTemplate()
  isEditorOpen.value = true
}
const editTemplate = (template) => {
  editingTemplateId.value = template.id

  templateForm.value = JSON.parse(JSON.stringify(template))

  isEditorOpen.value = true
}
const deleteTemplate = (id) => {
  templates.value = templates.value.filter(
      template => template.id !== id
  )

  successMessage.value = 'Template deleted successfully.'
}
</script>

<template>
  <main class="thresholds-page">
    <section class="page-header">
      <div>
        <h1>Crop Threshold Templates</h1>
        <p>
          Manage and apply optimal growing parameters across your parcels.
        </p>
      </div>
    </section>

    <Transition name="fade">
      <div
          v-if="successMessage"
          class="success-banner"
      >
        <span class="material-symbols-outlined">
          check_circle
        </span>
        <div>
          <strong>
            {{ successMessage }}
          </strong>
          <p>
            The template is now ready to be applied.
          </p>
        </div>
      </div>
    </Transition>

    <section class="metrics-grid">
      <article class="metric-card">
        <small>ACTIVE TEMPLATES</small>
        <h2>8</h2>
      </article>
      <article class="metric-card">
        <small>CROP TYPES</small>
        <h2>5</h2>
      </article>
      <article class="metric-card">
        <small>APPLIED PARCELS</small>
        <h2>24</h2>
      </article>
      <article class="metric-card">
        <small>RECENTLY UPDATED</small>
        <h2>3</h2>
      </article>
    </section>

    <section class="content-grid">
      <div class="main-column">
        <section class="card">
          <div class="card-header">
            <h2>Template Library</h2>
            <button class="ghost-button">
              Filter
            </button>
          </div>
          <div class="templates-header">
            <div>
              <h2>Template Library</h2>
              <p>Manage irrigation threshold templates.</p>
            </div>
            <button
                class="primary-btn"
                @click="openNewTemplate"
            >
              <span class="material-symbols-outlined">add</span>
              New Template
            </button>
          </div>
          <table>
            <thead>
            <tr>
              <th>Template Name</th>
              <th>Crop Type</th>
              <th>Status</th>
              <th>Last Modified</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="template in templates"
                :key="template.id"
            >
              <td>{{ template.name }}</td>
              <td>{{ template.crop }}</td>
              <td>
                <span
                    class="status-badge"
                    :class="template.status.toLowerCase()"
                >
                  {{ template.status }}
                </span>
              </td>
              <td>{{ template.modified }}</td>
              <td>
                <div class="template-actions">
                  <button class="icon-btn" @click="editTemplate(template)">
                    <span class="material-symbols-outlined">
                      edit
                    </span>
                  </button>
                  <button class="icon-btn danger" @click="deleteTemplate(template.id)">
                    <span class="material-symbols-outlined">
                      delete
                    </span>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </section>

        <section v-if="isEditorOpen" class="template-editor-modal">
          <div class="card-header">
            <h2>Template Editor</h2>
          </div>
          <div class="editor-section">
            <small class="section-label">
              INFORMATION
            </small>
            <div class="form-grid">
              <label class="field-group">
                <span>Template Name</span>
                <input
                    v-model="templateForm.name"
                    type="text"
                >
              </label>
              <label class="field-group">
                <span>Crop Type</span>
                <input
                    v-model="templateForm.crop"
                    type="text"
                >
              </label>
            </div>
          </div>

          <div class="editor-section">
            <small class="section-label">
              SOIL MOISTURE THRESHOLDS
            </small>
            <div class="form-grid three">
              <label class="field-group">
                <span>Minimum (%)</span>
                <input
                    v-model="templateForm.moistureMin"
                    type="number"
                >
              </label>
              <label class="field-group">
                <span>Optimal (%)</span>
                <input
                    v-model="templateForm.moistureOptimal"
                    type="number"
                >
              </label>
              <label class="field-group">
                <span>Maximum (%)</span>
                <input
                    v-model="templateForm.moistureMax"
                    type="number"
                >
              </label>
            </div>
          </div>

          <div class="editor-section">
            <small class="section-label">
              SOIL CHEMISTRY (PH)
            </small>
            <div class="form-grid">
              <label class="field-group">
                <span>Min pH</span>
                <input
                    v-model="templateForm.phMin"
                    type="number"
                    step="0.1"
                >
              </label>
              <label class="field-group">
                <span>Max pH</span>
                <input
                    v-model="templateForm.phMax"
                    type="number"
                    step="0.1"
                >
              </label>
            </div>
          </div>

          <div class="editor-section">
            <small class="section-label">
              TEMPERATURE (°C)
            </small>
            <div class="form-grid three">
              <label class="field-group">
                <span>Critical Low</span>
                <input
                    v-model="templateForm.tempLow"
                    type="number"
                >
              </label>
              <label class="field-group">
                <span>Optimal Range</span>
                <input
                    v-model="templateForm.tempOptimal"
                    type="text"
                >
              </label>
              <label class="field-group">
                <span>Critical High</span>
                <input
                    v-model="templateForm.tempHigh"
                    type="number"
                >
              </label>
            </div>
          </div>

          <div class="editor-section">
            <small class="section-label">
              ALERT RULES
            </small>
            <div class="rules-list">
              <div
                  v-for="(rule, index) in templateForm.rules"
                  :key="index"
                  class="rule-item"
              >
                <span class="material-symbols-outlined">
                  check_box
                </span>
                {{ rule }}
              </div>
            </div>
          </div>

          <div class="editor-actions">
            <button
                class="secondary-btn"
                @click="isEditorOpen = false"
            >
              Cancel
            </button>
            <button
                class="primary-btn"
                @click="saveTemplate"
            >
              Save Template
            </button>
          </div>
        </section>
      </div>

      <aside class="side-column">
        <section class="card side-card">
          <h3>Template Status</h3>
          <div class="status-ready">
            Ready
          </div>
          <div class="meta-row">
            <span>Created By</span>
            <strong>Dr. Mateo Vargas</strong>
          </div>
          <div class="meta-row">
            <span>Version</span>
            <strong>1.0.0</strong>
          </div>
        </section>
        <section class="card side-card">
          <h3>Validation</h3>
          <div class="validation-item success">
            Parameters validated
          </div>
          <div class="validation-item success">
            Rules checked
          </div>
        </section>
        <section class="card side-card">
          <h3>Audit Trail Preview</h3>
          <div class="audit-box">
            [SYS] Template created<br>
            [USR] Moisture params updated<br>
            [SYS] Validation passed<br>
            [SYS] Ready for apply action...
          </div>
        </section>
      </aside>
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

.page-header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:20px;
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

.success-banner{
  background:#eef7ee;
  border:1px solid #dcefdc;
  color:#456c4c;
  padding:18px 20px;
  border-radius:18px;
  display:flex;
  align-items:flex-start;
  gap:14px;
}

.success-banner strong{
  display:block;
  margin-bottom:4px;
}

.success-banner p{
  margin:0;
  color:#5d705f;
  font-size:14px;
}

.metrics-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:18px;
}

.metric-card{
  background:white;
  border:1px solid #ececec;
  border-radius:18px;
  padding:24px;
}

.metric-card small{
  color:#8b8b8b;
  font-size:12px;
  font-weight:600;
}

.metric-card h2{
  margin:16px 0 0;
  font-size:34px;
  color:#1f2937;
}

.content-grid{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:24px;
  align-items:start;
}

.main-column{
  display:flex;
  flex-direction:column;
  gap:24px;
}

.side-column{
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
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  border-bottom:1px solid #f1f1f1;
}

.card-header h2{
  margin:0;
  font-size:20px;
  color:#1f2937;
}

.templates-header{
  padding:24px 24px 0;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:20px;
}

.templates-header h2{
  margin:0;
  font-size:18px;
}

.templates-header p{
  margin-top:4px;
  color:#7b7b7b;
  font-size:14px;
}

.template-actions{
  display:flex;
  align-items:center;
  gap:10px;
}

.icon-btn{
  width:38px;
  height:38px;
  border:none;
  border-radius:10px;
  background:#f3f4f6;
  color:#4b5563;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:.2s ease;
}

.icon-btn:hover{
  background:#e7eaee;
}

.icon-btn.danger{
  background:#fff1f1;
  color:#c62828;
}

.icon-btn.danger:hover{
  background:#ffe3e3;
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
  padding:16px 24px;
  color:#7a7a7a;
  font-size:13px;
  font-weight:600;
}

td{
  padding:20px 24px;
  border-top:1px solid #f2f2f2;
  vertical-align:middle;
}

tbody tr{
  transition:.2s ease;
}

tbody tr:hover{
  background:#fafcf9;
}

.status-badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:6px 12px;
  border-radius:999px;
  font-size:12px;
  font-weight:600;
}

.status-badge.ready{
  background:#dcefdc;
  color:#456c4c;
}

.status-badge.applied{
  background:#e7eefc;
  color:#456caa;
}

.status-badge.draft{
  background:#fff1e7;
  color:#d9822b;
}

.template-editor-modal{
  background:white;
  border:1px solid #e8ece8;
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 10px 30px rgba(0,0,0,.04);
}

.editor-section{
  padding:24px;
  border-bottom:1px solid #f4f4f4;
}

.section-label{
  display:block;
  margin-bottom:18px;
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

.form-grid.three{
  grid-template-columns:repeat(3,1fr);
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

.field-group input{
  height:48px;
  border:1px solid #dddddd;
  border-radius:12px;
  padding:0 14px;
  background:white;
  font-size:14px;
  outline:none;
  transition:.2s ease;
}

.field-group input:focus{
  border-color:#456c4c;
  box-shadow:0 0 0 4px rgba(69,108,76,.12);
}

.rules-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.rule-item{
  background:#f8f9f6;
  border-radius:12px;
  padding:14px 16px;
  display:flex;
  align-items:center;
  gap:10px;
  color:#374151;
}

.editor-actions{
  padding:24px;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:12px;
  background:#fafafa;
}

.primary-btn,
.secondary-btn,
.ghost-button{
  border:none;
  border-radius:12px;
  padding:12px 18px;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  transition:.2s ease;
}

.primary-btn{
  background:#456c4c;
  color:white;
  display:flex;
  align-items:center;
  gap:8px;
}

.primary-btn:hover{
  background:#38573d;
}

.secondary-btn{
  background:#ececec;
  color:#333;
}

.secondary-btn:hover{
  background:#e1e1e1;
}

.ghost-button{
  background:#f4f4f4;
  color:#555;
}

.ghost-button:hover{
  background:#ebebeb;
}

.side-card{
  padding:24px;
}

.side-card h3{
  margin:0 0 18px;
  color:#1f2937;
}

.status-ready{
  width:fit-content;
  background:#dcefdc;
  color:#456c4c;
  padding:8px 14px;
  border-radius:999px;
  font-size:13px;
  font-weight:700;
  margin-bottom:20px;
}

.meta-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:14px;
  color:#666;
  font-size:14px;
}

.validation-item{
  padding:12px 14px;
  border-radius:12px;
  margin-bottom:12px;
  font-size:14px;
  font-weight:500;
}

.validation-item.success{
  background:#eef7ee;
  color:#456c4c;
}

.audit-box{
  background:#f8f9f6;
  border-radius:14px;
  padding:18px;
  font-family:monospace;
  font-size:13px;
  line-height:1.8;
  color:#666;
}

.fade-enter-active,
.fade-leave-active{
  transition:opacity .25s ease;
}

.fade-enter-from,
.fade-leave-to{
  opacity:0;
}

@media (max-width:1200px){
  .content-grid{
    grid-template-columns:1fr;
  }

  .metrics-grid{
    grid-template-columns:repeat(2,1fr);
  }

}

@media (max-width:768px){
  .thresholds-page{
    padding:20px;
  }

  .metrics-grid{
    grid-template-columns:1fr;
  }

  .templates-header{
    flex-direction:column;
    align-items:stretch;
  }

  .form-grid,
  .form-grid.three{
    grid-template-columns:1fr;
  }

  .editor-actions{
    flex-direction:column;
    align-items:stretch;
  }

  .page-header h1{
    font-size:30px;
  }
}
</style>