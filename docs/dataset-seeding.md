# Dataset seeding

This repository includes a small API-based seed script for the deployed SATECHO
backend. It creates realistic demo data through public backend contracts instead
of writing directly to the database.

## What it creates

- 1 agronomist account with an enterprise subscription.
- 2 farmer accounts.
- 2 farms with irrigation zones.
- Soil sensors per zone plus valve and PIR devices.
- Historical telemetry batches for soil moisture, EC, pH and temperature.
- Security events for the farm perimeter.
- Agronomist recommendations linked to farmer zones.
- Completed onboarding flags for the generated accounts.

The script is intentionally non-destructive. It does not delete or truncate
data. When a seed user or farm already exists, it tries to reuse it.

## Dry run

```bash
pnpm run seed:dataset -- --dry-run
```

This prints the API writes without modifying the backend.

## Real run

```bash
SATECHO_API_BASE_URL=https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io \
SATECHO_SEED_TAG=demo-001 \
SATECHO_SEED_PASSWORD=SeedPass123.A \
pnpm run seed:dataset
```

On Windows PowerShell:

```powershell
$env:SATECHO_API_BASE_URL = "https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io"
$env:SATECHO_SEED_TAG = "demo-001"
$env:SATECHO_SEED_PASSWORD = "SeedPass123.A"
pnpm.cmd run seed:dataset
Remove-Item Env:SATECHO_API_BASE_URL, Env:SATECHO_SEED_TAG, Env:SATECHO_SEED_PASSWORD
```

## Environment variables

- `SATECHO_API_BASE_URL`: backend origin. Defaults to the Azure Container Apps backend.
- `SATECHO_SEED_TAG`: suffix used in generated emails and serial numbers.
- `SATECHO_SEED_EMAIL_DOMAIN`: email domain for generated accounts. Defaults to `seed.satecho.local`.
- `SATECHO_SEED_PASSWORD`: password for generated accounts. Defaults to `SeedPass123.A`.

## Notes

- The script uses the same API contracts consumed by the frontend: auth, farms,
  zones, devices, telemetry, security events, recommendations, subscriptions
  and onboarding.
- Device activation still depends on the hardware certificate/thumbprint flow,
  so the script registers and links devices but does not activate physical
  hardware.
- Some backend deployments may reject telemetry for non-active devices. The
  script logs that as a skipped step and continues seeding the rest of the data.
