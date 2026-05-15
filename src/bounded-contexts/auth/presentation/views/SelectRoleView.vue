<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { countries } from '@/shared/constants/countries'
import {
  validateFullName,
  validateEmail,
  validatePhone,
  getPasswordRules
} from '@/shared/utils/validators'

import RegisterProgress from '@/bounded-contexts/auth/presentation/components/RegisterProgress.vue'
import RoleSelectionStep from '@/bounded-contexts/auth/presentation/components/RoleSelectionStep.vue'
import PersonalInformationStep from "@/bounded-contexts/auth/presentation/components/PersonalInformationStep.vue";
import SecurityStep from '@/bounded-contexts/auth/presentation/components/SecurityStep.vue'
import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const currentStep = ref(1)
const stepTitles = {
  1: 'auth.step1',
  2: 'auth.step2',
  3: 'auth.step3',
}

/* VALIDACIONES */
const fullNameError = computed(() =>
    validateFullName(fullName.value)
)

const emailError = computed(() =>
    validateEmail(email.value)
)

const phoneError = computed(() =>
    validatePhone(phone.value)
)

const passwordRules = computed(() =>
    getPasswordRules(password.value)
)

const currentStepTitle = computed(
    () => t(stepTitles[currentStep.value])
)

const progressWidth = computed(() => {
  return `${(currentStep.value / 3) * 100}%`
})
const selectedRole = ref(null)
const fullName = ref('')
const email = ref('')
const phone = ref('')

const selectedCountry = ref(countries[0])

const isCountryDropdownOpen = ref(false)

const selectCountry = (country) => {
  selectedCountry.value = country
  isCountryDropdownOpen.value = false
}

const isStepTwoValid = computed(() => {

  return (
      fullName.value &&
      email.value &&
      phone.value &&
      !fullNameError.value &&
      !emailError.value &&
      !phoneError.value
  )
})
const selectRole = (role) => {
  selectedRole.value = role
  currentStep.value = 2
}

const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const acceptTerms = ref(false)
const acceptMarketing = ref(false)

const isPasswordStrong = computed(() => {
  return Object.values(passwordRules.value).every(Boolean)
})

const passwordsMatch = computed(() => {
  return password.value === confirmPassword.value
})

const canSubmit = computed(() => {
  return (
      isPasswordStrong.value &&
      passwordsMatch.value &&
      acceptTerms.value
  )
})

const submitRegistration = async () => {
  try {
    await authStore.register({
      role: selectedRole.value,
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      countryCode: selectedCountry.value.code,
      password: password.value,
      acceptTerms: acceptTerms.value,
      acceptMarketing: acceptMarketing.value,
    })

    router.push({
      path: '/verify-account',
      query: { email: email.value },
    })
  } catch {
    return
  }
}
</script>

<template>
  <div class="role-page">

    <!-- Header -->
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

    <!-- Main -->
    <main class="main-content">

      <RegisterProgress
          :current-step="currentStep"
          :current-step-title="currentStepTitle"
          :progress-width="progressWidth"
      />

      <!-- Cards -->
      <Transition
          name="fade"
          mode="out-in"
      >

        <!-- STEP 1 -->
        <RoleSelectionStep
            v-if="currentStep === 1"
            @select-role="selectRole"
        />

        <!-- STEP 2 -->
        <PersonalInformationStep
            v-else-if="currentStep === 2"

            :full-name="fullName"
            :full-name-error="fullNameError"

            :email="email"
            :email-error="emailError"

            :phone="phone"
            :phone-error="phoneError"

            :selected-country="selectedCountry"
            :countries="countries"

            :is-country-dropdown-open="isCountryDropdownOpen"

            :is-step-two-valid="isStepTwoValid"

            @update:fullName="fullName = $event"
            @update:email="email = $event"
            @update:phone="phone = $event"

            @toggle-country-dropdown="
            isCountryDropdownOpen =
            !isCountryDropdownOpen "

            @select-country="selectCountry"

            @back="currentStep = 1"
            @continue="currentStep = 3"
        />

        <!-- STEP 3 -->
        <SecurityStep
            v-else-if="currentStep === 3"
            :password="password"
            :confirm-password="confirmPassword"
            :show-password="showPassword"
            :show-confirm-password="showConfirmPassword"
            :password-rules="passwordRules"
            :is-password-strong="isPasswordStrong"
            :passwords-match="passwordsMatch"
            :accept-terms="acceptTerms"
            :accept-marketing="acceptMarketing"
            :can-submit="canSubmit"
            :is-submitting="authStore.isLoading"
            :submit-error="authStore.error"
            :submit-feedback="authStore.feedback"
            @update:password="password = $event"
            @update:confirmPassword="confirmPassword = $event"
            @update:showPassword="showPassword = $event"
            @update:showConfirmPassword="showConfirmPassword = $event"
            @update:acceptTerms="acceptTerms = $event"
            @update:acceptMarketing="acceptMarketing = $event"
            @toggle-password="showPassword = !showPassword"
            @toggle-confirm-password="showConfirmPassword = !showConfirmPassword"
            @back="currentStep = 2"
            @submit="submitRegistration"
        />

      </Transition>
    </main>

    <!-- Footer -->
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
