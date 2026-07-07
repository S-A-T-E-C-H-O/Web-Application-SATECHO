import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/shared/infrastructure/http/api-client', () => ({
  apiRequest: vi.fn(),
}))

import { billingApi } from './billing.api'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

describe('billing.api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPlans', () => {
    it('should call apiRequest and return plans list', async () => {
      const mockPlans = [{ id: 1, name: 'Pro' }]
      apiRequest.mockResolvedValueOnce({ data: mockPlans })

      const result = await billingApi.getPlans()

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/subscriptions/plans',
      })
      expect(result).toEqual(mockPlans)
    })

    it('should return empty array if no data in response', async () => {
      apiRequest.mockResolvedValueOnce({})

      const result = await billingApi.getPlans()

      expect(result).toEqual([])
    })
  })

  describe('getCurrentSubscription', () => {
    it('should call apiRequest and return subscription details', async () => {
      const mockSubscription = { planType: 'PRO' }
      apiRequest.mockResolvedValueOnce({ data: mockSubscription })

      const result = await billingApi.getCurrentSubscription()

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/subscriptions/me',
      })
      expect(result).toEqual(mockSubscription)
    })

    it('should return null if apiRequest throws an error', async () => {
      apiRequest.mockRejectedValueOnce(new Error('Network Error'))

      const result = await billingApi.getCurrentSubscription()

      expect(result).toBeNull()
    })
  })

  describe('subscribe', () => {
    it('should call POST if hasSubscription is false', async () => {
      apiRequest.mockResolvedValueOnce({ data: { success: true } })

      const result = await billingApi.subscribe('pro', { hasSubscription: false, billingCycle: 'monthly' })

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/v1/subscriptions',
        data: { planType: 'PRO', billingCycle: 'MONTHLY' },
      })
      expect(result).toEqual({ success: true })
    })

    it('should call PUT if hasSubscription is true', async () => {
      apiRequest.mockResolvedValueOnce({ data: { success: true } })

      const result = await billingApi.subscribe('enterprise', { hasSubscription: true, billingCycle: 'annual' })

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/api/v1/subscriptions/me',
        data: { planType: 'ENTERPRISE', billingCycle: 'ANNUAL' },
      })
      expect(result).toEqual({ success: true })
    })
  })

  describe('cancel', () => {
    it('should call cancel endpoint with POST method', async () => {
      apiRequest.mockResolvedValueOnce({ data: { status: 'CANCELLED' } })

      const result = await billingApi.cancel()

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/v1/subscriptions/me/cancel',
      })
      expect(result).toEqual({ status: 'CANCELLED' })
    })
  })

  describe('getInvoices', () => {
    it('should call invoices endpoint and return invoices list', async () => {
      const mockInvoices = [{ invoiceId: 'INV-1' }]
      apiRequest.mockResolvedValueOnce({ data: mockInvoices })

      const result = await billingApi.getInvoices()

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/subscriptions/me/invoices',
      })
      expect(result).toEqual(mockInvoices)
    })

    it('should return empty array if no invoice data is found', async () => {
      apiRequest.mockResolvedValueOnce({})

      const result = await billingApi.getInvoices()

      expect(result).toEqual([])
    })
  })

  describe('getPayments', () => {
    it('should call payments endpoint and return payments list', async () => {
      const mockPayments = [{ paymentId: 'PAY-1' }]
      apiRequest.mockResolvedValueOnce({ data: mockPayments })

      const result = await billingApi.getPayments()

      expect(apiRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/subscriptions/me/payments',
      })
      expect(result).toEqual(mockPayments)
    })

    it('should return empty array if no payment data is found', async () => {
      apiRequest.mockResolvedValueOnce({})

      const result = await billingApi.getPayments()

      expect(result).toEqual([])
    })
  })
})
