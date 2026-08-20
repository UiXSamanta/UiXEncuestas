# Routing y layouts

Definición en `src/app/routes.tsx`.

## Layouts

### PublicLayout

Sin autenticación. Envuelve login, encuestas públicas, preview y rutas de diseño estático.

### ProtectedLayout

Requiere sesión Supabase válida (`src/app/components/ProtectedLayout.tsx`):

- Lee `localStorage.access_token` y `localStorage.user`
- Llama `api.verifyUser()` al montar
- Redirige a `/login` si no hay sesión
- Muestra `ChangePasswordModal` bloqueante si `must_change_password === true`
- Sincroniza token con `supabase.auth.onAuthStateChange`

## Rutas públicas

| Ruta | Componente | Notas |
|------|------------|-------|
| `/` | redirect → `/login` | |
| `/login` | `Login` | |
| `/admin-request` | `AdminRequestPage` | Solicitud de acceso admin |
| `/forgot-password` | `ForgotPasswordPage` | |
| `/reset-password` | `ResetPasswordPage` | |
| `/survey/:id` | `RespondentWelcome` | **Guarda respuestas** |
| `/survey/:id/questions` | `RespondentSurvey` | |
| `/preview/:id` | `PreviewWelcome` | **No guarda** |
| `/preview/:id/questions` | `PreviewSurvey` | |
| `/survey-error` | `SurveyError` | |
| `/:id` | `RespondentWelcome` | Legacy UUID en raíz |
| `/:id/questions` | `RespondentSurvey` | Legacy |
| `/survey-loader`, `/survey-welcome`, `/survey-thankyou` | stubs de diseño | Datos de muestra |

**Orden importante:** `/:id` debe ir al final de rutas públicas para no capturar `/login`, etc.

## Rutas protegidas

| Ruta | Componente |
|------|------------|
| `/admin` | `AdminDashboard` |
| `/notifications` | `NotificationsPage` |
| `/settings` | `AdminSettings` |
| `/builder/:id` | `SurveyBuilder` |
| `/analytics/:id` | `AnalyticsDashboard` |
| `/comparador` | `ComparadorResultados` |

## Navegación admin

- `AdminSidebar` — rail colapsable; enlaces admin, notificaciones, settings
- `AppNav` — barra superior en builder/analytics con “volver” al proyecto
- `builderNavigation.ts` — restaura carpeta de origen al salir del builder

## URLs helpers

`src/app/lib/urls.ts`:

- `getSurveyUrl(id)` → `/survey/{id}`
- `getPreviewUrl(id)` → `/preview/{id}`

## OG y middleware

`middleware.ts` (Vercel Edge) intercepta bots en rutas de encuesta para servir meta OG. Detalle en [deployment.md](deployment.md).

## SSO UiX Space (pendiente de ruta)

Helpers en `src/app/lib/uixSso.ts` para token en `/sso` o `/api/auth/sso`. **Aún no hay ruta dedicada en `routes.tsx`**; la sesión SSO se marca vía `localStorage.uix_sso_session` cuando el flujo esté conectado.
