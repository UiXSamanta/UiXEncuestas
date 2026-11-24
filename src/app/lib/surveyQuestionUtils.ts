/** CSAT display mode: stars (true) vs emoji faces (false). */
export function isCsatStarMode(question: {
  use_stars?: boolean;
  subtitulo_pregunta?: string;
  subtitle?: string;
  opciones?: string[];
}): boolean {
  if (question.use_stars !== undefined) {
    return question.use_stars;
  }

  const subtitle = (question.subtitle ?? question.subtitulo_pregunta ?? '').toLowerCase();
  return (
    subtitle.includes('estrella') ||
    subtitle.includes('star') ||
    (question.opciones ?? []).some(opt => opt.includes('⭐') || opt.includes('★'))
  );
}

export function isYesNoQuestion(opciones?: string[]): boolean {
  if (!opciones || opciones.length !== 2) return false;

  const normalized = opciones.map(opt => opt.toLowerCase().trim());
  const yesNoPatterns = [
    ['yes', 'no'],
    ['sí', 'no'],
    ['si', 'no'],
  ];

  return yesNoPatterns.some(
    pattern => normalized.includes(pattern[0]) && normalized.includes(pattern[1])
  );
}

export function csatStarLabel(starCount: number): string {
  return `⭐×${starCount}`;
}

export function parseMultipleChoiceAnswer(value: number | string | undefined): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === 'number') return [String(value)];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [trimmed];
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
}

export function isMultipleChoiceOptionSelected(
  value: number | string | undefined,
  option: string,
  multiSelect: boolean,
): boolean {
  if (!multiSelect) {
    return value === option;
  }
  return parseMultipleChoiceAnswer(value).includes(option);
}

export function toggleMultipleChoiceOption(
  value: number | string | undefined,
  option: string,
): string {
  const selected = parseMultipleChoiceAnswer(value);
  const next = selected.includes(option)
    ? selected.filter((item) => item !== option)
    : [...selected, option];
  return JSON.stringify(next);
}

export function formatMultipleChoiceAnswerDisplay(
  value: number | string | undefined,
  multiSelect: boolean,
  opciones?: string[],
): string {
  if (value === undefined || value === null) return '';
  if (!multiSelect) {
    if (typeof value === 'number' && opciones?.length) {
      return opciones[value] ?? String(value);
    }
    return String(value);
  }
  return parseMultipleChoiceAnswer(value).join(', ');
}

// ── Editable scale labels (CSAT faces / NPS ends) ────────────────────────────

export const DEFAULT_CSAT_LABELS = ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];
export const CSAT_LABEL_MAX_LENGTH = 20;

/** Always returns 5 labels; empty or missing entries fall back to the Spanish defaults. */
export function getCsatLabels(question: { csat_labels?: string[] }): string[] {
  return DEFAULT_CSAT_LABELS.map((fallback, i) => question.csat_labels?.[i]?.trim() || fallback);
}

export const DEFAULT_NPS_LABELS = { left: 'Nada probable', right: 'Muy probable' };
export const NPS_LABEL_MAX_LENGTH = 40;

/** NPS end labels (0 and 10); reuses the SUS fields label_izquierda / label_derecha. */
export function getNpsLabels(question: { label_izquierda?: string; label_derecha?: string }): { left: string; right: string } {
  return {
    left: question.label_izquierda?.trim() || DEFAULT_NPS_LABELS.left,
    right: question.label_derecha?.trim() || DEFAULT_NPS_LABELS.right,
  };
}

/** True when the creator changed either NPS end label; the slider's "…probable" value caption then no longer fits. */
export function hasCustomNpsLabels(question: { label_izquierda?: string; label_derecha?: string }): boolean {
  const { left, right } = getNpsLabels(question);
  return left !== DEFAULT_NPS_LABELS.left || right !== DEFAULT_NPS_LABELS.right;
}
