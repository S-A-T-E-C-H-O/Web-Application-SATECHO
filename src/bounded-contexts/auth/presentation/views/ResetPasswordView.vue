<template>
  <AuthLayout>

    <div class="reset-wrapper">

      <div class="reset-card">

        <!-- Header -->

        <div class="logo-section">

          <div class="logo-box">
            <span class="material-symbols-outlined">
              password
            </span>
          </div>

          <h1>
            Create a new password
          </h1>

          <p>
            Choose a secure password for your account.
          </p>

          <strong class="email-text">
            {{ email }}
          </strong>

        </div>

        <!-- Form -->

        <form
            class="reset-form"
            @submit.prevent="handleSubmit"
        >

          <!-- Password -->

          <div class="form-group">

            <label>
              New password
            </label>

            <div class="password-input">

              <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  :disabled="authStore.isLoading"
                  placeholder="••••••••"
                  required
              />

              <button
                  type="button"
                  class="eye-button"
                  @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined">
                  {{
                    showPassword
                        ? 'visibility_off'
                        : 'visibility'
                  }}
                </span>
              </button>

            </div>

          </div>

          <!-- Confirm -->

          <div class="form-group">

            <label>
              Confirm password
            </label>

            <div class="password-input">

              <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="confirmPassword"
                  :disabled="authStore.isLoading"
                  placeholder="••••••••"
                  required
              />

              <button
                  type="button"
                  class="eye-button"
                  @click="showConfirmPassword = !showConfirmPassword"
              >
                <span class="material-symbols-outlined">
                  {{
                    showConfirmPassword
                        ? 'visibility_off'
                        : 'visibility'
                  }}
                </span>
              </button>

            </div>

          </div>

          <!-- Rules -->

          <div class="password-rules">

            <div :class="['rule', password.length >= 8 ? 'valid' : '']">
              Minimum 8 characters
            </div>

            <div :class="['rule', hasUppercase ? 'valid' : '']">
              One uppercase letter
            </div>

            <div :class="['rule', hasLowercase ? 'valid' : '']">
              One lowercase letter
            </div>

            <div :class="['rule', hasNumber ? 'valid' : '']">
              One number
            </div>

          </div>

          <!-- Validation -->

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

          <!-- Submit -->

          <button
              type="submit"
              class="submit-button"
              :disabled="authStore.isLoading"
          >

            {{
              authStore.isLoading
                  ? 'Updating...'
                  : 'Update password'
            }}

            <span class="material-symbols-outlined">
              check_circle
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const validationError = ref('')

const email = computed(() =>
    String(route.query.email || '')
)

// The recovery email links here as /reset-password?token=... — the token is
// what the backend requires; the email is only informative.
const token = computed(() =>
    String(route.query.token || '')
)

const hasUppercase = computed(() =>
    /[A-Z]/.test(password.value)
)

const hasLowercase = computed(() =>
    /[a-z]/.test(password.value)
)

const hasNumber = computed(() =>
    /\d/.test(password.value)
)

const validateForm = () => {
  validationError.value = ''

  if (!password.value) {
    validationError.value =
        'Password is required.'
    return false
  }

  if (password.value.length < 8) {
    validationError.value =
        'Password must contain at least 8 characters.'
    return false
  }

  if (!hasUppercase.value) {
    validationError.value =
        'Password must contain at least one uppercase letter.'
    return false
  }

  if (!hasLowercase.value) {
    validationError.value =
        'Password must contain at least one lowercase letter.'
    return false
  }

  if (!hasNumber.value) {
    validationError.value =
        'Password must contain at least one number.'
    return false
  }

  if (password.value !== confirmPassword.value) {
    validationError.value =
        'Passwords do not match.'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.resetPassword({
      token: token.value,
      newPassword: password.value,
    })

    await router.push({
      name: 'password-updated',
    })
  } catch {
    //
  }
}

onMounted(() => {
  if (!token.value) {
    router.replace('/forgot-password')
  }
})
</script>

<style scoped>
.reset-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.reset-card {
  width: 100%;
  max-width: 500px;

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

  text-align: center;
}

.logo-box {
  width: 72px;
  height: 72px;

  border-radius: 18px;

  background: var(--color-primary-container);

  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-box span {
  color: white;
  font-size: 34px;
}

.logo-section h1 {
  font-size: 30px;
  font-weight: 700;

  color: var(--color-primary);
}

.logo-section p {
  color: var(--color-text-secondary);
}

.email-text {
  color: var(--color-primary);
  word-break: break-word;
}

.reset-form {
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

.password-input {
  position: relative;
}

.password-input input {
  width: 100%;

  height: 48px;

  border-radius: 12px;

  border: 1px solid var(--color-outline);

  padding: 0 52px 0 16px;

  outline: none;
}

.password-input input:focus {
  border-color: var(--color-primary);
}

.eye-button {
  position: absolute;

  right: 14px;
  top: 50%;

  transform: translateY(-50%);

  border: none;
  background: transparent;

  cursor: pointer;
}

.password-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.rule.valid {
  color: #2e7d32;
  font-weight: 600;
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
  cursor: not-allowed;
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

.bottom-section a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .reset-card {
    padding: 24px;
  }
}
</style>