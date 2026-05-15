import {
  createApiClient,
  createApiRequest,
} from '@/shared/infrastructure/http/api-client'

const DEFAULT_ONBOARDING_API_BASE_URL =
  'https://satecho-onboarding.free.beeceptor.com'

const onboardingClient = createApiClient(
  import.meta.env.VITE_ONBOARDING_API_BASE_URL ||
    DEFAULT_ONBOARDING_API_BASE_URL
)

const onboardingRequest = createApiRequest(onboardingClient)

const readPayload = (response) => {
  const data = response?.data

  if (data?.body && typeof data.body === 'object') return data.body
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.response && typeof data.response === 'object') return data.response

  return data || {}
}

export const onboardingApi = {
  async getStatus(userId) {
    const response = await onboardingRequest({
      method: 'GET',
      url: '/onboarding/status',
      params: { userId },
    })
    const payload = readPayload(response)

    return {
      completed: Boolean(payload.completed),
      currentStep: payload.currentStep || 1,
      setup: payload.setup || {},
      message: payload.message || '',
    }
  },

  async complete(setup) {
    const response = await onboardingRequest({
      method: 'POST',
      url: '/onboarding/complete',
      data: setup,
    })
    const payload = readPayload(response)

    return {
      completed: payload.completed !== false,
      message: payload.message || 'Configuracion completada correctamente.',
    }
  },
}
