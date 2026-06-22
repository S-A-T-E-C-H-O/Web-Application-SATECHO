import { apiRequest } from '@/shared/infrastructure/http/api-client'
import i18n from '@/shared/i18n'

const roleFromRoles = (roles = []) =>
  roles.find((r) => r.includes('AGRONOMIST'))
    ? 'agronomist'
    : roles.find((r) => r.includes('FARMER'))
    ? 'farmer'
    : (roles[0] || '').toLowerCase()

export const authApi = {
  async login(credentials) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/authentication/sign-in',
      data: { email: credentials.email, password: credentials.password },
    })
    const data = response?.data || {}

    return {
      user: {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: roleFromRoles(data.roles),
      },
      accessToken: data.token || null,
      requiresVerification: false,
      message: i18n.global.t('messages.loginSuccess'),
    }
  },

  async register(registration) {
    const roles = registration.role === 'agronomist' ? ['ROLE_AGRONOMIST'] : ['ROLE_FARMER']
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/authentication/sign-up',
      data: {
        fullName: registration.fullName,
        email: registration.email,
        password: registration.password,
        roles,
      },
    })
    const data = response?.data || {}

    return {
      user: {
        id: data.id,
        fullName: data.fullName || registration.fullName,
        email: data.email || registration.email,
        role: registration.role,
      },
      accessToken: data.token || data.accessToken || data.jwt || null,
      requiresVerification: false,
      message: data.message || i18n.global.t('messages.authApiRegisterSuccess'),
    }
  },

  async confirmVerification({ token }) {
    const response = await apiRequest({
      method: 'GET',
      url: '/api/v1/authentication/verify-account',
      params: { token },
    })
    const data = response?.data || {}

    return {
      user: { id: data.id, fullName: data.fullName, email: data.email },
      message: i18n.global.t('messages.accountVerified'),
    }
  },

  async resendVerification(email) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/v1/authentication/resend-verification',
      data: { email },
    })
    const data = response?.data || {}
    return { message: data.message || 'Verification email sent.' }
  },
}
