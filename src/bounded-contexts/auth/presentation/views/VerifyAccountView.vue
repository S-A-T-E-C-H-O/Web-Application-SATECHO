<script setup>
import AuthLayout from "@/shared/layouts/AuthLayout.vue";

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const verificationEmail = computed(
  () => route.query.email || authStore.pendingVerificationEmail
)

const resendVerificationEmail = async () => {
  if (!verificationEmail.value) return

  try {
    await authStore.resendVerificationEmail(verificationEmail.value)
  } catch {
    return
  }
}

const confirmAccount = async () => {
  try {
    await authStore.confirmVerification({
      email: verificationEmail.value,
      token: route.query.token || 'beeceptor-demo-token',
    })

    router.push({
      path: '/email-confirmation',
      query: { email: verificationEmail.value },
    })
  } catch {
    return
  }
}
</script>
<template>
  <AuthLayout>
    <div class="verify-page">

      <!-- TOPBAR -->
      <header class="topbar">
        <div class="topbar-content">
          <h1>SATECHO</h1>
          <button class="language-button">
          <span class="material-symbols-outlined">
            language
          </span>
            {{ $i18n.locale.toUpperCase() }}
          </button>
        </div>
      </header>

      <!-- MAIN -->
      <main class="verify-main">

        <section class="verify-card">

          <!-- ICON -->
          <div class="icon-wrapper">
            <span class="material-symbols-outlined">
              mark_email_read
            </span>
          </div>

          <!-- TEXT -->
          <h2>
            {{ $t('auth.verifyTitle') }}
          </h2>

          <p>
            {{ $t('auth.verifyDesc') }}
          </p>

          <p
              v-if="verificationEmail"
              class="email-target"
          >
            {{ verificationEmail }}
          </p>

          <!-- ACTION -->
          <button
              class="open-mail-button"
              :disabled="authStore.isLoading"
              @click="confirmAccount"
          >
            <span class="material-symbols-outlined">
              open_in_new
            </span>

            {{ authStore.isLoading ? $t('auth.verifying') : $t('auth.openMail') }}
          </button>

          <!-- RESEND -->
          <button
              class="resend-button"
              :disabled="authStore.isLoading || !verificationEmail"
              @click="resendVerificationEmail"
          >
            {{ $t('auth.resendQuestion') }}
          </button>

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

          <!-- INFO -->
          <div class="expiration-info">
            <span class="material-symbols-outlined">
              schedule
            </span>
            <span>
              {{ $t('auth.expires24h') }}
            </span>
          </div>
        </section>
      </main>
    </div>
  </AuthLayout>
  <!-- FOOTER -->
  <footer class="footer">
    <p>
      © 2024 SATECHO Precision Agriculture.
      {{ $t('general.footerRights') }}
    </p>
  </footer>
</template>

<style scoped>

.verify-page {
  min-height: 100vh;
  background: #faf9f5;
  display: flex;
  flex-direction: column;
}

/* TOPBAR */

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 72px;
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #ececec;
  z-index: 10;
}

.topbar-content {
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
}

.language-button {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* MAIN */

.verify-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120px 24px 00px;
}

/* CARD */

.verify-card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 28px;
  border: 1px solid #ececec;
  padding: 48px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,.05);
}

.icon-wrapper {
  width: 90px;
  height: 90px;
  margin: 0 auto 28px;
  border-radius: 999px;
  background: #dff0de;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper span {
  font-size: 48px;
  color: var(--color-primary);
}

.verify-card h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 18px;
}

.verify-card p {
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
}

.email-target {
  background: rgba(71, 102, 73, 0.08);
  border-radius: 12px;
  color: var(--color-primary);
  font-weight: 700;
  margin: -16px 0 28px;
  padding: 12px;
  word-break: break-word;
}

/* BUTTON */

.open-mail-button {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: .25s;
}

.open-mail-button:hover {
  transform: translateY(-2px);
}

.open-mail-button:disabled,
.resend-button:disabled {
  cursor: not-allowed;
  opacity: .65;
  transform: none;
}

.resend-button {
  margin-top: 24px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
}

.resend-button:hover {
  text-decoration: underline;
}

/* INFO */

.expiration-info {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #ececec;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
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

@media (max-width: 768px) {

  .verify-card {
    padding: 36px 24px;
  }

  .verify-card h2 {
    font-size: 26px;
  }

  .footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
