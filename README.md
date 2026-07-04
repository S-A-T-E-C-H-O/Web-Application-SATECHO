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

## Backend integration

The application uses the deployed Azure backend for authentication, onboarding,
farms, irrigation zones and perimeter-security settings.

```bash
# .env for local development
VITE_API_BASE_URL=https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io
BACKEND_API_ORIGIN=https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io

# Vercel Preview and Production
VITE_API_BASE_URL=/api
```

Vercel proxies `/api/*` to Azure, keeping production browser requests on the
same origin. For local development, the backend allows localhost CORS over
HTTPS, so the frontend can call Azure Container Apps directly. The HTTP client
automatically adds the saved JWT as `Authorization: Bearer <token>`.

The agronomist dashboard, client portfolio, priority cases and presentation-only
device, telemetry and irrigation demonstrations retain local fallback data until
their backend contracts are finalized. Their view interfaces remain stable so a
real endpoint can replace the fallback without changing the UI.
