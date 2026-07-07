import { defineStore } from 'pinia'

import { billingApi } from '@/bounded-contexts/billing/infrastructure/billing.api'

export const useBillingStore = defineStore('billing', {
  state: () => ({
    plans: [],
    subscription: null,
    invoices: [],
    payments: [],
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
    // SubscriptionResource exposes `planType` (STARTER|PRO|ENTERPRISE); `tierName`
    // is kept as a legacy fallback only.
    currentTier: (state) => state.subscription?.planType || state.subscription?.tierName || 'FREE',
    currentPlan: (state) => {
      const tier = state.subscription?.planType || state.subscription?.tierName || 'FREE'
      if (!state.plans.length) return null
      return state.plans.find(
        (p) => (p.tier || p.name || '').toUpperCase() === tier.toUpperCase()
      ) || null
    },
  },

  actions: {
    startRequest() {
      this.status = 'loading'
      this.error = ''
      this.feedback = ''
    },

    finishRequest(message = '') {
      this.status = 'success'
      this.feedback = message
    },

    failRequest(error) {
      this.status = 'error'
      this.error = error?.message || 'The request could not be completed.'
    },

    async load() {
      this.startRequest()

      const [plans, subscription, invoices, payments] = await Promise.allSettled([
        billingApi.getPlans(),
        billingApi.getCurrentSubscription(),
        billingApi.getInvoices(),
        billingApi.getPayments(),
      ])

      this.plans = plans.status === 'fulfilled' ? plans.value : []
      this.subscription = subscription.status === 'fulfilled' ? subscription.value : null
      this.invoices = invoices.status === 'fulfilled' ? invoices.value : []
      this.payments = payments.status === 'fulfilled' ? payments.value : []

      const hasFailure = [plans, subscription, invoices, payments].some((item) => item.status === 'rejected')

      this.status = hasFailure ? 'partial' : 'success'
      this.error = hasFailure ? 'Some billing data could not be loaded.' : ''
      this.feedback = ''
    },

    async subscribe(planType) {
      this.startRequest()
      try {
        this.subscription = await billingApi.subscribe(planType, {
          hasSubscription: Boolean(this.subscription),
        })
        this.invoices = await billingApi.getInvoices()
        this.payments = await billingApi.getPayments()
        this.finishRequest(`Subscribed to the ${planType} plan.`)
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async cancel() {
      this.startRequest()
      try {
        this.subscription = await billingApi.cancel()
        this.finishRequest('Subscription cancelled. It stays active until the end of the current period.')
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },
  },
})
