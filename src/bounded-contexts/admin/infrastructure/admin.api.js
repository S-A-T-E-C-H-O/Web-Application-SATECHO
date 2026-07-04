import { apiRequest } from '@/shared/infrastructure/http/api-client'

export const adminApi = {
  async getUsers({ role, blocked } = {}) {
    const params = {}
    if (role) params.role = role
    if (blocked !== undefined && blocked !== null) params.blocked = blocked
    const response = await apiRequest({ method: 'GET', url: '/api/v1/users', params })
    return response.data || []
  },

  async blockUser(userId) {
    const response = await apiRequest({ method: 'POST', url: `/api/v1/users/${userId}/block` })
    return response.data
  },

  async unblockUser(userId) {
    const response = await apiRequest({ method: 'POST', url: `/api/v1/users/${userId}/unblock` })
    return response.data
  },

  async getFarms() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/admin/farms' })
    return response.data || []
  },

  async deactivateFarm(farmId) {
    const response = await apiRequest({ method: 'POST', url: `/api/v1/admin/farms/${farmId}/deactivate` })
    return response.data
  },

  async reactivateFarm(farmId) {
    const response = await apiRequest({ method: 'POST', url: `/api/v1/admin/farms/${farmId}/reactivate` })
    return response.data
  },

  async getDevices() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/admin/devices' })
    return response.data || []
  },

  async getMetrics() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/admin/metrics' })
    return response.data || {}
  },

  async getRegistrationsTrend() {
    const response = await apiRequest({ method: 'GET', url: '/api/v1/admin/metrics/registrations-trend' })
    return response.data || []
  },
}
