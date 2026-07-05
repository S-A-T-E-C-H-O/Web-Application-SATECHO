<script setup>
import { onMounted, ref } from 'vue'
import { operationsApi } from '@/bounded-contexts/dashboard/infrastructure/operations.api'

const notificationTypes = [
  { value: 'SECURITY_ALERT', label: 'Security alerts' },
  { value: 'IRRIGATION_ALERT', label: 'Irrigation alerts' },
  { value: 'EC_ALERT', label: 'EC alerts' },
  { value: 'TEMPERATURE_ALERT', label: 'Temperature alerts' },
  { value: 'LOW_BATTERY', label: 'Low battery' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'DAILY_SUMMARY', label: 'Daily summary' },
]

const channels = ['PUSH', 'WHATSAPP', 'SMS', 'EMAIL']

const preferences = ref({})
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref('')
const feedback = ref('')

const emptyPreference = (type) => ({
  notificationType: type,
  channelsEnabled: [],
  dailyDigestEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
})

const load = async () => {
  isLoading.value = true
  try {
    const rows = await operationsApi.getNotificationPreferences()
    const byType = new Map(rows.map((r) => [r.notificationType, r]))
    const merged = {}
    for (const type of notificationTypes) {
      merged[type.value] = byType.get(type.value) || emptyPreference(type.value)
    }
    preferences.value = merged
  } catch (e) {
    error.value = e.message || 'Could not load notification preferences.'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const isChannelEnabled = (type, channel) =>
  (preferences.value[type]?.channelsEnabled || []).includes(channel)

const toggleChannel = async (type, channel) => {
  const pref = preferences.value[type]
  const enabled = new Set(pref.channelsEnabled || [])
  if (enabled.has(channel)) enabled.delete(channel)
  else enabled.add(channel)
  pref.channelsEnabled = [...enabled]

  isSaving.value = true
  error.value = ''
  try {
    await operationsApi.saveNotificationPreferences({
      notificationType: type,
      channelsEnabled: pref.channelsEnabled,
      dailyDigestEnabled: pref.dailyDigestEnabled,
      quietHoursStart: pref.quietHoursStart,
      quietHoursEnd: pref.quietHoursEnd,
    })
    feedback.value = 'Preferences saved.'
  } catch (e) {
    error.value = e.message || 'Could not save preference.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="notifications-page">
    <div class="page-heading">
      <h1>Notification Rules</h1>
      <p>Choose which channels you receive each type of alert on.</p>
    </div>

    <p v-if="feedback" class="feedback-text">{{ feedback }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="isLoading" class="loading">Loading…</div>
    <table v-else class="prefs-table">
      <thead>
        <tr>
          <th>Alert type</th>
          <th v-for="channel in channels" :key="channel">{{ channel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="type in notificationTypes" :key="type.value">
          <td>{{ type.label }}</td>
          <td v-for="channel in channels" :key="channel">
            <button
              class="check-dot"
              :class="{ on: isChannelEnabled(type.value, channel) }"
              :disabled="isSaving"
              @click="toggleChannel(type.value, channel)"
            ></button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.notifications-page {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f7f8f5;
  min-height: 100vh;
}

.page-heading h1 { margin: 0 0 6px; font-size: 32px; color: #1f2937; }
.page-heading p { margin: 0; color: #7a7a7a; }

.feedback-text { color: #456c4c; font-weight: 600; }
.error-text { color: #c62828; font-weight: 600; }
.loading { color: #888; }

.prefs-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #ececec;
}

.prefs-table th {
  text-align: left;
  padding: 16px 20px;
  background: #fafafa;
  color: #777;
  font-size: 13px;
  font-weight: 600;
}

.prefs-table td {
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}

.check-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: white;
  cursor: pointer;
}

.check-dot.on {
  background: #456c4c;
  border-color: #456c4c;
}

.check-dot:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
