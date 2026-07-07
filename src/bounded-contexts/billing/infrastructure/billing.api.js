import { apiRequest } from '@/shared/infrastructure/http/api-client'

/**
 * API Service for managing billing and subscriptions.
 * Provides methods to interact with subscription, plan, invoice, and payment endpoints.
 */
export const billingApi = {
  /**
   * Fetches the list of available subscription plans.
   * 
   * @async
   * @function getPlans
   * @returns {Promise<Array>} Promise resolving to a list of subscription plans. Returns an empty array if no data is found.
   */
  async getPlans() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/plans' })
    return response.data || []
  },

  /**
   * Fetches the current active subscription details for the authenticated user.
   * Handles errors internally if the endpoint is unavailable, returning null.
   * 
   * @async
   * @function getCurrentSubscription
   * @returns {Promise<Object|null>} Promise resolving to the subscription object or null if none exists or the endpoint fails.
   */
  async getCurrentSubscription() {
    try {
      const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me' })
      return response.data || null
    } catch (error) {
      // Subscription endpoint unavailable for now: "console.warn('[Billing] Current subscription unavailable:', error.message || error)"
      return null
    }
  },

  /**
   * Creates a new subscription or updates an existing one for the user.
   * Uses POST for new subscriptions and PUT to update existing ones.
   * 
   * @async
   * @function subscribe
   * @param {string} planType - The tier of the plan to subscribe to (e.g., 'STARTER', 'PRO', 'ENTERPRISE').
   * @param {Object} [options] - Additional subscription options.
   * @param {boolean} [options.hasSubscription=false] - Whether the user already has an active subscription (determines POST vs PUT).
   * @param {string} [options.billingCycle='MONTHLY'] - The billing frequency cycle (e.g., 'MONTHLY', 'QUARTERLY', 'ANNUAL').
   * @returns {Promise<Object>} Promise resolving to the created or updated subscription details.
   */
  async subscribe(planType, { hasSubscription = false, billingCycle = 'MONTHLY' } = {}) {
    const payload = {
      planType: String(planType || '').toUpperCase(),
      billingCycle: String(billingCycle || 'MONTHLY').toUpperCase(),
    }
    const response = hasSubscription
      ? await apiRequest({ method: 'PUT', url: '/api/v1/subscriptions/me', data: payload })
      : await apiRequest({ method: 'POST', url: '/api/v1/subscriptions', data: payload })
    return response.data
  },

  /**
   * Cancels the user's current subscription.
   * The subscription normally remains active until the end of the current billing cycle.
   * 
   * @async
   * @function cancel
   * @returns {Promise<Object>} Promise resolving to the cancelled subscription details.
   */
  async cancel() {
    const response = await apiRequest({ method: 'POST', url: '/api/v1/subscriptions/me/cancel' })
    return response.data
  },

  /**
   * Fetches the invoice history for the current user.
   * 
   * @async
   * @function getInvoices
   * @returns {Promise<Array>} Promise resolving to an array of invoices. Returns an empty array if no data is found.
   */
  async getInvoices() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me/invoices' })
    return response.data || []
  },

  /**
   * Fetches the payment history/transactions for the current user.
   * 
   * @async
   * @function getPayments
   * @returns {Promise<Array>} Promise resolving to an array of payments. Returns an empty array if no data is found.
   */
  async getPayments() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me/payments' })
    return response.data || []
  },
}
