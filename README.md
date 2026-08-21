# UiX Encuestas

SPA React para crear, publicar y analizar encuestas UX (CSAT, NPS, SUS, Likert, etc.).

- **Producción:** [uixencuestas.vercel.app](https://uixencuestas.vercel.app)
- **Diseño Figma:** [UiX Encuestas en Figma](https://www.figma.com/design/PfXw85H8dbeypmv2TKvIKC/UiX-Encuestas)
- **Repo:** `UiXSamanta/UiXEncuestas`

---

## Inicio rápido

```bash
pnpm install
pnpm dev      # servidor local (Vite)
pnpm build    # salida en dist/
```

---

## Stack (resumen)

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, React Router 7, Vite 6, Tailwind 4, shadcn/Radix |
| Auth | Supabase Auth |
| Backend | Supabase Edge Function **`make-server-824603ba`** (Hono) |
| Datos | KV Postgres `kv_store_824603ba` + Storage imágenes |
| Deploy | Vercel (SPA + middleware OG) |

---

## Rutas principales

**Públicas** — `PublicLayout`

| Ruta | Qué hace |
|------|----------|
| `/login` | Acceso admin |
| `/survey/:id` | Encuesta live → **guarda respuestas** |
| `/preview/:id` | Vista previa → **no guarda** |
| `/:id` | Legacy (misma encuesta live) |

**Protegidas** — `ProtectedLayout` (requiere login)

| Ruta | Qué hace |
|------|----------|
| `/admin` | Proyectos y encuestas |
| `/builder/:id` | Editor |
| `/analytics/:id` | Resultados |
| `/notifications` | Solicitudes de acceso admin |

Definición completa: `src/app/routes.tsx`

---

## Arquitectura en una frase

React llama a `src/app/lib/api.ts` → Edge Function `make-server-824603ba` → claves KV (`encuesta:`, `respuesta:`, `proyecto:`, `admin:`).

> **Importante:** el folder `supabase/functions/server/` es legacy. El frontend usa **`make-server-824603ba`**.

---

## Archivos clave

```
src/app/routes.tsx                    # Router
src/app/lib/api.ts                    # Cliente HTTP
src/app/lib/surveyNavigation.ts       # Lógica condicional (respondent)
src/app/lib/surveyQuestionUtils.ts    # isCsatStarMode, isYesNoQuestion
src/app/components/SurveyBuilder.tsx  # Editor (~2600 líneas)
src/app/components/RespondentSurvey.tsx
src/app/components/PreviewSurvey.tsx
src/app/components/AnalyticsDashboard.tsx
src/app/components/AdminDashboard.tsx
supabase/functions/make-server-824603ba/index.ts
middleware.ts                         # OG para bots (Vercel Edge)
```

---

## Modelo de datos (mínimo)

**Encuesta** — `nombre_encuesta`, `estado` (live/draft), `preguntas[]`, `sections[]`, `configuracion` (`modo_visualizacion`, `bloquear_regreso`, `color_primario`), `pantalla_bienvenida`.

**Tipos de pregunta:** `likert`, `sus`, `csat`, `nps`, `multiple-choice`, `text`, `separator`, `score-matrix`, `ranking`.

**Respuesta** — `{ responseID, surveyID, answers: [{ questionID, value }] }`.

Schema en español en builder (`tipo`, `titulo_pregunta`); respondent normaliza a inglés (`type`, `title`).

---

## Reglas para quien edita el código

1. **Cambios mínimos** — no refactorizar archivos grandes sin OK explícito.
2. **Preview ≠ Respondent** — no mezclar persistencia entre `/preview` y `/survey`.
3. **UI en español** — textos visibles al usuario en español.
4. **No editar** `utils/supabase/info.tsx` (autogenerado).
5. **Commits** — `feat:`, `fix:`, `docs:`; solo cuando se pida.

---

## Auth y permisos (mínimo)

- Login → Supabase → JWT en `Authorization: Bearer {access_token}` (ya no va en `_token` del body).
- `api.verifyUser()` lee `admin:{userId}` en KV. Sin registro admin (salvo super-admin), 401.
- Rutas públicas: encuesta **live**, `POST /respuestas`, `POST /notifications` (solicitud), health/OG.
- Drafts, listados, analytics, proyectos y papelera exigen admin.
- Solicitudes de acceso: `/admin-request` → `/notifications` (aprobar/rechazar requiere `can_access_notifications`).
- Proyectos con contraseña: hash PBKDF2 en servidor; el creador entra sin password.
- SSO UiX Space: helpers en `src/app/lib/uixSso.ts` (integración parcial).

---

## Dominios de la app

| Área | Componente | Notas |
|------|------------|-------|
| Admin | `AdminDashboard` | Proyectos, papelera, links |
| Builder | `SurveyBuilder` | CSAT: toggle estrellas/caritas (`use_stars`) |
| Live | `RespondentSurvey` | Guarda con `api.saveRespuesta` |
| Preview | `PreviewSurvey` | Misma UI, sin guardar |
| Analytics | `AnalyticsDashboard` | CSAT estrellas, donut Sí/No |

---

## Deploy

- **Frontend:** Vercel — `vercel.json` rewrite SPA.
- **Backend:** desplegar función Supabase `make-server-824603ba` tras cambios en `index.ts`.
- **OG:** `middleware.ts` + fallback `GET /og/:id`.

---

## Documentación detallada (por tema)

Índice extendido para agentes y desarrolladores:

| Tema | Archivo |
|------|---------|
| Arquitectura | [docs/agents/architecture.md](docs/agents/architecture.md) |
| Rutas y layouts | [docs/agents/routing-and-layouts.md](docs/agents/routing-and-layouts.md) |
| Auth y permisos | [docs/agents/auth-and-permissions.md](docs/agents/auth-and-permissions.md) |
| API y backend | [docs/agents/api-and-backend.md](docs/agents/api-and-backend.md) |
| Modelo de datos | [docs/agents/data-model.md](docs/agents/data-model.md) |
| Admin | [docs/agents/domain-admin.md](docs/agents/domain-admin.md) |
| Builder | [docs/agents/domain-builder.md](docs/agents/domain-builder.md) |
| Respondent / Preview | [docs/agents/domain-respondent.md](docs/agents/domain-respondent.md) |
| Analytics | [docs/agents/domain-analytics.md](docs/agents/domain-analytics.md) |
| Deploy | [docs/agents/deployment.md](docs/agents/deployment.md) |
| Convenciones | [docs/agents/conventions.md](docs/agents/conventions.md) |
| Figma e imports | [docs/agents/figma-and-imports.md](docs/agents/figma-and-imports.md) |

También: [AGENTS.md](AGENTS.md) (mismo índice, orientado a Cursor/agentes).
