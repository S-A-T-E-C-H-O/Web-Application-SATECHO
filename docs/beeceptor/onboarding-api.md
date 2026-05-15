# SATECHO Onboarding Beeceptor API

Endpoint recomendado para el bounded context de onboarding:

```text
https://satecho-onboarding.free.beeceptor.com
```

Dashboard:

```text
https://app.beeceptor.com/console/satecho-onboarding
```

Como Beeceptor limita la cantidad de reglas disponibles, este contexto usa solo 2 reglas reales y deja una libre para una accion futura.

## Endpoints

| Metodo | Path | Uso |
| --- | --- | --- |
| GET | `/onboarding/status` | Saber si el usuario ya completo onboarding y recuperar un borrador inicial. |
| POST | `/onboarding/complete` | Guardar la configuracion final y marcar onboarding como completo. |

`Save and continue later` se guarda localmente en el navegador para no gastar una regla de Beeceptor.

## Configuracion local

Agrega o conserva esta variable en `.env`:

```bash
VITE_ONBOARDING_API_BASE_URL=https://satecho-onboarding.free.beeceptor.com
```

## Respuestas sugeridas

`GET /onboarding/status`

```json
{
  "completed": false,
  "currentStep": 1,
  "setup": {},
  "message": "Onboarding listo para continuar."
}
```

`POST /onboarding/complete`

```json
{
  "completed": true,
  "message": "Configuracion completada correctamente."
}
```
