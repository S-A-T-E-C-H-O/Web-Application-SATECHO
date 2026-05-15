# SATECHO Dashboard Beeceptor mocks

The dashboard uses two Beeceptor endpoints so each mock stays within three rules.

## Farm API

Base URL:

```bash
VITE_FARM_API_BASE_URL=https://satecho-farm.free.beeceptor.com
```

Rules:

1. `GET /farm/overview`
   - Returns farm identity, KPI cards, critical alerts and irrigation zones.
2. `GET /irrigation/history`
   - Returns the irrigation activity table.
3. `GET /devices`
   - Returns the IoT devices table.

Import `docs/beeceptor/satecho-farm.openapi.json` into the `satecho-farm` Beeceptor endpoint.

## Operations API

Base URL:

```bash
VITE_OPERATIONS_API_BASE_URL=https://satecho-operations.free.beeceptor.com
```

Rules:

1. `GET /security/events`
   - Returns perimeter security events.
2. `POST /irrigation/actions`
   - Receives open/close valve actions from the irrigation control screen.
3. `PUT /notification-preferences`
   - Receives notification and security configuration updates.

Import `docs/beeceptor/satecho-operations.openapi.json` into the `satecho-operations` Beeceptor endpoint.

The frontend includes local fallback data for every screen, so the dashboard remains usable while the Beeceptor endpoints are being created or if a request fails.
