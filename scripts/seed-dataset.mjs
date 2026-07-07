#!/usr/bin/env node

const DEFAULT_API_BASE_URL =
  'https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io'

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const verbose = args.has('--verbose')

const apiBaseUrl = stripTrailingSlash(
  process.env.SATECHO_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    DEFAULT_API_BASE_URL
)
const seedTag = process.env.SATECHO_SEED_TAG || new Date().toISOString().slice(0, 10)
const emailDomain = process.env.SATECHO_SEED_EMAIL_DOMAIN || 'seed.satecho.local'
const password = process.env.SATECHO_SEED_PASSWORD || 'SeedPass123.A'

const farmers = [
  {
    key: 'la-esperanza',
    fullName: 'Juan Garcia Seed',
    farm: {
      name: 'La Esperanza Seed Farm',
      location: 'Bogota, Colombia',
      hectares: 28.5,
      cropType: 'TOMATO',
      zones: [
        { name: 'Northern Sector', areaHectares: 8.2, cropType: 'TOMATO' },
        { name: 'Greenhouse A', areaHectares: 2.4, cropType: 'TOMATO' },
        { name: 'East Plot', areaHectares: 6.8, cropType: 'CORN' },
      ],
    },
  },
  {
    key: 'valle-verde',
    fullName: 'Maria Rojas Seed',
    farm: {
      name: 'Valle Verde Seed Farm',
      location: 'Antioquia, Colombia',
      hectares: 41.2,
      cropType: 'AVOCADO',
      zones: [
        { name: 'Avocado Ridge', areaHectares: 15.5, cropType: 'AVOCADO' },
        { name: 'Blueberry Lot', areaHectares: 5.1, cropType: 'BLUEBERRY' },
      ],
    },
  },
]

const agronomist = {
  key: 'agronomist',
  fullName: 'Andrea Morales Seed',
  roles: ['ROLE_AGRONOMIST'],
  registrationNumber: `AGR-${seedTag.replace(/\D/g, '').slice(-6) || '000001'}`,
  specialty: 'Precision irrigation and soil health',
  yearsOfExperience: 8,
}

const metricProfiles = {
  TOMATO: { moisture: 42, ec: 1.8, ph: 6.1, soilTemp: 23, ambientTemp: 27 },
  CORN: { moisture: 55, ec: 1.4, ph: 6.4, soilTemp: 22, ambientTemp: 26 },
  AVOCADO: { moisture: 35, ec: 1.2, ph: 6.0, soilTemp: 21, ambientTemp: 25 },
  BLUEBERRY: { moisture: 62, ec: 0.9, ph: 5.4, soilTemp: 19, ambientTemp: 22 },
}

const now = Date.now()

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function emailFor(key) {
  const cleanTag = seedTag.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return `${key}.${cleanTag}@${emailDomain}`
}

function isoHoursAgo(hours) {
  return new Date(now - hours * 60 * 60 * 1000).toISOString()
}

function jitter(value, amount, index) {
  const delta = ((index % 5) - 2) * amount
  return Number((value + delta).toFixed(2))
}

