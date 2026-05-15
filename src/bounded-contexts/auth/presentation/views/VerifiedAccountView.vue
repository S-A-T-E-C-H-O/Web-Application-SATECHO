<template>
  <div class="verification-page">

    <!-- HEADER -->
    <header class="simple-header">
      <h1>
        SATECHO
      </h1>
    </header>

    <!-- MAIN -->
    <main class="verification-main">

      <!-- ILLUSTRATION -->
      <div class="illustration-wrapper">

        <div class="illustration-circle">

          <div class="circle-decoration top" />
          <div class="circle-decoration bottom" />

          <span class="material-symbols-outlined mail-icon">
            mark_email_unread
          </span>

        </div>

      </div>

      <!-- CONTENT -->
      <div class="content-section">

        <h2>
          {{ $t('auth.verified') }}
        </h2>

      </div>

      <!-- ACTIONS -->
      <div class="actions-section">

        <button
            class="resend-button"
            @click="router.push('/onboarding')"
        >
          {{ $t('auth.enterSystem') }}
        </button>
      </div>

    </main>

    <!-- FOOTER -->
    <footer class="footer">

      <div class="login-link">

        <span class="material-symbols-outlined">
          chevron_left
        </span>

        <RouterLink to="/login">
          {{ $t('general.back') }}
        </RouterLink>

      </div>

      <p>
        © 2024 SATECHO. Intelligent Stewardship.
      </p>

    </footer>

  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const email = route.query.email || ''

</script>

<style scoped>

.verification-page {
  min-height: 100vh;
  background: #faf9f5;
  display: flex;
  flex-direction: column;
}

/* HEADER */

.simple-header {
  width: 100%;
  padding: 32px 24px;
  display: flex;
  justify-content: center;
}

.simple-header h1 {
  font-size: 30px;
  font-weight: 800;
  color: var(--color-primary);
}

/* MAIN */

.verification-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  text-align: center;
}

/* ILLUSTRATION */

.illustration-wrapper {
  margin-bottom: 42px;
}

.illustration-circle {
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: #f1f3ec;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.circle-decoration {
  position: absolute;
  border-radius: 999px;
}

.circle-decoration.top {
  width: 100px;
  height: 100px;
  background: rgba(122, 154, 122, .12);
  top: -10px;
  right: -10px;
}

.circle-decoration.bottom {
  width: 70px;
  height: 70px;
  background: rgba(91, 120, 91, .08);
  bottom: -10px;
  left: -10px;
}

.mail-icon {
  font-size: 110px;
  color: #7a9a7a;
}

/* CONTENT */

.content-section {
  max-width: 620px;
}

.content-section h2 {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 18px;
  color: #1a1c1a;
}

.content-section p {
  font-size: 17px;
  line-height: 1.9;
  color: #5f655f;
}

.content-section strong {
  color: #1a1c1a;
}

/* ACTIONS */

.actions-section {
  margin-top: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.resend-button {
  min-width: 320px;
  height: 56px;
  border-radius: 16px;
  border: 1px solid #575f6c;
  background: transparent;
  color: #575f6c;
  font-weight: 700;
  cursor: pointer;
  transition: .25s;
}

.resend-button:hover {
  background: #f1f1ed;
}

.timer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b6f6a;
  font-size: 14px;
}

/* FOOTER */

.footer {
  border-top: 1px solid #ececec;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
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

.footer p {
  font-size: 13px;
  color: #999;
}

@media (max-width: 768px) {

  .illustration-circle {
    width: 210px;
    height: 210px;
  }

  .mail-icon {
    font-size: 82px;
  }

  .content-section h2 {
    font-size: 32px;
  }

  .resend-button {
    width: 100%;
    min-width: unset;
  }

  .footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
