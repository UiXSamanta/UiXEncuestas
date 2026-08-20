# Auth y permisos

## Login estándar

1. `Login.tsx` → `api.signIn(email, password)` → Supabase `signInWithPassword`
2. Token en `localStorage.access_token`
3. `api.verifyUser()` → backend lee KV `admin:{userId}`
4. Perfil en `localStorage.user` (nombre, permisos, flags)

Cliente Supabase: `src/app/lib/supabase.ts` — storage key `survey-app-auth-token`, PKCE, auto-refresh.

## Roles y permisos

Metadatos de admin en KV (`admin:{userId}`), no en JWT claims custom extensos.

Flags típicos usados en UI:

- Permisos de gestión de encuestas/proyectos
- `must_change_password` — fuerza modal en `ProtectedLayout`
- `source: 'uix-space-sso'` — usuario proveniente de UiX Space

Super-admin: email hardcodeado en `AdminDashboard` para acciones restringidas (verificar en código antes de asumir otro criterio).

## Cambio de contraseña obligatorio

Tras aprobar solicitud de acceso, el backend marca `must_change_password: true`. `ChangePasswordModal` bloquea la app hasta cambiar.

## Solicitudes de acceso (notificaciones)

Flujo completo documentado en `SISTEMA_NOTIFICACIONES.md` (resumen aquí).

| Paso | Acción |
|------|--------|
| 1 | Usuario envía formulario en `/admin-request` |
| 2 | Se crea KV `notification:{id}` estado `pending` |
| 3 | Super-admin en `/notifications` aprueba o rechaza |
| 4a Aprobar | Crea usuario Auth, contraseña auto, email placeholder (console), `must_change_password` |
| 4b Rechazar | Estado `rejected`, email placeholder de rechazo |

**Contraseña auto al aprobar:** 3 letras del nombre + 3 dígitos + 3 símbolos (`!@#$%&*`). Ejemplo: `sam456#@!`.

Endpoints:

- `POST /notifications/:id/approve`
- `POST /notifications/:id/reject`
- CRUD `/notifications`

## Contraseña de proyecto

Proyectos pueden tener `password` opcional. Reglas (`BACKEND_VERIFICACION.md`):

- Campo `created_by` en proyecto — el creador **no** necesita contraseña
- `GET /proyectos/:id/check-access` → `{ isCreator, hasPassword, requiresPassword }`
- `POST /proyectos/:id/validate-password` — bypass si es creador

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
const token = await getAccessToken();
await fetchApi('/encuestas', {
  method: 'POST',
  body: JSON.stringify({ ...payload, _token: token }),
});
```

Siempre `Authorization: Bearer {publicAnonKey}` en header; el JWT de usuario va en `_token` del body en endpoints protegidos.
