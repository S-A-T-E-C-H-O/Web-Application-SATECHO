<script setup>
import { computed, onMounted, ref } from 'vue'
import { useBillingStore } from '@/bounded-contexts/billing/application/stores/billing.store'

const billingStore = useBillingStore()

const activeTab = ref('subscription')
const feedback = ref('')
const error = ref('')
const isChangingPlan = ref(false)
const isCancelling = ref(false)

const planLabel = computed(() => {
  const tier = billingStore.currentTier
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
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
  if (price === 0) return 'Free'
  return `$${price.toFixed(2)}/mo`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(amount, currency) {
  return `$${(amount || 0).toFixed(2)} ${currency || 'USD'}`
}

onMounted(() => {
  billingStore.load()
})

async function changePlan(plan) {
  const tier = plan.tier || plan.name || ''
  if (billingStore.currentTier.toUpperCase() === tier.toUpperCase()) {
    feedback.value = 'You are already on this plan.'
    return
  }
  const confirmed = window.confirm(`Switch to the ${tier} plan?`)
  if (!confirmed) return
  isChangingPlan.value = true
  error.value = ''
  feedback.value = ''
  try {
    await billingStore.subscribe(tier)
    feedback.value = `Plan changed to ${tier} successfully.`
  } catch (e) {
    error.value = e.message || 'Could not change plan — it may exceed your current usage.'
  } finally {
    isChangingPlan.value = false
  }
}

async function cancelSubscription() {
  const confirmed = window.confirm('Cancel your subscription? It stays active until the end of the current billing period.')
  if (!confirmed) return
  isCancelling.value = true
  error.value = ''
  try {
    await billingStore.cancel()
    feedback.value = 'Subscription cancelled. Active until end of billing period.'
  } catch (e) {
    error.value = e.message || 'Could not cancel subscription.'
  } finally {
    isCancelling.value = false
  }
}

const tabs = [
  { key: 'subscription', label: 'My Plan', icon: 'workspace_premium' },
  { key: 'plans', label: 'Plans', icon: 'view_list' },
  { key: 'invoices', label: 'Invoices', icon: 'receipt_long' },
  { key: 'payments', label: 'Payments', icon: 'payments' },
]
</script>

<template>
  <div class="billing-view">
    <div class="header-section">
      <h1>Billing & Subscription</h1>
      <p>Manage your plan, view invoices, and track payments.</p>
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

    <p v-if="feedback" class="feedback-msg">{{ feedback }}</p>
    <p v-if="error" class="feedback-msg error">{{ error }}</p>

    <!-- My Plan Tab -->
    <div v-if="activeTab === 'subscription'" class="tab-content">
      <div class="content-card">
        <div class="plan-header">
          <div>
            <h2>Current Plan</h2>
            <p>Your active subscription details and usage limits.</p>
          </div>
          <span class="plan-badge" :class="planLabel.toLowerCase()">{{ planLabel }}</span>
        </div>

        <div class="kpi-grid three">
          <div class="kpi-card">
            <small>STATUS</small>
            <strong class="active-text">{{ planStatus }}</strong>
          </div>
          <div class="kpi-card">
            <small>NEXT RENEWAL</small>
            <strong>{{ renewalDate }}</strong>
          </div>
          <div class="kpi-card">
            <small>BILLING CYCLE</small>
            <strong>{{ billingStore.subscription?.billingCycle || 'Monthly' }}</strong>
          </div>
        </div>

        <div class="limits-grid">
          <div class="limit-item">
            <div class="limit-top">
              <span class="material-symbols-outlined">agriculture</span>
              <span>Farms</span>
            </div>
            <strong>{{ planLimits.maxFarms }}</strong>
          </div>
          <div class="limit-item">
            <div class="limit-top">
              <span class="material-symbols-outlined">sensors</span>
              <span>Devices</span>
            </div>
            <strong>{{ planLimits.maxDevices }}</strong>
          </div>
        </div>

        <div v-if="planFeatures.length" class="feature-section">
          <h3>Included Features</h3>
          <ul>
            <li v-for="(feature, i) in planFeatures" :key="i">
              <span class="material-symbols-outlined">check</span> {{ feature }}
            </li>
          </ul>
        </div>

        <div v-if="planLabel !== 'Free'" class="action-row">
          <button class="danger-btn" :disabled="isCancelling" @click="cancelSubscription">
            {{ isCancelling ? 'Cancelling...' : 'Cancel Subscription' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Plans Tab -->
    <div v-if="activeTab === 'plans'" class="tab-content">
      <div class="plans-grid-wide">
        <div v-for="plan in billingStore.plans" :key="plan.id || plan.name" class="plan-card"
          :class="{ active: (plan.tier || plan.name || '').toUpperCase() === planLabel.toUpperCase() }">
          <div class="plan-top">
            <div class="plan-tier">{{ plan.name || plan.tier }}</div>
            <div class="plan-cost">{{ planPrice(plan) }}</div>
            <p class="plan-desc">{{ plan.description || '' }}</p>
          </div>
          <ul class="plan-items">
            <li v-for="(feature, i) in (plan.features || [])" :key="i">
              <span class="material-symbols-outlined">check_circle</span> {{ feature }}
            </li>
            <li><span class="material-symbols-outlined">check_circle</span> Up to {{ plan.maxFarms }} farms</li>
            <li><span class="material-symbols-outlined">check_circle</span> Up to {{ plan.maxDevices }} devices</li>
          </ul>
          <button class="plan-cta"
            :class="{ 'current-plan': (plan.tier || plan.name || '').toUpperCase() === planLabel.toUpperCase() }"
            :disabled="isChangingPlan || (plan.tier || plan.name || '').toUpperCase() === planLabel.toUpperCase()"
            @click="changePlan(plan)">
            {{ (plan.tier || plan.name || '').toUpperCase() === planLabel.toUpperCase() ? 'Current' : `Switch to ${plan.name || plan.tier}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Invoices Tab -->
    <div v-if="activeTab === 'invoices'" class="tab-content">
      <div class="content-card">
        <h2>Invoice History</h2>
        <p class="section-subtitle">All billing invoices for your account.</p>
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
                <td>{{ formatDate(inv.issuedAt || inv.billingPeriodStart) }}</td>
                <td>{{ inv.description || `${planLabel} Plan — Monthly` }}</td>
                <td>{{ formatCurrency(inv.amount, inv.currency) }}</td>
                <td>
                  <span class="invoice-status" :class="(inv.status || '').toLowerCase()">
                    {{ inv.status || 'pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Payments Tab -->
    <div v-if="activeTab === 'payments'" class="tab-content">
      <div class="content-card">
        <h2>Payment History</h2>
        <p class="section-subtitle">Record of all payments made.</p>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="billingStore.payments.length === 0">
                <td colspan="5" class="empty-cell">No payments yet.</td>
              </tr>
              <tr v-for="pmt in billingStore.payments" :key="pmt.id">
                <td>{{ formatDate(pmt.processedAt || pmt.createdAt) }}</td>
                <td>{{ pmt.paymentMethod || '—' }}</td>
                <td>{{ formatCurrency(pmt.amount, pmt.currency) }}</td>
                <td class="tx-id">{{ pmt.transactionId || '—' }}</td>
                <td>
                  <span class="invoice-status" :class="(pmt.status || '').toLowerCase()">
                    {{ pmt.status || 'completed' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.billing-view {
  max-width: 1000px;
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

.tab-btn .material-symbols-outlined { font-size: 18px; }

.tab-btn.active {
  background: #7A9A7A;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f5f5f5;
  color: #333;
}

.feedback-msg {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin: 0 0 24px 0;
  background: #edf2ed;
  color: #456c4c;
}

.feedback-msg.error {
  background: #fff5f5;
  color: #c62828;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.content-card h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #111;
}

.section-subtitle {
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
}

/* Plan Header */
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eaeaea;
}

.plan-header h2 { margin: 0 0 4px 0; }
.plan-header p { color: #666; font-size: 14px; margin: 0; }

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

/* KPI Grid */
.kpi-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-grid.three { grid-template-columns: repeat(3, 1fr); }

.kpi-card {
  background: #fafafa;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.kpi-card small {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.kpi-card strong {
  font-size: 20px;
  color: #111;
}

.active-text { color: #16a34a !important; }

/* Limits */
.limits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.limit-item {
  background: #fafafa;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f0f0f0;
}

.limit-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.limit-top .material-symbols-outlined {
  color: #7A9A7A;
  font-size: 20px;
}

.limit-item strong {
  font-size: 22px;
  color: #111;
}

/* Features */
.feature-section {
  margin-bottom: 24px;
}

.feature-section h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px;
}

.feature-section ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-section li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #444;
}

.feature-section li .material-symbols-outlined {
  font-size: 18px;
  color: #7A9A7A;
}

.action-row {
  padding-top: 24px;
  border-top: 1px solid #eaeaea;
}

.danger-btn {
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

.danger-btn:hover:not(:disabled) {
  background: #fff5f5;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Plans Grid Wide */
.plans-grid-wide {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.plan-card {
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.plan-card.active {
  border-color: #7A9A7A;
  border-width: 2px;
  box-shadow: 0 0 0 4px rgba(122, 154, 122, 0.1);
}

.plan-tier {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.plan-cost {
  font-size: 32px;
  font-weight: 800;
  color: #111;
  margin-top: 4px;
}

.plan-desc {
  font-size: 13px;
  color: #888;
  margin: 8px 0 0 0;
}

.plan-items {
  list-style: none;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-items li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.plan-items li .material-symbols-outlined {
  font-size: 18px;
  color: #7A9A7A;
}

.plan-cta {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #7A9A7A;
  color: white;
  transition: background 0.2s;
}

.plan-cta.current-plan {
  background: #eaeaea;
  color: #888;
  cursor: default;
}

.plan-cta:hover:not(:disabled):not(.current-plan) {
  background: #688568;
}

.plan-cta:disabled {
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.tx-id {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.invoice-status.paid, .invoice-status.completed { background: #dcfce7; color: #16a34a; }
.invoice-status.pending { background: #fef9e7; color: #b45309; }
.invoice-status.overdue, .invoice-status.failed { background: #ffebee; color: #c62828; }
.invoice-status.cancelled, .invoice-status.canceled { background: #f5f5f5; color: #888; }
</style>
