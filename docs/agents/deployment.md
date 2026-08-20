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
supabase/functions/make-server-824603ba/kv_store.tsx
```

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
