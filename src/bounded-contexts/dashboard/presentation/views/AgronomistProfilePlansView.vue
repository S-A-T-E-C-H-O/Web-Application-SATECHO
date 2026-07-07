<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import { useBillingStore } from '@/bounded-contexts/billing/application/stores/billing.store'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

const authStore = useAuthStore()
const billingStore = useBillingStore()

const activeTab = ref('profile')

const profile = ref({
  fullName: '',
  email: '',
  registrationNumber: '',
  specialty: '',
  yearsOfExperience: '',
})

const isSavingProfile = ref(false)
const profileFeedback = ref('')

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isChangingPassword = ref(false)
const passwordFeedback = ref('')
const passwordError = ref('')

const isChangingPlan = ref(false)
const planFeedback = ref('')
const planError = ref('')

const isCancelling = ref(false)

const notifications = ref({
  criticalHumidity: { push: true, email: true, whatsapp: false },
  humidity: { push: true, email: true, whatsapp: false },
  movement: { push: true, email: true, whatsapp: true },
  offline: { push: true, email: true, whatsapp: false },
  battery: { push: false, email: true, whatsapp: false },
})
const isSavingNotif = ref(false)
const notifFeedback = ref('')

const memberSince = computed(() => {
  const accounts = JSON.parse(localStorage.getItem('satecho.auth.accounts') || '[]')
  const acct = accounts.find((item) => item.id === authStore.user?.id)
  if (!acct?.createdAt) return 'Unknown'
  return new Date(acct.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

function normalizePlanTier(tier) {
  const value = String(tier || 'BASIC').toUpperCase()
  if (value === 'FREE' || value === 'STARTER') return 'BASIC'
  return value
}

function planDisplayName(tier) {
  const labels = { BASIC: 'Basic', PRO: 'Pro', ENTERPRISE: 'Enterprise' }
  const normalized = normalizePlanTier(tier)
  return labels[normalized] || normalized
}

const planLabel = computed(() => {
  return planDisplayName(billingStore.currentTier)
})

const planStatus = computed(() => {
  const status = billingStore.subscription?.status || 'active'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
})

const renewalDate = computed(() => {
  const date = billingStore.subscription?.nextBillingDate || billingStore.subscription?.endDate
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const planFeatures = computed(() => {
  if (!billingStore.currentPlan) return []
  return billingStore.currentPlan.features || []
})

const planLimits = computed(() => {
  if (!billingStore.currentPlan) return { maxFarms: '—', maxDevices: '—' }
  return {
    maxFarms: billingStore.currentPlan.maxFarms || '—',
    maxDevices: billingStore.currentPlan.maxDevices || '—',
  }
})

function planPrice(plan) {
  const price = plan.price || plan.pricePerHaPerMonth || 0
  if (price === 0) return 'Included'
  return `$${price.toFixed(2)}/mo`
}

onMounted(async () => {
  billingStore.load()
  try {
    const resp = await apiRequest({ method: 'GET', url: '/api/v1/me' })
    if (resp?.data) {
      profile.value = {
        fullName: resp.data.fullName || '',
        email: resp.data.email || '',
        registrationNumber: resp.data.registrationNumber || '',
        specialty: resp.data.specialty || '',
        yearsOfExperience: resp.data.yearsOfExperience || '',
      }
    }

    try {
      const notifResp = await apiRequest({ method: 'GET', url: '/api/v1/notifications/preferences' })
      const prefs = Array.isArray(notifResp?.data) ? notifResp.data : []
      const typeMap = {
        CRITICAL_HUMIDITY: 'criticalHumidity',
        HUMIDITY: 'humidity',
        SECURITY_EVENT: 'movement',
        OFFLINE_DEVICE: 'offline',
        LOW_BATTERY: 'battery',
      }
      prefs.forEach((p) => {
        const key = typeMap[p.notificationType]
        if (key && p.channelsEnabled) {
          notifications.value[key] = {
            push: p.channelsEnabled.includes('PUSH'),
            email: p.channelsEnabled.includes('EMAIL'),
            whatsapp: p.channelsEnabled.includes('WHATSAPP'),
          }
        }
      })
    } catch {
      // keep defaults
    }
  } catch {
    // keep defaults
  }
})

async function saveProfile() {
  isSavingProfile.value = true
  profileFeedback.value = ''
  try {
    await apiRequest({
      method: 'PATCH',
      url: '/api/v1/me',
      data: { fullName: profile.value.fullName },
    })
    profileFeedback.value = 'Profile updated successfully.'
  } catch (e) {
    profileFeedback.value = e.message || 'Could not update profile.'
  } finally {
    isSavingProfile.value = false
  }
}

async function changePassword() {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value
  passwordError.value = ''
  passwordFeedback.value = ''
  if (!currentPassword) { passwordError.value = 'Current password is required.'; return }
  if (newPassword.length < 8) { passwordError.value = 'Password must be at least 8 characters.'; return }
  if (newPassword !== confirmPassword) { passwordError.value = 'Passwords do not match.'; return }
  isChangingPassword.value = true
  try {
    await apiRequest({
      method: 'POST',
      url: '/api/v1/me/change-password',
      data: { currentPassword, newPassword },
    })
    passwordFeedback.value = 'Password changed successfully.'
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    passwordError.value = e.message || 'Could not change password.'
  } finally {
    isChangingPassword.value = false
  }
}

async function changePlan(plan) {
  const tier = plan.tier || plan.name || ''
  if (normalizePlanTier(billingStore.currentTier) === normalizePlanTier(tier)) {
    planFeedback.value = 'You are already on this plan.'
    return
  }
  isChangingPlan.value = true
  planError.value = ''
  planFeedback.value = ''
  try {
    await billingStore.subscribe(tier)
    planFeedback.value = `Switched to ${planDisplayName(tier)} plan.`
  } catch (e) {
    planError.value = e.message || 'Could not change plan.'
  } finally {
    isChangingPlan.value = false
  }
}

async function cancelPlan() {
  isCancelling.value = true
  planError.value = ''
  try {
    await billingStore.cancel()
    planFeedback.value = 'Subscription cancelled. Active until end of billing period.'
  } catch (e) {
    planError.value = e.message || 'Could not cancel subscription.'
  } finally {
    isCancelling.value = false
  }
}

async function saveNotifications() {
  isSavingNotif.value = true
  notifFeedback.value = ''
  const typeMap = {
    criticalHumidity: 'CRITICAL_HUMIDITY',
    humidity: 'HUMIDITY',
    movement: 'SECURITY_EVENT',
    offline: 'OFFLINE_DEVICE',
    battery: 'LOW_BATTERY',
  }
  try {
    const promises = Object.entries(typeMap).map(([key, type]) => {
      const channels = []
      if (notifications.value[key].push) channels.push('PUSH')
      if (notifications.value[key].email) channels.push('EMAIL')
      if (notifications.value[key].whatsapp) channels.push('WHATSAPP')
      return apiRequest({
        method: 'PUT',
        url: '/api/v1/notifications/preferences',
        data: {
          notificationType: type,
          channelsEnabled: channels,
          dailyDigestEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
        },
      })
    })
    await Promise.all(promises)
    notifFeedback.value = 'Notification preferences saved.'
  } catch (e) {
    notifFeedback.value = e.message || 'Could not save preferences.'
  } finally {
    isSavingNotif.value = false
  }
}

const tabs = [
  { key: 'profile', label: 'Profile', icon: 'person' },
  { key: 'password', label: 'Security', icon: 'lock' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'billing', label: 'Subscription', icon: 'workspace_premium' },
]
</script>

<template>
  <div class="profile-plans-view">
    <div class="header-section">
      <h1>Profile & Plans</h1>
      <p>Manage your personal information, security settings, and subscription.</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.key"
        class="tab-btn" :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key">
        <span class="material-symbols-outlined">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Profile Tab -->
    <section v-if="activeTab === 'profile'" class="tab-content">
      <div class="profile-layout">
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-large">
              <span>{{ (profile.fullName || 'A').charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <h2>{{ profile.fullName || 'Agronomist' }}</h2>
              <p>{{ profile.email }}</p>
              <span class="role-tag">Agronomist · Member since {{ memberSince }}</span>
            </div>
          </div>

          <div class="profile-form">
            <p v-if="profileFeedback" class="feedback" :class="{ error: profileFeedback.includes('not') }">{{ profileFeedback }}</p>

            <label>
              <span>Full Name</span>
              <input v-model="profile.fullName" type="text" placeholder="Your full name">
            </label>
            <label>
              <span>Email</span>
              <input v-model="profile.email" type="email" disabled>
            </label>
            <label>
              <span>Registration Number</span>
              <input v-model="profile.registrationNumber" type="text" placeholder="Professional registration number" disabled>
            </label>
            <label>
              <span>Specialty</span>
              <input v-model="profile.specialty" type="text" placeholder="e.g. Soil Science, Crop Protection" disabled>
            </label>
            <label>
              <span>Years of Experience</span>
              <input v-model="profile.yearsOfExperience" type="text" placeholder="Years" disabled>
            </label>
            <button class="save-btn" :disabled="isSavingProfile" @click="saveProfile">
              {{ isSavingProfile ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Password Tab -->
    <section v-if="activeTab === 'password'" class="tab-content">
      <div class="profile-card">
        <h2>Change Password</h2>
        <p class="section-desc">Update your account password. Use a strong password with at least 8 characters.</p>
        <p v-if="passwordFeedback" class="feedback">{{ passwordFeedback }}</p>
        <p v-if="passwordError" class="feedback error">{{ passwordError }}</p>
        <div class="profile-form">
          <label>
            <span>Current Password</span>
            <input v-model="passwordForm.currentPassword" type="password" placeholder="Enter current password">
          </label>
          <label>
            <span>New Password</span>
            <input v-model="passwordForm.newPassword" type="password" placeholder="At least 8 characters">
          </label>
          <label>
            <span>Confirm New Password</span>
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="Repeat new password">
          </label>
          <button class="save-btn" :disabled="isChangingPassword" @click="changePassword">
            {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Notifications Tab -->
    <section v-if="activeTab === 'notifications'" class="tab-content">
      <div class="profile-card">
        <h2>Notification Preferences</h2>
        <p class="section-desc">Choose which channels to use for each alert type.</p>
        <p v-if="notifFeedback" class="feedback" :class="{ error: notifFeedback.includes('not') }">{{ notifFeedback }}</p>

        <div class="notif-table">
          <div class="notif-row header">
            <strong>Alert Type</strong>
            <span>Push</span>
            <span>Email</span>
            <span>WhatsApp</span>
          </div>
          <div class="notif-group-label">Irrigation & Soil</div>
          <div class="notif-row">
            <strong><span class="material-symbols-outlined">water_drop</span> Critical Humidity</strong>
            <button class="check-dot" :class="{ on: notifications.criticalHumidity.push }" @click="notifications.criticalHumidity.push = !notifications.criticalHumidity.push"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.criticalHumidity.email }" @click="notifications.criticalHumidity.email = !notifications.criticalHumidity.email"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.criticalHumidity.whatsapp }" @click="notifications.criticalHumidity.whatsapp = !notifications.criticalHumidity.whatsapp"><span class="material-symbols-outlined">check</span></button>
          </div>
          <div class="notif-row">
            <strong><span class="material-symbols-outlined">humidity_low</span> Humidity Alert</strong>
            <button class="check-dot" :class="{ on: notifications.humidity.push }" @click="notifications.humidity.push = !notifications.humidity.push"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.humidity.email }" @click="notifications.humidity.email = !notifications.humidity.email"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.humidity.whatsapp }" @click="notifications.humidity.whatsapp = !notifications.humidity.whatsapp"><span class="material-symbols-outlined">check</span></button>
          </div>
          <div class="notif-group-label">Security</div>
          <div class="notif-row">
            <strong><span class="material-symbols-outlined">motion_sensor_active</span> Motion Detection</strong>
            <button class="check-dot" :class="{ on: notifications.movement.push }" @click="notifications.movement.push = !notifications.movement.push"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.movement.email }" @click="notifications.movement.email = !notifications.movement.email"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.movement.whatsapp }" @click="notifications.movement.whatsapp = !notifications.movement.whatsapp"><span class="material-symbols-outlined">check</span></button>
          </div>
          <div class="notif-group-label">Devices</div>
          <div class="notif-row">
            <strong><span class="material-symbols-outlined">wifi_off</span> Offline Device</strong>
            <button class="check-dot" :class="{ on: notifications.offline.push }" @click="notifications.offline.push = !notifications.offline.push"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.offline.email }" @click="notifications.offline.email = !notifications.offline.email"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.offline.whatsapp }" @click="notifications.offline.whatsapp = !notifications.offline.whatsapp"><span class="material-symbols-outlined">check</span></button>
          </div>
          <div class="notif-row">
            <strong><span class="material-symbols-outlined">battery_alert</span> Low Battery</strong>
            <button class="check-dot" :class="{ on: notifications.battery.push }" @click="notifications.battery.push = !notifications.battery.push"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.battery.email }" @click="notifications.battery.email = !notifications.battery.email"><span class="material-symbols-outlined">check</span></button>
            <button class="check-dot" :class="{ on: notifications.battery.whatsapp }" @click="notifications.battery.whatsapp = !notifications.battery.whatsapp"><span class="material-symbols-outlined">check</span></button>
          </div>
        </div>
        <button class="save-btn" style="margin-top: 20px;" :disabled="isSavingNotif" @click="saveNotifications">
          {{ isSavingNotif ? 'Saving...' : 'Save Preferences' }}
        </button>
      </div>
    </section>

    <!-- Billing Tab -->
    <section v-if="activeTab === 'billing'" class="tab-content">
      <p v-if="planFeedback" class="feedback">{{ planFeedback }}</p>
      <p v-if="planError" class="feedback error">{{ planError }}</p>

      <!-- Current Plan Card -->
      <div class="billing-card">
        <div class="billing-header">
          <div>
            <h2>Current Plan</h2>
            <p>Your active subscription and usage limits.</p>
          </div>
          <span class="plan-badge" :class="planLabel.toLowerCase()">{{ planLabel }}</span>
        </div>
        <div class="billing-details">
          <div class="detail-row">
            <span>Status</span>
            <strong class="active-status">{{ planStatus }}</strong>
          </div>
          <div class="detail-row">
            <span>Next Renewal</span>
            <strong>{{ renewalDate }}</strong>
          </div>
          <div class="detail-row">
            <span>Max Farms</span>
            <strong>{{ planLimits.maxFarms }}</strong>
          </div>
          <div class="detail-row">
            <span>Max Devices</span>
            <strong>{{ planLimits.maxDevices }}</strong>
          </div>
        </div>
        <div v-if="planFeatures.length" class="feature-list">
          <h3>Features</h3>
          <ul>
            <li v-for="(feature, i) in planFeatures" :key="i">
              <span class="material-symbols-outlined">check_circle</span> {{ feature }}
            </li>
          </ul>
        </div>
        <div class="billing-actions">
          <button v-if="planLabel !== 'Basic'" class="cancel-btn" :disabled="isCancelling" @click="cancelPlan">
            {{ isCancelling ? 'Cancelling...' : 'Cancel Subscription' }}
          </button>
        </div>
      </div>

      <!-- Available Plans -->
      <div class="billing-card">
        <h2>Available Plans</h2>
        <p class="section-desc">Compare and switch between plans.</p>
        <div class="plans-grid">
          <div v-for="plan in billingStore.plans" :key="plan.id || plan.name" class="plan-card"
            :class="{ current: normalizePlanTier(plan.tier || plan.name) === normalizePlanTier(billingStore.currentTier) }">
            <div class="plan-name">{{ planDisplayName(plan.tier || plan.name) }}</div>
            <div class="plan-price">{{ planPrice(plan) }}</div>
            <ul class="plan-features">
              <li v-for="(feature, i) in (plan.features || [])" :key="i">{{ feature }}</li>
              <li>{{ plan.maxFarms }} farms</li>
              <li>{{ plan.maxDevices }} devices</li>
            </ul>
            <button class="plan-btn"
              :class="{ current: normalizePlanTier(plan.tier || plan.name) === normalizePlanTier(billingStore.currentTier) }"
              :disabled="isChangingPlan || normalizePlanTier(plan.tier || plan.name) === normalizePlanTier(billingStore.currentTier)"
              @click="changePlan(plan)">
              {{ normalizePlanTier(plan.tier || plan.name) === normalizePlanTier(billingStore.currentTier) ? 'Current Plan' : 'Switch to ' + planDisplayName(plan.tier || plan.name) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice History -->
      <div class="billing-card">
        <h2>Invoice History</h2>
        <p class="section-desc">Billing records for your account.</p>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="billingStore.invoices.length === 0">
                <td colspan="4" class="empty-cell">No invoices yet.</td>
              </tr>
              <tr v-for="inv in billingStore.invoices" :key="inv.id">
                <td>{{ inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—' }}</td>
                <td>{{ inv.description || `${planLabel} Plan` }}</td>
                <td>${{ (inv.amount || 0).toFixed(2) }} {{ inv.currency || 'USD' }}</td>
                <td>
                  <span class="status-chip" :class="(inv.status || '').toLowerCase()">
                    {{ inv.status || 'pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-plans-view {
  max-width: 900px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h1 {
  font-size: 28px;
  color: #111;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.header-section p {
  color: #666;
  font-size: 15px;
  margin: 0;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  background: white;
  border-radius: 12px;
  padding: 6px;
  border: 1px solid #eaeaea;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn .material-symbols-outlined {
  font-size: 18px;
}

.tab-btn.active {
  background: #7A9A7A;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f5f5f5;
  color: #333;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  margin-bottom: 24px;
}

.profile-card h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #111;
}

.section-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eaeaea;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #7A9A7A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  font-weight: 700;
}

.profile-header h2 {
  margin: 0 0 4px 0;
}

.profile-header p {
  color: #666;
  font-size: 14px;
  margin: 0 0 6px 0;
}

.role-tag {
  display: inline-block;
  background: #edf2ed;
  color: #456c4c;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Profile Form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-form label span {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.profile-form input {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  transition: border-color 0.2s;
}

.profile-form input:focus {
  outline: none;
  border-color: #7A9A7A;
}

.profile-form input:disabled {
  background: #f9f9f9;
  color: #888;
  cursor: not-allowed;
}

.save-btn {
  align-self: flex-start;
  padding: 10px 24px;
  background: #7A9A7A;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #688568;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.feedback {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin: 0;
  background: #edf2ed;
  color: #456c4c;
}

.feedback.error {
  background: #fff5f5;
  color: #c62828;
}

/* Notifications Table */
.notif-table {
  display: flex;
  flex-direction: column;
}

.notif-row {
  display: grid;
  grid-template-columns: 1fr 60px 60px 80px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}

.notif-row.header {
  font-size: 12px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
}

.notif-row strong {
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-row strong .material-symbols-outlined {
  font-size: 18px;
  color: #7A9A7A;
}

.notif-group-label {
  padding: 20px 0 8px 0;
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.check-dot {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s;
  justify-self: center;
}

.check-dot .material-symbols-outlined {
  font-size: 18px;
  color: transparent;
  transition: color 0.2s;
}

.check-dot.on {
  background: #7A9A7A;
  border-color: #7A9A7A;
}

.check-dot.on .material-symbols-outlined {
  color: white;
}

/* Billing */
.billing-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  margin-bottom: 24px;
}

.billing-card h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #111;
}

.billing-card h3 {
  font-size: 16px;
  color: #333;
  margin: 20px 0 12px;
}

.billing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.billing-header p {
  color: #666;
  font-size: 14px;
  margin: 4px 0 0 0;
}

.plan-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.plan-badge.free { background: #f5f5f5; color: #555; }
.plan-badge.basic { background: #edf2ed; color: #456c4c; }
.plan-badge.pro, .plan-badge.professional { background: #e8f0e8; color: #2d6a2d; }
.plan-badge.enterprise { background: #e0e7f0; color: #2d4a6a; }

.billing-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.detail-row span {
  font-size: 13px;
  color: #888;
}

.detail-row strong {
  font-size: 13px;
  color: #333;
}

.active-status {
  color: #16a34a !important;
}

.feature-list ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #444;
}

.feature-list li .material-symbols-outlined {
  font-size: 18px;
  color: #7A9A7A;
}

.billing-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eaeaea;
}

.cancel-btn {
  padding: 8px 20px;
  background: white;
  border: 1px solid #c62828;
  color: #c62828;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #fff5f5;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.plan-card {
  background: #fafafa;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: border-color 0.2s;
}

.plan-card.current {
  border-color: #7A9A7A;
  border-width: 2px;
  background: #f8faf8;
}

.plan-name {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.plan-price {
  font-size: 28px;
  font-weight: 800;
  color: #111;
}

.plan-features {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.plan-features li {
  font-size: 13px;
  color: #666;
}

.plan-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #7A9A7A;
  color: white;
  transition: background 0.2s;
}

.plan-btn.current {
  background: #eaeaea;
  color: #888;
  cursor: default;
}

.plan-btn:hover:not(:disabled):not(.current) {
  background: #688568;
}

.plan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  color: #666;
  font-weight: 600;
  border-bottom: 2px solid #eaeaea;
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
}

.empty-cell {
  text-align: center;
  color: #888;
  padding: 40px 16px !important;
}

.status-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-chip.paid, .status-chip.completed { background: #dcfce7; color: #16a34a; }
.status-chip.pending { background: #fef9e7; color: #b45309; }
.status-chip.overdue, .status-chip.failed { background: #ffebee; color: #c62828; }
.status-chip.cancelled { background: #f5f5f5; color: #888; }
</style>
