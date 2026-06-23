import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { telemetryApi } from '@/bounded-contexts/dashboard/infrastructure/telemetry.api'

const emptyReadings = () => ({
  humidity_fc28: null,
  salinity_hr202l: null,
  ambient_temp_dht11: null,
  soil_temp_ds18b20: null,
  security_pir_status: 'UNKNOWN',
})

export const useTelemetryStore = defineStore('telemetry', () => {
  const currentReadings = ref(emptyReadings())
  const salinityHistory = ref([])
  const pirEvents = ref([])
  const isIrrigating = ref(false)
  const status = ref('idle')
  const error = ref('')
  const feedback = ref('')

  const waterStressLevel = computed(() => {
    const humidity = currentReadings.value.humidity_fc28
    if (humidity == null) return 'unknown'
    if (humidity < 20) return 'critical'
    if (humidity > 80) return 'optimal'
    return 'moderate'
  })

  const waterStressLabel = computed(() => ({
    unknown: 'No humidity reading available',
    critical: 'Water stress - irrigation required',
    optimal: 'Optimal humidity',
    moderate: 'Moderate humidity',
  }[waterStressLevel.value]))

  const criticalSalinityReadings = computed(() =>
    salinityHistory.value.filter((entry) => Number(entry.salinity_hr202l) > 5)
  )
  const hasSalinityAlert = computed(() => criticalSalinityReadings.value.length > 0)
  const currentSalinity = computed(() => currentReadings.value.salinity_hr202l)
  const detectionCount = computed(() => pirEvents.value.filter((event) => event.status === 'DETECTED').length)
  const recentPirEvents = computed(() =>
    [...pirEvents.value]
      .sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)))
      .map((event, index) => ({ ...event, displayIndex: index + 1 }))
  )

  const setFeedback = (message) => {
    feedback.value = message
    window.setTimeout(() => {
      if (feedback.value === message) feedback.value = ''
    }, 2600)
  }

  const loadTelemetry = async () => {
    status.value = 'loading'
    error.value = ''
    const results = await Promise.allSettled([
      telemetryApi.getCurrentReadings(),
      telemetryApi.getSalinityHistory(),
      telemetryApi.getPirEvents(),
    ])

    if (results[0].status === 'fulfilled') currentReadings.value = { ...emptyReadings(), ...results[0].value }
    if (results[1].status === 'fulfilled') salinityHistory.value = results[1].value
    if (results[2].status === 'fulfilled') pirEvents.value = results[2].value

    const failures = results.filter((result) => result.status === 'rejected')
    status.value = failures.length ? 'partial' : 'success'
    error.value = failures.length ? 'Some telemetry data could not be loaded. No demo readings are shown.' : ''
  }

  const toggleIrrigation = async () => {
    const nextState = !isIrrigating.value
    try {
      await telemetryApi.toggleIrrigation({ active: nextState })
      isIrrigating.value = nextState
      await loadTelemetry()
      setFeedback(nextState ? 'Irrigation started.' : 'Irrigation stopped.')
    } catch (requestError) {
      setFeedback(requestError.message || 'Irrigation command could not be sent.')
    }
  }

  const refreshHumidityReading = () => loadTelemetry()

  return {
    currentReadings,
    salinityHistory,
    pirEvents,
    isIrrigating,
    status,
    error,
    feedback,
    waterStressLevel,
    waterStressLabel,
    criticalSalinityReadings,
    hasSalinityAlert,
    currentSalinity,
    detectionCount,
    recentPirEvents,
    loadTelemetry,
    toggleIrrigation,
    refreshHumidityReading,
    setFeedback,
  }
})
