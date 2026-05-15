import axios from 'axios'

const DEFAULT_API_BASE_URL = 'https://satecho-auth.free.beeceptor.com'

export const createApiClient = (baseURL) => axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const getApiBaseUrl = () => apiClient.defaults.baseURL

export const createApiRequest = (client) => async (config) => {
  try {
    const response = await client.request(config)

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: parseMaybeJson(response.data),
    }
  } catch (error) {
    const status = error.response?.status
    const responseData = parseMaybeJson(error.response?.data)
    const responseMessage =
      responseData?.message ||
      responseData?.error ||
      responseData?.detail ||
      error.message

    throw {
      status,
      data: responseData,
      message: responseMessage || 'No se pudo completar la solicitud.',
      isNetworkError: !error.response,
    }
  }
}

export const apiRequest = createApiRequest(apiClient)
