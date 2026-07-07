import { defineStore } from 'pinia'

import { billingApi } from '@/bounded-contexts/billing/infrastructure/billing.api'

/**
 * Normalizes the plan tier name for the client UI.
 * Maps 'FREE' or 'STARTER' to 'BASIC', returning other tier names in uppercase.
 * 
 * @param {string} tier - The original plan tier name.
 * @returns {string} The normalized tier name.
 */
const normalizePlanTier = (tier) => {
  const value = String(tier || 'BASIC').toUpperCase()
  if (value === 'FREE' || value === 'STARTER') return 'BASIC'
  return value
}

/**
 * Pinia store for managing billing and subscription state.
 */
export const useBillingStore = defineStore('billing', {
  /**
   * Global billing state.
   */
  state: () => ({
    /** @type {Array} List of available subscription plans */
    plans: [],
    /** @type {Object|null} Information about the current active user subscription */
    subscription: null,
    /** @type {Array} User invoice list/history */
    invoices: [],
    /** @type {Array} User payment transaction history */
    payments: [],
    /** @type {'idle'|'loading'|'success'|'error'|'partial'} API request status */
    status: 'idle',
    /** @type {string} Error message if the API request fails */
    error: '',
    /** @type {string} Feedback message when the API request succeeds */
    feedback: '',
  }),

  getters: {
    /**
     * Determines whether a billing network request is in progress.
     * @param {Object} state - The store state.
     * @returns {boolean} True if loading, false otherwise.
     */
    isLoading: (state) => state.status === 'loading',
    
    /**
     * Retrieves the current normalized plan tier name.
     * @param {Object} state - The store state.
     * @returns {string} The normalized tier name (e.g. 'BASIC', 'PRO', 'ENTERPRISE').
     */
    currentTier: (state) => normalizePlanTier(state.subscription?.planType || state.subscription?.tierName),
    
    /**
     * Finds the full plan details matching the current active subscription.
     * @param {Object} state - The store state.
     * @returns {Object|null} The matching plan object, or null if not found.
     */
    currentPlan: (state) => {
      const tier = normalizePlanTier(state.subscription?.planType || state.subscription?.tierName)
      if (!state.plans.length) return null
      return state.plans.find(
        (p) => normalizePlanTier(p.tier || p.name) === tier
      ) || null
    },
  },

  actions: {
    /**
     * Starts a network request by setting status to 'loading' and clearing previous messages.
     */
    startRequest() {
      this.status = 'loading'
      this.error = ''
      this.feedback = ''
    },

    /**
     * Finalizes a successful network request and sets a feedback message.
     * @param {string} [message=''] - Optional feedback message.
     */
    finishRequest(message = '') {
      this.status = 'success'
      this.feedback = message
    },

    /**
     * Handles a failed network request, updating state and setting the error message.
     * @param {Error|Object} error - The caught error object.
     */
    failRequest(error) {
      this.status = 'error'
      this.error = error?.message || 'The request could not be completed.'
    },

    /**
     * Concurrently loads all billing related data: plans, active subscription, invoices, and payments.
     * Gracefully handles partial failures by setting the status to 'partial'.
     * 
     * @async
     */
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

    /**
     * Subscribes the user to a specific plan tier. Updates subscription if one exists,
     * or registers a new one if not. Refreshes invoices and payments on success.
     * 
     * @async
     * @param {string} planType - The tier/type of the plan to subscribe to.
     * @throws {Error} Propagates the caught error if the operation fails.
     */
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

    /**
     * Cancels the user's active subscription.
     * 
     * @async
     * @throws {Error} Propagates the caught error if the cancellation fails.
     */
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
