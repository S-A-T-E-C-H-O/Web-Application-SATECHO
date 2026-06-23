import { defineStore } from 'pinia'

import { farmApi } from '@/bounded-contexts/dashboard/infrastructure/farm.api'
import { operationsApi } from '@/bounded-contexts/dashboard/infrastructure/operations.api'

const AUTH_STORAGE_KEY = 'satecho.auth.session'

const readCurrentSession = () => {
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY) || window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const emptyOverview = () => ({
  farm: {
    id: null,
    name: 'Your property',
    subtitle: 'No property has been configured yet.',
    owner: '',
    role: 'Farmer',
    location: '',
    sizeHectares: 0,
  },
  metrics: [
    { key: 'water', label: 'Water used today', value: '0 L', detail: 'No irrigation sessions today', icon: 'water_drop' },
    { key: 'irrigation', label: 'Irrigation cycles', value: '0', detail: 'No irrigation sessions today', icon: 'play_circle' },
    { key: 'security', label: 'Motion events', value: '0', detail: 'No events pending review', icon: 'sensors' },
    { key: 'devices', label: 'Connected devices', value: '0/0', detail: 'No devices registered', icon: 'developer_board', progress: 0 },
  ],
  alerts: [],
  zones: [],
})

const defaultNotificationPreferences = () => ({
  matrix: {
    criticalHumidity: { push: true, whatsapp: true, sms: false, email: true },
    humidity: { push: true, whatsapp: false, sms: false, email: true },
    movement: { push: true, whatsapp: true, sms: true, email: true },
    offline: { push: true, whatsapp: false, sms: false, email: true },
    battery: { push: false, whatsapp: false, sms: false, email: true },
  },
  whatsappPhone: '',
  dailySummary: true,
  dailyTime: '08:00 AM',
  quietHours: { start: '22:00', end: '06:00' },
  alertSeverity: { criticalOnly: true, deviceFailures: true, securityEvents: true, informational: false },
  emergencyContacts: [],
  security: {
    sensitivity: 70,
    types: { movement: true },
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
      day,
      enabled: true,
      start: ['Saturday', 'Sunday'].includes(day) ? '00:00' : '18:00',
      end: ['Saturday', 'Sunday'].includes(day) ? '23:59' : '06:00',
    })),
  },
})

const notificationTypeByKey = {
  criticalHumidity: 'CRITICAL_HUMIDITY',
  humidity: 'HUMIDITY',
  movement: 'SECURITY_EVENT',
  offline: 'OFFLINE_DEVICE',
  battery: 'LOW_BATTERY',
}

const channelsFor = (matrixRow) =>
  Object.entries(matrixRow)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel.toUpperCase())

