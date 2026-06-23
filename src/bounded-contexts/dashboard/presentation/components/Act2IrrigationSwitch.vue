<script setup>
import { computed } from 'vue'
import { useTelemetryStore } from '@/bounded-contexts/dashboard/application/stores/telemetry.store'

/**
 * Acto 2 — Interruptor de Riego
 * ------------------------------------------------------------
 * Demuestra al jurado académico el control de actuadores desde
 * el frontend: el botón alterna el estado de la electroválvula
 * de riego y envía una petición POST al endpoint del backend.
 *
 * - Botón "Activar Riego" (apagado) / "Detener Riego" (encendido)
 * - Indicador LED azul que se ilumina cuando el riego está activo
 * - Manejo declarativo de eventos (@click enlaza directamente a la acción)
 */

const store = useTelemetryStore()

// Etiqueta del botón derivada declarativamente del estado
const buttonLabel = computed(() =>
  store.isIrrigating ? 'Detener Riego' : 'Activar Riego'
)

// Clase CSS dinámica según estado
const buttonClass = computed(() =>
  store.isIrrigating ? 'irrigate-active' : 'irrigate-inactive'
)

const iconName = computed(() =>
  store.isIrrigating ? 'stop_circle' : 'play_circle'
)
</script>

<template>
  <article
    class="act2-card"
    :class="{ 'irrigation-on': store.isIrrigating }"
    aria-label="Control de riego - Acto 2"
  >
    <!-- Cabecera con identificador académico -->
    <header class="act2-header">
      <span class="act-badge">Acto 2</span>
      <h2 class="act2-title">
        <span class="material-symbols-outlined">valve</span>
        Control de Electroválvula
      </h2>
    </header>

    <!-- Cuerpo: visualización del estado actual -->
    <div class="act2-body">
      <!-- Indicador LED azul que representa el estado de la válvula -->
      <div class="led-display">
        <div class="led-ring" :class="{ 'led-on': store.isIrrigating }">
          <span class="led-core" />
        </div>
        <span class="led-label">
          {{ store.isIrrigating ? 'Válvula Abierta' : 'Válvula Cerrada' }}
        </span>
      </div>

      <!-- Datos complementarios del sistema de riego -->
      <div class="irrigation-info">
        <div class="info-row">
          <span class="info-icon material-symbols-outlined">schedule</span>
          <span class="info-label">Duración programada</span>
          <strong>15 min</strong>
        </div>
        <div class="info-row">
          <span class="info-icon material-symbols-outlined">location_on</span>
          <span class="info-label">Zona de riego</span>
          <strong>First linked irrigation zone</strong>
        </div>
        <div class="info-row">
          <span class="info-icon material-symbols-outlined">water_drop</span>
          <span class="info-label">Caudal estimado</span>
          <strong>Not available</strong>
        </div>
      </div>
    </div>

    <!-- Acción: botón de alternancia con manejo declarativo de eventos -->
    <footer class="act2-footer">
      <button
        class="irrigate-btn"
        :class="buttonClass"
        @click="store.toggleIrrigation"
      >
        <span class="material-symbols-outlined">{{ iconName }}</span>
        {{ buttonLabel }}
      </button>
      <p class="endpoint-hint">
        <span class="material-symbols-outlined">http</span>
        Sends an irrigation command to the linked actuator.
      </p>
    </footer>
  </article>
</template>

<style scoped>
.act2-card {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.act2-card.irrigation-on {
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.act2-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
}

.act-badge {
  background: #2b6cb0;
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}

.act2-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 7px;
}

.act2-title .material-symbols-outlined {
  color: #3182ce;
  font-size: 22px;
}

/* Indicador LED circular azul */
.act2-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.led-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.led-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e2e8f0;
  display: grid;
  place-items: center;
  transition: background 0.3s, box-shadow 0.3s;
}

.led-ring.led-on {
  background: #3182ce;
  box-shadow: 0 0 18px rgba(49, 130, 206, 0.6), 0 0 36px rgba(49, 130, 206, 0.3);
}

.led-core {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transition: background 0.3s;
}

.led-ring.led-on .led-core {
  background: rgba(255, 255, 255, 0.7);
}

.led-label {
  font-size: 14px;
  font-weight: 700;
  color: #4a5568;
}

/* Información complementaria */
.irrigation-info {
  width: 100%;
  background: #f7fafc;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 18px;
  color: #a0aec0;
}

.info-label {
  font-size: 13px;
  color: #718096;
  flex: 1;
}

.info-row strong {
  font-size: 13px;
  color: #1a202c;
}

/* Botón de acción */
.act2-footer {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.irrigate-btn {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 10px;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, color 0.2s;
}

.irrigate-btn .material-symbols-outlined {
  font-size: 22px;
}

.irrigate-inactive {
  background: #3182ce;
  color: white;
}

.irrigate-inactive:hover {
  background: #2b6cb0;
}

.irrigate-active {
  background: white;
  color: #e53e3e;
  border: 2px solid #e53e3e;
}

.irrigate-active:hover {
  background: #fff5f5;
}

.endpoint-hint {
  font-size: 11px;
  color: #a0aec0;
  font-family: 'SF Mono', 'Consolas', monospace;
  display: flex;
  align-items: center;
  gap: 4px;
}

.endpoint-hint .material-symbols-outlined {
  font-size: 14px;
}
</style>
