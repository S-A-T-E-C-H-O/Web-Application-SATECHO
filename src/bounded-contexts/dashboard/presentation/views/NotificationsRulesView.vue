<script setup>
import { ref, computed, watch } from 'vue'

/*
|--------------------------------------------------------------------------
| SUCCESS BANNER
|--------------------------------------------------------------------------
*/

const showSuccessBanner = ref(true)

const closeSuccessBanner = () => {
  showSuccessBanner.value = false
}

/*
|--------------------------------------------------------------------------
| NOTIFICATION CHANNELS
|--------------------------------------------------------------------------
*/

const defaultChannels = [
  {
    id: 'email',
    name: 'Email',
    icon: 'mail',
    enabled: true,
    description: 'Send notifications via email'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'chat',
    enabled: true,
    description: 'Send notifications via WhatsApp'
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: 'sms',
    enabled: false,
    description: 'Send notifications via SMS'
  },
  {
    id: 'inapp',
    name: 'In-App',
    icon: 'notifications',
    enabled: true,
    description: 'Show notifications inside platform'
  }
]

const channels = ref(
    JSON.parse(JSON.stringify(defaultChannels))
)

/*
|--------------------------------------------------------------------------
| ALERT RULES
|--------------------------------------------------------------------------
*/

const defaultRules = [
  {
    id: 1,

    title: 'Critical EC/pH Anomaly',

    description:
        'Triggered when EC or pH values exceed critical thresholds.',

    icon: 'warning',

    priority: 'High',

    frequency: 'Immediate',

    enabled: true,

    channels: [
      'mail',
      'chat',
      'notifications'
    ],

    lastTriggered: '3 hrs ago',

    triggerCount: 24
  },

  {
    id: 2,

    title: 'Low Soil Moisture',

    description:
        'Triggered when soil moisture drops below acceptable levels.',

    icon: 'water_drop',

    priority: 'Medium',

    frequency: 'Hourly',

    enabled: true,

    channels: [
      'mail',
      'notifications'
    ],

    lastTriggered: '1 day ago',

    triggerCount: 14
  },

  {
    id: 3,

    title: 'Sensor Offline',

    description:
        'Triggered when a telemetry device stops responding.',

    icon: 'wifi_off',

    priority: 'Low',

    frequency: 'Daily',

    enabled: true,

    channels: [
      'mail'
    ],

    lastTriggered: '5 days ago',

    triggerCount: 6
  }
]

const alertRules = ref(
    JSON.parse(JSON.stringify(defaultRules))
)

/*
|--------------------------------------------------------------------------
| SNAPSHOT FOR CANCEL CHANGES
|--------------------------------------------------------------------------
*/

const initialChannelsSnapshot = ref(
    JSON.parse(JSON.stringify(defaultChannels))
)

const initialRulesSnapshot = ref(
    JSON.parse(JSON.stringify(defaultRules))
)

/*
|--------------------------------------------------------------------------
| UI STATE
|--------------------------------------------------------------------------
*/

const isSaving = ref(false)

const isSendingTest = ref(false)

const hasUnsavedChanges = ref(false)

const showTestModal = ref(false)

const showResetModal = ref(false)

const showSaveModal = ref(false)

const selectedRule = ref(null)

/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

const search = ref('')

/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

const selectedPriorityFilter = ref('All')

const priorityOptions = [
  'All',
  'High',
  'Medium',
  'Low'
]

/*
|--------------------------------------------------------------------------
| FILTERED RULES
|--------------------------------------------------------------------------
*/

const filteredRules = computed(() => {
  let result = alertRules.value

  if (selectedPriorityFilter.value !== 'All') {
    result = result.filter(
        rule => rule.priority === selectedPriorityFilter.value
    )
  }

  if (search.value.trim()) {
    const term = search.value.toLowerCase()

    result = result.filter(rule =>
        rule.title.toLowerCase().includes(term)
    )
  }

  return result
})

/*
|--------------------------------------------------------------------------
| METRICS
|--------------------------------------------------------------------------
*/

const activeRules = computed(() => {
  return alertRules.value.filter(
      rule => rule.enabled
  ).length
})

const criticalChannels = computed(() => {
  return channels.value.filter(
      channel => channel.enabled
  ).length
})

