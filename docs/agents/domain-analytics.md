# Dominio: Analytics

Archivo principal: `src/app/components/AnalyticsDashboard.tsx` (~1.670 líneas)

Ruta: `/analytics/:id` (protegida)

## Datos

- Encuesta: `api.getEncuesta(id)`
- Respuestas: `api.getRespuestas(encuesta_id)`
- Helper: `getAnswersForQuestion(questionId, respuestasData)` → array de `value`

## UI por pregunta

`QuestionCard` — acordeón expandible con badge de tipo, contador de respuestas, gráfico según `tipo`.

| Tipo | Componente | Notas |
|------|------------|-------|
| `likert` | `LikertChart` | Barras + gauge promedio |
| `sus` | `SusChart` | Escala configurable |
| `csat` | `CsatChart` | Caritas o estrellas según `isCsatStarMode()` |
| `nps` | `NpsChart` | Donut promotores/pasivos/detratores + score NPS |
| `multiple-choice` | `MultipleChoiceChart` | Barras; Sí/No → donut lateral |
| `score-matrix` | `ScoreMatrixChart` | Por fila; color amarillo si estrellas |
| `ranking` | `RankingChart` | Posiciones promedio |
| `text` | `TextAnswers` | Lista + nube de palabras (stopwords ES) |
| `separator` | Solo título | Sin gráfico |

## CSAT en analytics

Usa `isCsatStarMode(question)` de `surveyQuestionUtils.ts`:

- **Caritas:** emoji + label (`CSAT_EMOJIS`, `CSAT_LABELS`)
- **Estrellas:** icono ⭐ + “N estrella(s)”, barras color `#FDC700`
- Panel derecho: `ScoreGauge` promedio + % satisfechos (≥4)

Tabla de respuestas: caritas o `csatStarLabel(n)` según modo.

## Yes/No en analytics

`MultipleChoiceChart` detecta `isYesNoQuestion(opciones)`:

- Barras izquierda (labels `w-10`)
- `SplitDonutChart` derecha — mismo tamaño que `ScoreGauge` (`w-24 h-24`)
- Centro: % de Sí; leyenda con conteos

## Resumen de sección

`SectionSummary` — promedios CSAT/SUS, NPS agregado, word cloud de textos abiertos en la sección.

## Stopwords

Array extenso `SPANISH_STOPWORDS` para nubes de frecuencia en preguntas abiertas.

## Acciones admin en analytics

- Copiar link encuesta / preview
- Toggle live/draft (`estado`)
- Eliminar respuestas
- Editar encuesta → builder

## Helpers compartidos

Importar desde `src/app/lib/surveyQuestionUtils.ts` — **no duplicar** lógica CSAT/Sí-No en analytics.

## Comparador

`ComparadorResultados.tsx` en `/comparador` — usa `POST /ai/compare-surveys`. WIP; fuera del dashboard por encuesta.

## Al extender gráficos

- Reutilizar `BarRow`, `ScoreGauge`, `SplitDonutChart`
- Mantener layout `flex gap-8` (barras izq, visual derecha) consistente con CSAT/NPS
- No tocar respondent al cambiar solo analytics
