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
