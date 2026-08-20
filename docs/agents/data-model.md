# Modelo de datos

Tipos principales definidos en `SurveyBuilder.tsx` (`EncuestaRow`, `PreguntaSchema`) y normalizados en respondent.

## Encuesta (`encuesta:{id}`)

```typescript
interface EncuestaRow {
  id: string;
  nombre_encuesta: string;
  estado: boolean;              // true = publicada/live
  pantalla_bienvenida: {
    titulo: string;
    descripcion: string;
    imagen_url?: string;
    imagen_fondo_enabled?: boolean;
    opengraph_url?: string;
    opengraph_enabled?: boolean;
    thumbnail_url?: string;
    thumbnail_enabled?: boolean;
  };
  configuracion: {
    color_primario?: string;
    modo_visualizacion: 'scroll' | 'paginated';
    bloquear_regreso?: boolean;
  };
  preguntas: PreguntaSchema[];
  sections?: SectionMetadata[];
  proyecto_id?: string;
  conteo_respuestas?: number;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;          // nombre del editor
}
```

## Sección (`sections[]`)

```typescript
interface SectionMetadata {
  id: string;
  title: string;
  section_logic?: ConditionalLogic[];  // lógica al completar sección
}
```

Las preguntas referencian sección con `section_id`.

## Pregunta (`PreguntaSchema`)

Campo común: `pregunta_id`, `tipo`, `titulo_pregunta`, `subtitulo_pregunta?`, `opciones[]`, `orden`, `opcional?`, `section_id?`.

### Tipos de pregunta

| `tipo` | Campos específicos |
|--------|-------------------|
| `likert` | `opciones`, `conditional_logic` |
| `sus` | `escala_sus` (3\|5\|10), `label_izquierda`, `label_derecha` |
| `csat` | `use_stars?` (editor; default false = caritas), `opciones`, `conditional_logic` |
| `nps` | `usar_slider`, `subtitulo_pregunta`, `nps_group_logic` |
| `multiple-choice` | `respuesta_unica`, `usar_dropdown`, `conditional_logic` |
| `text` | `solo_email`, `text_logic` (answered/skipped) |
| `separator` | Solo título informativo |
| `score-matrix` | `matrix_rows`, `matrix_columns`, `use_stars` |
| `ranking` | `ranking_instruction`, orden drag-and-drop |

### Lógica condicional

```typescript
interface ConditionalLogic {
  condition: string;       // valor que dispara el salto
  jump_to: string;         // pregunta_id destino o "END_SURVEY"
}
```

NPS usa `nps_group_logic` con rangos 0-6 / 7-8 / 9-10.

## Respuesta (`respuesta:{id}`)

```typescript
{
  responseID: string;
  surveyID: string;
  timestamp: string;
  answers: Array<{
    questionID: string;
    value: number | string;   // índice, escala, JSON string (matrix/ranking)
  }>;
}
```

Al guardar: incrementa `encuesta.conteo_respuestas`.

Valores por tipo:

| Tipo | `value` típico |
|------|----------------|
| likert / csat / nps / sus | número 1-N o 0-10 (NPS) |
| multiple-choice | índice o string de opción |
| text | string |
| score-matrix | JSON `{ rowIndex: colIndex, ... }` |
| ranking | JSON array de strings en orden |

## Proyecto (`proyecto:{id}`)

```typescript
{
  id: string;
  nombre: string;
  password?: string;
  locked?: boolean;
  created_by?: string;      // user id del creador
  encuestas: string[];    // ids de encuestas
  created_at: string;
  updated_at: string;
}
```

## Admin (`admin:{userId}`)

Metadatos post-login: nombre, permisos, `must_change_password`, `source`, etc.

## Notificación (`notification:{id}`)

Solicitud de acceso: email, nombre, estado (`pending` \| `approved` \| `rejected`).

## Normalización respondent

`RespondentSurvey` / `PreviewSurvey` mapean:

- `tipo` → `type`
- `titulo_pregunta` → `title`
- `subtitulo_pregunta` → `subtitle`

Ver `normalizeQuestion()` en esos archivos. **No cambiar respondent sin OK explícito.**

## Helpers compartidos

`src/app/lib/surveyQuestionUtils.ts`:

- `isCsatStarMode(question)` — respeta `use_stars` del editor; fallback heurístico legacy
- `isYesNoQuestion(opciones)` — detecta pares Sí/No para analytics
- `csatStarLabel(n)` — formato `⭐×N` (tabla analytics)
