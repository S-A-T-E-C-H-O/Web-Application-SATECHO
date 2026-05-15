import { defineStore } from 'pinia'

import { authApi } from '@/bounded-contexts/auth/infrastructure/auth.api'

const AUTH_STORAGE_KEY = 'satecho.auth.session'
const PENDING_VERIFICATION_KEY = 'satecho.auth.pendingVerificationEmail'

const readStoredSession = () => {
  const rawSession =
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawSession) return { user: null, accessToken: null }

  try {
    return JSON.parse(rawSession)
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return { user: null, accessToken: null }
  }
}

const persistSession = ({ user, accessToken }, rememberMe) => {
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken }))
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const storedSession = readStoredSession()

    return {
      user: storedSession.user,
      accessToken: storedSession.accessToken,
      pendingVerificationEmail:
        window.sessionStorage.getItem(PENDING_VERIFICATION_KEY) || '',
      status: 'idle',
      error: '',
      feedback: '',
    }
  },

  getters: {
    isLoading: (state) => state.status === 'loading',
    isAuthenticated: (state) => Boolean(state.user),
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
      this.error =
        error?.message ||
        'No pudimos comunicarnos con el servicio. Intenta nuevamente.'
    },

    async login(credentials) {
      this.startRequest()

      try {
        const session = await authApi.login(credentials)

        this.user = session.user
        this.accessToken = session.accessToken
        persistSession(session, credentials.rememberMe)
        this.finishRequest(session.message)

        return session
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async register(registration) {
      this.startRequest()

      try {
        const result = await authApi.register(registration)

        this.pendingVerificationEmail = registration.email
        window.sessionStorage.setItem(
          PENDING_VERIFICATION_KEY,
          registration.email
        )
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async resendVerificationEmail(email = this.pendingVerificationEmail) {
      this.startRequest()

      try {
        const result = {
          verificationExpiresIn: '24 horas',
          message:
            'Enlace de verificacion simulado. Revisa Beeceptor para probar login, registro y confirmacion.',
        }

        this.pendingVerificationEmail = email
        window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, email)
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async confirmVerification({ email, token }) {
      this.startRequest()

      try {
        const result = await authApi.confirmVerification({ email, token })

        this.user = result.user
        window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
        this.pendingVerificationEmail = ''
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },
  },
})
