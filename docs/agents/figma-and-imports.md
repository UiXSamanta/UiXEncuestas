# Figma e imports

## Origen del proyecto

Generado inicialmente con **Figma Make** (package name `@figma/my-make-file` en `package.json`).

README apunta al archivo Figma fuente del diseño.

## Artefactos Figma Make

### Supresión de errores share-modal

- `src/init.ts` — antes de React
- Patches en `App.tsx` para errores de modal de compartir de Figma

No eliminar sin verificar consola en dev.

### Alias de assets

`vite.config.ts` resuelve imports `figma:asset/...` a archivos bajo el proyecto.

### Carpeta `src/imports/`

Componentes y assets generados desde diseño (estrellas CSAT, ranking, matrices, etc.).

**Tratamiento:**

- Preferir **reutilizar** imports existentes antes de crear SVGs nuevos
- No refactorizar masivamente — muchos son referencias visuales puntuales
- Si el diseño cambia en Figma, re-export puede regenerar archivos; diff con cuidado

## Guidelines

`guidelines/Guidelines.md` — plantilla vacía para reglas de diseño AI. Puede alimentarse desde Figma; hoy no tiene contenido operativo.

## Design stubs en rutas

Rutas estáticas de preview de componentes aislados:

- `/survey-loader`
- `/survey-welcome`
- `/survey-thankyou`

Usan props hardcodeadas; no conectadas a API.

## Compatibilidad URLs Figma Sites

Rutas legacy `/:uuid` mantienen encuestas publicadas desde URLs cortas de Figma Sites.

Al agregar rutas públicas nuevas, **no** capturar antes que `/:id` en `routes.tsx`.

## Implementar diseño nuevo

1. Revisar si existe componente en `src/imports/` o `ui/`
2. Seguir tokens Tailwind y colores de `theme.css`
3. Textos en español
4. Para motion complejo, ver skill figma-implement-motion (fuera de este repo)
5. **No** mezclar cambios de diseño con refactors de lógica en el mismo PR sin necesidad

## Code Connect

No hay `.figma.ts` Code Connect configurado en este repo actualmente. Si se añade, documentar en este archivo la ruta de templates.
