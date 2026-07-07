import { defineStore } from 'pinia'

import { authApi } from '@/bounded-contexts/auth/infrastructure/auth.api'
import i18n from '@/shared/i18n'

const AUTH_STORAGE_KEY = 'satecho.auth.session'
const PENDING_VERIFICATION_KEY = 'satecho.auth.pendingVerificationEmail'

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName || '',
  email: user.email || '',
  phone: user.phone || '',
  plan: user.plan || 'pro',
  countryCode: user.countryCode || '',
  role: user.role || '',
  language: user.language || 'English',
  timeZone: user.timeZone || 'Bogota (GMT-5)',
  location: user.location || '',
})

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

const clearOtherSessionStorage = (rememberMe) => {
  const storage = rememberMe ? window.sessionStorage : window.localStorage
  storage.removeItem(AUTH_STORAGE_KEY)
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
        error?.message || i18n.global.t('messages.serviceUnavailable')
    },

    async login(credentials) {
      this.startRequest()

      try {
        const result = await authApi.login(credentials)
        const user = publicUser(result.user)

        this.user = user
        this.accessToken = result.accessToken
        persistSession({ user, accessToken: result.accessToken }, credentials.rememberMe)
        clearOtherSessionStorage(credentials.rememberMe)
        this.finishRequest(result.message)

        return {
          user,
          accessToken: result.accessToken,
          requiresVerification: false,
          message: result.message,
        }
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async register(registration) {
      this.startRequest()

      try {
        const result = await authApi.register(registration)
        const user = publicUser(result.user)
        const accessToken = result.accessToken

        if (!accessToken) {
          this.user = null
          this.accessToken = null
          this.pendingVerificationEmail = ''
          window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
          this.finishRequest('Registro exitoso')

          return {
            ...result,
            user,
            accessToken: null,
            requiresLogin: true,
            requiresVerification: false,
            message: 'Registro exitoso',
          }
        }

        this.user = user
        this.accessToken = accessToken
        this.pendingVerificationEmail = ''
        window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
        persistSession({ user, accessToken }, false)
        clearOtherSessionStorage(false)
        this.finishRequest(result.message)

        return {
          ...result,
          user,
          accessToken,
          requiresVerification: false,
        }
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async resendVerificationEmail(email = this.pendingVerificationEmail) {
      this.startRequest()

      try {
        const result = await authApi.resendVerification(email)

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
        const user = publicUser({
          ...result.user,
          email: result.user?.email || email,
        })
        const session = { user, accessToken: result.accessToken || null }

        this.user = user
        this.accessToken = session.accessToken
        if (session.accessToken) {
          persistSession(session, false)
        }
        window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
        this.pendingVerificationEmail = ''
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    updateProfile(profile) {
      this.user = {
        ...this.user,
        ...publicUser({ ...this.user, ...profile }),
      }
      const session = { user: this.user, accessToken: this.accessToken }
      persistSession(
        session,
        Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))
      )
      this.feedback = i18n.global.t('messages.profileUpdated')
    },

    async changePassword(currentPassword, newPassword) {
      this.startRequest()

      try {
        const result = await authApi.changePassword({ currentPassword, newPassword })
        this.finishRequest(result.message)
        return true
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    deleteAccount() {
      if (!this.user) return
      const userId = this.user.id
      localStorage.removeItem(userId)
      localStorage.removeItem(`profilePhoto_${userId}`)
      localStorage.removeItem(`dashboard_${userId}`)
      localStorage.removeItem(`preferences_${userId}`)
      localStorage.removeItem(`farmSetup_${userId}`)
      localStorage.removeItem('userRole')
      this.logout()
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.pendingVerificationEmail = ''
      this.status = 'idle'
      this.error = ''
      this.feedback = ''
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
    },

    async forgotPassword(email) {
      this.startRequest()

      try {
        if (!email) {
          throw { message: 'Email is required.' }
        }
        const result = await authApi.forgotPassword(email)
        this.finishRequest(result.message)
        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },

    async resetPassword({ token, newPassword }) {
      this.startRequest()

      try {
        if (!token) {
          throw { message: 'Reset link is invalid or incomplete. Request a new one.' }
        }
        if (!newPassword || newPassword.length < 8) {
          throw { message: 'Password must contain at least 8 characters.' }
        }
        const result = await authApi.resetPassword({ token, newPassword })
        this.finishRequest(result.message)
        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },
  },
})
