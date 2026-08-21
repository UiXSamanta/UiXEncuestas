# Arquitectura

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, React Router 7, Vite 6, Tailwind CSS 4 |
| UI | shadcn/Radix, lucide-react, react-dnd |
| Auth | Supabase Auth (PKCE, localStorage) |
| Backend | Supabase Edge Functions (Hono on Deno) |
| Persistencia | Supabase Postgres KV (`kv_store_824603ba`) + Storage bucket imágenes |
| Deploy frontend | Vercel SPA + Edge Middleware (OG) |
| Deploy backend | Supabase Functions `make-server-824603ba` |

## Capas

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                     │
│  src/app/components/*  src/app/lib/api.ts               │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
                           │ Authorization: Bearer {user JWT | anon key}
                           │ apikey: {anon key}
┌──────────────────────────▼──────────────────────────────┐
│  Supabase Edge Function: make-server-824603ba           │
│  supabase/functions/make-server-824603ba/index.ts       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  kv_store_824603ba (JSONB)  │  Supabase Auth  │  Storage │
└─────────────────────────────────────────────────────────┘
```

## Entry points

- `index.html` → `src/main.tsx` → `src/app/App.tsx` (ThemeProvider, RouterProvider)
- `src/init.ts` — suprime errores de share-modal de Figma Make antes de React

## Dominios funcionales

| Dominio | Componentes principales | Persiste datos |
|---------|-------------------------|----------------|
| Admin | `AdminDashboard`, `AdminSidebar`, `AdminSettings` | Proyectos, encuestas |
| Builder | `SurveyBuilder` | Definición de encuesta |
| Respondent | `RespondentWelcome`, `RespondentSurvey` | Respuestas |
| Preview | `PreviewWelcome`, `PreviewSurvey` | No |
| Analytics | `AnalyticsDashboard`, `ComparadorResultados` | Solo lectura |
| Auth | `Login`, `ProtectedLayout`, `NotificationsPage` | Admins |

## Flujo de datos típico

1. Admin crea encuesta en builder → `PUT /encuestas/:id` → KV `encuesta:{uuid}`
2. Respondente abre `/survey/:id` → `GET /encuestas/:id` → welcome → questions
3. Submit → `POST /respuestas` → KV `respuesta:{uuid}` + incremento `conteo_respuestas`
4. Admin abre analytics → `GET /respuestas/:encuesta_id` → gráficos en cliente

## Alias y paths

- Vite alias `@` → `src/`
- Alias especial `figma:asset/` para assets importados desde Figma Make

## Gotchas

- No hay `tsconfig.json` explícito; TypeScript vía Vite.
- Esquema dual: builder usa claves en español (`tipo`, `titulo_pregunta`); respondent normaliza a inglés (`type`, `title`) al renderizar.
- URLs legacy `/:uuid` coexisten con `/survey/:uuid` (compatibilidad Figma Sites).
