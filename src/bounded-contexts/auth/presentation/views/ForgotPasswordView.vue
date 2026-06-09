<template>
  <AuthLayout>

    <div class="forgot-wrapper">

      <div class="forgot-card">

        <div class="logo-section">

          <div class="logo-box">
            <span class="material-symbols-outlined">
              lock_reset
            </span>
          </div>

          <h1>
            Forgot Password
          </h1>

          <p>
            Enter the email associated with your account and we'll send recovery instructions.
          </p>

        </div>

        <form
            class="forgot-form"
            @submit.prevent="handleSubmit"
        >

          <div class="form-group">

            <label>
              Email
            </label>

            <input
                type="email"
                v-model.trim="email"
                :disabled="authStore.isLoading"
                placeholder="name@example.com"
                required
            />

          </div>

          <p
              v-if="validationError"
              class="form-message error-message"
          >
            {{ validationError }}
          </p>

          <p
              v-else-if="authStore.error"
              class="form-message error-message"
          >
            {{ authStore.error }}
          </p>

          <p
              v-else-if="authStore.feedback"
              class="form-message success-message"
          >
            {{ authStore.feedback }}
          </p>

          <button
              type="submit"
              class="submit-button"
              :disabled="authStore.isLoading"
          >

            {{
              authStore.isLoading
                  ? 'Sending...'
                  : 'Send recovery instructions'
            }}

            <span class="material-symbols-outlined">
              send
            </span>

          </button>

        </form>

        <div class="bottom-section">

          <RouterLink
              to="/login"
          >
            Back to Login
          </RouterLink>

        </div>

      </div>

    </div>

  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const validationError = ref('')

const validateForm = () => {
  validationError.value = ''

  if (!email.value.trim()) {
    validationError.value = 'Email is required.'
    return false
  }

  const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.value)) {
    validationError.value =
        'Please enter a valid email address.'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.forgotPassword(
        email.value
    )

    await router.push({
      name: 'recovery-email-sent',
      query: {
        email: email.value,
      },
    })
  } catch {
    //
  }
}
</script>

<style scoped>
.forgot-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.forgot-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-primary-container);
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-box span {
  color: white;
  font-size: 32px;
}

.logo-section h1 {
  color: var(--color-primary);
  font-size: 30px;
  font-weight: 700;
}

.logo-section p {
  text-align: center;
  color: var(--color-text-secondary);
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
}

.form-group input {
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 16px;
  outline: none;
}

.form-group input:focus {
  border-color: var(--color-primary);
}

.submit-button {
  height: 52px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary-container);
  color: white;
  font-weight: 700;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.submit-button:disabled {
  opacity: .65;
}

.form-message {
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}

.error-message {
  background: rgba(217,75,75,.08);
  color: #9b2f2f;
}

.success-message {
  background: rgba(78,155,78,.08);
  color: #2e7d32;
}

.bottom-section {
  border-top: 1px solid #ececec;
  padding-top: 20px;
  text-align: center;
}

.bottom-section a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}
</style>