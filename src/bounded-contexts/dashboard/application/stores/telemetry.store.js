import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { telemetryApi } from '@/bounded-contexts/dashboard/infrastructure/telemetry.api'

/**
 * Datos de telemetría simulados / de respaldo que representan lecturas
 * reales de los sensores de hardware del prototipo SATECHO:
 *   - FC-28  → humedad del suelo (%)
 *   - HR202L → salinidad / conductividad eléctrica (dS/m)
 *   - DHT11  → temperatura ambiente (°C)
 *   - DS18B20→ temperatura del suelo (°C)
 *   - PIR    → estado de seguridad (DETECTED / CLEAR)
 */
const fallbackReadings = {
  humidity_fc28: 15,        // < 20 % → Acto 1: Estrés Hídrico
  salinity_hr202l: 5.8,     // > 5.0 dS/m → Acto 3: Alerta de Bloqueo Salino
  ambient_temp_dht11: 28.4,
  soil_temp_ds18b20: 26.1,
  security_pir_status: 'DETECTED',
}

/** Historial de salinidad simulado para demostrar la gráfica de tendencia del Acto 3 */
const fallbackSalinityHistory = [
  { timestamp: '2026-06-15 06:00', salinity_hr202l: 3.2 },
  { timestamp: '2026-06-15 07:00', salinity_hr202l: 3.5 },
  { timestamp: '2026-06-15 08:00', salinity_hr202l: 4.0 },
  { timestamp: '2026-06-15 09:00', salinity_hr202l: 4.3 },
  { timestamp: '2026-06-15 10:00', salinity_hr202l: 4.8 },
  { timestamp: '2026-06-15 11:00', salinity_hr202l: 5.2 }, // Supera umbral crítico
  { timestamp: '2026-06-15 12:00', salinity_hr202l: 5.8 },
  { timestamp: '2026-06-15 13:00', salinity_hr202l: 5.5 },
  { timestamp: '2026-06-15 14:00', salinity_hr202l: 5.9 },
  { timestamp: '2026-06-15 15:00', salinity_hr202l: 6.1 },
]

/** Eventos del sensor PIR para el registro cronológico del Acto 4 */
const fallbackPirEvents = [
  { id: 'pir-1', timestamp: '2026-06-15 06:12', status: 'CLEAR', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-2', timestamp: '2026-06-15 07:05', status: 'DETECTED', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-3', timestamp: '2026-06-15 07:06', status: 'CLEAR', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-4', timestamp: '2026-06-15 09:30', status: 'DETECTED', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-5', timestamp: '2026-06-15 09:32', status: 'CLEAR', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-6', timestamp: '2026-06-15 11:45', status: 'DETECTED', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-7', timestamp: '2026-06-15 12:10', status: 'CLEAR', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-8', timestamp: '2026-06-15 14:20', status: 'DETECTED', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-9', timestamp: '2026-06-15 14:22', status: 'DETECTED', zone: 'Zona 1 — Perímetro' },
  { id: 'pir-10', timestamp: '2026-06-15 14:25', status: 'CLEAR', zone: 'Zona 1 — Perímetro' },
]

