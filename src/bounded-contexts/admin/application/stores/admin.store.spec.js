import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/bounded-contexts/admin/infrastructure/admin.api', () => ({
  adminApi: {
    getUsers: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  },
}))

import { useAdminStore } from './admin.store'
import { adminApi } from '@/bounded-contexts/admin/infrastructure/admin.api'

describe('admin.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadUsers populates users on success', async () => {
    adminApi.getUsers.mockResolvedValue([{ id: 1, email: 'a@b.com', blocked: false }])
    const store = useAdminStore()

    await store.loadUsers()

    expect(store.users).toHaveLength(1)
    expect(store.status).toBe('success')
  })

  it('loadUsers surfaces an error without throwing', async () => {
    adminApi.getUsers.mockRejectedValue({ message: 'network down' })
    const store = useAdminStore()

    await store.loadUsers()

    expect(store.status).toBe('error')
    expect(store.error).toBe('network down')
  })

  it('blockUser marks the matching user as blocked locally after a successful call', async () => {
    adminApi.getUsers.mockResolvedValue([{ id: 1, email: 'a@b.com', blocked: false }])
    adminApi.blockUser.mockResolvedValue({})
    const store = useAdminStore()
    await store.loadUsers()

    await store.blockUser(1)

    expect(adminApi.blockUser).toHaveBeenCalledWith(1)
    expect(store.users[0].blocked).toBe(true)
  })
})
