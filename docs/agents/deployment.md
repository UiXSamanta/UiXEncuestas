# Deployment

## Frontend (Vercel)

- Build: `pnpm build` → `dist/`
- `vercel.json`: rewrite SPA — rutas no-estáticas → `/index.html`
- Producción referenciada: `https://uixencuestas.vercel.app`
- Variable opcional: `VITE_SITE_URL` para URLs absolutas en `urls.ts` / OG

## Edge Middleware

`middleware.ts` + `lib/og-meta.ts` + `lib/site-config.ts`:

- Intercepta crawlers en rutas de encuesta
- Sirve meta tags Open Graph dinámicos (título, imagen, descripción)
- Rutas cubiertas: `/survey/:id`, legacy `/:uuid`

Fallback OG también en backend: `GET /og/:id`.

## Backend (Supabase)

- Proyecto: `buqpkujiozvrsizitwti`
- Function desplegada: **`make-server-824603ba`**
- URL: `https://buqpkujiozvrsizitwti.supabase.co/functions/v1/make-server-824603ba`

Desplegar tras cambios en:

```
supabase/functions/make-server-824603ba/index.ts
supabase/functions/make-server-824603ba/auth.ts
supabase/functions/make-server-824603ba/passwords.ts
supabase/functions/make-server-824603ba/response_keys.ts
supabase/functions/make-server-824603ba/rate_limit.ts
supabase/functions/make-server-824603ba/kv_store.tsx
```

**RLS (una vez por entorno):** ejecutar `supabase/migrations/20260820143000_lock_down_kv_store.sql` en el SQL Editor si el entorno es nuevo.

**Variables opcionales (Edge Functions → Secrets):**

| Variable | Función | Uso |
|----------|---------|-----|
| `UIX_SSO_ALLOWED_DOMAINS` | `uix-sso` | Dominios de email permitidos (coma-separados). Default: `upax.com.mx` |
| `SITE_URL` | `make-server-824603ba` | CORS y OG |