export const useTelemetryStore = defineStore('telemetry', () => {
  // ─── Estado reactivo ─────────────────────────────────────────────
  const currentReadings = ref({ ...fallbackReadings })
  const salinityHistory = ref([...fallbackSalinityHistory])
  const pirEvents = ref([...fallbackPirEvents])
  const isIrrigating = ref(false)
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  const error = ref('')
  const feedback = ref('')

  // ─── Getters computados ──────────────────────────────────────────

  /** Acto 1: determina si el cultivo está en estrés hídrico usando .filter() */
  const waterStressLevel = computed(() => {
    const humidity = currentReadings.value.humidity_fc28
    if (humidity < 20) return 'critical'
    if (humidity > 80) return 'optimal'
    return 'moderate'
  })

  /** Acto 1: etiqueta descriptiva según nivel de humedad */
  const waterStressLabel = computed(() => {
    const levels = [
      { condition: 'critical', label: 'Estrés Hídrico — Requiere Riego' },
      { condition: 'optimal', label: 'Humedad Óptima' },
      { condition: 'moderate', label: 'Humedad Moderada' },
    ]
    // Uso declarativo de .find() para mapear condición → etiqueta
    return levels.find((l) => l.condition === waterStressLevel.value).label
  })

  /** Acto 3: lecturas críticas de salinidad (> 5.0 dS/m) usando .filter() */
  const criticalSalinityReadings = computed(() =>
    salinityHistory.value.filter((entry) => entry.salinity_hr202l > 5.0)
  )

  /** Acto 3: verifica si existe al menos una lectura crítica de salinidad */
  const hasSalinityAlert = computed(() => criticalSalinityReadings.value.length > 0)

  /** Acto 3: valor actual de salinidad */
  const currentSalinity = computed(() => currentReadings.value.salinity_hr202l)

  /** Acto 4: conteo de detecciones usando .filter() */
  const detectionCount = computed(() =>
    pirEvents.value.filter((event) => event.status === 'DETECTED').length
  )

  /** Acto 4: eventos recientes en orden cronológico inverso usando .map() + .sort() */
  const recentPirEvents = computed(() =>
    [...pirEvents.value]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .map((event, index) => ({
        ...event,
        displayIndex: index + 1,
      }))
  )

  // ─── Acciones ────────────────────────────────────────────────────

  const setFeedback = (message) => {
    feedback.value = message
    setTimeout(() => {
      if (feedback.value === message) feedback.value = ''
    }, 2600)
  }

  /** Carga toda la telemetría desde el backend (o usa datos de respaldo si falla) */
  const loadTelemetry = async () => {
    status.value = 'loading'
    error.value = ''

    try {
      const results = await Promise.allSettled([
        telemetryApi.getCurrentReadings(),
        telemetryApi.getSalinityHistory(),
        telemetryApi.getPirEvents(),
      ])

      if (results[0].status === 'fulfilled' && results[0].value?.humidity_fc28 !== undefined) {
        currentReadings.value = { ...fallbackReadings, ...results[0].value }
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        salinityHistory.value = results[1].value
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
        pirEvents.value = results[2].value
      }

      const anyRejected = results.some((r) => r.status === 'rejected')
      status.value = anyRejected ? 'local' : 'success'
      if (anyRejected) {
        error.value = 'Usando datos de telemetría locales mientras el backend no está disponible.'
      }
    } catch (err) {
      status.value = 'error'
      error.value = err?.message || 'Error al cargar telemetría'
    }
  }

  /**
   * Acto 2: Alterna el estado de riego y envía comando POST al endpoint.
   * Usa manejo declarativo de eventos desde el componente.
   */
  const toggleIrrigation = async () => {
    const nextState = !isIrrigating.value
    isIrrigating.value = nextState

    try {
      await telemetryApi.toggleIrrigation({
        active: nextState,
        zone: 'Zona 1 — Principal',
        timestamp: new Date().toISOString(),
      })
      setFeedback(
        nextState
          ? 'Riego activado. El actuador de válvula ha sido accionado.'
          : 'Riego detenido. Válvula cerrada correctamente.'
      )
    } catch {
      // Simulación local si el backend no responde
      setFeedback(
        nextState
          ? 'Riego activado (modo local). Demostración para jurado académico.'
          : 'Riego detenido (modo local).'
      )
    }
  }

  /** Actualiza manualmente la lectura de humedad (simulación de nueva lectura del FC-28) */
  const refreshHumidityReading = () => {
    // Simula una variación de lectura del sensor FC-28
    const delta = Math.round((Math.random() - 0.5) * 10)
    currentReadings.value = {
      ...currentReadings.value,
      humidity_fc28: Math.max(5, Math.min(98, currentReadings.value.humidity_fc28 + delta)),
    }
    setFeedback(`Nueva lectura del FC-28: ${currentReadings.value.humidity_fc28}%`)
  }

  return {
    // Estado
    currentReadings,
    salinityHistory,
    pirEvents,
    isIrrigating,
    status,
    error,
    feedback,
    // Getters
    waterStressLevel,
    waterStressLabel,
    criticalSalinityReadings,
    hasSalinityAlert,
    currentSalinity,
    detectionCount,
    recentPirEvents,
    // Acciones
    loadTelemetry,
    toggleIrrigation,
    refreshHumidityReading,
    setFeedback,
  }
})
