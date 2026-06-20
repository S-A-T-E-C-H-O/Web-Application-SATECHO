import { defineStore } from 'pinia'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

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
      try {
        await apiRequest({
          method: 'POST',
          url: '/api/v1/onboarding/complete',
          data: { role: 'AGRONOMIST', setup: this.setup },
        })
        window.localStorage.removeItem('satecho.agronomist.draft')
        this.finishRequest('Configuration completed!')
        return true
      } catch (err) {
        const msg = err?.response?.data?.message || 'Could not complete setup. Try again.'
        this.failRequest(msg)
        return false
      }
    }
  }
})
