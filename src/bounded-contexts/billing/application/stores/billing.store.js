import { defineStore } from 'pinia'

import { billingApi } from '@/bounded-contexts/billing/infrastructure/billing.api'

export const useBillingStore = defineStore('billing', {
  state: () => ({
    plans: [],
    subscription: null,
    invoices: [],
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
    currentTier: (state) => state.subscription?.tierName || 'FREE',
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
      try {
        const [plans, subscription, invoices] = await Promise.all([
          billingApi.getPlans(),
          billingApi.getCurrentSubscription(),
          billingApi.getInvoices(),
        ])
        this.plans = plans
        this.subscription = subscription
        this.invoices = invoices
        this.finishRequest()
      } catch (error) {
        this.failRequest(error)
      }
    },

    async subscribe(planTier) {
      this.startRequest()
      try {
        this.subscription = await billingApi.subscribe(planTier)
        this.invoices = await billingApi.getInvoices()
        this.finishRequest(`Subscribed to the ${planTier} plan.`)
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
