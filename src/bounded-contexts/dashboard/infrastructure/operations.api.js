import {
  createApiClient,
  createApiRequest,
} from '@/shared/infrastructure/http/api-client'

const DEFAULT_OPERATIONS_API_BASE_URL =
  'https://satecho-operations.free.beeceptor.com'

const operationsClient = createApiClient(
  import.meta.env.VITE_OPERATIONS_API_BASE_URL ||
    DEFAULT_OPERATIONS_API_BASE_URL
)

const operationsRequest = createApiRequest(operationsClient)

const readPayload = (response) => {
  const data = response?.data

  if (data?.body && typeof data.body === 'object') return data.body
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.response && typeof data.response === 'object') return data.response

  return data || {}
}

export const operationsApi = {
  async getSecurityEvents(filter = 'all') {
    const response = await operationsRequest({
      method: 'GET',
      url: '/security/events',
      params: { filter },
    })

    return readPayload(response)
  },

  async registerIrrigationAction(action) {
    const response = await operationsRequest({
      method: 'POST',
      url: '/irrigation/actions',
      data: action,
    })

    return readPayload(response)
  },

  async saveNotificationPreferences(preferences) {
    const response = await operationsRequest({
      method: 'PUT',
      url: '/notification-preferences',
      data: preferences,
    })

    return readPayload(response)
  },
}
