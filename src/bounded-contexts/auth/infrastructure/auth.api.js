import { apiRequest } from '@/shared/infrastructure/http/api-client'

const readPayload = (response) => {
  const data = response?.data

  if (data?.body && typeof data.body === 'object') return data.body
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.response && typeof data.response === 'object') return data.response

  return data || {}
}

const buildUserFromPayload = (payload, fallback = {}) => ({
  id: payload.user?.id || payload.id || fallback.id || null,
  fullName:
    payload.user?.fullName ||
    payload.user?.name ||
    payload.fullName ||
    fallback.fullName ||
    '',
  email: payload.user?.email || payload.email || fallback.email || '',
  role: payload.user?.role || payload.role || fallback.role || '',
})

const successMessage = (payload, fallback) =>
  payload.message || payload.statusMessage || fallback

export const authApi = {
  async login(credentials) {
    const response = await apiRequest({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    })
    const payload = readPayload(response)

    return {
      user: buildUserFromPayload(payload, credentials),
      accessToken:
        payload.accessToken ||
        payload.token ||
        payload.jwt ||
        payload.sessionToken ||
        null,
      requiresVerification: Boolean(payload.requiresVerification),
      message: successMessage(payload, 'Inicio de sesion correcto.'),
    }
  },

  async register(registration) {
    const response = await apiRequest({
      method: 'POST',
      url: '/auth/register',
      data: registration,
    })
    const payload = readPayload(response)

    return {
      user: buildUserFromPayload(payload, registration),
      verificationExpiresIn:
        payload.verificationExpiresIn ||
        payload.expiresIn ||
        '24 horas',
      message: successMessage(
        payload,
        'Cuenta creada. Revisa tu correo para verificarla.'
      ),
    }
  },

  async confirmVerification({ email, token }) {
    const response = await apiRequest({
      method: 'POST',
      url: '/auth/verification/confirm',
      data: { email, token },
    })
    const payload = readPayload(response)

    return {
      user: buildUserFromPayload(payload, { email }),
      message: successMessage(payload, 'Cuenta verificada correctamente.'),
    }
  },
}
