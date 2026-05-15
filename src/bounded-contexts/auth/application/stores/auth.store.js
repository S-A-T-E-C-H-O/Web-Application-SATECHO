import { defineStore } from 'pinia'

import { authApi } from '@/bounded-contexts/auth/infrastructure/auth.api'
import i18n from '@/shared/i18n'

const AUTH_STORAGE_KEY = 'satecho.auth.session'
const PENDING_VERIFICATION_KEY = 'satecho.auth.pendingVerificationEmail'
const REGISTERED_ACCOUNTS_KEY = 'satecho.auth.accounts'

const normalizeEmail = (email = '') => email.trim().toLowerCase()

const readRegisteredAccounts = () => {
  const rawAccounts = window.localStorage.getItem(REGISTERED_ACCOUNTS_KEY)
  if (!rawAccounts) return []

  try {
    return JSON.parse(rawAccounts)
  } catch {
    window.localStorage.removeItem(REGISTERED_ACCOUNTS_KEY)
    return []
  }
}

const writeRegisteredAccounts = (accounts) => {
  window.localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts))
}

const publicUser = (account) => ({
  id: account.id,
  fullName: account.fullName,
  email: account.email,
  phone: account.phone,
  countryCode: account.countryCode,
  role: account.role,
  language: account.language || 'English',
  timeZone: account.timeZone || 'Bogota (GMT-5)',
  location: account.location || '',
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
        error?.message ||
        i18n.global.t('messages.serviceUnavailable')
    },

    async login(credentials) {
      this.startRequest()

      try {
        const accounts = readRegisteredAccounts()
        const account = accounts.find(
          (item) => normalizeEmail(item.email) === normalizeEmail(credentials.email)
        )

        if (!account) {
          throw {
            message:
              i18n.global.t('messages.accountNotFound'),
          }
        }

        if (account.password !== credentials.password) {
          throw { message: i18n.global.t('messages.passwordMismatch') }
        }

        if (!account.verified) {
          this.pendingVerificationEmail = account.email
          window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, account.email)
          this.finishRequest(i18n.global.t('messages.accountNeedsVerification'))

          return {
            user: publicUser(account),
            accessToken: null,
            requiresVerification: true,
            message: i18n.global.t('messages.accountNeedsVerification'),
          }
        }

        let remoteSession = {}

        try {
          remoteSession = await authApi.login(credentials)
        } catch {
          remoteSession = {}
        }

        const session = {
          user: {
            ...publicUser(account),
            ...(remoteSession.user || {}),
            id: account.id,
            email: account.email,
          },
          accessToken:
            remoteSession.accessToken ||
            `local-session-${account.id}-${Date.now()}`,
          requiresVerification: false,
          message: remoteSession.message || i18n.global.t('messages.loginSuccess'),
        }

        this.user = session.user
        this.accessToken = session.accessToken
        persistSession(session, credentials.rememberMe)
        clearOtherSessionStorage(credentials.rememberMe)
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
        const accounts = readRegisteredAccounts()
        const email = normalizeEmail(registration.email)
        const existingAccount = accounts.find(
          (account) => normalizeEmail(account.email) === email
        )

        if (existingAccount) {
          throw {
            message:
              i18n.global.t('messages.accountAlreadyExists'),
          }
        }

        const account = {
          id: `user-${Date.now()}`,
          role: registration.role,
          fullName: registration.fullName,
          email,
          phone: registration.phone,
          countryCode: registration.countryCode,
          password: registration.password,
          acceptTerms: registration.acceptTerms,
          acceptMarketing: registration.acceptMarketing,
          verified: false,
          language: 'English',
          timeZone: 'Bogota (GMT-5)',
          location: '',
          createdAt: new Date().toISOString(),
        }

        writeRegisteredAccounts([...accounts, account])

        let result

        try {
          result = await authApi.register(registration)
        } catch {
          result = {
            user: publicUser(account),
            verificationExpiresIn: '24 hours',
            message:
              i18n.global.t('messages.accountCreatedLocal'),
          }
        }

        this.pendingVerificationEmail = email
        window.sessionStorage.setItem(
          PENDING_VERIFICATION_KEY,
          email
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
          verificationExpiresIn: '24 hours',
          message:
            i18n.global.t('messages.verificationLinkSimulated'),
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
        const accounts = readRegisteredAccounts()
        const accountIndex = accounts.findIndex(
          (account) => normalizeEmail(account.email) === normalizeEmail(email)
        )

        if (accountIndex === -1) {
          throw {
            message:
              i18n.global.t('messages.verificationPendingNotFound'),
          }
        }

        accounts[accountIndex] = {
          ...accounts[accountIndex],
          verified: true,
          verifiedAt: new Date().toISOString(),
        }
        writeRegisteredAccounts(accounts)

        let result

        try {
          result = await authApi.confirmVerification({ email, token })
        } catch {
          result = {
            user: publicUser(accounts[accountIndex]),
            message: i18n.global.t('messages.accountVerified'),
          }
        }

        const session = {
          user: {
            ...publicUser(accounts[accountIndex]),
            ...(result.user || {}),
            id: accounts[accountIndex].id,
            email: accounts[accountIndex].email,
          },
          accessToken: `local-session-${accounts[accountIndex].id}-${Date.now()}`,
        }

        this.user = session.user
        this.accessToken = session.accessToken
        persistSession(session, false)
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
      const accounts = readRegisteredAccounts()
      const accountIndex = accounts.findIndex(
        (account) => account.id === this.user?.id
      )

      if (accountIndex === -1) return

      accounts[accountIndex] = {
        ...accounts[accountIndex],
        ...profile,
        email: normalizeEmail(profile.email || accounts[accountIndex].email),
      }
      writeRegisteredAccounts(accounts)

      this.user = {
        ...this.user,
        ...publicUser(accounts[accountIndex]),
      }
      const session = {
        user: this.user,
        accessToken: this.accessToken,
      }
      persistSession(session, Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY)))
      this.feedback = i18n.global.t('messages.profileUpdated')
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
  },
})
