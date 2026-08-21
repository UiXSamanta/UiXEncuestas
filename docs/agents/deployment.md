# Deployment

Referencia mínima para desarrollar y desplegar. Checklists de smoke test, curl de verificación y runbooks operativos (anti-ataques, incidentes): **SharePoint del equipo** — no van en este repo.

## Frontend (Vercel)

- Build: `pnpm build` → `dist/`
- `vercel.json`: rewrite SPA → `/index.html`
- Producción: `https://uixencuestas.vercel.app`
- Opcional en build: `VITE_SITE_URL` (URLs absolutas / OG)

## Open Graph

- Vercel Edge: `middleware.ts` + `lib/og-meta.ts` + `lib/site-config.ts` (bots en `/survey/:id` y legacy `/:uuid`)
- Fallback backend: `GET /og/:id` en `make-server-824603ba`

En Cloudflare/AWS hay que replicar el middleware o apoyarse en el fallback del backend.

## Backend (Supabase)

- Proyecto: `buqpkujiozvrsizitwti`
- Función: **`make-server-824603ba`**
- Base URL: `https://buqpkujiozvrsizitwti.supabase.co/functions/v1/make-server-824603ba`

Redeploy tras cambios en `supabase/functions/make-server-824603ba/` (p. ej. `index.ts`, `auth.ts`, `passwords.ts`).

```bash
supabase functions deploy make-server-824603ba --project-ref buqpkujiozvrsizitwti
```

SSO (si aplica): `supabase functions deploy uix-sso --project-ref buqpkujiozvrsizitwti`

**RLS (entorno nuevo):** ejecutar una vez `supabase/migrations/20260820143000_lock_down_kv_store.sql` en el SQL Editor.

### Secrets (Edge Functions)

| Variable | Función | Uso |
|----------|---------|-----|
| `SITE_URL` | `make-server-824603ba` | CORS y OG (sin `/` final) |
| `CORS_EXTRA_ORIGINS` | `make-server-824603ba` | Orígenes extra, coma-separados |
| `UIX_SSO_ALLOWED_DOMAINS` | `uix-sso` | Dominios de email SSO |

CORS en código: `SITE_URL`, previews `https://uixencuestas-*.vercel.app`, localhost y `CORS_EXTRA_ORIGINS`.

## Cambio de host

Si el frontend sale de Vercel o cambia el dominio de producción:

1. Secrets → `SITE_URL` (y `CORS_EXTRA_ORIGINS` si hay staging/previews)
2. Redeploy `make-server-824603ba` (comando arriba)
3. Supabase Auth → Site URL y redirect URLs (`/login`, `/reset-password`, etc.)
4. Host nuevo: build SPA + `VITE_SITE_URL` si hace falta; replicar OG middleware o usar fallback `/og/:id`
5. Verificar en el dominio nuevo (login admin, encuesta live, respuesta de prueba) — checklist completo en SharePoint

## Otros

- **Storage:** bucket `make-824603ba-images` (imágenes del builder)
- **Frontend keys:** `utils/supabase/info.tsx` (autogenerado; anon key pública). Service role solo en Edge Functions
- **Integraciones:** UiX Space `uix-space.vercel.app`; SSO en `{project}.supabase.co/functions/v1/uix-sso`
- **Remoto:** `git@github.com:UiXSamanta/UiXEncuestas.git`
