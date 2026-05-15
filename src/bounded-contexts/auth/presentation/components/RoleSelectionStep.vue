<script setup>
const emit = defineEmits(['selectRole'])
</script>

<template>
  <section class="roles-grid">

  <!-- Farmer -->
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
      {{ $t('auth.farmer') }}
    </h3>
    <p>
      {{ $t('auth.farmerDesc') }}
    </p>
    <div class="card-action">
          <span>
            {{ $t('auth.startAsFarmer') }}
          </span>
      <span class="material-symbols-outlined">
            arrow_forward
          </span>
    </div>
  </button>

  <!-- Agronomist -->
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
      {{ $t('auth.agronomist') }}
    </h3>
    <p>
      {{ $t('auth.agronomistDesc') }}
    </p>
    <div class="card-action">
          <span>
            {{ $t('auth.startAsAgronomist') }}
          </span>
      <span class="material-symbols-outlined">
            arrow_forward
          </span>
    </div>
  </button>
  </section>
</template>
