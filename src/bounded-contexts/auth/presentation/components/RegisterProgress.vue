<script setup>
defineProps({
  currentStep: Number,
  currentStepTitle: String,
  progressWidth: String
})
</script>

<template>
  <section class="progress-wrapper">
  <Transition name="fade">
    <div
        v-if="currentStep === 1"
        class="hero-section"
    >
      <h2>
        {{ $t('auth.welcomeRegister') }}
      </h2>
      <p>
        {{ $t('auth.welcomeRegisterDesc') }}
      </p>
    </div>
  </Transition>

  <!-- PROGRESS -->
  <div class="progress-section">
    <div class="progress-top">
              <span class="step-counter">
                {{ $t('auth.stepOf', { current: currentStep }) }}
              </span>
      <Transition
          name="fade-slide"
          mode="out-in"
      >
                <span
                    :key="currentStep"
                    class="step-title"
                >
                  {{ currentStepTitle }}
                </span>
      </Transition>
    </div>
    <div class="progress-bar">
      <div
          class="progress-fill"
          :style="{ width: progressWidth }"
      />
    </div>
  </div>
  </section>
</template>
