# Auth y permisos

## Login estándar

1. `Login.tsx` → `api.signIn(email, password)` → Supabase `signInWithPassword`
2. Token en `localStorage.access_token` (espejo de la sesión PKCE)
3. `api.verifyUser()` envía el JWT en `Authorization`; el backend valida con `auth.getUser` (firma real) y lee KV `admin:{userId}`
4. Perfil en `localStorage.user` (nombre, permisos, flags) — **no es control de acceso**; el servidor revalida

Cliente Supabase: `src/app/lib/supabase.ts` — storage key `survey-app-auth-token`, PKCE, auto-refresh.

Helpers de servidor: `supabase/functions/make-server-824603ba/auth.ts`.

## Qué es público vs admin

| Público (anon) | Admin autenticado |
|----------------|-------------------|
| `GET /health`, `GET /og/:id` | Listado de encuestas, proyectos, trash, analytics |
| `GET /encuestas/:id` si `estado === true` (live) | Drafts (`estado !== true` → 404 para anónimos) |
| `POST /respuestas` si la encuesta está live | Mutaciones de encuestas/proyectos/respuestas |
| `POST /notifications` (solicitud de acceso) | GET/approve/reject notificaciones (permiso) |

Altas de admin solo vía `/auth/signup` con permiso `settings` (no hay registro público).

## Roles y permisos

Metadatos de admin en KV (`admin:{userId}`), **enforced en el servidor**.

- `can_access_notifications` — listar/aprobar/rechazar solicitudes
- `can_access_settings` — CRUD admins, import CSV, reset password
- Super-admin: email `PRIMARY_ADMIN_EMAIL` (bypass de flags)

Cualquier usuario sin registro `admin:{id}` en KV no accede a rutas admin (salvo super-admin configurado en servidor).

## Cambio de contraseña obligatorio

Tras aprobar solicitud de acceso, el backend marca `must_change_password: true`. `ChangePasswordModal` bloquea la app hasta cambiar. Las passwords temporales se devuelven **una sola vez** en la respuesta; no se persisten en KV.

## Solicitudes de acceso (notificaciones)

Flujo completo documentado en `SISTEMA_NOTIFICACIONES.md` (resumen aquí).

| Paso | Acción |
|------|--------|
| 1 | Usuario envía formulario en `/admin-request` |
| 2 | Se crea KV `notification:{id}` estado `pending` |
| 3 | Admin con permiso en `/notifications` aprueba o rechaza |
| 4a Aprobar | Crea usuario Auth, contraseña aleatoria (16 chars), `must_change_password` |
| 4b Rechazar | Estado `rejected` |

Endpoints:

- `POST /notifications/:id/approve` — requiere permiso notifications
- `POST /notifications/:id/reject`
- `GET /notifications` — requiere permiso notifications

## Contraseña de proyecto

Proyectos pueden tener `password` opcional. Las APIs GET solo exponen `hasPassword`, no el secreto.

- Campo `created_by` — el creador **no** necesita contraseña
- `POST /proyectos/:id/check-access` → `{ isCreator, hasPassword, requiresPassword }`
- `POST /proyectos/:id/validate-password` — bypass si es creador; contraseñas legacy en texto plano se migran al validar

Frontend: `api.checkProyectoAccess`, `api.validateProyectoPassword` — usados en `AdminDashboard`.

## UiX Space SSO

Archivo: `src/app/lib/uixSso.ts`

| Función | Propósito |
|---------|-----------|
| `captureSsoTokenFromUrl()` | Lee token de query al cargar |
| `consumeSsoToken()` | Intercambia token con función `uix-sso` |
| `markUixSpaceSsoSession()` / `clearUixSpaceSsoSession()` | Flag en localStorage |
| `isUixSpaceSsoUser()` | Detecta admin con `source === 'uix-space-sso'` |

UiX Space: `https://uix-space.vercel.app`

`AdminSidebar` muestra “Regresar a UiX Space” para usuarios SSO.

**Agentes:** no implementar flujos SSO en respondent/builder salvo petición explícita.

## Patrón API autenticada

```typescript
await fetchApi('/encuestas', {
  method: 'POST',
  body: JSON.stringify(payload),
});
// fetchApi pone Authorization: Bearer {userJwt} y apikey: {anonKey}
```

Rutas públicas (`saveRespuesta`, `createNotification`, GET encuesta live) usan `authMode: 'public' | 'optional'`.
