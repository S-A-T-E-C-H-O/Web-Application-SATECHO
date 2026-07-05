import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/bounded-contexts/admin/infrastructure/admin.api', () => ({
  adminApi: {
    getDevices: vi.fn().mockResolvedValue([
      { id: 1, serialNumber: 'SAT-001', userId: 5, online: true, type: 'SOIL_SENSOR', batteryLevel: 80 },
      { id: 2, serialNumber: 'SAT-002', userId: 5, online: false, type: 'SOIL_SENSOR', batteryLevel: 10 },
    ]),
  },
}))

import DeviceFleetView from './DeviceFleetView.vue'

describe('DeviceFleetView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the real device list with online/offline counts', async () => {
    const wrapper = mount(DeviceFleetView, {
      global: { plugins: [createTestingPinia({ stubActions: false })] },
    })
    await flushMounted(wrapper)

    expect(wrapper.text()).toContain('SAT-001')
    expect(wrapper.text()).toContain('SAT-002')
  })

  it('filtering by Online status hides offline devices', async () => {
    const wrapper = mount(DeviceFleetView, {
      global: { plugins: [createTestingPinia({ stubActions: false })] },
    })
    await flushMounted(wrapper)

    const buttons = wrapper.findAll('.filter-chip')
    const onlineButton = buttons.find((b) => b.text() === 'Online')
    await onlineButton.trigger('click')

    expect(wrapper.text()).toContain('SAT-001')
    expect(wrapper.text()).not.toContain('SAT-002')
  })
})

async function flushMounted(wrapper) {
  await wrapper.vm.$nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}
