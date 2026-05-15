import {
  createApiClient,
  createApiRequest,
} from '@/shared/infrastructure/http/api-client'

const DEFAULT_FARM_API_BASE_URL = 'https://satecho-farm.free.beeceptor.com'

const farmClient = createApiClient(
  import.meta.env.VITE_FARM_API_BASE_URL || DEFAULT_FARM_API_BASE_URL
)

const farmRequest = createApiRequest(farmClient)

const readPayload = (response) => {
  const data = response?.data

  if (data?.body && typeof data.body === 'object') return data.body
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.response && typeof data.response === 'object') return data.response

  return data || {}
}

export const farmApi = {
  async getOverview() {
    const response = await farmRequest({
      method: 'GET',
      url: '/farm/overview',
    })

    return readPayload(response)
  },

  async getIrrigationHistory(area = 'all') {
    const response = await farmRequest({
      method: 'GET',
      url: '/irrigation/history',
      params: { area },
    })

    return readPayload(response)
  },

  async getDevices(type = 'all', status = 'all') {
    const response = await farmRequest({
      method: 'GET',
      url: '/devices',
      params: { type, status },
    })

    return readPayload(response)
  },
}
