# Convenciones

## Idioma

- **UI usuario:** español (México/LATAM informal profesional)
- **Código:** nombres de variables en inglés mezclados con dominio español en schema (`titulo_pregunta`)
- `index.html`: `lang="es"`

## Naming de dominio

| Español (persistido) | Inglés (viewer normalizado) |
|----------------------|----------------------------|
| `tipo` | `type` |
| `titulo_pregunta` | `title` |
| `subtitulo_pregunta` | `subtitle` |
| `nombre_encuesta` | — |
| `pregunta_id` | `id` (en answers: `questionID`) |

## API

- Siempre `{ data, error }`
- Comprobar **ambos** en componentes
- Token usuario en body `_token`, no solo en header
- Header: `Authorization: Bearer {publicAnonKey}`

## Estilos

- Tailwind 4 + tokens en `src/styles/theme.css`
- Colores marca frecuentes: `#597AFF`, `#8C59FE`, `#00C4B3`, `#ACE738`
- Dark mode: `next-themes` via `ThemeProvider`
- Componentes base: `src/app/components/ui/` (shadcn)

## Commits y PRs

Conventional commits:

```
feat: descripción breve
fix: ...
docs: ...
chore: ...
```

- MR/PR pequeños y enfocados
- Referenciar issues `#123` si aplica (GitLab workflow rule; repo en GitHub)
- **No commitear** sin pedido explícito del usuario
- No incluir `.env`, `supabase/.temp/`, credenciales

## Archivos sensibles / ignorar

- `supabase/.temp/`
- Secretos de service role
- `node_modules/`, `dist/`

## Patrones React

- Componentes de dominio grandes — preferir edits localizados
- Estado de encuesta en builder: un objeto `encuestaData` + `setEncuestaData`
- `useEffect` para carga inicial por `useParams().id`
- Confirmaciones destructivas con `confirm()` nativo

## Testing manual recomendado

Tras cambios en:

| Área | Verificar |
|------|-----------|
| Builder | crear pregunta, guardar, preview |
| Respondent | submit real en `/survey/:id` |
| Preview | no incrementa conteo respuestas |
| Analytics | gráficos con datos reales |
| Auth | login, logout, change password |

## Anti-patrones (evitar)

- Refactorizar archivos 1500+ líneas “de paso”
- Cambiar respondent al implementar solo editor o analytics
- Asumir `use_stars` en respondent (aún heurístico)
- Editar `utils/supabase/info.tsx` a mano
- Desplegar solo frontend sin Edge Function cuando cambia API
