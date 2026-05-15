import { defineStore } from 'pinia'

import { farmApi } from '@/bounded-contexts/dashboard/infrastructure/farm.api'
import { operationsApi } from '@/bounded-contexts/dashboard/infrastructure/operations.api'

const fallbackOverview = {
  farm: {
    name: 'La Esperanza Farm',
    subtitle: 'Overview of soil and irrigation monitoring',
    owner: 'Juan Garcia',
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
      label: 'Irrigation today',
      value: '8',
      detail: 'Last 45 minutes ago',
      icon: 'play_circle',
    },
    {
      key: 'resolved',
      label: 'Alerts resolved',
      value: '12',
      detail: 'All criticisms addressed',
      icon: 'check_circle',
    },
    {
      key: 'devices',
      label: 'Devices',
      value: '18/20',
      detail: '90% active network',
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
      description: 'High EC: 1.8 mS/cm (recommended maximum: 1.5)',
      time: '15 minutes ago',
      action: 'View details',
    },
    {
      id: 'alert-3',
      level: 'attention',
      badge: 'ATTENTION',
      title: 'Southern Sector',
      description: 'Low humidity: 58% (minimum recommended: 65%)',
      time: '30 minutes ago',
      action: 'Open irrigation',
    },
    {
      id: 'alert-4',
      level: 'info',
      badge: 'INFO',
      title: 'Northern Perimeter',
      description: 'Movement detected - Confidence: 87%',
      time: '1 hour ago',
      action: 'View event',
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
    },
  ],
}

const fallbackHistory = [
  ['2024-01-15 14:30', 'Northern Sector', 'Open', '15 min', '450', '(Automatic) System'],
  ['2024-01-15 14:15', 'Greenhouse A', 'Open', 'In progress', '320', 'Juan Garcia'],
  ['2024-01-15 08:30', 'Northern Sector', 'Close', '15 min', '450', '(Automatic) System'],
  ['2024-01-15 08:15', 'Northern Sector', 'Open', '-', '-', '(Automatic) System'],
  ['2024-01-15 06:20', 'Southern Sector', 'Close', '20 min', '580', '(Automatic) System'],
  ['2024-01-15 06:00', 'Southern Sector', 'Open', '-', '-', '(Automatic) System'],
  ['2024-01-14 18:25', 'East Plot', 'Close', '25 min', '720', 'Juan Garcia'],
  ['2024-01-14 18:00', 'East Plot', 'Open', '-', '-', 'Juan Garcia'],
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
  ['North-1 Ground Sensor', 'SENS-001', 'Ground sensor', 'Northern Sector', 'online', 85, '2 min ago', 'water_drop'],
  ['North-2 Ground Sensor', 'SENS-002', 'Ground sensor', 'Northern Sector', 'online', 72, '3 min ago', 'water_drop'],
  ['South-1 Soil Sensor', 'SENS-003', 'Ground sensor', 'Sector Sur', 'online', 45, '1 min ago', 'water_drop'],
  ['Main North Valve', 'VALVE-001', 'Valve controller', 'Northern Sector', 'online', 100, '30 sec ago', 'valve'],
  ['Main South Valve', 'VALVE-002', 'Valve controller', 'Southern Sector', 'offline', 15, '2 hrs ago', 'valve'],
  ['PIR North Perimeter', 'PIR-001', 'Passive Infrared sensor', 'Northern Perimeter', 'online', 100, 'Live', 'videocam'],
  ['PIR Main Entrance', 'PIR-002', 'Passive Infrared sensor', 'Entrada Principal', 'online', 100, 'Live', 'videocam'],
  ['Central Meteorological Station', 'WEATHER-001', 'Weather station', 'Central', 'online', 68, '5 min ago', 'air'],
].map(([name, code, type, zone, status, battery, lastReading, icon]) => ({
  id: code,
  name,
  code,
  type,
  zone,
  status,
  battery,
  lastReading,
  icon,
}))

const fallbackSecurityEvents = [
  ['person-1', 'Person', 92, 'Without checking', 'Northern Perimeter', '5 minutes ago', 'PIR-001', 'critical', false, 'person'],
  ['vehicle-1', 'Vehicle', 88, 'Notification sent', 'Main Entrance', '52 minutes ago', 'PIR-002', 'normal', true, 'directions_car'],
  ['animal-1', 'Animal', 75, '', 'Perimetro Sur', '2 hours ago', 'PIR-003', 'warning', true, 'pets'],
  ['wind-1', 'Strong wind', 95, '', 'Invernadero A', '4 hours ago', 'SENSOR-WIND-01', 'info', true, 'air'],
  ['person-2', 'Person', 87, 'Notification sent', 'Perimetro Este', '6 hours ago', 'PIR-004', 'normal', true, 'person'],
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

const defaultNotificationPreferences = () => ({
  matrix: {
    criticalHumidity: { push: true, whatsapp: true, sms: false, email: true },
    humidity: { push: true, whatsapp: false, sms: false, email: true },
    person: { push: true, whatsapp: true, sms: true, email: true },
    vehicle: { push: true, whatsapp: true, sms: false, email: true },
    offline: { push: true, whatsapp: false, sms: false, email: true },
    battery: { push: false, whatsapp: false, sms: false, email: true },
  },
  whatsappPhone: '+57 300 123 4567',
  dailySummary: true,
  dailyTime: '08:00 AM',
  security: {
    sensitivity: 70,
    types: {
      person: true,
      vehicle: true,
      animal: false,
      wind: false,
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
    notificationPreferences: defaultNotificationPreferences(),
    status: 'idle',
    error: '',
    feedback: '',
  }),

  getters: {
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
    },

    async toggleIrrigation(zoneId, minutes = 15) {
      const zone = this.overview.zones.find((item) => item.id === zoneId)
      if (!zone) return

      const nextState = !zone.irrigating
      zone.irrigating = nextState
      zone.lastWatering = nextState ? 'In progress' : 'Just closed'

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
      }
    },

    async saveNotificationPreferences() {
      try {
        await operationsApi.saveNotificationPreferences(this.notificationPreferences)
        this.setFeedback('Notification preferences saved.')
      } catch {
        this.setFeedback('Notification preferences saved locally.')
      }
    },
  },
})
