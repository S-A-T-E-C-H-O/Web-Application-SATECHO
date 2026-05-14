<script setup>
const emit = defineEmits(['selectRole'])
</script>

<template>
  <section class="roles-grid">

  <!-- Agricultor -->
  <button
      class="role-card"
      @click="emit('selectRole', 'farmer')"
  >
    <div class="role-icon farmer-icon">
          <span class="material-symbols-outlined">
            potted_plant
          </span>
    </div>
    <h3>
      Agricultor
    </h3>
    <p>
      Gestiona tus cultivos, optimiza recursos y recibe alertas inteligentes directamente en tu parcela.
    </p>
    <div class="card-action">
          <span>
            Empezar como Agricultor
          </span>
      <span class="material-symbols-outlined">
            arrow_forward
          </span>
    </div>
  </button>

  <!-- Agrónomo -->
  <button
      class="role-card"
      @click="emit('selectRole', 'agronomist')"
  >
    <div class="role-icon agronomist-icon">
          <span class="material-symbols-outlined">
            query_stats
          </span>
    </div>
    <h3>
      Agrónomo
    </h3>
    <p>
      Analiza datos masivos, gestiona múltiples clientes y genera informes técnicos de alto valor agronómico.
    </p>
    <div class="card-action">
          <span>
            Empezar como Agrónomo
          </span>
      <span class="material-symbols-outlined">
            arrow_forward
          </span>
    </div>
  </button>
  </section>
</template>