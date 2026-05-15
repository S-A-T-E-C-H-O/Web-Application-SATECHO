import { defineStore } from 'pinia'

export const useOnboardingAgronomistStore = defineStore('onboardingAgronomist', {
  state: () => ({
    currentStep: 1,
    isLoading: false,
    error: '',
    feedback: '',
    setup: {
      profile: {
        fullName: '',
        licenseId: '',
        experience: null,
        serviceCoverage: '',
        primaryCrops: '',
        specialties: [],
        document: null,
      },
      portfolio: {
        clients: [],
      },
      protocols: {
        templateName: '',
        targetCrop: '',
        description: '',
        thresholds: {
          soilMoisture: [25, 45],
          ecLimit: 1.8,
          phLevel: [5.8, 7.0],
          temperature: [16, 28]
        },
        alertRules: {
          warning: true,
          critical: true,
          info: false
        },
        applyTo: 'specific'
      },
      controlRoom: {
        reportFrequency: 'weekly',
        urgencyLevels: ['preventive', 'warning', 'critical'],
        channels: ['email', 'whatsapp', 'in-app'],
        supervisionRules: {
          notifyCritical: true,
          escalateUnresponsive: true,
          includeTrendContext: true,
          includeContactShortcut: true
        }
      }
    }
  }),
  
  actions: {
    startRequest() {
      this.isLoading = true
      this.error = ''
      this.feedback = ''
    },
    finishRequest(message = '') {
      this.isLoading = false
      this.feedback = message
    },
    failRequest(message) {
      this.isLoading = false
      this.error = message
    },
    persistDraft() {
      this.startRequest()
      // Simulate API call
      setTimeout(() => {
        window.localStorage.setItem('satecho.agronomist.draft', JSON.stringify(this.setup))
        this.finishRequest('Draft saved successfully.')
      }, 500)
    },
    async complete(userId) {
      this.startRequest()
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate success
          this.finishRequest('Configuration completed!')
          window.localStorage.removeItem('satecho.agronomist.draft')
          resolve(true)
        }, 1500)
      })
    }
  }
})
