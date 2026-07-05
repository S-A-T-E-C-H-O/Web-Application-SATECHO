import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/shared/infrastructure/http/api-client', () => ({
  apiRequest: vi.fn(),
}))

import { useDashboardAgronomistStore } from './dashboardAgronomist.store'
import { apiRequest } from '@/shared/infrastructure/http/api-client'

describe('dashboardAgronomist.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadDashboard reflects a genuinely empty priority-case list instead of keeping stale data', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { totalFarms: 0, onlineDevices: 0, offlineDevices: 0, errorDevices: 0 } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })

    const store = useDashboardAgronomistStore()
    expect(store.priorityCases).toEqual([])

    await store.loadDashboard()

    expect(store.priorityCases).toEqual([])
    expect(store.status).toBe('success')
  })

  it('loadDashboard maps the real PriorityCaseResource shape (no `cases` wrapper) into UI-ready entries', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: [
          { alertId: 42, farmerUserId: 7, farmId: 3, farmerName: 'Ana Torres', farmName: 'Finca Ana', alertType: 'EC_HIGH', severity: 'CRITICAL', createdAt: new Date().toISOString() },
        ],
      })
      .mockResolvedValueOnce({ data: [] })

    const store = useDashboardAgronomistStore()
    await store.loadDashboard()

    expect(store.priorityCases).toHaveLength(1)
    expect(store.priorityCases[0]).toMatchObject({
      id: '42',
      farmerId: 7,
      farmId: 3,
      parcelName: 'Finca Ana',
      type: 'critical',
    })
  })
})