const weeklyReports = computed(() => {
  return 8
})

const pendingTests = computed(() => {
  return isSendingTest.value ? 1 : 0
})

/*
|--------------------------------------------------------------------------
| RULE SUMMARY
|--------------------------------------------------------------------------
*/

const criticalRule = computed(() => {
  return alertRules.value.find(
      rule => rule.priority === 'High'
  )
})

const preventiveRule = computed(() => {
  return alertRules.value.find(
      rule => rule.priority === 'Medium'
  )
})

const activeChannelCount = computed(() => {
  return channels.value.filter(
      channel => channel.enabled
  ).length
})

/*
|--------------------------------------------------------------------------
| PRIORITY BADGES
|--------------------------------------------------------------------------
*/

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'High':
      return 'priority-high'

    case 'Medium':
      return 'priority-medium'

    case 'Low':
      return 'priority-low'

    default:
      return ''
  }
}

/*
|--------------------------------------------------------------------------
| RULE ACTIONS
|--------------------------------------------------------------------------
*/

const toggleRule = (rule) => {
  rule.enabled = !rule.enabled
}

const selectRule = (rule) => {
  selectedRule.value = rule
}

/*
|--------------------------------------------------------------------------
| CHANNEL ACTIONS
|--------------------------------------------------------------------------
*/

const toggleChannel = (channel) => {
  channel.enabled = !channel.enabled
}

/*
|--------------------------------------------------------------------------
| SAVE RULES
|--------------------------------------------------------------------------
*/

