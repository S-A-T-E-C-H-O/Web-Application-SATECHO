<script setup>
import { computed } from 'vue'
import { useTelemetryStore } from '@/bounded-contexts/dashboard/application/stores/telemetry.store'

/**
 * Acto 4 — Registro Cronológico de Eventos de Seguridad PIR
 * ------------------------------------------------------------
 * Demuestra al jurado académico el sistema de seguridad perimetral
 * del prototipo SATECHO. Muestra los eventos del sensor PIR en
 * orden cronológico, destacando detecciones con codificación visual.
 *
 * Campo hardware: security_pir_status ("DETECTED" | "CLEAR")
 *
 * Cada evento muestra:
 *   - Marca de tiempo
 *   - Estado (DETECTED / CLEAR)
 *   - Etiqueta de zona: "Zona 1 — Perímetro"
 *
 * Patrones declarativos usados:
 *   - .map() para renderizar cada evento en el DOM
 *   - .filter() para contar detecciones y calcular estadísticas
 */

const store = useTelemetryStore()

/** Conteo total de detecciones usando .filter() */
const totalDetections = computed(() =>
  store.pirEvents.filter((event) => event.status === 'DETECTED').length
)

/** Conteo de eventos CLEAR usando .filter() */
const totalClear = computed(() =>
  store.pirEvents.filter((event) => event.status === 'CLEAR').length
)

/** Frecuencia de detecciones por hora usando .filter() + .map() para agrupación */
const detectionRate = computed(() => {
  const hoursWithData = new Set(
    store.pirEvents.map((event) => event.timestamp.split(' ')[1]?.split(':')[0])
  ).size
  if (hoursWithData === 0) return '0.0'
  return (totalDetections.value / Math.max(hoursWithData, 1)).toFixed(1)
})

/** Último evento (más reciente) obtenido vía ordenación declarativa */
const lastEvent = computed(() =>
  [...store.pirEvents]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    [0]
)

/** Fecha formateada del último evento */
const lastEventTime = computed(() => {
  if (!lastEvent.value) return '—'
  return lastEvent.value.timestamp
})
</script>

<template>
  <article
    class="act4-card"
    :class="{ 'detection-active': lastEvent?.status === 'DETECTED' }"
    aria-label="Registro de eventos de seguridad PIR - Acto 4"
  >
    <!-- Cabecera con indicador de estado actual -->
    <header class="act4-header">
      <span class="act-badge">Acto 4</span>
      <h2 class="act4-title">
        <span class="material-symbols-outlined">shield</span>
        Seguridad Perimetral — Sensor PIR
      </h2>
      <!-- Indicador de estado actual del perímetro -->
      <span
        class="status-indicator"
        :class="{
          'status-detected': store.currentReadings.security_pir_status === 'DETECTED',
          'status-clear': store.currentReadings.security_pir_status === 'CLEAR',
        }"
      >
        <span class="status-dot" />
        {{ store.currentReadings.security_pir_status === 'DETECTED' ? 'PERÍMETRO ALERTA' : store.currentReadings.security_pir_status === 'CLEAR' ? 'PERÍMETRO SEGURO' : 'SIN LECTURA PIR' }}
      </span>
    </header>

    <!-- Panel de estadísticas de seguridad -->
    <div class="act4-stats">
      <div class="stat-card detections">
        <span class="stat-number">{{ totalDetections }}</span>
        <span class="stat-label">Detecciones</span>
      </div>
      <div class="stat-card clearances">
        <span class="stat-number">{{ totalClear }}</span>
        <span class="stat-label">Normalizaciones</span>
      </div>
      <div class="stat-card rate">
        <span class="stat-number">{{ detectionRate }}/h</span>
        <span class="stat-label">Tasa de detección</span>
      </div>
      <div class="stat-card last">
        <span class="stat-number">{{ store.pirEvents.length }}</span>
        <span class="stat-label">Eventos totales</span>
      </div>
    </div>

    <!-- Último evento destacado -->
    <div class="latest-event" v-if="lastEvent">
      <span class="latest-label">Último evento</span>
      <div class="latest-detail">
        <span class="latest-time">{{ lastEventTime }}</span>
        <span
          class="latest-status"
          :class="{
            'text-detected': lastEvent.status === 'DETECTED',
            'text-clear': lastEvent.status === 'CLEAR',
          }"
        >
          {{ lastEvent.status }}
        </span>
      </div>
    </div>

    <!-- Registro cronológico de eventos: renderizado con .map() -->
    <div class="events-log" role="log" aria-label="Registro de eventos PIR">
      <div
        v-for="event in store.pirEvents
          .map((evt, index) => ({ ...evt, displayIndex: index + 1 }))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))"
        :key="event.id"
        class="event-row"
        :class="{
          'event-detected': event.status === 'DETECTED',
          'event-clear': event.status === 'CLEAR',
        }"
      >
        <!-- Índice del evento -->
        <span class="event-index">#{{ event.displayIndex }}</span>

        <!-- Icono según tipo de evento -->
        <span class="event-icon material-symbols-outlined">
          {{ event.status === 'DETECTED' ? 'person_alert' : 'shield_check' }}
        </span>

        <!-- Datos del evento -->
        <div class="event-data">
          <div class="event-top-row">
            <strong
              class="event-status"
              :class="{
                'text-detected': event.status === 'DETECTED',
                'text-clear': event.status === 'CLEAR',
              }"
            >
              {{ event.status === 'DETECTED' ? 'DETECTADO' : 'NORMALIZADO' }}
            </strong>
            <span class="event-zone">{{ event.zone }}</span>
          </div>
          <span class="event-time">
            <span class="material-symbols-outlined">schedule</span>
            {{ event.timestamp }}
          </span>
        </div>

        <!-- Barra de acento lateral para DETECTED -->
        <span v-if="event.status === 'DETECTED'" class="accent-bar" />
      </div>
    </div>

    <!-- Pie: resumen académico explicando el uso de .map() y .filter() -->
    <footer class="act4-footer">
      <p>
        <span class="material-symbols-outlined">code</span>
        <strong>Demostración de .map() y .filter():</strong>
        {{ store.pirEvents.length }} eventos renderizados con .map().
        {{ totalDetections }} detecciones contadas con .filter().
      </p>
    </footer>
  </article>
