import { defineStore } from 'pinia'

import { onboardingApi } from '@/bounded-contexts/onboarding/infrastructure/onboarding.api'
import i18n from '@/shared/i18n'

const ONBOARDING_DRAFT_KEY = 'satecho.onboarding.draft'
const ONBOARDING_COMPLETED_KEY = 'satecho.onboarding.completed'

const defaultSetup = () => ({
  property: {
    name: '',
    location: '',
    sizeHectares: '',
  },
  irrigationZones: [
    {
      name: '',
      areaHectares: '',
      crop: '',
    },
  ],
})

const normalizeSetup = (setup = {}) => ({
  property: {
    ...defaultSetup().property,
    ...(setup.property || {}),
  },
  irrigationZones:
    Array.isArray(setup.irrigationZones) && setup.irrigationZones.length
      ? setup.irrigationZones.map((zone) => ({
          name: zone.name || '',
          areaHectares: zone.areaHectares || '',
          crop: zone.crop || '',
        }))
      : defaultSetup().irrigationZones,
})

const readDraft = () => {
  const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
  if (!rawDraft) return defaultSetup()

  try {
    return normalizeSetup(JSON.parse(rawDraft))
  } catch {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    return defaultSetup()
  }
}

const readCompletedSetups = () => {
  const rawSetups = window.localStorage.getItem(ONBOARDING_COMPLETED_KEY)
  if (!rawSetups) return {}

  try {
    return JSON.parse(rawSetups)
  } catch {
    window.localStorage.removeItem(ONBOARDING_COMPLETED_KEY)
    return {}
  }
}

const readCompletedSetup = (userId) => readCompletedSetups()[userId] || null

const writeCompletedSetup = (userId, setup) => {
  const setups = readCompletedSetups()
  setups[userId] = {
    completed: true,
    completedAt: new Date().toISOString(),
    setup,
  }
  window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, JSON.stringify(setups))
}

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    currentStep: 1,
    completed: false,
    status: 'idle',
    error: '',
    feedback: '',
    setup: readDraft(),
  }),

  getters: {
    isLoading: (state) => state.status === 'loading',
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
        i18n.global.t('messages.onboardingServiceUnavailable')
    },

    persistDraft() {
      window.localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify(this.setup)
      )
      this.feedback = i18n.global.t('messages.savedLocal')
    },

    async loadStatus(userId) {
      this.startRequest()

      const localSetup = readCompletedSetup(userId)

      if (localSetup?.completed) {
        this.completed = true
        this.currentStep = 2
        this.setup = normalizeSetup(localSetup.setup)
        this.finishRequest(i18n.global.t('messages.setupLoadedLocal'))

        return {
          completed: true,
          currentStep: 2,
          setup: this.setup,
          message: i18n.global.t('messages.setupLoadedLocal'),
        }
      }

      try {
        const result = await onboardingApi.getStatus(userId)

        this.completed = result.completed
        this.currentStep = Math.min(2, Math.max(1, Number(result.currentStep) || 1))
        this.setup = normalizeSetup({ ...this.setup, ...result.setup })
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        return { completed: false }
      }
    },

    async complete(userId) {
      this.startRequest()

      try {
        const setup = normalizeSetup(this.setup)
        const result = await onboardingApi.complete({ userId, ...setup })

        this.completed = result.completed
        this.setup = setup
        writeCompletedSetup(userId, setup)
        window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
        this.finishRequest(result.message)

        return result
      } catch (error) {
        this.failRequest(error)
        throw error
      }
    },
  },
})