const saveRules = async () => {
  try {
    isSaving.value = true

    console.log('Saving notification rules...')
    console.log(channels.value)
    console.log(alertRules.value)

    await new Promise(resolve =>
        setTimeout(resolve, 1500)
    )

    initialChannelsSnapshot.value =
        JSON.parse(JSON.stringify(channels.value))

    initialRulesSnapshot.value =
        JSON.parse(JSON.stringify(alertRules.value))

    hasUnsavedChanges.value = false

    showSuccessBanner.value = true

    showSaveModal.value = true

  } catch (error) {
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL CHANGES
|--------------------------------------------------------------------------
*/

const cancelChanges = () => {
  channels.value =
      JSON.parse(
          JSON.stringify(
              initialChannelsSnapshot.value
          )
      )

  alertRules.value =
      JSON.parse(
          JSON.stringify(
              initialRulesSnapshot.value
          )
      )

  hasUnsavedChanges.value = false
}

/*
|--------------------------------------------------------------------------
| RESET DEFAULTS
|--------------------------------------------------------------------------
*/

const resetDefaults = () => {
  channels.value =
      JSON.parse(
          JSON.stringify(defaultChannels)
      )

  alertRules.value =
      JSON.parse(
          JSON.stringify(defaultRules)
      )

  hasUnsavedChanges.value = true

  showResetModal.value = false
}

/*
|--------------------------------------------------------------------------
| MODALS
|--------------------------------------------------------------------------
*/

const openResetModal = () => {
  showResetModal.value = true
}

const closeResetModal = () => {
  showResetModal.value = false
}

const closeSaveModal = () => {
  showSaveModal.value = false
}

const closeTestModal = () => {
  showTestModal.value = false
}

/*
|--------------------------------------------------------------------------
| TEST NOTIFICATIONS
|--------------------------------------------------------------------------
*/

const sendTestNotification = async () => {
  try {
    isSendingTest.value = true

    console.log('Sending test notification...')

    await new Promise(resolve =>
        setTimeout(resolve, 2000)
    )

    showTestModal.value = true

  } catch (error) {
    console.error(error)
  } finally {
    isSendingTest.value = false
  }
}

/*
|--------------------------------------------------------------------------
| CHANNEL HELPERS
|--------------------------------------------------------------------------
*/

const getEnabledChannels = computed(() => {
  return channels.value.filter(
      channel => channel.enabled
  )
})

const emailEnabled = computed(() => {
  return channels.value.find(
      c => c.id === 'email'
  )?.enabled
})

const whatsappEnabled = computed(() => {
  return channels.value.find(
      c => c.id === 'whatsapp'
  )?.enabled
})

const smsEnabled = computed(() => {
  return channels.value.find(
      c => c.id === 'sms'
  )?.enabled
})

const inAppEnabled = computed(() => {
  return channels.value.find(
      c => c.id === 'inapp'
  )?.enabled
})

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
*/

const totalTriggers = computed(() => {
  return alertRules.value.reduce(
      (total, rule) => total + rule.triggerCount,
      0
  )
})

const highPriorityRules = computed(() => {
  return alertRules.value.filter(
      rule => rule.priority === 'High'
  ).length
})

const mediumPriorityRules = computed(() => {
  return alertRules.value.filter(
      rule => rule.priority === 'Medium'
  ).length
})

const lowPriorityRules = computed(() => {
  return alertRules.value.filter(
      rule => rule.priority === 'Low'
  ).length
})

/*
|--------------------------------------------------------------------------
| CHANGE DETECTION
|--------------------------------------------------------------------------
*/

watch(
    channels,
    () => {
      hasUnsavedChanges.value = true
    },
    {
      deep: true
    }
)

watch(
    alertRules,
    () => {
      hasUnsavedChanges.value = true
    },
    {
      deep: true
    }
)

/*
|--------------------------------------------------------------------------
| HEADER STATS
|--------------------------------------------------------------------------
*/

const headerStats = computed(() => ({
  activeRules: activeRules.value,
  channels: activeChannelCount.value,
  triggers: totalTriggers.value
}))
</script>

<template>

  <div class="notifications-view">

    <!-- ===================================================== -->
    <!-- HEADER -->
    <!-- ===================================================== -->

    <div class="page-header">

      <div class="breadcrumbs">
        Notifications
        <span>/</span>
        Rules
      </div>

      <h1>
        Notification Rules
      </h1>

      <p>
        Manage how critical alerts, summaries, and client
        recommendations are delivered.
      </p>

    </div>

    <!-- ===================================================== -->
    <!-- SUCCESS BANNER -->
    <!-- ===================================================== -->

    <div
        v-if="showSuccessBanner"
        class="success-banner"
    >

      <div class="success-content">

        <span class="material-symbols-outlined">
          check_circle
        </span>

        <span>
          Notification rules saved successfully.
        </span>

      </div>

      <button
          class="banner-close"
          @click="closeSuccessBanner"
      >
        <span class="material-symbols-outlined">
          close
        </span>
      </button>

    </div>

    <!-- ===================================================== -->
    <!-- SUMMARY CARDS -->
    <!-- ===================================================== -->

    <div class="summary-grid">

      <div class="summary-card">

        <div class="summary-icon">
          <span class="material-symbols-outlined">
            rule
          </span>
        </div>

        <div>
          <h3>{{ activeRules }}</h3>
          <p>Active Rules</p>
        </div>

      </div>

      <div class="summary-card">

        <div class="summary-icon">
          <span class="material-symbols-outlined">
            campaign
          </span>
        </div>

        <div>
          <h3>{{ criticalChannels }}</h3>
          <p>Critical Channels</p>
        </div>

      </div>

      <div class="summary-card">

        <div class="summary-icon">
          <span class="material-symbols-outlined">
            calendar_month
          </span>
        </div>

        <div>
          <h3>{{ weeklyReports }}</h3>
          <p>Weekly Reports</p>
        </div>

      </div>

      <div class="summary-card">

        <div class="summary-icon">
          <span class="material-symbols-outlined">
            pending_actions
          </span>
        </div>

        <div>
          <h3>{{ pendingTests }}</h3>
          <p>Pending Tests</p>
        </div>

      </div>

    </div>

    <!-- ===================================================== -->
    <!-- MAIN CONTENT -->
    <!-- ===================================================== -->

    <div class="content-grid">

      <!-- ================================================ -->
      <!-- LEFT COLUMN -->
      <!-- ================================================ -->

      <div class="left-column">

        <!-- ============================================ -->
        <!-- CHANNELS -->
        <!-- ============================================ -->

        <div class="card">

          <div class="section-header">

            <h2>
              Notification Channels
            </h2>

            <span>
              Enable or disable communication channels
            </span>

          </div>

          <div
              v-for="channel in channels"
              :key="channel.id"
              class="channel-row"
          >

            <div class="channel-left">

              <div class="channel-icon">

                <span class="material-symbols-outlined">
                  {{ channel.icon }}
                </span>

              </div>

              <div>

                <strong>
                  {{ channel.name }}
                </strong>

                <small>
                  {{ channel.description }}
                </small>

              </div>

            </div>

            <!-- SWITCH -->

            <label class="switch">

              <input
                  type="checkbox"
                  :checked="channel.enabled"
                  @change="toggleChannel(channel)"
              >

              <span class="slider"></span>

            </label>

          </div>

        </div>

        <!-- ============================================ -->
        <!-- ALERT RULES -->
        <!-- ============================================ -->

        <div class="card">

          <div class="section-header">

            <h2>
              Alert Type Preferences
            </h2>

            <span>
              Configure priority and delivery behavior
            </span>

          </div>

          <!-- Search -->

          <div class="search-box">

            <span class="material-symbols-outlined">
              search
            </span>

            <input
                v-model="search"
                placeholder="Search rules..."
            >

          </div>

          <!-- Filters -->

          <div class="priority-filters">

            <button
                v-for="priority in priorityOptions"
                :key="priority"
                class="filter-chip"
                :class="{
                active:
                selectedPriorityFilter === priority
              }"
                @click="
                selectedPriorityFilter = priority
              "
            >
              {{ priority }}
            </button>

          </div>

          <!-- Rules -->

          <div
              v-for="rule in filteredRules"
              :key="rule.id"
              class="rule-card"
              @click="selectRule(rule)"
          >

            <div class="rule-main">

              <div class="rule-icon">

                <span
                    class="material-symbols-outlined"
                >
                  {{ rule.icon }}
                </span>

              </div>

              <div class="rule-info">

                <strong>
                  {{ rule.title }}
                </strong>

                <p>
                  {{ rule.description }}
                </p>

                <div class="rule-channels">

                  <span
                      v-for="channel in rule.channels"
                      :key="channel"
                      class="material-symbols-outlined"
                  >
                    {{ channel }}
                  </span>

                </div>

              </div>

            </div>

            <div class="rule-right">

              <span
                  class="priority-badge"
                  :class="
                  getPriorityClass(
                    rule.priority
                  )
                "
              >
                {{ rule.priority }} Priority
              </span>

              <small>
                {{ rule.frequency }}
              </small>

            </div>

          </div>

        </div>

      </div>

      <!-- ================================================ -->
      <!-- RIGHT COLUMN -->
      <!-- ================================================ -->

      <div class="right-column">

        <!-- ============================================ -->
        <!-- RULE SUMMARY -->
        <!-- ============================================ -->

        <div class="card summary-sidebar">

          <h2>
            Rule Summary
          </h2>

          <div class="summary-item">

            <span>Critical</span>

            <strong>
              {{
                criticalRule?.frequency ||
                'Immediate'
              }}
            </strong>

          </div>

          <div class="summary-item">

            <span>Preventive</span>

            <strong>
              {{
                preventiveRule?.frequency ||
                'Daily Digest'
              }}
            </strong>

          </div>

          <div class="summary-item">

            <span>
              Active Channels
            </span>

            <strong>
              {{ activeChannelCount }}
            </strong>

          </div>

        </div>

        <!-- ============================================ -->
        <!-- ANALYTICS -->
        <!-- ============================================ -->

        <div class="card">

          <h2>
            Analytics
          </h2>

          <div class="analytics-item">

            <span>
              Total Triggers
            </span>

            <strong>
              {{ totalTriggers }}
            </strong>

          </div>

          <div class="analytics-item">

            <span>
              High Priority
            </span>

            <strong>
              {{ highPriorityRules }}
            </strong>

          </div>

          <div class="analytics-item">

            <span>
              Medium Priority
            </span>

            <strong>
              {{ mediumPriorityRules }}
            </strong>

          </div>

          <div class="analytics-item">

            <span>
              Low Priority
            </span>

            <strong>
              {{ lowPriorityRules }}
            </strong>

          </div>

        </div>

      </div>

    </div>

    <!-- ===================================================== -->
    <!-- FOOTER ACTIONS -->
    <!-- ===================================================== -->

    <div class="footer-actions">

      <div class="footer-left">

        <button
            class="text-button"
            @click="cancelChanges"
        >
          Cancel
        </button>

        <button
            class="text-button danger"
            @click="openResetModal"
        >
          Reset to Defaults
        </button>

      </div>

      <div class="footer-right">

        <button
            class="outlined-button"
            :disabled="isSendingTest"
            @click="sendTestNotification"
        >

          <span
              class="material-symbols-outlined"
          >
            notifications_active
          </span>

          {{
            isSendingTest
                ? 'Sending...'
                : 'Send Test Notification'
          }}

        </button>

        <button
            class="primary-button"
            :disabled="isSaving"
            @click="saveRules"
        >

          <span
              class="material-symbols-outlined"
          >
            save
          </span>

          {{
            isSaving
                ? 'Saving...'
                : 'Save Rules'
          }}

        </button>

      </div>

    </div>

    <!-- ===================================================== -->
    <!-- SAVE MODAL -->
    <!-- ===================================================== -->

    <div
        v-if="showSaveModal"
        class="modal-overlay"
    >

      <div class="modal-card">

        <span
            class="material-symbols-outlined modal-success"
        >
          check_circle
        </span>

        <h3>
          Rules Saved
        </h3>

        <p>
          Notification rules were updated
          successfully.
        </p>

        <button
            class="primary-button full-width"
            @click="closeSaveModal"
        >
          Close
        </button>

      </div>

    </div>

    <!-- ===================================================== -->
    <!-- TEST MODAL -->
    <!-- ===================================================== -->

    <div
        v-if="showTestModal"
        class="modal-overlay"
    >

      <div class="modal-card">

        <span
            class="material-symbols-outlined modal-info"
        >
          send
        </span>

        <h3>
          Test Notification Sent
        </h3>

        <p>
          Test notification was delivered through
          active channels.
        </p>

        <button
            class="primary-button full-width"
            @click="closeTestModal"
        >
          Close
        </button>

      </div>

    </div>

    <!-- ===================================================== -->
    <!-- RESET MODAL -->
    <!-- ===================================================== -->

    <div
        v-if="showResetModal"
        class="modal-overlay"
    >

      <div class="modal-card">

        <span
            class="material-symbols-outlined modal-warning"
        >
          restart_alt
        </span>

        <h3>
          Reset Configuration
        </h3>

        <p>
          This action will restore all notification
          rules to their default values.
        </p>

        <div class="modal-actions">

          <button
              class="outlined-button"
              @click="closeResetModal"
          >
            Cancel
          </button>

          <button
              class="primary-button"
              @click="resetDefaults"
          >
            Reset
          </button>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped>

/* ===================================================== */
/* PAGE */
/* ===================================================== */

.notifications-view {
  padding: 24px;
  background: #f5f7f4;
  min-height: 100vh;
}

/* ===================================================== */
/* HEADER */
/* ===================================================== */

.page-header {
  margin-bottom: 24px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 13px;
  font-weight: 600;

  color: #667085;
}

.page-header h1 {
  margin: 10px 0 8px;

  font-size: 40px;
  font-weight: 800;

  color: #101828;
}

.page-header p {
  margin: 0;

  color: #667085;

  font-size: 15px;
  line-height: 1.6;
}

/* ===================================================== */
/* SUCCESS BANNER */
/* ===================================================== */

.success-banner {
  background: #ecfdf3;
  border: 1px solid #abefc6;

  border-radius: 16px;

  padding: 16px 20px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 24px;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 12px;

  color: #067647;
  font-weight: 600;
}

.banner-close {
  border: none;
  background: transparent;

  cursor: pointer;

  color: #067647;
}

.banner-close:hover {
  opacity: 0.7;
}

/* ===================================================== */
/* SUMMARY CARDS */
/* ===================================================== */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  gap: 16px;

  margin-bottom: 24px;
}

