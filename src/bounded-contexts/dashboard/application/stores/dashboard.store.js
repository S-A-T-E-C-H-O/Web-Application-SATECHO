import { defineStore } from 'pinia'

import { farmApi } from '@/bounded-contexts/dashboard/infrastructure/farm.api'
import { operationsApi } from '@/bounded-contexts/dashboard/infrastructure/operations.api'

const AUTH_STORAGE_KEY = 'satecho.auth.session'
const ONBOARDING_COMPLETED_KEY = 'satecho.onboarding.completed'

const readJsonStorage = (key, fallback) => {
  const rawValue =
    window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
  if (!rawValue) return fallback

  try {
    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

const readCurrentSession = () => readJsonStorage(AUTH_STORAGE_KEY, null)

const readCurrentSetup = (userId) => {
  const setups = readJsonStorage(ONBOARDING_COMPLETED_KEY, {})
  return setups[userId]?.setup || null
}

const buildZonesFromSetup = (setup) =>
  setup.irrigationZones
    .filter((zone) => zone.name && zone.crop)
    .map((zone, index) => {
      const humidity = Math.max(50, 64 - index * 3)
      const ec = 1.5 + index * 0.1
      const ph = 6.4 + index * 0.1

      return {
        id: zone.name.toLowerCase().replace(/\s+/g, '-'),
        name: zone.name,
        crop: zone.crop,
        areaHectares: zone.areaHectares,
        humidity,
        ec: Number(ec.toFixed(1)),
        ph: Number(ph.toFixed(1)),
        temp: 22 + index,
        waterUsed: Math.round(Number(zone.areaHectares || 1) * 90),
        lastWatering: index === 0 ? 'Today 08:30' : 'Yesterday at 6:00 PM',
        irrigating: false,
        status: 'normal',
      }
    })

const fallbackOverview = {
  farm: {
    name: '-',
    subtitle: 'Smart irrigation and security monitoring',
    owner: '-',
    role: 'Farmer',
  },

  metrics: [
    {
      key: 'water',
      label: 'Water used today',
      value: '2450 L',
      detail: '12% less than yesterday',
      icon: 'water_drop',
    },
    {
      key: 'irrigation',
      label: 'Irrigation cycles',
      value: '8',
      detail: 'Last cycle 45 minutes ago',
      icon: 'play_circle',
    },
    {
      key: 'security',
      label: 'Motion events',
      value: '4',
      detail: '1 event pending review',
      icon: 'sensors',
    },
    {
      key: 'devices',
      label: 'Connected devices',
      value: '18/20',
      detail: '90% network availability',
      icon: 'developer_board',
      progress: 90,
    },
  ],

  alerts: [
    {
      id: 'alert-1',
      level: 'critical',
      badge: 'CRITICAL',
      title: 'Greenhouse A',
      description: 'Critical humidity: 42% (minimum recommended: 65%)',
      time: '5 minutes ago',
      action: 'Open irrigation',
    },
    {
      id: 'alert-2',
      level: 'attention',
      badge: 'ATTENTION',
      title: 'Greenhouse A',
      description: 'Electrical conductivity above recommended threshold',
      time: '15 minutes ago',
      action: 'Review zone',
    },
    {
      id: 'alert-3',
      level: 'attention',
      badge: 'ATTENTION',
      title: 'Southern Sector',
      description: 'Humidity approaching minimum threshold',
      time: '30 minutes ago',
      action: 'Review irrigation',
    },
    {
      id: 'alert-4',
      level: 'info',
      badge: 'INFO',
      title: 'Northern Perimeter',
      description: 'Motion detected by PIR sensor',
      time: '1 hour ago',
      action: 'Review event',
    },
  ],

  zones: [
    {
      id: 'north',
      name: 'Northern Sector',
      crop: 'Tomato',
      status: 'normal',
      humidity: 68,
      ec: 2.4,
      ph: 6.5,
      temp: 24,
      waterUsed: 450,
      lastWatering: 'Today 08:30',
      irrigating: false,
    },
    {
      id: 'south',
      name: 'Southern Sector',
      crop: 'Lettuce',
      status: 'attention',
      humidity: 58,
      ec: 1.5,
      ph: 6.2,
      temp: 22,
      waterUsed: 580,
      lastWatering: 'Today 06:00',
      irrigating: false,
    },
    {
      id: 'greenhouse-a',
      name: 'Greenhouse A',
      crop: 'Strawberry',
      status: 'critical',
      humidity: 42,
      ec: 1.8,
      ph: 5.8,
      temp: 28,
      waterUsed: 320,
      lastWatering: 'In progress',
      irrigating: true,
      irrigationStartedAt: Date.now() - 600000,
    },
    {
      id: 'east',
      name: 'East Plot',
      crop: 'Corn',
      status: 'normal',
      humidity: 55,
      ec: 1.8,
      ph: 6.4,
      temp: 26,
      waterUsed: 720,
      lastWatering: 'Yesterday at 6:00 PM',
      irrigating: false,
    },
  ],
}

const fallbackHistory = [
  ['2026-06-08 06:00', 'Tomato Zone', 'Open', '20 min', '420', '(Automatic) System'],
  ['2026-06-08 06:20', 'Tomato Zone', 'Close', '20 min', '420', '(Automatic) System'],
  ['2026-06-08 07:15', 'Lettuce Zone', 'Open', '15 min', '280', '(Automatic) System'],
  ['2026-06-08 07:30', 'Lettuce Zone', 'Close', '15 min', '280', '(Automatic) System'],
  ['2026-06-08 09:00', 'Strawberry Greenhouse', 'Open', '10 min', '190', 'Farm Manager'],
  ['2026-06-08 09:10', 'Strawberry Greenhouse', 'Close', '10 min', '190', 'Farm Manager'],
  ['2026-06-08 16:30', 'Corn Field', 'Open', '25 min', '610', '(Automatic) System'],
  ['2026-06-08 16:55', 'Corn Field', 'Close', '25 min', '610', '(Automatic) System'],
  ['2026-06-09 06:15', 'Tomato Zone', 'Open', '20 min', '430', '(Automatic) System'],
  ['2026-06-09 06:35', 'Tomato Zone', 'Close', '20 min', '430', '(Automatic) System'],
  ['2026-06-09 08:00', 'Strawberry Greenhouse', 'Open', 'In progress', '210', 'Farm Manager'],
].map(([dateTime, area, action, duration, water, user], index) => ({
  id: `history-${index}`,
  dateTime,
  area,
  action,
  duration,
  water,
  user,
}))

const fallbackDevices = [
  ['Tomato Zone Soil Sensor', 'SENS-001', 'Ground sensor', 'Tomato Zone', 'online', 88, '1 min ago', 'water_drop', 'v1.2.0', 96, 'Healthy'],
  ['Lettuce Zone Soil Sensor', 'SENS-002', 'Ground sensor', 'Lettuce Zone', 'online', 73, '3 min ago', 'water_drop', 'v1.2.0', 91, 'Healthy'],
  ['Strawberry Greenhouse Sensor', 'SENS-003', 'Ground sensor', 'Strawberry Greenhouse', 'online', 62, '2 min ago', 'water_drop', 'v1.2.0', 87, 'Healthy'],
  ['Corn Field Sensor', 'SENS-004', 'Ground sensor', 'Corn Field', 'online', 41, '5 min ago', 'water_drop', 'v1.2.0', 80, 'Warning'],
  ['Tomato Zone Valve', 'VALVE-001', 'Valve controller', 'Tomato Zone', 'online', 100, '30 sec ago', 'valve', 'v2.0.0', 100, 'Healthy'],
  ['Lettuce Zone Valve', 'VALVE-002', 'Valve controller', 'Lettuce Zone', 'online', 100, '45 sec ago', 'valve', 'v2.0.0', 100, 'Healthy'],
  ['Corn Field Valve', 'VALVE-003', 'Valve controller', 'Corn Field', 'offline', 12, '2 hrs ago', 'valve', 'v2.0.0', 15, 'Critical'],
  ['Main PIR Sensor', 'PIR-001', 'Passive Infrared Sensor', 'North Perimeter', 'online', 95, 'Live', 'sensors', 'v1.0.0', 94, 'Healthy'],
  ['Entrance PIR Sensor', 'PIR-002', 'Passive Infrared Sensor', 'Main Entrance', 'online', 93, 'Live', 'sensors', 'v1.0.0', 92, 'Healthy'],
  ['Weather Station', 'WEATHER-001', 'Weather station', 'Central Area', 'online', 67, '4 min ago', 'air', 'v3.1.0', 89, 'Healthy']
].map(([name, code, type, zone, status, battery, lastReading, icon, firmware, signal, health,]) => ({
      id: code,
      name,
      code,
      type,
      zone,
      status,
      battery,
      lastReading,
      icon,
      firmware,
      signal,
      health,
      installedAt: '2026-01-15',
    })
)

const fallbackSecurityEvents = [
  ['motion-1', 'Motion detected', 100, 'Without checking', 'Northern Perimeter', '5 minutes ago', 'PIR-001', 'critical', false, 'sensors'],
  ['motion-2', 'Motion detected', 100, 'Notification sent', 'Main Entrance', '52 minutes ago', 'PIR-002', 'normal', true, 'sensors'],
  ['motion-3', 'Motion detected', 100, '', 'South Perimeter', '2 hours ago', 'PIR-003', 'warning', true, 'sensors'],
  ['motion-4', 'Motion detected', 100, '', 'Greenhouse A', '4 hours ago', 'PIR-004', 'info', true, 'sensors']
].map(([id, type, trust, note, location, time, device, priority, reviewed, icon]) => ({
  id,
  type,
  trust,
  note,
  location,
  time,
  device,
  priority,
  reviewed,
  icon,
}))

const authSession =
    JSON.parse(
        localStorage.getItem('satecho.auth.session') ||
        sessionStorage.getItem('satecho.auth.session') ||
        '{}'
    )

const loadNotificationPreferences = () => {
  try {
    const saved = localStorage.getItem(
        'notificationPreferences'
    )

    return saved
        ? JSON.parse(saved)
        : defaultNotificationPreferences()
  } catch {
    return defaultNotificationPreferences()
  }
}

const defaultNotificationPreferences = () => ({
  matrix: {
    criticalHumidity: {push: true, whatsapp: true, sms: false, email: true,},
    humidity: {push: true, whatsapp: false, sms: false, email: true,},
    movement: {push: true, whatsapp: true, sms: true, email: true,},
    offline: {push: true, whatsapp: false, sms: false, email: true,},
    battery: {push: false, whatsapp: false, sms: false, email: true,},
  },
  whatsappPhone:
      authSession?.user?.phone
          ? `${authSession.user.countryCode || ''} ${authSession.user.phone}`
          : '',
  dailySummary: true,
  dailyTime: '08:00 AM',

  quietHours: {
    start: '22:00',
    end: '06:00',
  },

  alertSeverity: {
    criticalOnly: true,
    deviceFailures: true,
    securityEvents: true,
    informational: false,
  },

  emergencyContacts: [],
  security: {
    sensitivity: 70,
    types: {
      movement: true,
    },
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
      day,
      enabled: true,
      start: ['Saturday', 'Sunday'].includes(day) ? '00:00' : '18:00',
      end: ['Saturday', 'Sunday'].includes(day) ? '23:59' : '06:00',
    })),
  },
})

