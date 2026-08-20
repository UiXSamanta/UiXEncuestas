# Dominio: Respondent y Preview

## Archivos

| Rol | Welcome | Survey |
|-----|---------|--------|
| Live (guarda) | `RespondentWelcome.tsx` | `RespondentSurvey.tsx` |
| Preview (no guarda) | `PreviewWelcome.tsx` | `PreviewSurvey.tsx` |

Compartidos: `SurveyThankYou`, `SurveyFooter`, `SurveyLoader`, `SurveyError`.

## Rutas

| Modo | Welcome | Questions |
|------|---------|-----------|
| Live | `/survey/:id` | `/survey/:id/questions` |
| Preview | `/preview/:id` | `/preview/:id/questions` |
| Legacy | `/:id` | `/:id/questions` |

## Diferencia crítica

| | Respondent | Preview |
|---|------------|---------|
| `saveRespuesta` | **Sí** al submit | **No** |
| `responseID` | UUID generado | `'preview_mode'` |
| Banner | — | “Preview Mode…” |

**Regla para agentes:** no modificar `RespondentSurvey` / `PreviewSurvey` salvo petición explícita del usuario.

## Normalización de schema

Builder guarda español; viewer usa helper que mapea a:

```typescript
{ id, type, title, subtitle, opciones, ... }
```

## Configuración de encuesta

Desde `encuesta.configuracion`:

- `modo_visualizacion`: `'scroll'` (una página) vs `'paginated'` (pasos)
- `bloquear_regreso`: oculta botón Anterior
- `color_primario`: acentos en multiple-choice, yes/no, etc.

## Navegación condicional

`src/app/lib/surveyNavigation.ts`:

- `hasSurveyLogic()` — detecta si hay saltos
- `normalizeEncuestaConfig()` — prepara preguntas ordenadas
- **Nav stack** — historial de índices para back/forward correcto con lógica
- `pruneAnswersToStack()` — limpia respuestas invalidadas al retroceder

Stepper: sin total fijo cuando hay lógica (solo posición actual).

## CSAT en respondent

Detección de estrellas vs caritas por **heurística legacy** (subtítulo contiene “estrella/star” u opciones con ⭐), **no** por `use_stars` del editor hasta que el producto decida conectar ambos.

El campo `use_stars` del editor se persiste en KV pero respondent aún no lo lee de forma exclusiva.

## Tipos de pregunta (render)

Implementación inline por `activeQ.type`:

- likert, csat, nps (slider o botones), multiple-choice (lista, dropdown, yes/no especial)
- sus (escala 3/5/10), text (voz opcional Mic), score-matrix, ranking (DnD)

## Envío

Respondent:

1. Validar respuestas requeridas
2. Construir `ResponseDocument`
3. `api.saveRespuesta()`
4. Navegar a thank-you

Errores → `/survey-error` o mensaje inline.

## Welcome

Muestra `pantalla_bienvenida` (título, descripción, imagen). Botón “Comenzar” → `/questions`.

## OG / sharing

URLs públicas usadas en middleware y meta tags — ver [deployment.md](deployment.md).
