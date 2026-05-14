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
        Bienvenido a SATECHO
      </h2>
      <p>
        Selecciona el perfil que mejor describa tu actividad
        para personalizar tu experiencia de gestión inteligente.
      </p>
    </div>
  </Transition>

  <!-- PROGRESS -->
  <div class="progress-section">
    <div class="progress-top">
              <span class="step-counter">
                PASO {{ currentStep }} DE 3
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