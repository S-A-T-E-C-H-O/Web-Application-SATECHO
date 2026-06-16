<script setup>
import { computed } from 'vue'
import { useTelemetryStore } from '@/bounded-contexts/dashboard/application/stores/telemetry.store'

/**
 * Acto 3 — Gráfica de Salinidad
 * ------------------------------------------------------------
 * Demuestra al jurado académico el monitoreo de conductividad
 * eléctrica del suelo mediante el sensor HR202L. Incluye:
 *
 *   - Gráfica de línea SVG que muestra salinidad_hr202l en el tiempo
 *   - Alerta roja cuando el valor supera 5.0 dS/m:
 *     "⚠ Alerta Crítica: Bloqueo Salino Detectado"
 *   - Uso de .filter() para identificar lecturas críticas
 *
 * Campo hardware: salinity_hr202l (unidad: dS/m)
 */

const store = useTelemetryStore()

/** Puntos normalizados para la gráfica SVG usando .map() */
const chartPoints = computed(() => {
  const data = store.salinityHistory
  if (data.length === 0) return []

  const maxVal = Math.max(...data.map((d) => d.salinity_hr202l), 6)
  const minVal = 0

  return data.map((entry, index) => ({
    x: (index / Math.max(data.length - 1, 1)) * 100,
    y: 100 - ((entry.salinity_hr202l - minVal) / (maxVal - minVal)) * 100,
    value: entry.salinity_hr202l,
    timestamp: entry.timestamp.split(' ')[1], // Solo la hora HH:MM
    isCritical: entry.salinity_hr202l > 5.0,
  }))
})

/** Cadena SVG polyline usando .map() para construir el path */
const polylinePath = computed(() =>
  chartPoints.value
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
)

/** Array de puntos críticos para marcadores en la gráfica usando .filter() */
const criticalPoints = computed(() =>
  chartPoints.value.filter((point) => point.isCritical)
)

/** Etiquetas del eje Y generadas con .map() */
const yAxisLabels = ['6.0', '4.5', '3.0', '1.5', '0.0'].map((label) => ({
  label: `${label} dS/m`,
  y: 100 - (parseFloat(label) / 6) * 100,
}))

/** Valor máximo de salinidad en las últimas 24h calculado con .map() + Math.max */
const maxSalinity = computed(() =>
  Math.max(...store.salinityHistory.map((entry) => entry.salinity_hr202l), 0).toFixed(1)
)
</script>