CORS de la función: valor de `SITE_URL`, previews `https://uixencuestas-*.vercel.app` (regex en código), localhost, y opcional `CORS_EXTRA_ORIGINS`. Si migras a Cloudflare/AWS, actualiza secrets y redeploy — ver [Cambio de host](#cambio-de-host).

## Cambio de host

Cuando el frontend deja Vercel (Cloudflare Pages, S3+CloudFront, etc.) o cambia el dominio de producción:

### 1. Secrets en Supabase (Edge Functions)

Dashboard → Project **Encuestas** (`buqpkujiozvrsitwti`) → Edge Functions → Secrets:

| Secret | Función | Ejemplo |
|--------|---------|---------|
| `SITE_URL` | `make-server-824603ba` | `https://encuestas.tuempresa.com` |
| `CORS_EXTRA_ORIGINS` | `make-server-824603ba` | `https://staging.tuempresa.com,https://preview-xxx.pages.dev` |

Sin `/` al final. Si solo cambias dominio prod, `SITE_URL` suele bastar.

### 2. Redeploy backend

```bash
supabase functions deploy make-server-824603ba --project-ref buqpkujiozvrsitwti
```

Si usas SSO: `supabase functions deploy uix-sso --project-ref buqpkujiozvrsitwti`

### 3. Supabase Auth (URLs)

Dashboard → Authentication → URL Configuration:

- **Site URL:** dominio nuevo de producción
- **Redirect URLs:** incluir `https://tu-dominio/login`, `/reset-password`, callbacks que uses

### 4. Frontend en el host nuevo

- Build: `pnpm build` → servir `dist/` (SPA: todas las rutas → `index.html`)
- Env de build: `VITE_SITE_URL=https://tu-dominio` (opcional; en runtime usa `window.location.origin` si no está)
- **OG para bots:** hoy `middleware.ts` es **Vercel Edge**. En Cloudflare → Worker equivalente; en AWS → Lambda@Edge o similar. Fallback backend: `GET /og/:id` (usa `SITE_URL` para redirección)

### 5. Verificar CORS (curl)

Sustituye `TU_DOMINIO` y la anon key de `utils/supabase/info.tsx`:

```bash
curl -sI -X OPTIONS \
  "https://buqpkujiozvrsizitwti.supabase.co/functions/v1/make-server-824603ba/health" \
  -H "Origin: https://TU_DOMINIO" \
  -H "Access-Control-Request-Method: GET" \
  | grep -i access-control-allow-origin
```

Esperado: `access-control-allow-origin: https://TU_DOMINIO`

## Smoke test (post-deploy)

Ejecutar en **producción** (o preview) tras cada deploy importante.

### En el navegador (~5 min)

| # | Acción | Esperado |
|---|--------|----------|
| 1 | `/login` → entrar como admin | Dashboard carga |
| 2 | `/admin` | Proyectos visibles |
| 3 | `/preview/:id` → completar hasta gracias | No guarda en BD; llega a thank-you |
| 4 | `/survey/:id` (encuesta **live**) | Carga sin login |
| 5 | Enviar respuesta de prueba | OK; aparece en analytics |
| 6 | Admin → Verificar BD (opcional) | Health + KV OK |

### En terminal (API)

Anon key: `utils/supabase/info.tsx`. User JWT: tras login, DevTools → Application → `access_token` o Network → header `Authorization`.

```bash
BASE="https://buqpkujiozvrsizitwti.supabase.co/functions/v1/make-server-824603ba"
ANON="<publicAnonKey>"
ORIGIN="https://uixencuestas.vercel.app"

# Health (requiere Authorization o apikey en gateway Supabase)
curl -s "$BASE/health" -H "Origin: $ORIGIN" -H "Authorization: Bearer $ANON" -H "apikey: $ANON"

# Listado admin SIN user JWT → debe fallar
curl -s "$BASE/encuestas" -H "Origin: $ORIGIN" -H "Authorization: Bearer $ANON" -H "apikey: $ANON"
# Esperado: {"data":null,"error":"No autorizado"}

# Listado CON user JWT (opcional)
# curl -s "$BASE/encuestas" -H "Origin: $ORIGIN" -H "Authorization: Bearer $USER_JWT" -H "apikey: $ANON"
```

## Verificación post-deploy (checklist)

1. RLS aplicado en Supabase (entornos nuevos)
2. Deploy `make-server-824603ba` (+ `uix-sso` si cambió)
3. Deploy frontend (preview → prod)
4. Smoke test navegador + curl arriba

## Documentación operativa privada

Runbooks que **no** van en este repo (plan anti-ataques, respuesta a incidentes, inventario de admins, historial de cambios de seguridad): guardarlos en **SharePoint** (o equivalente corporativo) con acceso restringido al equipo.

El repositorio conserva solo lo necesario para desarrollar y desplegar.

## Storage

Bucket: `make-824603ba-images` — imágenes de encuestas subidas desde builder.

## Credenciales frontend

`utils/supabase/info.tsx` — **autogenerado**:

- `projectId`
- `publicAnonKey`

No commitear secretos adicionales; service role solo en Edge Functions.

## Auth redirect URLs

Configurar en Supabase Dashboard las URLs de reset password apuntando a `/reset-password` en el dominio Vercel.

## Integraciones externas

| Servicio | URL |
|----------|-----|
| UiX Encuestas | `uixencuestas.vercel.app` |
| UiX Space | `uix-space.vercel.app` |
| SSO function | `{project}.supabase.co/functions/v1/uix-sso` |

## Checklist post-deploy (resumen)

1. Health + CORS (curl arriba)
2. Login admin en producción
3. Encuesta live + respuesta de prueba
4. Preview → thank-you sin guardar
5. OG en red social (opcional)

## Git remoto

`git@github.com:UiXSamanta/UiXEncuestas.git` (GitHub)

Rama de trabajo frecuente: `agents-and-markdowns`
