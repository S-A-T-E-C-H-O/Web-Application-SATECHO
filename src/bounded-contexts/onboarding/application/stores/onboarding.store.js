import { defineStore } from 'pinia'

import { onboardingApi } from '@/bounded-contexts/onboarding/infrastructure/onboarding.api'

const ONBOARDING_DRAFT_KEY = 'satecho.onboarding.draft'

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
  devices: {
    groundSensor: false,
    valveController: false,
    weatherStation: false,
    securityCamera: false,
  },
  thresholds: {
    soilMoisture: [50, 80],
    electricalConductivity: [1.5, 3],
    soilPh: [6, 7],
  },
})

const readDraft = () => {
  const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
  if (!rawDraft) return defaultSetup()

  try {
    return {
      ...defaultSetup(),
      ...JSON.parse(rawDraft),
    }
  } catch {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    return defaultSetup()
  }
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
        'No pudimos comunicarnos con el servicio de onboarding.'
    },

    persistDraft() {
      window.localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify(this.setup)
      )
      this.feedback = 'Guardado localmente. Podras continuar despues.'
    },

    async loadStatus(userId) {
      this.startRequest()

      try {
        const result = await onboardingApi.getStatus(userId)

        this.completed = result.completed
        this.currentStep = Number(result.currentStep) || 1
        this.setup = {
          ...defaultSetup(),
          ...this.setup,
          ...result.setup,
        }
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
        const result = await onboardingApi.complete({
          userId,
          ...this.setup,
        })

        this.completed = result.completed
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