<template>
  <article
    class="act3-card"
    :class="{ 'salinity-alert': store.hasSalinityAlert }"
    aria-label="Monitor de salinidad - Acto 3"
  >
    <!-- Cabecera con identificador académico -->
    <header class="act3-header">
      <span class="act-badge">Acto 3</span>
      <h2 class="act3-title">
        <span class="material-symbols-outlined">science</span>
        Salinidad del Suelo — Sensor HR202L
      </h2>
    </header>

    <!-- Resumen de métricas clave -->
    <div class="act3-metrics">
      <div class="metric-item current">
        <span class="metric-label">Actual</span>
        <span class="metric-value" :class="{ 'text-critical': store.currentSalinity > 5.0 }">
          {{ store.currentSalinity.toFixed(1) }}
        </span>
        <span class="metric-unit">dS/m</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Máx. 24h</span>
        <span class="metric-value">{{ maxSalinity }}</span>
        <span class="metric-unit">dS/m</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Umbral crítico</span>
        <span class="metric-value threshold">5.0</span>
        <span class="metric-unit">dS/m</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Alertas</span>
        <!-- Uso de .filter() para contar lecturas críticas -->
        <span class="metric-value alert-count">{{ store.criticalSalinityReadings.length }}</span>
        <span class="metric-unit">eventos</span>
      </div>
    </div>

    <!-- Gráfica SVG de línea con puntos críticos resaltados -->
    <div class="chart-container" aria-label="Gráfica de salinidad 24h">
      <svg class="salinity-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Líneas de referencia del eje Y generadas con .map() -->
        <line
          v-for="tick in yAxisLabels"
          :key="tick.label"
          :x1="0" :x2="100"
          :y1="tick.y" :y2="tick.y"
          stroke="#e2e8f0"
          stroke-width="0.5"
          stroke-dasharray="2,2"
        />
        <!-- Línea de umbral crítico (5.0 dS/m) -->
        <line
          x1="0" x2="100"
          :y1="100 - (5.0 / 6) * 100" :y2="100 - (5.0 / 6) * 100"
          stroke="#e53e3e"
          stroke-width="1"
          stroke-dasharray="3,3"
          opacity="0.6"
        />
        <!-- Área bajo la curva -->
        <polygon
          v-if="chartPoints.length > 1"
          :points="`0,100 ${polylinePath} 100,100`"
          fill="rgba(49, 130, 206, 0.08)"
        />
        <!-- Línea de tendencia -->
        <polyline
          :points="polylinePath"
          fill="none"
          stroke="#3182ce"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <!-- Puntos críticos resaltados con .filter() + .map() -->
        <circle
          v-for="point in criticalPoints"
          :key="point.timestamp"
          :cx="point.x"
          :cy="point.y"
          r="2.5"
          fill="#e53e3e"
          stroke="white"
          stroke-width="1"
        />
      </svg>

      <!-- Etiquetas del eje X (horas) generadas con .map() -->
      <div class="x-axis-labels">
        <span
          v-for="point in chartPoints.filter((_, i) => i % 2 === 0).map((p) => ({ ts: p.timestamp, x: p.x }))"
          :key="point.ts"
          class="x-label"
          :style="{ left: `${point.x}%` }"
        >
          {{ point.ts }}
        </span>
      </div>
    </div>

    <!-- Banner de alerta crítica cuando salinidad > 5.0 dS/m -->
    <div
      v-if="store.hasSalinityAlert"
      class="critical-banner"
      role="alert"
    >
      <span class="material-symbols-outlined">warning</span>
      <div>
        <strong>⚠ Alerta Crítica: Bloqueo Salino Detectado</strong>
        <p>
          La conductividad eléctrica ha superado el umbral de 5.0 dS/m en
          <strong>{{ store.criticalSalinityReadings.length }}</strong>
          lecturas. Se recomienda aplicar lavado de sales (leaching fraction)
          para evitar daño osmótico al cultivo.
        </p>
      </div>
    </div>

    <!-- Pie con conteo de lecturas críticas (uso de .filter()) -->
    <footer class="act3-footer">
      <p>
        <span class="material-symbols-outlined">filter_alt</span>
        <strong>Demostración de .filter():</strong>
        {{ store.criticalSalinityReadings.length }} de {{ store.salinityHistory.length }}
        lecturas superan el umbral de 5.0 dS/m.
      </p>
    </footer>
  </article>
</template>

<style scoped>
.act3-card {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.act3-card.salinity-alert {
  border-color: #fc8181;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
}

.act3-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
}

.act-badge {
  background: #6b46c1;
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}

.act3-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 7px;
}

.act3-title .material-symbols-outlined {
  color: #6b46c1;
  font-size: 22px;
}

/* Métricas resumen */
.act3-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 20px;
}

.metric-item {
  background: #f7fafc;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.metric-value {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #1a202c;
  line-height: 1.2;
}

.metric-value.text-critical {
  color: #e53e3e;
}

.metric-value.threshold {
  color: #e53e3e;
  font-size: 22px;
}

.metric-value.alert-count {
  color: #e53e3e;
}

.metric-unit {
  font-size: 11px;
  color: #718096;
  font-weight: 600;
}

/* Contenedor de gráfica SVG */
.chart-container {
  position: relative;
  padding: 0 20px 10px;
  height: 180px;
}

.salinity-chart {
  width: 100%;
  height: 140px;
}

.x-axis-labels {
  position: relative;
  height: 20px;
  margin-top: 4px;
}

.x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: #a0aec0;
  font-weight: 600;
}

/* Banner de alerta crítica */
.critical-banner {
  margin: 0 20px 16px;
  background: #fff5f5;
  border: 1px solid #fc8181;
  border-left: 4px solid #e53e3e;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.critical-banner .material-symbols-outlined {
  color: #e53e3e;
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.critical-banner strong {
  display: block;
  color: #c53030;
  font-size: 14px;
  margin-bottom: 4px;
}

.critical-banner p {
  font-size: 12px;
  color: #4a5568;
  line-height: 1.5;
}

/* Pie */
.act3-footer {
  padding: 0 20px 18px;
  border-top: 1px solid #edf2f7;
  margin: 0 20px;
  padding-top: 14px;
}

.act3-footer p {
  font-size: 12px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 6px;
}

.act3-footer .material-symbols-outlined {
  font-size: 16px;
  color: #a0aec0;
}
</style>
