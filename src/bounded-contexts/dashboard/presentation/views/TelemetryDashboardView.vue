<script setup>
import { onMounted } from 'vue'
import { useTelemetryStore } from '@/bounded-contexts/dashboard/application/stores/telemetry.store'
import Act1WaterStressCard from '@/bounded-contexts/dashboard/presentation/components/Act1WaterStressCard.vue'
import Act2IrrigationSwitch from '@/bounded-contexts/dashboard/presentation/components/Act2IrrigationSwitch.vue'
import Act3SalinityChart from '@/bounded-contexts/dashboard/presentation/components/Act3SalinityChart.vue'
import Act4SecurityEventLog from '@/bounded-contexts/dashboard/presentation/components/Act4SecurityEventLog.vue'

/**
 * Vista Principal de Telemetría — Narrativa Académica en 4 Actos
 * ---------------------------------------------------------------
 * Esta vista consolida los 4 widgets que componen la presentación
 * académica del prototipo SATECHO ante el jurado evaluador.
 *
 * Cada acto demuestra una capacidad específica del sistema de
 * monitoreo agrícola IoT, usando exclusivamente patrones
 * declarativos de JavaScript (.map, .filter, computed).
 *
 * Acto 1: Monitoreo de estrés hídrico con sensor FC-28
 * Acto 2: Control de electroválvula de riego con comando POST
 * Acto 3: Gráfica de salinidad y alerta de bloqueo salino (HR202L)
 * Acto 4: Registro cronológico de seguridad perimetral (PIR)
 */

const store = useTelemetryStore()

onMounted(() => {
  store.loadTelemetry()
})
</script>

<template>
  <div class="telemetry-view">
    <!-- Encabezado de la narrativa académica -->
    <header class="narrative-header">
      <div class="narrative-title-row">
        <span class="narrative-badge">Presentación Académica</span>
        <h1>Dashboard de Telemetría — Narrativa en 4 Actos</h1>
        <p class="narrative-subtitle">
          Demostración del sistema SATECHO para monitoreo agrícola IoT con lógica
          declarativa. Cada widget representa un acto de la presentación ante el
          jurado evaluador.
        </p>
      </div>
      <div class="header-actions">
        <button class="reload-btn" @click="store.loadTelemetry">
          <span class="material-symbols-outlined">sync</span>
          {{ store.status === 'loading' ? 'Cargando...' : 'Recargar telemetría' }}
        </button>
      </div>
    </header>

    <!-- Indicador de estado de carga -->
    <div v-if="store.status === 'loading'" class="loading-banner">
      <span class="material-symbols-outlined spinning">progress_activity</span>
      Conectando con los sensores de hardware...
    </div>

    <!-- Mensaje de error (si aplica) -->
    <div v-if="store.error && store.status !== 'loading'" class="info-banner">
      <span class="material-symbols-outlined">info</span>
      {{ store.error }}
    </div>

    <!-- Feedback temporal de acciones -->
    <div v-if="store.feedback" class="feedback-toast">
      <span class="material-symbols-outlined">check_circle</span>
      {{ store.feedback }}
    </div>

    <!-- Cuadrícula de widgets: 2 columnas en desktop, 1 en móvil -->
    <div class="widgets-grid">
      <!-- Acto 1: Estrés Hídrico (FC-28) -->
      <Act1WaterStressCard />

      <!-- Acto 2: Control de Riego (POST a endpoint) -->
      <Act2IrrigationSwitch />

      <!-- Acto 3: Salinidad (HR202L) con gráfica SVG -->
      <Act3SalinityChart />

      <!-- Acto 4: Seguridad Perimetral (PIR) -->
      <Act4SecurityEventLog />
    </div>

    <!-- Pie: resumen de patrones declarativos usados -->
    <footer class="narrative-footer">
      <h3>Resumen de Patrones Declarativos</h3>
      <div class="pattern-grid">
        <div class="pattern-item">
          <span class="material-symbols-outlined">map</span>
          <strong>.map()</strong>
          <p>Renderizado de listas de eventos, puntos de gráfica, escalas y etiquetas.</p>
        </div>
        <div class="pattern-item">
          <span class="material-symbols-outlined">filter_alt</span>
          <strong>.filter()</strong>
          <p>Conteo de detecciones PIR, identificación de lecturas críticas de salinidad.</p>
        </div>
        <div class="pattern-item">
          <span class="material-symbols-outlined">function</span>
          <strong>computed()</strong>
          <p>Derivación reactiva de estados: nivel de estrés, alertas, estadísticas.</p>
        </div>
        <div class="pattern-item">
          <span class="material-symbols-outlined">http</span>
          <strong>async/await</strong>
          <p>Comunicación asíncrona con endpoints del backend para telemetría y actuadores.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.telemetry-view {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1a202c;
}

/* Encabezado narrativo */
.narrative-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}

.narrative-title-row {
  flex: 1;
}

.narrative-badge {
  display: inline-block;
  background: #ebf4ff;
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.narrative-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: -0.025em;
}

.narrative-subtitle {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  max-width: 680px;
}

.header-actions {
  flex-shrink: 0;
}

.reload-btn {
  min-height: 42px;
  padding: 0 20px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  color: #374151;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.reload-btn:hover {
  background: #f9fafb;
}

.reload-btn .material-symbols-outlined {
  font-size: 20px;
}

/* Banner de carga */
.loading-banner {
  background: #ebf4ff;
  border: 1px solid #bee3f8;
  border-radius: 10px;
  color: #2b6cb0;
  padding: 14px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.loading-banner .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Banner informativo */
.info-banner {
  background: #fffff0;
  border: 1px solid #faf089;
  border-radius: 10px;
  color: #975a16;
  padding: 12px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

/* Toast de feedback */
.feedback-toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: #1a202c;
  color: white;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.feedback-toast .material-symbols-outlined {
  color: #48bb78;
}

/* Cuadrícula de widgets 2x2 */
.widgets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

@media (max-width: 860px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }
}

/* Pie: resumen de patrones */
.narrative-footer {
  background: white;
  border: 1px solid #eceee9;
  border-radius: 14px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(24, 30, 22, 0.04);
}

.narrative-footer h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pattern-item {
  background: #f7fafc;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
}

.pattern-item .material-symbols-outlined {
  font-size: 28px;
  color: #456c4c;
  margin-bottom: 10px;
  display: block;
}

.pattern-item strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
}

.pattern-item p {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .pattern-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