.summary-card {
  background: white;

  border-radius: 20px;

  padding: 20px;

  display: flex;
  align-items: center;
  gap: 16px;

  border: 1px solid #eaecf0;

  transition: all .2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);

  box-shadow:
      0 4px 12px rgba(16,24,40,.08);
}

.summary-icon {
  width: 50px;
  height: 50px;

  border-radius: 14px;

  background: #edf5ef;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #456c4c;
}

.summary-icon .material-symbols-outlined {
  font-size: 24px;
}

.summary-card h3 {
  margin: 0;

  font-size: 28px;
  font-weight: 800;

  color: #101828;
}

.summary-card p {
  margin: 4px 0 0;

  color: #667085;

  font-size: 13px;
}

/* ===================================================== */
/* MAIN GRID */
/* ===================================================== */

.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;

  gap: 24px;
}

/* ===================================================== */
/* COLUMN */
/* ===================================================== */

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===================================================== */
/* CARD */
/* ===================================================== */

.card {
  background: white;

  border-radius: 24px;

  padding: 24px;

  border: 1px solid #eaecf0;

  box-shadow:
      0 1px 2px rgba(16,24,40,.04);
}

/* ===================================================== */
/* SECTION HEADER */
/* ===================================================== */

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 6px;

  font-size: 22px;
  font-weight: 700;

  color: #101828;
}

