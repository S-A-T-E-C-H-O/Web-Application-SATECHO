import { apiRequest } from '@/shared/infrastructure/http/api-client'

const cropTypeByLabel = {
  Wheat: 'WHEAT',
  'Cherry Tomatoes': 'TOMATO',
  Avocado: 'AVOCADO',
  Blueberries: 'BLUEBERRY',
  Corn: 'CORN',
  Lettuce: 'LETTUCE',
}

const toCropType = (crop) => cropTypeByLabel[crop] || String(crop || 'CORN').toUpperCase()

const toFarmPayload = (setup) => {
  const zones = (setup.irrigationZones || [])
    .filter((zone) => zone.name && zone.crop)
    .map((zone) => ({
      name: zone.name,
      areaHectares: Number(zone.areaHectares),
      cropType: toCropType(zone.crop),
    }))

  return {
    name: setup.property?.name,
    location: setup.property?.location,
    hectares: Number(setup.property?.sizeHectares),
    cropType: zones[0]?.cropType || 'CORN',
    zones,
  }
}

export const onboardingApi = {
  async getStatus(_userId) {
    const response = await apiRequest({
      method: 'GET',
      url: '/api/v1/onboarding/status',
    })
    const data = response?.data || {}

    return {
      completed: Boolean(data.completed),
      currentStep: data.currentStep || 1,
      setup: data.setup || {},
      message: data.message || '',
    }
  },

  async complete(setup) {
    const payload = toFarmPayload(setup)
    const { zones, ...farmData } = payload
    const farmsResponse = await apiRequest({ method: 'GET', url: '/api/v1/farms' })
    const farms = Array.isArray(farmsResponse?.data) ? farmsResponse.data : []
    const existingFarm = farms.find((farm) => farm.name === payload.name)

    if (existingFarm) {
      await apiRequest({
        method: 'PUT',
        url: `/api/v1/farms/${existingFarm.id}`,
        data: farmData,
      })

      const zonesResponse = await apiRequest({
        method: 'GET',
        url: `/api/v1/farms/${existingFarm.id}/zones`,
      })
      const existingZones = Array.isArray(zonesResponse?.data) ? zonesResponse.data : []
      const missingZones = zones.filter(
        (zone) => !existingZones.some((existingZone) => existingZone.name === zone.name)
      )

      await Promise.all(
        missingZones.map((zone) =>
          apiRequest({
            method: 'POST',
            url: `/api/v1/farms/${existingFarm.id}/zones`,
            data: zone,
          })
        )
      )
    } else {
      await apiRequest({ method: 'POST', url: '/api/v1/farms', data: payload })
    }

    const response = await apiRequest({ method: 'POST', url: '/api/v1/onboarding/complete' })
    const data = response?.data || {}

    return {
      completed: data.completed !== false,
      message: data.message || 'Configuracion completada correctamente.',
    }
  },
}
