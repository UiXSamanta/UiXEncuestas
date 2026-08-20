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
