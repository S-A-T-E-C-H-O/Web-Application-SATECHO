import { apiRequest } from '@/shared/infrastructure/http/api-client'

export const billingApi = {
  async getPlans() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/plans' })
    return response.data || []
  },

  async getCurrentSubscription() {
    try {
      const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me' })
      return response.data || null
    } catch (error) {
      // Subscription endpoint unavailable for now: "console.warn('[Billing] Current subscription unavailable:', error.message || error)"
      return null
    }
  },

  // Backend contract (SubscriptionController):
  //   POST /api/v1/subscriptions      → create the first subscription
  //   PUT  /api/v1/subscriptions/me   → change the plan of the existing one
  // Both accept { planType: STARTER|PRO|ENTERPRISE, billingCycle: MONTHLY|QUARTERLY|ANNUAL }.
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

  async cancel() {
    const response = await apiRequest({ method: 'POST', url: '/api/v1/subscriptions/me/cancel' })
    return response.data
  },

  async getInvoices() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me/invoices' })
    return response.data || []
  },

  async getPayments() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me/payments' })
    return response.data || []
  },
}
