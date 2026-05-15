# Web Application SATECHO

Frontend application developed with Vue 3 + Vite following DDD architecture and GitFlow workflow.

## Technologies

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios
- Sass

## Architecture

The project follows:

- Domain-Driven Design (DDD)
- Bounded Contexts
- GitFlow

## Project Structure

src/    <br>
├── app/    <br>
├── shared/    <br>
├── bounded-contexts/    <br>

## Installation

```bash
npm install
```

## Mock API with Beeceptor

The auth bounded context is wired to a configurable Beeceptor mock API. By default it points to:

```bash
VITE_API_BASE_URL=https://satecho-auth.free.beeceptor.com
```

Create the Beeceptor endpoint `satecho-auth` and import `docs/beeceptor/satecho-auth.openapi.json`, or set another endpoint in a local `.env` file. The implemented endpoints are documented in `docs/beeceptor/auth-api.md`.

For future bounded contexts, create one Beeceptor endpoint per context when rule limits become tight, for example `satecho-fields` or `satecho-crops`.

The onboarding bounded context uses its own Beeceptor endpoint:

```bash
VITE_ONBOARDING_API_BASE_URL=https://satecho-onboarding.free.beeceptor.com
```

Create the Beeceptor endpoint `satecho-onboarding` and import `docs/beeceptor/satecho-onboarding.openapi.json`. The implemented endpoints are documented in `docs/beeceptor/onboarding-api.md`.

The agricultural dashboard uses two Beeceptor endpoints with a maximum of three rules each:

```bash
VITE_FARM_API_BASE_URL=https://satecho-farm.free.beeceptor.com
VITE_OPERATIONS_API_BASE_URL=https://satecho-operations.free.beeceptor.com
```

Create `satecho-farm` from `docs/beeceptor/satecho-farm.openapi.json` and `satecho-operations` from `docs/beeceptor/satecho-operations.openapi.json`. The rule split is documented in `docs/beeceptor/dashboard-api.md`.