.section-header span {
  color: #667085;
  font-size: 14px;
}

/* ===================================================== */
/* CHANNELS */
/* ===================================================== */

.channel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 18px 0;

  border-top: 1px solid #f0f2f5;
}

.channel-row:first-of-type {
  border-top: none;
}

.channel-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.channel-icon {
  width: 50px;
  height: 50px;

  border-radius: 14px;

  background: #edf5ef;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #456c4c;
}

.channel-icon .material-symbols-outlined {
  font-size: 24px;
}

.channel-left strong {
  display: block;

  color: #101828;
}

.channel-left small {
  color: #667085;
}

/* ===================================================== */
/* SWITCH */
/* ===================================================== */

.switch {
  position: relative;
  width: 52px;
  height: 30px;
}

.switch input {
  display: none;
}

.slider {
  position: absolute;
  inset: 0;

  border-radius: 999px;

  background: #d0d5dd;

  cursor: pointer;

  transition: .25s;
}

.slider::before {
  content: '';

  position: absolute;

  width: 24px;
  height: 24px;

  left: 3px;
  top: 3px;

  border-radius: 50%;

  background: white;

  transition: .25s;

  box-shadow:
      0 2px 6px rgba(0,0,0,.15);
}

.switch input:checked + .slider {
  background: #456c4c;
}

