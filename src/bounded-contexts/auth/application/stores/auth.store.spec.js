import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/bounded-contexts/auth/infrastructure/auth.api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}))

import { useAuthStore } from './auth.store'
import { authApi } from '@/bounded-contexts/auth/infrastructure/auth.api'

describe('auth.store password flows', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  it('forgotPassword calls the real API with the email', async () => {
    authApi.forgotPassword.mockResolvedValue({ email: 'a@b.com', message: 'sent' })
    const store = useAuthStore()

    const result = await store.forgotPassword('a@b.com')

    expect(authApi.forgotPassword).toHaveBeenCalledWith('a@b.com')
    expect(result.message).toBe('sent')
    expect(store.status).toBe('success')
  })

  it('forgotPassword fails without email and does not call the API', async () => {
    const store = useAuthStore()

    await expect(store.forgotPassword('')).rejects.toBeTruthy()

    expect(authApi.forgotPassword).not.toHaveBeenCalled()
    expect(store.status).toBe('error')
  })

  it('forgotPassword surfaces API errors instead of faking success', async () => {
    authApi.forgotPassword.mockRejectedValue({ message: 'Service unavailable' })
    const store = useAuthStore()

    await expect(store.forgotPassword('a@b.com')).rejects.toBeTruthy()

    expect(store.status).toBe('error')
    expect(store.error).toBe('Service unavailable')
  })

  it('resetPassword sends token and newPassword to the API', async () => {
    authApi.resetPassword.mockResolvedValue({ success: true, message: 'updated' })
    const store = useAuthStore()

    await store.resetPassword({ token: 'tok-123', newPassword: 'Str0ngPass' })

    expect(authApi.resetPassword).toHaveBeenCalledWith({
      token: 'tok-123',
      newPassword: 'Str0ngPass',
    })
    expect(store.status).toBe('success')
  })

  it('resetPassword rejects a missing token without calling the API', async () => {
    const store = useAuthStore()

    await expect(
      store.resetPassword({ token: '', newPassword: 'Str0ngPass' })
    ).rejects.toBeTruthy()

    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('resetPassword rejects short passwords without calling the API', async () => {
    const store = useAuthStore()

    await expect(
      store.resetPassword({ token: 'tok-123', newPassword: 'short' })
    ).rejects.toBeTruthy()

    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('changePassword calls POST /me/change-password payload contract', async () => {
    authApi.changePassword.mockResolvedValue({ success: true, message: 'ok' })
    const store = useAuthStore()

    const result = await store.changePassword('OldPass123', 'NewPass456')

    expect(authApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
    })
    expect(result).toBe(true)
  })

  it('changePassword propagates API failure', async () => {
    authApi.changePassword.mockRejectedValue({ message: 'Current password is wrong' })
    const store = useAuthStore()

    await expect(store.changePassword('bad', 'NewPass456')).rejects.toBeTruthy()

    expect(store.status).toBe('error')
    expect(store.error).toBe('Current password is wrong')
  })
})
