<template>
  <AuthLayout>

    <div class="login-wrapper">

      <div class="login-card">

        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-box">
            <span class="material-symbols-outlined">
              agriculture
            </span>
          </div>
          <h1>SATECHO</h1>
          <p>
            {{ $t('auth.portalTitle') }}
          </p>
        </div>

        <!-- Form -->
        <form
            class="login-form"
            @submit.prevent="handleLogin"
        >

          <!-- Email -->
          <div class="form-group">
            <label>
              {{ $t('auth.email') }}
            </label>
            <input
                type="email"
                :placeholder="$t('auth.emailPlaceholder')"
                v-model.trim="email"
                :disabled="authStore.isLoading"
                required
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label>
              {{ $t('auth.password') }}
            </label>
            <div class="password-input">
              <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  :disabled="authStore.isLoading"
                  required
                  placeholder="••••••••"
              />
              <button
                  type="button"
                  class="eye-button"
                  @click="togglePassword"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Utilities -->
          <div class="utilities">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" />
              <span>
                {{ $t('auth.rememberMe') }}
              </span>
            </label>
            <RouterLink to="/forgot-password">
              {{ $t('auth.forgotPassword') }}
            </RouterLink>
          </div>

          <p
              v-if="authStore.error"
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
            {{ authStore.isLoading ? $t('auth.validating') : $t('auth.login') }}
            <span class="material-symbols-outlined">
              login
            </span>
          </button>
        </form>

        <!-- Bottom -->
        <div class="bottom-section">
          <p>
            {{ $t('auth.noAccount') }}
            <RouterLink to="/register/select-role">
              {{ $t('auth.createAccount') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </AuthLayout>
  <!-- Footer -->
  <footer class="footer">
    <p>
      © 2024 SATECHO Precision Agriculture.
      {{ $t('general.footerRights') }}
    </p>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const showPassword = ref(false)
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  let session

  try {
    session = await authStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })
  } catch {
    return
  }

  if (session.requiresVerification) {
    router.push({
      path: '/verify-account',
      query: { email: email.value },
    })
    return
  }

  if (session.user && session.user.role) {
    window.localStorage.setItem('userRole', session.user.role)
  }

  const role = window.localStorage.getItem('userRole')
  if (role === 'agronomist') {
    router.push('/onboarding-agronomist')
  } else {
    router.push('/onboarding')
  }
}
</script>

<style scoped>
.login-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.login-card {
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
  font-size: 32px;
  color: white;
}

.logo-section h1 {
  color: var(--color-primary);
  font-size: 32px;
  font-weight: 700;
}

.logo-section p {
  color: var(--color-text-secondary);
  text-align: center;
}

.login-form {
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
  font-size: 14px;
  font-weight: 600;
}

.form-group input {
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 16px;
  font-size: 15px;
  outline: none;
  width: 100%;
}

.form-group input:focus {
  border-color: var(--color-primary);
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 52px;
}

.eye-button {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.utilities {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-me span {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.utilities a {
  font-size: 14px;
  color: var(--color-primary);
  text-decoration: none;
}

.utilities a:hover {
  text-decoration: underline;
}

.submit-button {
  margin-top: 8px;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary-container);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.submit-button:hover {
  opacity: 0.9;
}

.submit-button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.form-message {
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 14px;
}

.error-message {
  background: rgba(217, 75, 75, 0.08);
  color: #9b2f2f;
}

.success-message {
  background: rgba(78, 155, 78, 0.08);
  color: #2e7d32;
}

.bottom-section {
  border-top: 1px solid #ececec;
  padding-top: 20px;
  text-align: center;
}

.bottom-section p {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.bottom-section a {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
}

.bottom-section a:hover {
  text-decoration: underline;
}

.login-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.login-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}

.login-link a:hover {
  text-decoration: underline;
}

/* FOOTER */

.footer {
  border-top: 1px solid #ececec;
  padding: 24px;
  text-align: center;
}

.footer p {
  color: #999;
  font-size: 13px;
}

@media (max-width: 640px) {
  .login-card {
    padding: 24px;
  }

  .utilities {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
