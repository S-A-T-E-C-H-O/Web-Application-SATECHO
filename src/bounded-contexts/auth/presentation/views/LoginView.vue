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
            Portal de Agricultura de Precisión
          </p>
        </div>

        <!-- Form -->
        <form
            class="login-form"
            @submit.prevent
        >

          <!-- Email -->
          <div class="form-group">
            <label>
              Correo Electrónico
            </label>
            <input
                type="email"
                placeholder="ejemplo@satecho.com"
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label>
              Contraseña
            </label>
            <div class="password-input">
              <input
                  :type="showPassword ? 'text' : 'password'"
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
              <input type="checkbox" />
              <span>
                Mantenerme conectado
              </span>
            </label>
            <a href="#">
              Olvidé mi contraseña
            </a>
          </div>

          <!-- Submit -->
          <button
              type="submit"
              class="submit-button"
          >
            Iniciar Sesión
            <span class="material-symbols-outlined">
              login
            </span>
          </button>
        </form>

        <!-- Bottom -->
        <div class="bottom-section">
          <p>
            ¿No tienes una cuenta?
            <RouterLink to="/register/select-role">
              Crear cuenta
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
      Todos los derechos reservados.
    </p>
  </footer>
</template>

<script setup>
import { ref } from 'vue'

import AuthLayout from '@/shared/layouts/AuthLayout.vue'

const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
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