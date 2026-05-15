import { defineStore } from 'pinia'

export const usePriorityCasesStore = defineStore('priorityCases', {
  state: () => ({
    kpis: {
      criticalCases: 4,
      highRiskParcels: 9,
      pendingRecommendations: 3,
      resolvedToday: 5
    },
    cases: [
      {
        id: 'c1',
        parcelId: 'sp1',
        parcelName: 'Huerta Los Pinos',
        sectionName: 'Greenhouse 2',
        crop: 'Tomato',
        location: 'Pachacámac',
        alertBadge: 'High EC',
        timeAgo: '12m ago',
        description: 'Greenhouse 2 - High Electrical Conductivity detected with consistently low moisture levels over 48h.',
        tags: [
          { icon: 'water_drop', text: '17% Moisture' },
          { icon: 'bolt', text: '2.3 EC' }
        ],
        details: {
          title: 'Huerta Los Pinos - Greenhouse 2',
          subtitle: 'High EC / Low Moisture Anomaly',
          sensorNode: 'Sensor Node: GN-2-Alpha',
          metrics: {
            ec: { value: '2.3', unit: 'dS/m', isAlert: true, label: 'High', trend: 'up' },
            moisture: { value: '17', unit: '%', isAlert: true, label: 'Below range', trend: 'down' },
            ph: { value: '5.4', unit: '', isAlert: true, label: 'Low', trend: 'down' },
            temp: { value: '29', unit: '°C', isAlert: true, label: 'Slightly high', trend: 'up' }
          },
          historicalContext: {
            previousAlerts: '2 in 14 days',
            lastRecSent: '3 days ago',
            farmerResponse: 'Acknowledged'
          },
          farmerContact: {
            name: 'Luis Herrera',
            methods: 'WhatsApp/Email',
            lastContact: 'Last contact Yesterday',
            initials: 'LH'
          },
          confidence: 'HIGH',
          suggestedAction: 'Review irrigation schedule, flush salts if needed, and apply a short preventive irrigation cycle while monitoring EC response.',
          activity: [
            { id: 1, title: 'Awaiting rec', meta: 'Now', isCurrent: true, isAlert: false },
            { id: 2, title: 'Added to queue', meta: '10m ago', isCurrent: false, isAlert: false },
            { id: 3, title: 'Severity classified', meta: '11m ago', isCurrent: false, isAlert: false },
            { id: 4, title: 'Anomaly detected', meta: '12m ago', isCurrent: false, isAlert: false }
          ]
        }
      },
      {
        id: 'c2',
        parcelId: 'sp2',
        parcelName: 'Finca Santa Rosa',
        sectionName: 'Sector B',
        alertBadge: 'Pest Risk',
        timeAgo: '1h ago',
        description: 'Sector B - Thermal imagery indicates irregular canopy cooling consistent with potential aphid stress.',
        tags: [
          { icon: 'device_thermostat', text: '28°C Temp' },
          { icon: 'bug_report', text: 'High Risk' }
        ],
        details: {
          title: 'Finca Santa Rosa - Sector B',
          subtitle: 'Irregular Canopy Cooling / Potential Aphids',
          sensorNode: 'Sensor Node: Drone-IR-04',
          metrics: {
            ec: { value: '1.2', unit: 'dS/m', isAlert: false },
            moisture: { value: '45', unit: '%', isAlert: false }
          },
          suggestedAction: 'Deploy scouting team to Sector B immediately to visually confirm aphid presence. Prepare targeted biological control intervention.',
          activity: [
            { id: 1, title: 'Awaiting review', meta: 'Now', isCurrent: true, isAlert: false },
            { id: 2, title: 'Thermal scan completed', meta: '45m ago • Drone-IR-04', isCurrent: false, isAlert: false },
            { id: 3, title: 'Cooling anomaly detected', meta: '1h ago • System AI', isCurrent: false, isAlert: true }
          ]
        }
      },
      {
        id: 'c3',
        parcelId: 'sp3',
        parcelName: 'Agro Valle SAC',
        sectionName: 'Zone 4',
        alertBadge: 'Irrigation Failure',
        timeAgo: '2h ago',
        description: 'Zone 4 - Valve 12 flow rate drop. Potential blockage or pump issue.',
        tags: [
          { icon: 'water_drop', text: '21% Moisture' },
          { icon: 'warning', text: 'Flow Drop' }
        ],
        details: {
          title: 'Agro Valle SAC - Zone 4',
          subtitle: 'Valve 12 Flow Rate Drop / Blockage',
          sensorNode: 'Sensor Node: VLV-12-Ctrl',
          metrics: {
            ec: { value: '1.9', unit: 'dS/m', isAlert: false },
            moisture: { value: '21', unit: '%', isAlert: true }
          },
          suggestedAction: 'Dispatch maintenance to inspect Valve 12 and main pump line for physical blockages. Override standard schedule until resolved.',
          activity: [
            { id: 1, title: 'Awaiting maintenance dispatch', meta: '10m ago', isCurrent: true, isAlert: false },
            { id: 2, title: 'Moisture dropping rapidly', meta: '1h ago • System', isCurrent: false, isAlert: true },
            { id: 3, title: 'Flow rate alert triggered', meta: '2h ago • VLV-12-Ctrl', isCurrent: false, isAlert: true }
          ]
        }
      },
      {
        id: 'c4',
        parcelId: 'sp4',
        parcelName: 'Campo Verde',
        sectionName: 'Block 7',
        alertBadge: 'Yield Variance',
        timeAgo: '4h ago',
        description: 'Block 7 - NDVI forecast showing 15% drop compared to historical average for this growth stage.',
        tags: [
          { icon: 'satellite', text: 'NDVI 0.65' },
          { icon: 'trending_down', text: '-15% Yield' }
        ],
        details: {
          title: 'Campo Verde - Block 7',
          subtitle: 'NDVI Forecast Drop / Growth Stunting',
          sensorNode: 'Sensor Node: SAT-Img-Weekly',
          metrics: {
            ec: { value: '3.8', unit: 'dS/m', isAlert: true },
            moisture: { value: '28', unit: '%', isAlert: false }
          },
          suggestedAction: 'Analyze recent soil tests for Block 7. High EC might be contributing to stunted growth. Schedule foliar nutrient application.',
          activity: [
            { id: 1, title: 'Awaiting agronomist review', meta: 'Now', isCurrent: true, isAlert: false },
            { id: 2, title: 'Historical average comparison', meta: '2h ago • AI Model', isCurrent: false, isAlert: false },
            { id: 3, title: 'Weekly satellite imagery processed', meta: '4h ago • SAT-Img-Weekly', isCurrent: false, isAlert: true }
          ]
        }
      }
    ],
    selectedCaseId: 'c1'
  }),

  actions: {
    selectCase(id) {
      this.selectedCaseId = id
    }
  }
})
