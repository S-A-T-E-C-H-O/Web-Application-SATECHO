<template>
  <AuthLayout>

    <div class="success-wrapper">

      <div class="success-card">

        <!-- Icon -->

        <div class="logo-section">

          <div class="success-icon">
            <span class="material-symbols-outlined">
              check_circle
            </span>
          </div>

          <h1>
            Password Updated
          </h1>

          <p>
            Your password has been successfully updated.
          </p>

          <p class="secondary-text">
            You can now sign in using your new password.
          </p>

        </div>

        <!-- Success Message -->

        <div
            v-if="authStore.feedback"
            class="form-message success-message"
        >
          {{ authStore.feedback }}
        </div>

        <!-- Actions -->

        <button
            class="submit-button"
            @click="goToLogin"
        >
          <span class="material-symbols-outlined">
            login
          </span>

          Go to Login
        </button>

      </div>

    </div>

  </AuthLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const goToLogin = async () => {
  authStore.status = 'idle'
  authStore.error = ''
  authStore.feedback = ''

  await router.push('/login')
}

onMounted(() => {
  authStore.error = ''
})
</script>

<style scoped>
.success-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.success-card {
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

  text-align: center;

  gap: var(--spacing-sm);
}

.success-icon {
  width: 80px;
  height: 80px;

  border-radius: 50%;

  display: flex;
  justify-content: center;
  align-items: center;

  background: rgba(78, 155, 78, 0.12);
}

.success-icon span {
  font-size: 44px;
  color: #2e7d32;
}

.logo-section h1 {
  font-size: 30px;
  font-weight: 700;

  color: var(--color-primary);
}

.logo-section p {
  color: var(--color-text-secondary);
}

.secondary-text {
  font-size: 14px;
}

.form-message {
  border-radius: 12px;

  padding: 12px 14px;

  font-size: 14px;

  text-align: center;
}

.success-message {
  background: rgba(78, 155, 78, 0.08);
  color: #2e7d32;
}

.submit-button {
  height: 52px;

  border: none;

  border-radius: 12px;

  background: var(--color-primary-container);

  color: white;

  font-weight: 700;

  cursor: pointer;

  transition: .2s;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.submit-button:hover {
  opacity: .9;
}

@media (max-width: 640px) {
  .success-card {
    padding: 24px;
  }
}
</style>