import { apiRequest } from '@/shared/infrastructure/http/api-client'

export const onboardingApi = {
  async getStatus(_userId) {
    const response = await apiRequest({
      method: 'GET',
      url: '/api/v1/onboarding/status',
    })
    const data = response?.data || {}

    return {
      completed: Boolean(data.completed),
      currentStep: data.currentStep || 1,
      setup: data.setup || {},
      message: data.message || '',
    }
  },

  async complete(setup) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/onboarding/complete',
      data: setup,
    })
    const data = response?.data || {}

    return {
      completed: data.completed !== false,
      message: data.message || 'Configuracion completada correctamente.',
    }
  },
}