.switch input:checked + .slider::before {
  transform: translateX(22px);
}

/* ===================================================== */
/* SEARCH */
/* ===================================================== */

.search-box {
  position: relative;

  margin-bottom: 18px;
}

.search-box input {
  width: 100%;

  height: 46px;

  border: 1px solid #d0d5dd;

  border-radius: 12px;

  padding-left: 42px;

  outline: none;

  transition: .2s;
}

.search-box input:focus {
  border-color: #456c4c;

  box-shadow:
      0 0 0 4px rgba(69,108,76,.12);
}

.search-box .material-symbols-outlined {
  position: absolute;

  left: 12px;
  top: 11px;

  color: #667085;
}

/* ===================================================== */
/* FILTERS */
/* ===================================================== */

.priority-filters {
  display: flex;
  gap: 8px;

  margin-bottom: 20px;

  flex-wrap: wrap;
}

.filter-chip {
  border: 1px solid #d0d5dd;

  background: white;

  border-radius: 999px;

  padding: 8px 14px;

  cursor: pointer;

  transition: .2s;
}

.filter-chip:hover {
  background: #f8fafc;
}

.filter-chip.active {
  background: #456c4c;
  color: white;
  border-color: #456c4c;
}

/* ===================================================== */
/* RULES */
/* ===================================================== */

.rule-card {
  border: 1px solid #eaecf0;

  border-radius: 18px;

  padding: 18px;

  display: flex;
  justify-content: space-between;
  gap: 18px;

  margin-bottom: 14px;

  cursor: pointer;

  transition: .2s;
}

.rule-card:hover {
  border-color: #456c4c;

  transform: translateY(-2px);
}

.rule-main {
  display: flex;
  gap: 16px;
}

.rule-icon {
  width: 48px;
  height: 48px;

  border-radius: 12px;

  background: #fff3f0;

  display: flex;
  align-items: center;
  justify-content: center;
}

