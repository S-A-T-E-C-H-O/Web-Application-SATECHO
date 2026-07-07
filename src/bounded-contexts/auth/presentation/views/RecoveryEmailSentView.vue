<template>
  <AuthLayout>

    <div class="recovery-wrapper">

      <div class="recovery-card">

        <!-- Icon -->

        <div class="logo-section">

          <div class="logo-box">
            <span class="material-symbols-outlined">
              mark_email_read
            </span>
          </div>

          <h1>
            Check your inbox
          </h1>

          <p>
            We've sent password recovery instructions to:
          </p>

          <strong class="email-text">
            {{ email }}
          </strong>

        </div>

        <!-- Feedback -->

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

        <!-- Actions -->

        <div class="actions">

          <button
              class="secondary-button"
              @click="resendInstructions"
              :disabled="cooldown > 0 || authStore.isLoading"
          >
            <span class="material-symbols-outlined">
              refresh
            </span>

            <template v-if="cooldown > 0">
              Resend in {{ cooldown }}s
            </template>

            <template v-else>
              Resend instructions
            </template>

          </button>

        </div>

        <!-- Footer -->

        <div class="bottom-section">

          <RouterLink to="/login">
            Back to Login
          </RouterLink>

        </div>

      </div>

    </div>

  </AuthLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const cooldown = ref(0)

let timer = null

const email = computed(() =>
    String(route.query.email || '')
)

const startCooldown = () => {
  cooldown.value = 30

  timer = setInterval(() => {
    cooldown.value--

    if (cooldown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const resendInstructions = async () => {
  try {
    await authStore.forgotPassword(
        email.value
    )

    startCooldown()
  } catch {
    //
  }
}

// The reset link now arrives by email with a real backend token
// (/reset-password?token=...), so there is no in-app shortcut to it.

onMounted(() => {
  if (!email.value) {
    router.replace('/forgot-password')
  }
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.recovery-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.recovery-card {
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
  font-size: 15px;
  word-break: break-word;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-button,
.secondary-button {
  height: 52px;

  border-radius: 12px;

  font-weight: 700;

  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  transition: .2s;
}

.primary-button {
  border: none;

  background: var(--color-primary-container);

  color: white;
}

.primary-button:hover {
  opacity: .9;
}

.secondary-button {
  border: 1px solid var(--color-outline);

  background: white;

  color: var(--color-primary);
}

.secondary-button:hover:not(:disabled) {
  background: rgba(0,0,0,.03);
}

.secondary-button:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.form-message {
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
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

.bottom-section a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}

.bottom-section a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .recovery-card {
    padding: 24px;
  }
}
</style>