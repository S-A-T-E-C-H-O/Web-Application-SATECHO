import { defineStore } from 'pinia'

import { adminApi } from '@/bounded-contexts/admin/infrastructure/admin.api'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    farms: [],
    devices: [],
    metrics: null,
    registrationsTrend: [],
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
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

    async loadUsers({ role, blocked } = {}) {
      this.startRequest()
      try {
        this.users = await adminApi.getUsers({ role, blocked })
        this.finishRequest()
      } catch (error) {
        this.failRequest(error)
      }
    },

    async blockUser(userId) {
      try {
        await adminApi.blockUser(userId)
        const user = this.users.find((u) => u.id === userId)
        if (user) user.blocked = true
        this.finishRequest('User blocked.')
      } catch (error) {
        this.failRequest(error)
      }
    },

    async unblockUser(userId) {
      try {
        await adminApi.unblockUser(userId)
        const user = this.users.find((u) => u.id === userId)
        if (user) user.blocked = false
        this.finishRequest('User unblocked.')
      } catch (error) {
        this.failRequest(error)
      }
    },

    async loadFarms() {
      this.startRequest()
      try {
        this.farms = await adminApi.getFarms()
        this.finishRequest()
      } catch (error) {
        this.failRequest(error)
      }
    },

    async deactivateFarm(farmId) {
      try {
        const updated = await adminApi.deactivateFarm(farmId)
        this.applyFarmUpdate(farmId, updated)
        this.finishRequest('Farm deactivated.')
      } catch (error) {
        this.failRequest(error)
      }
    },

    async reactivateFarm(farmId) {
      try {
        const updated = await adminApi.reactivateFarm(farmId)
        this.applyFarmUpdate(farmId, updated)
        this.finishRequest('Farm reactivated.')
      } catch (error) {
        this.failRequest(error)
      }
    },

    applyFarmUpdate(farmId, updated) {
      const index = this.farms.findIndex((f) => f.id === farmId)
      if (index !== -1 && updated) this.farms[index] = updated
    },

    async loadDevices() {
      this.startRequest()
      try {
        this.devices = await adminApi.getDevices()
        this.finishRequest()
      } catch (error) {
        this.failRequest(error)
      }
    },

    async loadMetrics() {
      this.startRequest()
      try {
        const [metrics, trend] = await Promise.all([
          adminApi.getMetrics(),
          adminApi.getRegistrationsTrend(),
        ])
        this.metrics = metrics
        this.registrationsTrend = trend
        this.finishRequest()
      } catch (error) {
        this.failRequest(error)
      }
    },
  },
})
