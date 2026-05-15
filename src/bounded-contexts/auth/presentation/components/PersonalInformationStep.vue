<script setup>
import {countries} from "@/shared/constants/countries.js";
defineProps({
  fullName: String,
  fullNameError: String,

  email: String,
  emailError: String,

  phone: String,
  phoneError: String,

  selectedCountry: Object,
  countries: Array,

  isCountryDropdownOpen: Boolean,

  isStepTwoValid: Boolean
})

const emit = defineEmits([
  'update:fullName',
  'update:email',
  'update:phone',

  'toggle-country-dropdown',
  'select-country',

  'back',
  'continue'
])
</script>

<template>
  <section class="step-two-wrapper">
    <div class="register-card">
      <div class="register-content">
        <div class="register-header">
          <h2>
            {{ $t('auth.aboutYou') }}
          </h2>
          <p>
            {{ $t('auth.aboutYouDesc') }}
          </p>
        </div>
        <form class="register-form">

          <!-- Nombre -->
          <div class="input-group">
            <label>
              {{ $t('auth.fullName') }}
            </label>
            <div class="input-wrapper"
                 :class="{    success: fullName && !fullNameError, error: fullNameError}">
              <input
                  :value="fullName"
                  @input="emit('update:fullName', $event.target.value)"
                  type="text"
                  :placeholder="$t('auth.fullNamePlaceholder')"
              />
              <span v-if="fullName && !fullNameError" class="material-symbols-outlined success-icon">
                          check_circle
                        </span>
              <span v-if="fullNameError" class="material-symbols-outlined error-icon">
                          error
                        </span>
            </div>
            <small
                v-if="fullName && !fullNameError"
                class="success-text"
            >
              {{ $t('auth.validName') }}
            </small>
            <small
                v-if="fullNameError"
                class="error-text"
            >
              {{ fullNameError }}
            </small>
          </div>

          <!-- Email -->
          <div class="input-group">
            <label>
              {{ $t('auth.email') }}
            </label>
            <div class="input-wrapper" :class="{ success: email && !emailError, error: emailError}">
              <input
                  :value="email"
                  @input="emit('update:email', $event.target.value)"
                  type="email"
                  :placeholder="$t('auth.emailPlaceholder')"
              />
              <span v-if="email && !emailError" class="material-symbols-outlined success-icon">
                          check_circle
                        </span>
              <span v-if="emailError" class="material-symbols-outlined error-icon">
                          error
                        </span>
            </div>
            <small
                v-if="email && !emailError"
                class="success-text"
            >
              {{ $t('auth.validEmail') }}
            </small>
            <small
                v-if="emailError"
                class="error-text"
            >
              {{ emailError }}
            </small>
          </div>

          <!-- Teléfono -->
          <div class="input-group">
            <label>
              {{ $t('auth.phone') }}
            </label>
            <div class="phone-wrapper">
              <div class="country-selector">
                <button type="button" class="country-code" @click="emit('toggle-country-dropdown')">
                            <span>
                              {{ selectedCountry.flag }}
                            </span>
                  <span>
                              {{ selectedCountry.code }}
                            </span>
                  <span class="material-symbols-outlined">
                              expand_more
                            </span>
                </button>
                <Transition name="fade">
                  <div v-if="isCountryDropdownOpen" class="country-dropdown">
                    <button
                        v-for="country in countries"
                        :key="country.code"
                        type="button"
                        class="country-option"
                        @click="emit('select-country', country)"
                    >
                                <span>
                                  {{ country.flag }}
                                </span>
                      <span>
                                  {{ country.name }}
                                </span>
                      <span class="country-option-code">
                                  {{ country.code }}
                                </span>
                    </button>
                  </div>
                </Transition>
              </div>
              <div class="input-wrapper" :class="{ success: phone && !phoneError, error: phoneError}">
                <input
                    :value="phone"
                    @input="emit('update:phone', $event.target.value)"
                    type="tel"
                    maxlength="9"
                    placeholder="999 999 999"
                />
                <span v-if="phone && !phoneError" class="material-symbols-outlined success-icon">
                            check_circle
                          </span>
                <span v-if="phoneError" class="material-symbols-outlined error-icon">
                            error
                          </span>
              </div>
            </div>
            <small v-if="phone && !phoneError" class="success-text">
              {{ $t('auth.validPhone') }}
            </small>
            <small v-if="phoneError" class="error-text">
              {{ phoneError }}
            </small>
          </div>
        </form>
      </div>

      <!-- FOOTER -->
      <div class="register-footer">
        <button
            class="secondary-button"
            @click="emit('back')"
        >
              <span class="material-symbols-outlined">
                arrow_back
              </span>
          {{ $t('general.back') }}
        </button>
        <button
            class="primary-button"
            :disabled="!isStepTwoValid"
            :class="{ disabled: !isStepTwoValid }"
            @click="emit('continue')"
        >
          {{ $t('general.continue') }}
          <span class="material-symbols-outlined">
                arrow_forward
              </span>
        </button>
      </div>
    </div>

    <!-- TRUST -->
    <div class="trust-indicators">
      <div class="trust-item">
                  <span class="material-symbols-outlined">
                    shield
                  </span>
        <span>
                    {{ $t('auth.sslSecurity') }}
                  </span>
      </div>
      <div class="trust-item">
                  <span class="material-symbols-outlined">
                    lock
                  </span>
        <span>
                    {{ $t('auth.gdprProtection') }}
                  </span>
      </div>
    </div>
  </section>
</template>
