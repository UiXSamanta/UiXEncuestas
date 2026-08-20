# Dominio: Admin

Archivo principal: `src/app/components/AdminDashboard.tsx` (~1.570 líneas)

Componentes relacionados: `AdminSidebar`, `AdminSettings`, `AdminRequestPage`, `NotificationsPage`, `ChangePasswordModal`.

## Vista de dos niveles

1. **Grid de proyectos** — carpetas que agrupan encuestas
2. **Detalle de proyecto** — lista de encuestas del proyecto

Estado local: `viewMode`, `selectedProyecto`, modales de contraseña/confirmación.

## Proyectos

Operaciones vía `api.ts`:

- Crear, renombrar, duplicar, eliminar proyecto
- Asignar contraseña opcional (`password`)
- Mover encuesta entre proyectos
- `checkProyectoAccess` antes de abrir — creador bypass (ver [auth-and-permissions.md](auth-and-permissions.md))

## Encuestas desde admin

Por encuesta en la lista:

- Abrir builder → `/builder/:id`
- Analytics → `/analytics/:id`
- Copiar link público (`getSurveyUrl`) y preview (`getPreviewUrl`)
- Duplicar, mover, eliminar (a papelera)
- Toggle `estado` live/draft (chip Live/Draft)

## Papelera

Encuestas/proyectos eliminados → KV `trash:{id}`. Restaurar o borrar permanente desde UI.

## Sidebar

`AdminSidebar.tsx`:

- Navegación colapsable en riel
- Enlaces: Admin, Notificaciones, Settings
- “Regresar a UiX Space” si `isUixSpaceSsoUser()`

## CSV

`src/app/lib/adminCsv.ts` — import/export de admins (super-admin).

## Verificación de BD

Modal de verificación de campos en encuestas (integración con backend). Útil tras migraciones de schema.

## Super-admin

Acciones restringidas (gestión de admins, notificaciones) gated por email hardcodeado — revisar constante en `AdminDashboard` antes de extender permisos.

## Navegación de retorno

Al volver del builder, `builderNavigation.ts` puede restaurar la carpeta de origen usando state de React Router o sessionStorage.

## Qué no tocar sin pedido

- Refactor masivo de `AdminDashboard` (archivo grande, mucho estado)
- Flujos de contraseña de proyecto ya integrados con backend
