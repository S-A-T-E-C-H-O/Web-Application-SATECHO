<script setup>
import { ref } from 'vue'

defineProps({
  password: String,
  confirmPassword: String,
  showPassword: Boolean,
  showConfirmPassword: Boolean,
  acceptTerms: Boolean,
  acceptMarketing: Boolean,
  passwordRules: Object,
  isPasswordStrong: Boolean,
  passwordsMatch: Boolean,
  canSubmit: Boolean,
  isSubmitting: Boolean,
  submitError: String,
  submitFeedback: String
})

const emit = defineEmits([
  'update:password',
  'update:confirmPassword',
  'toggle-password',
  'toggle-confirm-password',
  'update:acceptTerms',
  'update:acceptMarketing',
  'back',
  'submit'
])
</script>

<template>
  <section class="step-two-wrapper">
    <div class="register-card">
      <div class="register-content">
        <div class="register-header">
          <h2>
            Protege tu cuenta
          </h2>
          <p>
            Configura tu contraseña para finalizar el proceso
            de registro en SATECHO.
          </p>
        </div>
        <form class="register-form" @submit.prevent>

          <!-- PASSWORD -->
          <div class="input-group">
            <label>
              Contraseña
            </label>
            <div class="password-wrapper">
              <input
                  :type="showPassword ? 'text' : 'password'"
                  :value="password"
                  @input="emit('update:password', $event.target.value)"
                  placeholder="Mínimo 8 caracteres"
                  :class="{ invalid: password.length > 0 && !isPasswordStrong }"
              >
              <button
                  type="button"
                  class="toggle-password"
                  @click="emit('toggle-password')"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>

            <!-- RULES -->
            <div class="password-rules">
              <span :class="{ valid: passwordRules.minLength }">
                ✓ 8 caracteres
              </span>
              <span :class="{ valid: passwordRules.uppercase }">
                ✓ Mayúscula
              </span>
              <span :class="{ valid: passwordRules.lowercase }">
                ✓ Minúscula
              </span>
              <span :class="{ valid: passwordRules.number }">
                ✓ Número
              </span>
            </div>
          </div>
          <!-- CONFIRM -->
          <div class="input-group">
            <label>
              Confirmar Contraseña
            </label>
            <div class="password-wrapper">
              <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :value="confirmPassword"
                  @input="emit('update:confirmPassword', $event.target.value)"
                  placeholder="Repite tu contraseña"
                  :class="{ invalid: confirmPassword.length > 0 && !passwordsMatch }"
              >
              <button
                  type="button"
                  class="toggle-password"
                  @click="emit('toggle-confirm-password')"
              >
                <span class="material-symbols-outlined">
                  {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <p
                v-if="confirmPassword.length > 0 && !passwordsMatch"
                class="error-text"
            >
              Las contraseñas no coinciden
            </p>
          </div>
          <!-- CHECKBOXES -->
          <div class="agreements">
            <label class="checkbox-group">
              <input
                  type="checkbox"
                  :checked="acceptMarketing"
                  @change="emit('update:acceptMarketing', $event.target.checked)"
              >
              <span>
                Acepto recibir comunicaciones comerciales,
                actualizaciones y recomendaciones.
                <strong>(Opcional)</strong>
              </span>
            </label>
            <label class="checkbox-group">
              <input
                  type="checkbox"
                  :checked="acceptTerms"
                  @change="emit('update:acceptTerms', $event.target.checked)"
              >
              <span>
                He leído y acepto los
                <a href="#">
                  Términos y Condiciones
                </a>
                y la Política de Privacidad.
              </span>
            </label>
          </div>

          <p
              v-if="submitError"
              class="form-message error-message"
          >
            {{ submitError }}
          </p>

          <p
              v-else-if="submitFeedback"
              class="form-message success-message"
          >
            {{ submitFeedback }}
          </p>

          <!-- ACTIONS -->
          <div class="form-actions">
            <button
                type="button"
                class="back-button"
                @click="emit('back')"
            >
              <span class="material-symbols-outlined">
                arrow_back
              </span>
              Atrás
            </button>
            <button
                type="button"
                class="continue-button"
                :disabled="!canSubmit || isSubmitting"
                @click="emit('submit')"
            >
              {{ isSubmitting ? 'Creando...' : 'Crear Cuenta' }}
              <span class="material-symbols-outlined">
                rocket_launch
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
