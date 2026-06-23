import axios from 'axios'
import i18n from '@/shared/i18n'

const AUTH_STORAGE_KEY = 'satecho.auth.session'

const readStoredToken = () => {
  try {
    const raw =
      window.sessionStorage.getItem(AUTH_STORAGE_KEY) ||
      window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.accessToken || null
  } catch {
    return null
  }
}

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://agrosafe-back.eastus2.azurecontainer.io:8080'

export const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    // The application API paths already include `/api`. In production Vercel
    // provides `/api` as the proxy base, so remove only the duplicated prefix.
    if (client.defaults.baseURL === '/api' && config.url?.startsWith('/api/')) {
      config.url = config.url.slice(4)
    }

    const token = readStoredToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  return client
}

export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return value }
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
      message: responseMessage || i18n.global.t('messages.requestFailed'),
      isNetworkError: !error.response,
    }
  }
}

export const apiRequest = createApiRequest(apiClient)
