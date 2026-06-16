<script setup>
import { computed } from 'vue'
import { useTelemetryStore } from '@/bounded-contexts/dashboard/application/stores/telemetry.store'

/**
 * Acto 1 — Tarjeta de Estrés Hídrico
 * ------------------------------------------------------------
 * Demuestra al jurado académico la capacidad del sistema SATECHO
 * para medir humedad del suelo con el sensor FC-28 y clasificar
 * el nivel de estrés hídrico del cultivo mediante lógica declarativa.
 *
 * Procesa el campo hardware: humidity_fc28 (unidad: %)
 *   - Si < 20 % → Fondo ROJO:  "Estrés Hídrico — Requiere Riego"
 *   - Si > 80 % → Fondo VERDE: "Humedad Óptima"
 *   - Uso de .map() / .filter() para procesar datos de telemetría
 */

const store = useTelemetryStore()

// Determina la clase de estilo según el nivel de estrés hídrico usando .map() sobre rangos definidos
const rangeLabels = [
  { min: 0, max: 19, class: 'stress-critical', label: 'Estrés Hídrico' },
  { min: 20, max: 40, class: 'stress-low', label: 'Humedad Baja' },
  { min: 41, max: 60, class: 'stress-moderate', label: 'Humedad Moderada' },
  { min: 61, max: 80, class: 'stress-good', label: 'Humedad Adecuada' },
  { min: 81, max: 100, class: 'stress-optimal', label: 'Humedad Óptima' },
]

const activeRange = computed(() =>
  rangeLabels.filter(
    (r) =>
      store.currentReadings.humidity_fc28 >= r.min &&
      store.currentReadings.humidity_fc28 <= r.max
  )[0]
)

const cardClass = computed(() => activeRange.value?.class || 'stress-moderate')
const rangeTag = computed(() => activeRange.value?.label || 'Humedad Moderada')

// Barra de progreso: calcula el porcentaje de llenado para el indicador visual
const fillPercentage = computed(() => Math.min(100, Math.max(0, store.currentReadings.humidity_fc28)))

// Determina la recomendación textual usando .filter() sobre condiciones predefinidas
const recommendation = computed(() => {
  const recommendations = [
    { condition: 'critical', text: 'Acción inmediata requerida: activar sistema de riego por goteo.' },
    { condition: 'optimal', text: 'No se requiere intervención. El suelo mantiene humedad adecuada.' },
    { condition: 'low', text: 'Se recomienda programar riego en las próximas horas.' },
    { condition: 'moderate', text: 'Monitorear. La humedad está dentro del rango esperado.' },
    { condition: 'good', text: 'Condiciones favorables. Continuar con el plan de riego actual.' },
    { condition: 'optimal-high', text: 'Humedad en nivel óptimo. Cultivo en condiciones ideales.' },
  ]
  return recommendations.filter((r) => r.condition === store.waterStressLevel)[0]?.text || ''
})
</script>

<template>
  <article
    class="act1-card"
    :class="cardClass"
    aria-label="Indicador de estrés hídrico - Acto 1"
  >
    <!-- Cabecera del widget con identificador académico -->
    <header class="act1-header">
      <span class="act-badge">Acto 1</span>
      <h2 class="act1-title">
        <span class="material-symbols-outlined">water_drop</span>
        Estrés Hídrico — Sensor FC-28
      </h2>
      <span class="range-tag">{{ rangeTag }}</span>
    </header>

    <!-- Cuerpo: valor principal con barra de progreso -->
    <div class="act1-body">
      <div class="act1-value-section">
        <span class="act1-value">{{ store.currentReadings.humidity_fc28 }}</span>
        <span class="act1-unit">%</span>
      </div>

      <!-- Barra de progreso horizontal estilo gauge -->
      <div class="gauge-track" role="progressbar" :aria-valuenow="fillPercentage" aria-valuemin="0" aria-valuemax="100">
        <div
          class="gauge-fill"
          :style="{ width: `${fillPercentage}%` }"
        />
      </div>

      <!-- Etiquetas de la escala numérica generadas con .map() -->
      <div class="gauge-scale">
        <span
          v-for="tick in [0, 25, 50, 75, 100].map((v) => ({ value: v, label: `${v}%` }))"
          :key="tick.value"
          class="scale-tick"
        >
          {{ tick.label }}
        </span>
      </div>
    </div>

    <!-- Pie: mensaje de estado y recomendación -->
    <footer class="act1-footer">
      <p class="stress-message">{{ store.waterStressLabel }}</p>
      <p class="recommendation-text">
        <span class="material-symbols-outlined">tips_and_updates</span>
        {{ recommendation }}
      </p>
      <button class="refresh-btn" @click="store.refreshHumidityReading">
        <span class="material-symbols-outlined">sync</span>
        Simular nueva lectura
      </button>
    </footer>
  </article>
</template>

<style scoped>
.act1-card {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}

/* Fondos dinámicos según el nivel de estrés hídrico */
.act1-card.stress-critical {
  background: #fff5f5;
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.12);
}
.act1-card.stress-low {
  background: #fffaf0;
  border-color: #ed8936;
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.12);
}
.act1-card.stress-moderate {
  background: #fffff0;
  border-color: #ecc94b;
}
.act1-card.stress-good {
  background: #f0fff4;
  border-color: #38a169;
}
.act1-card.stress-optimal {
  background: #f0fff4;
  border-color: #2f855a;
  box-shadow: 0 0 0 3px rgba(47, 133, 90, 0.15);
}

.act1-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
}

.act-badge {
  background: #456c4c;
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}

.act1-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 7px;
}

.act1-title .material-symbols-outlined {
  color: #3182ce;
  font-size: 22px;
}

.range-tag {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: #edf2f7;
  color: #4a5568;
}

/* Valor principal */
.act1-body {
  padding: 20px 20px 0;
}

.act1-value-section {
  text-align: center;
  margin-bottom: 16px;
}

.act1-value {
  font-size: 56px;
  font-weight: 800;
  color: #1a202c;
  line-height: 1;
}

.act1-unit {
  font-size: 20px;
  font-weight: 600;
  color: #718096;
  margin-left: 4px;
}

/* Barra de progreso estilo gauge */
.gauge-track {
  height: 14px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.gauge-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #e53e3e 0%, #ed8936 25%, #ecc94b 50%, #38a169 75%, #2f855a 100%);
  transition: width 0.5s ease;
}

/* Escala generada con .map() */
.gauge-scale {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-bottom: 8px;
}

.scale-tick {
  font-size: 10px;
  font-weight: 600;
  color: #a0aec0;
}

/* Pie con mensaje y recomendación */
.act1-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid #edf2f7;
  margin-top: 12px;
}

.stress-message {
  font-size: 16px;
  font-weight: 800;
  color: #e53e3e;
  text-align: center;
  margin-bottom: 10px;
}

.act1-card.stress-optimal .stress-message {
  color: #2f855a;
}

.act1-card.stress-good .stress-message {
  color: #38a169;
}

.recommendation-text {
  font-size: 13px;
  color: #4a5568;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 14px;
  line-height: 1.5;
}

.recommendation-text .material-symbols-outlined {
  font-size: 18px;
  color: #a0aec0;
  flex-shrink: 0;
  margin-top: 1px;
}

.refresh-btn {
  width: 100%;
  min-height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #f7fafc;
}

.refresh-btn .material-symbols-outlined {
  font-size: 18px;
}
</style>
