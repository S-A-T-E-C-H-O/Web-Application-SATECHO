export const PLAN_LIMITS = {
    basic: {
        price: 39.90,
        hectares: 2,
        zones: 2,
        devices: 5,
        users: 1,
        security: false,
        smsAlerts: false,
    },

    pro: {
        price: 79.99,
        hectares: 20,
        zones: 10,
        devices: 30,
        users: 5,
        security: true,
        smsAlerts: true,
    },

    enterprise: {
        price: 199.99,
        hectares: Infinity,
        zones: Infinity,
        devices: Infinity,
        users: Infinity,
        security: true,
        smsAlerts: true,
    },
}