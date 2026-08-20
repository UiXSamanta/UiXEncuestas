# Dominio: Builder

Archivo principal: `src/app/components/SurveyBuilder.tsx` (~2.600 líneas)

## Responsabilidad

Editor visual de encuestas: preguntas, secciones, lógica condicional, pantalla de bienvenida, configuración global, imágenes, preview link.

## Carga y guardado

- Ruta: `/builder/:id`
- Carga: `api.getEncuesta(id)`
- Guardado: `api.updateEncuesta(id, data)` — auto-save y manual
- Metadatos de edición: `updated_at`, `updated_by` (nombre del admin)

## Panel de configuración

Orden acordado en UI (panel izquierdo, arriba):

- **Configuración** — color primario, modo vista (`scroll` \| `paginated`, default `paginated`), bloquear regreso
- Lista de preguntas con drag-and-drop (react-dnd)
- Secciones colapsables (accordions)

## Tipos de pregunta

Definidos en array `questionTypes` con iconos, colores y `defaultOptions`.

Defaults al crear:

| Tipo | Default notable |
|------|-----------------|
| `csat` | `use_stars: false` (caritas), opciones emoji |
| `score-matrix` | filas/columnas, `use_stars: true` |
| `nps` | `usar_slider: true` |
| `sus` | escala 5, labels izq/der |
| `ranking` | instrucción de arrastre |

## CSAT — toggle estrellas/caritas

En editor CSAT (sección opciones):

- Toggle **Estrellas** — ON = estrellas 1-5 en respondent (comportamiento legacy/heurístico si no hay `use_stars` guardado)
- OFF = caritas (default nuevas preguntas)
- Modo estrellas oculta editor de opciones emoji; muestra nota “escala fija 1-5”

Usa `isCsatStarMode()` de `surveyQuestionUtils.ts` solo en **editor** para reflejar estado legacy.

## Lógica condicional

Editores modales por tipo:

- Estándar: `conditional_logic` en multiple-choice, likert, csat
- NPS: `nps_group_logic` por grupos de score
- Text: `text_logic` answered/skipped
- Sección: `section_logic` en metadata de sección

Salto especial: `jump_to: "END_SURVEY"`.

Endpoint de reparación: `POST /encuestas/:id/fix-logic`.

## Imágenes

Upload vía `api.uploadSurveyImage` — welcome, OG, thumbnail con toggles `*_enabled`.

## Preview

Botón abre `/preview/:id` en nueva pestaña. Preview **no persiste** respuestas.

## Navegación

- `AppNav` + `builderNavigation.ts` — volver al proyecto/carpeta en admin
- No confundir preview URL con survey URL

## Convenciones al editar

- Cambios **aditivos** y localizados
- No renombrar campos de schema sin migración backend
- Textos UI en español
- Mantener compatibilidad con encuestas existentes (campos opcionales)