const normalizeOverview = (payload) => ({
  ...fallbackOverview,
  ...payload,
  farm: {
    ...fallbackOverview.farm,
    ...(payload.farm || {}),
  },
  metrics: payload.metrics || fallbackOverview.metrics,
  alerts: payload.alerts || fallbackOverview.alerts,
  zones: payload.zones || fallbackOverview.zones,
})

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    overview: normalizeOverview({}),
    history: fallbackHistory,
    devices: fallbackDevices,
    securityEvents: fallbackSecurityEvents,
    notificationPreferences: loadNotificationPreferences(),
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
    sortedHistory: (state) => state.history,
    unreadSecurityEvents: (state) =>
      state.securityEvents.filter((event) => !event.reviewed).length,
    onlineDevices: (state) =>
      state.devices.filter((device) => device.status === 'online').length,
    offlineDevices: (state) =>
      state.devices.filter((device) => device.status === 'offline').length,
    lowBatteryDevices: (state) =>
      state.devices.filter((device) => Number(device.battery) <= 20).length,
  },

  actions: {
    setFeedback(message) {
      this.feedback = message
      window.setTimeout(() => {
        if (this.feedback === message) this.feedback = ''
      }, 2600)
    },

    updateOverviewMetrics() {
      const devicesMetric = this.overview.metrics.find((metric) => metric.key === 'devices')
      const irrigationMetric = this.overview.metrics.find((metric) => metric.key === 'irrigation')

      if (devicesMetric) {
        devicesMetric.value = `${this.onlineDevices}/${this.devices.length}`
        devicesMetric.progress = Math.round((this.onlineDevices / this.devices.length) * 100)
        devicesMetric.detail = `${devicesMetric.progress}% active network`
      }

      if (irrigationMetric) {
        irrigationMetric.value = String(this.history.filter((item) => item.action === 'Open').length)
        irrigationMetric.detail = 'Updated from local activity'
      }
    },

    async loadDashboard() {
      this.status = 'loading'
      this.error = ''

      const tasks = await Promise.allSettled([
        farmApi.getOverview(),
        farmApi.getIrrigationHistory(),
        farmApi.getDevices(),
        operationsApi.getSecurityEvents(),
      ])

      if (tasks[0].status === 'fulfilled') this.overview = normalizeOverview(tasks[0].value)
      if (tasks[1].status === 'fulfilled' && Array.isArray(tasks[1].value.items)) this.history = tasks[1].value.items
      if (tasks[2].status === 'fulfilled' && Array.isArray(tasks[2].value.items)) this.devices = tasks[2].value.items
      if (tasks[3].status === 'fulfilled' && Array.isArray(tasks[3].value.items)) this.securityEvents = tasks[3].value.items

      const failed = tasks.some((task) => task.status === 'rejected')
      this.status = failed ? 'local' : 'success'
      this.error = failed ? 'Using local dashboard data while Beeceptor is unavailable.' : ''
      this.applyLocalUserConfiguration()
      this.updateOverviewMetrics()
    },

    applyLocalUserConfiguration() {
      const session = readCurrentSession()
      const user = session?.user
      if (!user?.id) return

      const setup = readCurrentSetup(user.id)

      this.overview.farm = {
        ...this.overview.farm,
        name: setup?.property?.name || this.overview.farm.name,
        subtitle: setup?.property
          ? `${setup.property.location || 'Configured property'} - ${setup.property.sizeHectares || 0} ha`
          : this.overview.farm.subtitle,
        owner: user.fullName || this.overview.farm.owner,
        role: user.role === 'agronomist' ? 'Agronomist' : 'Farmer',
        location: setup?.property?.location || user.location || '',
        sizeHectares: setup?.property?.sizeHectares || '',
      }

      if (!setup) return

      const zones = buildZonesFromSetup(setup)
      this.overview.zones = zones.length ? zones : this.overview.zones
      this.history = this.overview.zones.flatMap((zone, index) => [
        {
          id: `setup-open-${zone.id}`,
          dateTime: 'Today 08:30',
          area: zone.name,
          action: 'Open',
          duration: `${15 + index * 5} min`,
          water: String(zone.waterUsed),
          user: '(Automatic) System',
        },
        {
          id: `setup-close-${zone.id}`,
          dateTime: 'Today 08:45',
          area: zone.name,
          action: 'Close',
          duration: `${15 + index * 5} min`,
          water: String(zone.waterUsed),
          user: user.fullName || 'Current user',
        },
      ])
    },

    updateFarmProfile(profile) {
      const session = readCurrentSession()
      const userId = session?.user?.id
      if (!userId) return

      const setups = readJsonStorage(ONBOARDING_COMPLETED_KEY, {})
      const currentSetup = setups[userId]?.setup || {
        property: {},
        irrigationZones: [],
      }

      setups[userId] = {
        ...setups[userId],
        completed: true,
        setup: {
          ...currentSetup,
          property: {
            ...currentSetup.property,
            name: profile.propertyName || currentSetup.property.name,
            location: profile.location || currentSetup.property.location,
            sizeHectares:
              profile.sizeHectares || currentSetup.property.sizeHectares,
          },
        },
      }
      window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, JSON.stringify(setups))
      this.applyLocalUserConfiguration()
      this.setFeedback('Farm profile updated.')
    },

    async toggleIrrigation(zoneId, minutes = 15) {
      const zone = this.overview.zones.find((item) => item.id === zoneId)
      if (!zone) return

      const nextState = !zone.irrigating
      zone.irrigating = nextState

      if (nextState) {
        zone.irrigationStartedAt = Date.now()
        zone.lastWatering = 'In progress'
      } else {
        zone.irrigationStartedAt = null
        zone.lastWatering = 'Just closed'
      }

      const action = {
        zoneId,
        zoneName: zone.name,
        action: nextState ? 'open' : 'close',
        durationMinutes: minutes,
        user: this.overview.farm.owner,
      }

      this.history.unshift({
        id: `history-${Date.now()}`,
        dateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        area: zone.name,
        action: nextState ? 'Open' : 'Close',
        duration: nextState ? 'In progress' : `${minutes} min`,
        water: nextState ? String(zone.waterUsed) : '-',
        user: this.overview.farm.owner,
      })
      this.updateOverviewMetrics()

      try {
        await operationsApi.registerIrrigationAction(action)
        this.setFeedback(`${zone.name}: irrigation ${nextState ? 'opened' : 'stopped'}.`)
      } catch {
        this.setFeedback(`${zone.name}: local irrigation action saved.`)
      }
    },

    markSecurityReviewed(eventId) {
      const event = this.securityEvents.find((item) => item.id === eventId)
      if (event) {
        event.reviewed = true
        event.note = 'Reviewed'
        event.reviewedAt = new Date().toLocaleString()
        this.setFeedback(`${event.type} event marked as reviewed.`)
      }
    },

    createSecurityEvent() {
      const now = new Date()

      const event = {
        id: `event-${now.getTime()}`,
        type: 'Motion detected',
        note: 'Pending review',
        location: 'North Perimeter',
        time: 'Just now',
        device: 'PIR-001',
        priority: 'critical',
        reviewed: false,
        icon: 'sensors',
        classification: null,
      }

      this.securityEvents.unshift(event)

      this.setFeedback(
          'Motion event generated.'
      )
    },

    registerDevice() {
      const nextIndex = this.devices.length + 1
      const device = {
        id: `SENS-${String(nextIndex).padStart(3, '0')}`,
        name: `New Ground Sensor ${nextIndex}`,
        code: `SENS-${String(nextIndex).padStart(3, '0')}`,
        type: 'Ground sensor',
        zone: 'Greenhouse A',
        status: 'online',
        battery: 100,
        signal: 100,
        firmware: 'v1.0.0',
        health: 'Healthy',
        installedAt: new Date().toISOString().split('T')[0],
        lastReading: 'Just now',
        icon: 'water_drop',
      }

      this.devices.unshift(device)
      this.updateOverviewMetrics()
      this.setFeedback(`${device.name} registered locally.`)
    },

    toggleDeviceStatus(deviceId) {
      const device = this.devices.find((item) => item.id === deviceId)
      if (!device) return

      device.status = device.status === 'online' ? 'offline' : 'online'
      device.lastReading = device.status === 'online' ? 'Just now' : 'Disconnected'
      this.updateOverviewMetrics()
      this.setFeedback(`${device.name} is now ${device.status}.`)
    },

    refreshDeviceReading(deviceId) {
      const device = this.devices.find((item) => item.id === deviceId)
      if (!device) return

      device.battery = Math.max(5, Number(device.battery) - 1)
      device.lastReading = 'Just now'
      this.setFeedback(`${device.name} reading refreshed.`)
    },

    async saveNotificationPreferences() {
      localStorage.setItem(
          'notificationPreferences',
          JSON.stringify(this.notificationPreferences)
      )
      this.feedback =
          'Notification settings updated successfully.'
    },

    classifySecurityEvent(
        eventId,
        classification
    ) {
      const event =
          this.securityEvents.find(
              e => e.id === eventId
          )
      if (!event) return
      event.classification =
          classification
      event.reviewed = true
      event.note = 'Reviewed'
      this.setFeedback(
          `Event classified as ${classification}.`
      )
    },
  },
})
