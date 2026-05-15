import { defineStore } from 'pinia'

import { authApi } from '@/bounded-contexts/auth/infrastructure/auth.api'

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
        'No pudimos comunicarnos con el servicio. Intenta nuevamente.'
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
              'No existe una cuenta registrada con este correo. Crea una cuenta antes de iniciar sesion.',
          }
        }

        if (account.password !== credentials.password) {
          throw { message: 'La contrasena ingresada no coincide con esta cuenta.' }
        }

        if (!account.verified) {
          this.pendingVerificationEmail = account.email
          window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, account.email)
          this.finishRequest('Tu cuenta aun necesita verificacion.')

          return {
            user: publicUser(account),
            accessToken: null,
            requiresVerification: true,
            message: 'Tu cuenta aun necesita verificacion.',
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
          message: remoteSession.message || 'Inicio de sesion correcto.',
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
              'Ya existe una cuenta registrada con este correo. Inicia sesion o usa otro correo.',
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
            verificationExpiresIn: '24 horas',
            message:
              'Cuenta creada localmente. Verifica tu correo para continuar.',
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
        const accounts = readRegisteredAccounts()
        const accountIndex = accounts.findIndex(
          (account) => normalizeEmail(account.email) === normalizeEmail(email)
        )

        if (accountIndex === -1) {
          throw {
            message:
              'No encontramos una cuenta pendiente de verificacion para este correo.',
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
            message: 'Cuenta verificada correctamente.',
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
      this.feedback = 'Perfil actualizado correctamente.'
    },
  },
})
