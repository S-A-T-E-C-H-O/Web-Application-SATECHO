# Optional dashboard APIs for Beeceptor

These APIs are optional. The dashboard already works with:

- `satecho-farm`
- `satecho-operations`

If your free Beeceptor plan only allows three mock APIs total, keep the current setup and let the extra actions run locally. Use these extra APIs only if you upgrade the plan, replace one mock temporarily during demos, or consolidate several contexts into one Beeceptor endpoint.

## Option A: Account and subscription API

Suggested Beeceptor API name:

```bash
satecho-account
```

Base URL:

```bash
https://satecho-account.free.beeceptor.com
```

Rules:

1. `GET /account/profile`
   - Used by My account to load profile information, plan, active devices and recent activity.
2. `PUT /account/profile`
   - Used by the Edit profile action.
3. `POST /account/password`
   - Used by Update password.

Example response for `GET /account/profile`:

```json
{
  "profile": {
    "fullName": "Juan Garcia",
    "email": "juan@fincalaesperanza.com",
    "language": "English",
    "timeZone": "Bogota (GMT-5)"
  },
  "summary": {
    "plan": "Premium Enterprise",
    "memberSince": "March, 2026",
    "activeDevices": "18 / 20"
  },
  "activity": [
    { "label": "Login", "detail": "2 hours ago - Bogota, CO" },
    { "label": "Updated profile", "detail": "2 days ago" },
    { "label": "Password change", "detail": "1 month ago" }
  ]
}
```

## Option B: Reports and exports API

Suggested Beeceptor API name:

```bash
satecho-reports
```

Base URL:

```bash
https://satecho-reports.free.beeceptor.com
```

Rules:

1. `POST /reports/irrigation`
   - Receives filters and returns a generated report id.
2. `GET /reports/:id`
   - Returns report status and download URL.
3. `POST /reports/account`
   - Generates an account report.

Example response for `POST /reports/irrigation`:

```json
{
  "reportId": "report-irrigation-001",
  "status": "ready",
  "downloadUrl": "https://example.com/satecho-irrigation-report.csv"
}
```

## Option C: Device actions API

Suggested Beeceptor API name:

```bash
satecho-device-actions
```

Base URL:

```bash
https://satecho-device-actions.free.beeceptor.com
```

Rules:

1. `POST /devices/register`
   - Receives a new device registration.
2. `POST /devices/:id/reading`
   - Simulates refreshing a device reading.
3. `PATCH /devices/:id/status`
   - Simulates toggling a device online/offline.

Example response for `POST /devices/register`:

```json
{
  "id": "SENS-009",
  "name": "New Ground Sensor 9",
  "status": "online",
  "battery": 100,
  "lastReading": "Just now"
}
```

## Recommended free-plan setup

If Beeceptor gives you only three APIs total, use:

1. `satecho-auth`
2. `satecho-onboarding`
3. A single consolidated dashboard API, or keep `satecho-farm` and let operations run locally.

For the current code, the best demo balance is:

1. `satecho-auth`
2. `satecho-onboarding`
3. `satecho-farm`

The operations actions still feel functional because the frontend updates local state immediately and only uses Beeceptor as a remote confirmation when available.
