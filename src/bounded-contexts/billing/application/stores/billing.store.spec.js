import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/bounded-contexts/billing/infrastructure/billing.api', () => ({
  billingApi: {
    getPlans: vi.fn(),
    getCurrentSubscription: vi.fn(),
    getInvoices: vi.fn(),
    getPayments: vi.fn(),
    subscribe: vi.fn(),
    cancel: vi.fn(),
  },
}))

import { useBillingStore } from './billing.store'
import { billingApi } from '@/bounded-contexts/billing/infrastructure/billing.api'

describe('billing.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have initial state properties', () => {
      const store = useBillingStore()
      expect(store.plans).toEqual([])
      expect(store.subscription).toBeNull()
      expect(store.invoices).toEqual([])
      expect(store.payments).toEqual([])
      expect(store.status).toBe('idle')
      expect(store.error).toBe('')
      expect(store.feedback).toBe('')
    })
  })

  describe('getters', () => {
    it('isLoading should return true if status is loading', () => {
      const store = useBillingStore()
      store.status = 'loading'
      expect(store.isLoading).toBe(true)
      store.status = 'success'
      expect(store.isLoading).toBe(false)
    })

    it('currentTier should return normalized tier', () => {
      const store = useBillingStore()
      
      // Default/unspecified should normalize to BASIC
      expect(store.currentTier).toBe('BASIC')

      store.subscription = { planType: 'STARTER' }
      expect(store.currentTier).toBe('BASIC')

      store.subscription = { tierName: 'FREE' }
      expect(store.currentTier).toBe('BASIC')

      store.subscription = { planType: 'pro' }
      expect(store.currentTier).toBe('PRO')

      store.subscription = { planType: 'ENTERPRISE' }
      expect(store.currentTier).toBe('ENTERPRISE')
    })

    it('currentPlan should find the plan matching the normalized tier', () => {
      const store = useBillingStore()
      store.plans = [
        { name: 'Starter', tier: 'FREE' },
        { name: 'Pro Plan', tier: 'PRO' },
      ]

      store.subscription = { planType: 'STARTER' }
      expect(store.currentPlan).toEqual({ name: 'Starter', tier: 'FREE' })

      store.subscription = { planType: 'pro' }
      expect(store.currentPlan).toEqual({ name: 'Pro Plan', tier: 'PRO' })

      store.subscription = { planType: 'UNKNOWN' }
      expect(store.currentPlan).toBeNull()
    })
  })

  describe('actions', () => {
    describe('load', () => {
      it('should load all billing data successfully', async () => {
        const mockPlans = [{ tier: 'PRO' }]
        const mockSubscription = { planType: 'PRO' }
        const mockInvoices = [{ id: 1 }]
        const mockPayments = [{ id: 2 }]

        billingApi.getPlans.mockResolvedValueOnce(mockPlans)
        billingApi.getCurrentSubscription.mockResolvedValueOnce(mockSubscription)
        billingApi.getInvoices.mockResolvedValueOnce(mockInvoices)
        billingApi.getPayments.mockResolvedValueOnce(mockPayments)

        const store = useBillingStore()
        await store.load()

        expect(store.plans).toEqual(mockPlans)
        expect(store.subscription).toEqual(mockSubscription)
        expect(store.invoices).toEqual(mockInvoices)
        expect(store.payments).toEqual(mockPayments)
        expect(store.status).toBe('success')
        expect(store.error).toBe('')
      })

      it('should handle partial loading failure if some API calls reject', async () => {
        const mockPlans = [{ tier: 'PRO' }]
        
        billingApi.getPlans.mockResolvedValueOnce(mockPlans)
        billingApi.getCurrentSubscription.mockRejectedValueOnce(new Error('Auth expired'))
        billingApi.getInvoices.mockResolvedValueOnce([])
        billingApi.getPayments.mockResolvedValueOnce([])

        const store = useBillingStore()
        await store.load()

        expect(store.plans).toEqual(mockPlans)
        expect(store.subscription).toBeNull()
        expect(store.status).toBe('partial')
        expect(store.error).toBe('Some billing data could not be loaded.')
      })
    })

    describe('subscribe', () => {
      it('should subscribe and reload invoices/payments', async () => {
        const newSubscription = { planType: 'PRO' }
        const invoices = [{ id: 1 }]
        const payments = [{ id: 2 }]

        billingApi.subscribe.mockResolvedValueOnce(newSubscription)
        billingApi.getInvoices.mockResolvedValueOnce(invoices)
        billingApi.getPayments.mockResolvedValueOnce(payments)

        const store = useBillingStore()
        store.subscription = null // No subscription initially

        await store.subscribe('PRO')

        expect(billingApi.subscribe).toHaveBeenCalledWith('PRO', { hasSubscription: false })
        expect(store.subscription).toEqual(newSubscription)
        expect(store.invoices).toEqual(invoices)
        expect(store.payments).toEqual(payments)
        expect(store.status).toBe('success')
        expect(store.feedback).toBe('Subscribed to the PRO plan.')
      })

      it('should pass hasSubscription: true if subscription exists', async () => {
        const updatedSubscription = { planType: 'ENTERPRISE' }
        billingApi.subscribe.mockResolvedValueOnce(updatedSubscription)
        billingApi.getInvoices.mockResolvedValueOnce([])
        billingApi.getPayments.mockResolvedValueOnce([])

        const store = useBillingStore()
        store.subscription = { planType: 'PRO' }

        await store.subscribe('ENTERPRISE')

        expect(billingApi.subscribe).toHaveBeenCalledWith('ENTERPRISE', { hasSubscription: true })
        expect(store.subscription).toEqual(updatedSubscription)
        expect(store.status).toBe('success')
      })

      it('should set status to error if subscription api fails', async () => {
        const error = new Error('Card declined')
        billingApi.subscribe.mockRejectedValueOnce(error)

        const store = useBillingStore()

        await expect(store.subscribe('PRO')).rejects.toThrow('Card declined')

        expect(store.status).toBe('error')
        expect(store.error).toBe('Card declined')
      })
    })

    describe('cancel', () => {
      it('should cancel subscription and update status', async () => {
        const cancelledSubscription = { planType: 'PRO', status: 'CANCELLED' }
        billingApi.cancel.mockResolvedValueOnce(cancelledSubscription)

        const store = useBillingStore()

        await store.cancel()

        expect(billingApi.cancel).toHaveBeenCalled()
        expect(store.subscription).toEqual(cancelledSubscription)
        expect(store.status).toBe('success')
        expect(store.feedback).toBe('Subscription cancelled. It stays active until the end of the current period.')
      })

      it('should set status to error if cancel api fails', async () => {
        const error = new Error('Cancel failed')
        billingApi.cancel.mockRejectedValueOnce(error)

        const store = useBillingStore()

        await expect(store.cancel()).rejects.toThrow('Cancel failed')

        expect(store.status).toBe('error')
        expect(store.error).toBe('Cancel failed')
      })
    })
  })
})