async function request(path, { method = 'GET', token, body, params } = {}) {
  const url = new URL(`${apiBaseUrl}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    }
  }

  if (dryRun && method !== 'GET') {
    console.log(`[dry-run] ${method} ${url.pathname}`, body ? JSON.stringify(body) : '')
    const id = dryRunId(path, body)
    if (path.includes('/authentication/sign-up')) {
      return {
        id,
        fullName: body.fullName,
        email: body.email,
        roles: body.roles,
        token: `dry-run-token-${id}`,
      }
    }
    return { id, ...(body || {}) }
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const data = text ? parseJson(text) : null
  if (verbose) console.log(`${method} ${url.pathname} -> ${response.status}`)

  if (!response.ok) {
    const message = data?.message || data?.error || data?.detail || text || response.statusText
    const error = new Error(`${method} ${url.pathname} failed with ${response.status}: ${message}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function dryRunId(path, body) {
  const source = `${path}:${JSON.stringify(body || {})}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  return (hash % 900000) + 1000
}

async function ensureUser(user) {
  const email = emailFor(user.key)
  const signUpPayload = {
    fullName: user.fullName,
    email,
    password,
    roles: user.roles || ['ROLE_FARMER'],
    ...(user.registrationNumber ? { registrationNumber: user.registrationNumber } : {}),
    ...(user.specialty ? { specialty: user.specialty } : {}),
    ...(user.yearsOfExperience ? { yearsOfExperience: user.yearsOfExperience } : {}),
  }

  try {
    const data = await request('/api/v1/authentication/sign-up', {
      method: 'POST',
      body: signUpPayload,
    })
    return mapSession(data, email)
  } catch (error) {
    if (![400, 409].includes(error.status)) throw error
    const data = await request('/api/v1/authentication/sign-in', {
      method: 'POST',
      body: { email, password },
    })
    return mapSession(data, email)
  }
}

function mapSession(data, email) {
  return {
    id: data?.id,
    email: data?.email || email,
    fullName: data?.fullName,
    token: data?.token || data?.accessToken || data?.jwt,
  }
}

async function ensureSubscription(session, planType = 'PRO') {
  try {
    return await request('/api/v1/subscriptions/me', {
      method: 'PUT',
      token: session.token,
      body: { planType, billingCycle: 'MONTHLY' },
    })
  } catch (error) {
    console.warn(`Subscription skipped for ${session.email}: ${error.message}`)
    return null
  }
}

async function ensureFarm(session, farmPayload) {
  const farms = dryRun
    ? []
    : await request('/api/v1/farms', { token: session.token }).catch(() => [])
  const existing = Array.isArray(farms)
    ? farms.find((farm) => farm.name === farmPayload.name)
    : null
  if (existing) return existing
  return request('/api/v1/farms', {
    method: 'POST',
    token: session.token,
    body: farmPayload,
  })
}

async function ensureZones(session, farmId, zonePayloads) {
  const existingZones = dryRun
    ? []
    : await request(`/api/v1/farms/${farmId}/zones`, { token: session.token }).catch(() => [])
  const zones = []

  for (const zonePayload of zonePayloads) {
    const existing = Array.isArray(existingZones)
      ? existingZones.find((zone) => zone.name === zonePayload.name)
      : null
    zones.push(
      existing ||
        (await request(`/api/v1/farms/${farmId}/zones`, {
          method: 'POST',
          token: session.token,
          body: zonePayload,
        }))
    )
  }

  return zones
}

async function ensureDevice(session, farmerId, devicePayload) {
  const devices = dryRun
    ? []
    : await request('/api/v1/devices', { token: session.token }).catch(() => [])
  const existing = Array.isArray(devices)
    ? devices.find((device) => device.serialNumber === devicePayload.serialNumber)
    : null
  if (existing) return existing

  return request('/api/v1/devices', {
    method: 'POST',
    token: session.token,
    body: { ...devicePayload, farmerId },
  })
}

async function linkDevice(session, zoneId, deviceId) {
  return request(`/api/v1/zones/${zoneId}/devices`, {
    method: 'POST',
    token: session.token,
    body: { deviceId: Number(deviceId) },
  }).catch((error) => {
    console.warn(`Device link skipped for zone ${zoneId}: ${error.message}`)
    return null
  })
}

async function seedTelemetry(session, zone, device, sampleCount = 18) {
  const profile = metricProfiles[zone.cropType] || metricProfiles.CORN
  const samples = []

  for (let i = sampleCount; i >= 1; i -= 1) {
    const timestamp = isoHoursAgo(i)
    samples.push(
      metric(zone, device, 'SOIL_MOISTURE', jitter(profile.moisture, 1.6, i), timestamp),
      metric(zone, device, 'ELECTRICAL_CONDUCTIVITY', jitter(profile.ec, 0.08, i), timestamp),
      metric(zone, device, 'SOIL_PH', jitter(profile.ph, 0.04, i), timestamp),
      metric(zone, device, 'SOIL_TEMPERATURE', jitter(profile.soilTemp, 0.3, i), timestamp),
      metric(zone, device, 'AMBIENT_TEMPERATURE', jitter(profile.ambientTemp, 0.5, i), timestamp)
    )
  }

  return request('/api/v1/telemetry/batch', {
    method: 'POST',
    token: session.token,
    body: samples,
  }).catch((error) => {
    console.warn(`Telemetry skipped for ${zone.name}: ${error.message}`)
    return null
  })
}

function metric(zone, device, metricType, value, timestamp) {
  return {
    zoneId: Number(zone.id),
    deviceId: Number(device.id),
    metricType,
    value,
    timestamp,
  }
}

async function seedSecurityEvents(session, farm, pirDevice) {
  const events = [
    {
      farmId: Number(farm.id),
      deviceId: Number(pirDevice.id),
      classification: 'PERSON',
      confidenceLevel: 0.93,
      detectedAt: isoHoursAgo(1.2),
      locationDescription: 'Northern Perimeter',
      rawData: JSON.stringify({ source: 'seed-dataset', frame: 'person-north-001' }),
    },
    {
      farmId: Number(farm.id),
      deviceId: Number(pirDevice.id),
      classification: 'VEHICLE',
      confidenceLevel: 0.86,
      detectedAt: isoHoursAgo(6),
      locationDescription: 'Main Entrance',
      rawData: JSON.stringify({ source: 'seed-dataset', frame: 'vehicle-main-002' }),
    },
  ]

  for (const event of events) {
    await request('/api/v1/security/events/ingest', {
      method: 'POST',
      token: session.token,
      body: event,
    }).catch((error) => console.warn(`Security event skipped: ${error.message}`))
  }
}

async function seedRecommendation(agronomistSession, farmerSession, zone) {
  if (!agronomistSession?.token) return null
  return request('/api/v1/recommendations', {
    method: 'POST',
    token: agronomistSession.token,
    body: {
      farmerId: Number(farmerSession.id),
      zoneId: Number(zone.id),
      title: `Review irrigation schedule for ${zone.name}`,
      description: 'Recent soil moisture is trending near the lower threshold.',
      recommendedActions:
        'Increase the next irrigation cycle by 10 minutes and review EC again after 24 hours.',
      priority: 'HIGH',
    },
  }).catch((error) => {
    console.warn(`Recommendation skipped: ${error.message}`)
    return null
  })
}

async function completeOnboarding(session) {
  return request('/api/v1/onboarding/complete', {
    method: 'POST',
    token: session.token,
    body: {},
  }).catch((error) => {
    console.warn(`Onboarding completion skipped for ${session.email}: ${error.message}`)
    return null
  })
}

async function seedFarmer(farmerConfig, agronomistSession) {
  const session = await ensureUser(farmerConfig)
  if (!session.token) throw new Error(`No JWT returned for ${session.email}`)

  await ensureSubscription(session, farmerConfig.key === 'la-esperanza' ? 'PRO' : 'STARTER')
  const farm = await ensureFarm(session, farmerConfig.farm)
  const zones = await ensureZones(session, farm.id, farmerConfig.farm.zones)

  const seededDevices = []
  for (const [index, zone] of zones.entries()) {
    const sensor = await ensureDevice(session, session.id, {
      serialNumber: `SEED-${seedTag}-${farmerConfig.key}-${index + 1}-SOIL`,
      type: 'SOIL_SENSOR',
    })
    await linkDevice(session, zone.id, sensor.id)
    await seedTelemetry(session, zone, sensor)
    seededDevices.push(sensor)
  }

  const valve = await ensureDevice(session, session.id, {
    serialNumber: `SEED-${seedTag}-${farmerConfig.key}-VALVE`,
    type: 'VALVE_CONTROLLER',
  })
  await linkDevice(session, zones[0].id, valve.id)
  seededDevices.push(valve)

  const pir = await ensureDevice(session, session.id, {
    serialNumber: `SEED-${seedTag}-${farmerConfig.key}-PIR`,
    type: 'PIR_SENSOR',
  })
  await seedSecurityEvents(session, farm, pir)
  seededDevices.push(pir)

  await seedRecommendation(agronomistSession, session, zones[0])
  await completeOnboarding(session)

  return {
    email: session.email,
    farm: farm.name,
    zones: zones.length,
    devices: seededDevices.length,
  }
}

async function main() {
  console.log(`Seeding SATECHO dataset into ${apiBaseUrl}`)
  if (dryRun) console.log('Running in dry-run mode; no database writes will be performed.')

  const agronomistSession = await ensureUser(agronomist)
  await ensureSubscription(agronomistSession, 'ENTERPRISE')
  await completeOnboarding(agronomistSession)

  const summary = []
  for (const farmer of farmers) {
    summary.push(await seedFarmer(farmer, agronomistSession))
  }

  console.table(summary)
  console.log(`Agronomist seed account: ${agronomistSession.email}`)
  console.log(`Password for all seed accounts: ${password}`)
}

main().catch((error) => {
  console.error(error.message)
  if (verbose && error.data) console.error(JSON.stringify(error.data, null, 2))
  process.exitCode = 1
})
