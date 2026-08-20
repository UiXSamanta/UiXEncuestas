# API y backend

## Ubicación

**Backend activo:** `supabase/functions/make-server-824603ba/index.ts`

**Cliente:** `src/app/lib/api.ts`  
Base URL: `https://{projectId}.supabase.co/functions/v1/make-server-824603ba`

**Legacy (no usar para deploy):** `supabase/functions/server/index.tsx` — espejo histórico.

## KV store

`supabase/functions/make-server-824603ba/kv_store.tsx` — tabla Postgres `kv_store_824603ba`:

| Columna | Tipo |
|---------|------|
| key | TEXT (PK) |
| value | JSONB |

Prefijos de clave:

| Prefijo | Entidad |
|---------|---------|
| `encuesta:` | Definición de encuesta |
| `respuesta:` | Respuesta individual |
| `proyecto:` | Carpeta/proyecto |
| `admin:` | Metadatos de administrador |
| `notification:` | Solicitud de acceso |
| `trash:` | Elementos en papelera |

## Formato de respuesta

Todas las rutas devuelven:

```json
{ "data": ..., "error": null }
```

o `{ "data": null, "error": "mensaje" }`.

El helper `fetchApi` en `api.ts` parsea esto y propaga `error` string al caller.

## Endpoints principales

### Salud y meta

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/health` | Health check |
| GET | `/og/:id` | HTML OG fallback |

### Encuestas

| Método | Ruta |
|--------|------|
| GET | `/encuestas` |
| GET | `/encuestas/:id` |
| POST | `/encuestas` |
| PUT | `/encuestas/:id` |
| DELETE | `/encuestas/:id` |
| POST | `/encuestas/:id/fix-logic` | Reparar IDs en lógica condicional |

### Respuestas

| Método | Ruta |
|--------|------|
| POST | `/respuestas` |
| GET | `/respuestas/:encuesta_id` |
| DELETE | `/respuestas/:encuesta_id` (o por id según implementación) |

### Proyectos

| Método | Ruta |
|--------|------|
| GET/POST | `/proyectos` |
| GET/PUT/DELETE | `/proyectos/:id` |
| POST | `/proyectos/:id/duplicate` |
| GET | `/proyectos/:id/check-access` |
| POST | `/proyectos/:id/validate-password` |

### Papelera

| Método | Ruta |
|--------|------|
| GET | `/trash` |
| POST | `/trash/restore/:id` |
| DELETE | `/trash/:id` |

### Auth y admins

| Método | Ruta |
|--------|------|
| POST | `/auth/signup`, `/auth/verify`, `/auth/change-password` |
| POST | `/auth/reset-password` |
| CRUD | `/admins`, `/admins/import` |

### Notificaciones

| Método | Ruta |
|--------|------|
| GET/POST | `/notifications` |
| POST | `/notifications/:id/approve` |
| POST | `/notifications/:id/reject` |

### Media e IA

| Método | Ruta |
|--------|------|
| POST | `/upload-image` → bucket `make-824603ba-images` |
| POST | `/ai/compare-surveys` | Comparador (WIP) |

### Setup

| Método | Ruta |
|--------|------|
| POST | `/setup-admin` | Bootstrap super-admin |

## Storage

Imágenes de encuesta (welcome, OG, thumbnail) vía `api.uploadSurveyImage` → Supabase Storage.

## Errores comunes

| Síntoma | Causa probable |
|---------|----------------|
| 404 en API | Function no desplegada o nombre incorrecto |
| HTML en lugar de JSON | URL mal formada o rewrite de Vercel capturando la petición |
| `_token` inválido | Sesión expirada; refrescar con `getAccessToken()` |

## Deploy backend

Desde Supabase CLI / dashboard, desplegar función `make-server-824603ba`. Ver [deployment.md](deployment.md).
