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

**RLS (obligatorio, una vez):** ejecutar `supabase/migrations/20260820143000_lock_down_kv_store.sql` en el SQL Editor del proyecto. Sin esto, PostgREST podría seguir exponiendo `kv_store_824603ba` con la anon key.

**Variables opcionales (Edge Functions → Secrets):**

| Variable | Función | Uso |
|----------|---------|-----|
| `UIX_SSO_ALLOWED_DOMAINS` | `uix-sso` | Dominios de email permitidos (coma-separados). Default: `upax.com.mx` |
| `SITE_URL` | `make-server-824603ba` | CORS y OG |

CORS de la función: `https://uixencuestas.vercel.app` y localhost. Preview de Vercel no está en la lista.

## Checklist post-hardening (orden)

1. SQL Editor → pegar y ejecutar `20260820143000_lock_down_kv_store.sql`
2. Deploy `make-server-824603ba` + `uix-sso` (si cambió SSO)
3. Deploy frontend Vercel (rama `seguridarks-sam` o merge a prod)
4. Probar login admin, abrir encuesta live, guardar respuesta de prueba
5. Confirmar que `GET /encuestas` sin JWT devuelve 401 (curl con solo anon key)

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

## Checklist post-deploy

1. `GET .../make-server-824603ba/health` → OK
2. Login admin en producción
3. Abrir encuesta live y preview
4. Compartir link en Slack/Twitter — verificar OG (bot user-agent)
5. Guardar respuesta de prueba y ver en analytics

## Git remoto

`git@github.com:UiXSamanta/UiXEncuestas.git` (GitHub)

Rama de trabajo frecuente: `agents-and-markdowns`