const applyServerPreferences = (preferences, serverPreferences) => {
  serverPreferences.forEach((preference) => {
    const entry = Object.entries(notificationTypeByKey).find(([, type]) => type === preference.notificationType)
    if (!entry) return
    const [key] = entry
    const channels = new Set(preference.channelsEnabled || [])
    preferences.matrix[key] = {
      push: channels.has('PUSH'),
      whatsapp: channels.has('WHATSAPP'),
      sms: channels.has('SMS'),
      email: channels.has('EMAIL'),
    }
    preferences.dailySummary = preference.dailyDigestEnabled ?? preferences.dailySummary
    preferences.quietHours = {
      start: preference.quietHoursStart || preferences.quietHours.start,
      end: preference.quietHoursEnd || preferences.quietHours.end,
    }
  })
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    overview: emptyOverview(),
    history: [],
    devices: [],
    securityEvents: [],
    securitySettings: null,
    notificationPreferences: defaultNotificationPreferences(),
    cropTypes: [],
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
    sortedHistory: (state) => state.history,
    unreadSecurityEvents: (state) => state.securityEvents.filter((event) => !event.reviewed).length,
    onlineDevices: (state) => state.devices.filter((device) => device.online).length,
    offlineDevices: (state) => state.devices.filter((device) => !device.online && device.status !== 'pending_activation').length,
    lowBatteryDevices: (state) => state.devices.filter((device) => Number(device.battery) <= 20).length,
  },

  actions: {
    setFeedback(message) {
      this.feedback = message
      window.setTimeout(() => {
        if (this.feedback === message) this.feedback = ''
      }, 3000)
    },

    updateOverviewMetrics() {
      const metrics = this.overview.metrics
      const completedSessions = this.history.filter((item) => item.action === 'Close')
      const waterUsed = completedSessions.reduce((total, item) => total + (Number(item.water) || 0), 0)
      const setMetric = (key, values) => Object.assign(metrics.find((metric) => metric.key === key), values)

      setMetric('water', {
        value: `${waterUsed} L`,
        detail: waterUsed ? 'Calculated from irrigation sessions' : 'No irrigation sessions yet',
      })
      setMetric('irrigation', {
        value: String(completedSessions.length),
        detail: completedSessions.length ? 'Recorded irrigation sessions' : 'No irrigation sessions yet',
      })
      setMetric('security', {
        value: String(this.securityEvents.length),
        detail: this.unreadSecurityEvents ? `${this.unreadSecurityEvents} pending review` : 'No events pending review',
      })
      const totalDevices = this.devices.length
      setMetric('devices', {
        value: `${this.onlineDevices}/${totalDevices}`,
        detail: totalDevices ? `${this.onlineDevices} active device${this.onlineDevices === 1 ? '' : 's'}` : 'No devices registered',
        progress: totalDevices ? Math.round((this.onlineDevices / totalDevices) * 100) : 0,
      })
    },

    async loadDashboard() {
      this.status = 'loading'
      this.error = ''
      this.overview = emptyOverview()
      this.history = []
      this.devices = []
      this.securityEvents = []
      const tasks = await Promise.allSettled([
        farmApi.getOverview(),
        farmApi.getIrrigationHistory(),
        farmApi.getDevices(),
        operationsApi.getSecurityEvents(),
        operationsApi.getSecuritySettings(),
        farmApi.getCropTypes(),
        operationsApi.getNotificationPreferences(),
      ])

      if (tasks[0].status === 'fulfilled') {
        this.overview = { ...emptyOverview(), ...tasks[0].value, metrics: emptyOverview().metrics }
      }
      if (tasks[1].status === 'fulfilled') this.history = tasks[1].value.items
      if (tasks[2].status === 'fulfilled') this.devices = tasks[2].value.items
      if (tasks[3].status === 'fulfilled') this.securityEvents = tasks[3].value.items
      if (tasks[4].status === 'fulfilled' && tasks[4].value) {
        this.securitySettings = tasks[4].value
        this.notificationPreferences.security.sensitivity =
          tasks[4].value.motionSensitivity ?? this.notificationPreferences.security.sensitivity
      }
      if (tasks[5].status === 'fulfilled') this.cropTypes = tasks[5].value
      if (tasks[6].status === 'fulfilled') applyServerPreferences(this.notificationPreferences, tasks[6].value)

      const failures = tasks.filter((task) => task.status === 'rejected')
      this.status = failures.length ? 'partial' : 'success'
      this.error = failures.length ? 'Some live data could not be loaded. Try updating again.' : ''
      this.updateOverviewMetrics()
    },

    async saveZone({ id, name, areaHectares, cropType }) {
      const farmId = this.overview.farm.id
      if (!farmId && !id) throw new Error('Create a property before adding zones.')
      const payload = { name, areaHectares: Number(areaHectares), cropType }
      if (id) await farmApi.updateZone(id, payload)
      else await farmApi.createZone(farmId, payload)
      await this.loadDashboard()
      this.setFeedback(id ? 'Zone updated.' : 'Zone created.')
    },

    async updateFarmProfile(profile) {
      const farm = this.overview.farm
      if (!farm.id) throw new Error('Create a property before updating its details.')
      await farmApi.updateFarm(farm.id, {
        name: profile.propertyName || farm.name,
        location: profile.location || farm.location,
        hectares: Number(profile.sizeHectares || farm.sizeHectares),
        cropType: farm.cropType,
      })
      await this.loadDashboard()
      this.setFeedback('Property details updated.')
    },

    async registerDevice({ serialNumber, type, zoneId }) {
      await farmApi.registerDevice({ serialNumber, type, zoneId })
      await this.loadDashboard()
      this.setFeedback('Device registered. It will remain pending activation until hardware provisioning is completed.')
    },

    async refreshDeviceStatus(deviceId) {
      const status = await farmApi.getDeviceStatus(deviceId)
      const device = this.devices.find((item) => item.id === String(deviceId))
      if (device) {
        device.status = String(status.status || device.status).toLowerCase()
        device.online = Boolean(status.online)
        device.battery = status.batteryLevel ?? device.battery
        device.health = status.healthStatus || device.health
        device.firmware = status.firmwareVersion || device.firmware
      }
      this.updateOverviewMetrics()
      this.setFeedback('Device status refreshed.')
    },

    async deactivateDevice(deviceId) {
      await farmApi.deactivateDevice(deviceId)
      await this.loadDashboard()
      this.setFeedback('Device deactivated.')
    },

    async toggleIrrigation(zoneId, minutes = 15) {
      const zone = this.overview.zones.find((item) => item.id === String(zoneId))
      if (!zone) return
      if (!zone.irrigating && !zone.deviceId) {
        this.setFeedback('This zone needs a linked actuator before irrigation can start.')
        return
      }
      try {
        const wasIrrigating = zone.irrigating
        await operationsApi.registerIrrigationAction({
          zoneId,
          action: wasIrrigating ? 'close' : 'open',
          durationMinutes: minutes,
          user: this.overview.farm.owner || 'Current user',
        })
        await this.loadDashboard()
        this.setFeedback(wasIrrigating ? 'Irrigation stopped.' : 'Irrigation started.')
      } catch (error) {
        this.setFeedback(error.message || 'Irrigation command could not be sent.')
      }
    },

    async markSecurityReviewed(eventId) {
      try {
        const user = readCurrentSession()?.user
        await operationsApi.acknowledgeSecurityEvent(eventId, user?.id)
        await this.loadDashboard()
        this.setFeedback('Security event marked as reviewed.')
      } catch (error) {
        this.setFeedback(error.message || 'Security event could not be updated.')
      }
    },

    async saveSecuritySettings() {
      const security = this.notificationPreferences.security
      const activeSchedule = security.schedule.find((day) => day.enabled) || security.schedule[0]
      this.securitySettings = await operationsApi.saveSecuritySettings({
        motionSensitivity: security.sensitivity,
        alertMode: security.types.movement ? 'ACTIVE' : 'MUTED',
        detectionScheduleStart: activeSchedule?.start || '00:00',
        detectionScheduleEnd: activeSchedule?.end || '23:59',
        notificationContacts: this.notificationPreferences.emergencyContacts.map((contact) => contact.phone).filter(Boolean).join(','),
      })
      this.setFeedback('Security settings updated.')
    },

    async saveNotificationPreferences() {
      const preferences = this.notificationPreferences
      await Promise.all(
        Object.entries(notificationTypeByKey).map(([key, notificationType]) =>
          operationsApi.saveNotificationPreferences({
            notificationType,
            channelsEnabled: channelsFor(preferences.matrix[key]),
            dailyDigestEnabled: preferences.dailySummary,
            quietHoursStart: preferences.quietHours.start,
            quietHoursEnd: preferences.quietHours.end,
          })
        )
      )
      this.setFeedback('Notification preferences updated.')
    },
  },
})
