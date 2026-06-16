import {
  createApiClient,
  createApiRequest,
} from '@/shared/infrastructure/http/api-client'

const DEFAULT_TELEMETRY_API_BASE_URL =
  'https://satecho-telemetry.free.beeceptor.com'

const telemetryClient = createApiClient(
  import.meta.env.VITE_TELEMETRY_API_BASE_URL ||
    DEFAULT_TELEMETRY_API_BASE_URL
)

const telemetryRequest = createApiRequest(telemetryClient)

const readPayload = (response) => {
  const data = response?.data
  if (data?.body && typeof data.body === 'object') return data.body
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.response && typeof data.response === 'object') return data.response
  return data || {}
}

export const telemetryApi = {
  /** Obtiene las lecturas actuales de todos los sensores de hardware (FC-28, HR202L, DHT11, DS18B20, PIR) */
  async getCurrentReadings() {
    const response = await telemetryRequest({
      method: 'GET',
      url: '/telemetry/current',
    })
    return readPayload(response)
  },

  /** Obtiene el historial de lecturas de salinidad para la gráfica del Acto 3 */
  async getSalinityHistory(period = '24h') {
    const response = await telemetryRequest({
      method: 'GET',
      url: '/telemetry/salinity/history',
      params: { period },
    })
    return readPayload(response)
  },

  /** Obtiene los eventos del sensor PIR para el registro de seguridad del Acto 4 */
  async getPirEvents() {
    const response = await telemetryRequest({
      method: 'GET',
      url: '/telemetry/pir/events',
    })
    return readPayload(response)
  },

  /** Envía comando de activación/desactivación de riego (Acto 2) */
  async toggleIrrigation(irrigationState) {
    const response = await telemetryRequest({
      method: 'POST',
      url: '/telemetry/irrigation/toggle',
      data: irrigationState,
    })
    return readPayload(response)
  },
}
