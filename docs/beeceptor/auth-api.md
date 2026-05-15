# SATECHO Auth Beeceptor API

Endpoint recomendado para el bounded context de auth:

```text
https://satecho-auth.free.beeceptor.com
```

Dashboard:

```text
https://app.beeceptor.com/console/satecho-auth
```

Este endpoint funciona como mock backend solo para el bounded context de autenticacion. Como Beeceptor puede limitar la cantidad de reglas por endpoint, la convencion del proyecto sera crear un Beeceptor por bounded context.

Beeceptor requiere crear el endpoint desde su dashboard para el plan gratuito. Su API de administracion requiere API key y plan Team o superior, por eso el repositorio deja listo el contrato importable y la aplicacion configurable por `VITE_API_BASE_URL`.

## Convencion

```text
satecho-{bounded-context}
```

Ejemplos:

```text
satecho-auth.free.beeceptor.com
satecho-fields.free.beeceptor.com
satecho-crops.free.beeceptor.com
```

Dentro de cada endpoint se conservan rutas con prefijo del contexto para que el contrato siga pareciendose al backend real:

```text
POST /auth/login
POST /auth/register
```

## Endpoints

| Metodo | Path | Uso |
| --- | --- | --- |
| POST | `/auth/login` | Validar credenciales y devolver usuario/sesion. |
| POST | `/auth/register` | Crear cuenta pendiente de verificacion. |
| POST | `/auth/verification/confirm` | Confirmar cuenta con email y token. |

`POST /auth/verification/resend` no se configura en Beeceptor porque el plan actual solo permite 3 reglas. En el frontend queda como simulacion local para no gastar una regla del mock server.

## Configuracion local

1. Crea el endpoint `satecho-auth` en Beeceptor.
2. Importa `docs/beeceptor/satecho-auth.openapi.json` en Beeceptor o crea reglas equivalentes.
3. Copia `.env.example` a `.env` si quieres usar otro endpoint:

```bash
VITE_API_BASE_URL=https://satecho-auth.free.beeceptor.com
```

La app acepta respuestas 2xx aunque Beeceptor devuelva una forma minima, y normaliza campos comunes como `token`, `accessToken`, `user`, `data` o `body`.
