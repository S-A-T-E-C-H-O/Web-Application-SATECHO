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
            {{ $t('auth.protectAccount') }}
          </h2>
          <p>
            {{ $t('auth.protectAccountDesc') }}
          </p>
        </div>
        <form class="register-form" @submit.prevent>

          <!-- PASSWORD -->
          <div class="input-group">
            <label>
              {{ $t('auth.password') }}
            </label>
            <div class="password-wrapper">
              <input
                  :type="showPassword ? 'text' : 'password'"
                  :value="password"
                  @input="emit('update:password', $event.target.value)"
                  :placeholder="$t('auth.min8')"
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
                ✓ {{ $t('auth.rule8') }}
              </span>
              <span :class="{ valid: passwordRules.uppercase }">
                ✓ {{ $t('auth.ruleUpper') }}
              </span>
              <span :class="{ valid: passwordRules.lowercase }">
                ✓ {{ $t('auth.ruleLower') }}
              </span>
              <span :class="{ valid: passwordRules.number }">
                ✓ {{ $t('auth.ruleNumber') }}
              </span>
            </div>
          </div>
          <!-- CONFIRM -->
          <div class="input-group">
            <label>
              {{ $t('auth.confirmPassword') }}
            </label>
            <div class="password-wrapper">
              <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :value="confirmPassword"
                  @input="emit('update:confirmPassword', $event.target.value)"
                  :placeholder="$t('auth.confirmPasswordPlaceholder')"
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
              {{ $t('auth.passwordMismatch') }}
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
                {{ $t('auth.acceptMarketing') }}
                <strong>{{ $t('auth.optional') }}</strong>
              </span>
            </label>
            <label class="checkbox-group">
              <input
                  type="checkbox"
                  :checked="acceptTerms"
                  @change="emit('update:acceptTerms', $event.target.checked)"
              >
              <span>
                {{ $t('auth.acceptTermsPrefix') }}
                <a href="#">
                  {{ $t('auth.terms') }}
                </a>
                {{ $t('auth.privacy') }}.
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
              {{ $t('general.back') }}
            </button>
            <button
                type="button"
                class="continue-button"
                :disabled="!canSubmit || isSubmitting"
                @click="emit('submit')"
            >
              {{ isSubmitting ? $t('auth.creating') : $t('auth.createAccount') }}
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
