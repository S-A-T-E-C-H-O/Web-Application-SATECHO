import { apiRequest } from '@/shared/infrastructure/http/api-client'

export const billingApi = {
  async getPlans() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/plans' })
    return response.data || []
  },

  async getCurrentSubscription() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/subscriptions/me' })
    return response.data || null
  },

  async subscribe(planTier) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/subscriptions/me',
      data: { planTier },
    })
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
}