</template>

<style scoped>
.act4-card {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
  overflow: hidden;
  transition: border-color 0.3s;
}

.act4-card.detection-active {
  border-color: #fc8181;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.08);
}

.act4-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
  flex-wrap: wrap;
}

.act-badge {
  background: #c05621;
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}

.act4-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
}

.act4-title .material-symbols-outlined {
  color: #c05621;
  font-size: 22px;
}

/* Indicador de estado del perímetro */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.status-indicator.status-detected {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #fc8181;
}

.status-indicator.status-clear {
  background: #f0fff4;
  color: #2f855a;
  border: 1px solid #9ae6b4;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* Estadísticas */
.act4-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 20px 20px 0;
}

.stat-card {
  background: #f7fafc;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.stat-card.detections {
  border-left: 3px solid #e53e3e;
}

.stat-card.clearances {
  border-left: 3px solid #38a169;
}

.stat-card.rate {
  border-left: 3px solid #3182ce;
}

.stat-card.last {
  border-left: 3px solid #718096;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #1a202c;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* Último evento */
.latest-event {
  margin: 16px 20px 0;
  background: #f7fafc;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.latest-label {
  font-size: 11px;
  font-weight: 700;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.latest-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.latest-time {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.latest-status {
  font-size: 13px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
}

.text-detected {
  color: #c53030;
  background: #fff5f5;
}

.text-clear {
  color: #2f855a;
  background: #f0fff4;
}

/* Registro cronológico renderizado con .map() */
.events-log {
  margin: 16px 20px 0;
  max-height: 340px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-row {
  position: relative;
  display: grid;
  grid-template-columns: 36px 36px 1fr;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.15s;
}

.event-row:hover {
  background: #f7fafc;
}

.event-row.event-detected {
  background: #fffaf0;
  border-color: #fbd38d;
}

.event-row.event-clear {
  background: white;
  border-color: #edf2f7;
}

.event-index {
  font-size: 11px;
  font-weight: 700;
  color: #a0aec0;
  text-align: right;
}

.event-icon {
  font-size: 20px;
}

.event-detected .event-icon {
  color: #e53e3e;
}

.event-clear .event-icon {
  color: #38a169;
}

.event-data {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.event-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-status {
  font-size: 13px;
  font-weight: 800;
}

.event-zone {
  font-size: 11px;
  color: #718096;
  font-weight: 600;
}

.event-time {
  font-size: 11px;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.event-time .material-symbols-outlined {
  font-size: 14px;
}

/* Barra de acento para detecciones (naranja/rojo) */
.accent-bar {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: #e53e3e;
  border-radius: 0 2px 2px 0;
}

/* Pie académico */
.act4-footer {
  padding: 0 20px 18px;
  border-top: 1px solid #edf2f7;
  margin: 16px 20px 0;
  padding-top: 14px;
}

.act4-footer p {
  font-size: 12px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 6px;
}

.act4-footer .material-symbols-outlined {
  font-size: 16px;
  color: #a0aec0;
}
</style>