.rule-icon .material-symbols-outlined {
  color: #dc2626;
}

.rule-info strong {
  color: #101828;
}

.rule-info p {
  margin: 8px 0;

  color: #667085;

  font-size: 14px;
}

.rule-channels {
  display: flex;
  gap: 8px;
}

.rule-channels .material-symbols-outlined {
  font-size: 18px;
  color: #456c4c;
}

.rule-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.rule-right small {
  color: #667085;
}

/* ===================================================== */
/* PRIORITY BADGES */
/* ===================================================== */

.priority-badge {
  padding: 6px 12px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 700;
}

.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.priority-medium {
  background: #ffedd5;
  color: #9a3412;
}

.priority-low {
  background: #f3f4f6;
  color: #374151;
}

/* ===================================================== */
/* SIDEBAR */
/* ===================================================== */

.summary-sidebar {
  position: sticky;
  top: 24px;
}

.summary-sidebar h2 {
  margin-top: 0;
}

.summary-item,
.analytics-item {
  display: flex;
  justify-content: space-between;

  padding: 14px 0;

  border-top: 1px solid #f0f2f5;
}

.summary-item:first-of-type,
.analytics-item:first-of-type {
  border-top: none;
}

.summary-item span,
.analytics-item span {
  color: #667085;
}

.summary-item strong,
.analytics-item strong {
  color: #101828;
}

/* ===================================================== */
/* FOOTER ACTIONS */
/* ===================================================== */

.footer-actions {
  margin-top: 28px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  flex-wrap: wrap;

  gap: 16px;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.text-button {
  border: none;
  background: transparent;

  cursor: pointer;

  color: #667085;

  font-weight: 600;
}

.text-button:hover {
  color: #101828;
}

.text-button.danger {
  color: #b42318;
}

.outlined-button {
  border: 1px solid #456c4c;

  background: white;

  color: #456c4c;

  height: 46px;

  padding: 0 18px;

  border-radius: 12px;

  display: flex;
  align-items: center;
  gap: 8px;

  cursor: pointer;

  transition: .2s;
}

.outlined-button:hover {
  background: #edf5ef;
}

.primary-button {
  border: none;

  background: #456c4c;

  color: white;

  height: 46px;

  padding: 0 18px;

  border-radius: 12px;

  display: flex;
  align-items: center;
  gap: 8px;

  cursor: pointer;

  transition: .2s;
}

.primary-button:hover {
  background: #36533b;
}

.primary-button:disabled,
.outlined-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* ===================================================== */
/* MODALS */
/* ===================================================== */

.modal-overlay {
  position: fixed;
  inset: 0;

  background: rgba(16,24,40,.55);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 1000;
}

.modal-card {
  width: 450px;
  max-width: 95%;

  background: white;

  border-radius: 24px;

  padding: 28px;

  text-align: center;
}

.modal-card h3 {
  margin: 16px 0 10px;

  color: #101828;
}

.modal-card p {
  color: #667085;
  line-height: 1.6;
}

.modal-success {
  color: #16a34a;
  font-size: 52px;
}

.modal-info {
  color: #2563eb;
  font-size: 52px;
}

.modal-warning {
  color: #ea580c;
  font-size: 52px;
}

.modal-actions {
  margin-top: 20px;

  display: flex;
  justify-content: center;
  gap: 12px;
}

.full-width {
  width: 100%;
  justify-content: center;
}

/* ===================================================== */
/* RESPONSIVE */
/* ===================================================== */

@media (max-width: 1200px) {

  .content-grid {
    grid-template-columns: 1fr;
  }

  .summary-sidebar {
    position: static;
  }

}

@media (max-width: 900px) {

  .summary-grid {
    grid-template-columns: repeat(2,1fr);
  }

}

@media (max-width: 768px) {

  .page-header h1 {
    font-size: 30px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .footer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-left,
  .footer-right {
    width: 100%;
  }

  .outlined-button,
  .primary-button {
    width: 100%;
    justify-content: center;
  }

  .rule-card {
    flex-direction: column;
  }

  .rule-right {
    align-items: flex-start;
  }

}

</style>