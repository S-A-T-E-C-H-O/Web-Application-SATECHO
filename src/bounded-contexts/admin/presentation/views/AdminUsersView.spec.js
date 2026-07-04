import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/bounded-contexts/admin/infrastructure/admin.api', () => ({
  adminApi: {
    getUsers: vi.fn().mockResolvedValue([
      { id: 1, email: 'farmer@satecho.com', fullName: 'Farmer One', roles: ['ROLE_FARMER'], blocked: false, createdAt: null },
    ]),
    blockUser: vi.fn().mockResolvedValue({}),
    unblockUser: vi.fn().mockResolvedValue({}),
  },
}))

import AdminUsersView from './AdminUsersView.vue'
import { useAdminStore } from '@/bounded-contexts/admin/application/stores/admin.store'

describe('AdminUsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and renders users on mount', async () => {
    const wrapper = mount(AdminUsersView, {
      global: { plugins: [createTestingPinia({ stubActions: false })] },
    })
    await flushMounted(wrapper)

    expect(wrapper.text()).toContain('farmer@satecho.com')
    expect(wrapper.text()).toContain('Active')
  })

  it('clicking Block calls the store action with the user id', async () => {
    const wrapper = mount(AdminUsersView, {
      global: { plugins: [createTestingPinia({ stubActions: false })] },
    })
    await flushMounted(wrapper)

    const store = useAdminStore()
    await wrapper.find('button.outline-button').trigger('click')

    expect(store.blockUser).toHaveBeenCalledWith(1)
  })
})

async function flushMounted(wrapper) {
  await wrapper.vm.$nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}
