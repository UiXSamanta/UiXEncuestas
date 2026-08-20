export type ModoVisualizacion = 'scroll' | 'paginated';

export interface EncuestaConfigLike {
  color_primario?: string;
  modo_visualizacion?: ModoVisualizacion;
  bloquear_regreso?: boolean;
}

export function normalizeEncuestaConfig(config?: EncuestaConfigLike) {
  return {
    color_primario: config?.color_primario ?? '#2563eb',
    modo_visualizacion: config?.modo_visualizacion ?? 'paginated',
    bloquear_regreso: config?.bloquear_regreso ?? false,
  };
}

export interface SurveyQuestionLike {
  id: string;
  conditional_logic?: unknown[];
  nps_group_logic?: unknown[];
  text_logic?: unknown[];
}

export interface SurveySectionLike {
  section_logic?: { enabled?: boolean };
}

export function hasSurveyLogic(
  questions: SurveyQuestionLike[],
  sections: SurveySectionLike[] = [],
): boolean {
  if (sections.some((s) => s.section_logic?.enabled)) return true;
  return questions.some(
    (q) =>
      (q.conditional_logic?.length ?? 0) > 0 ||
      (q.nps_group_logic?.length ?? 0) > 0 ||
      (q.text_logic?.length ?? 0) > 0,
  );
}

export function pruneAnswersToStack(
  answers: Array<{ questionID: string; value: number | string }>,
  questions: SurveyQuestionLike[],
  stack: number[],
): Array<{ questionID: string; value: number | string }> {
  const allowedIds = new Set(stack.map((i) => questions[i]?.id).filter(Boolean));
  return answers.filter((a) => allowedIds.has(a.questionID));
}

export function pushNavStack(stack: number[], nextIndex: number): number[] {
  if (stack.length > 0 && stack[stack.length - 1] === nextIndex) return stack;
  return [...stack, nextIndex];
}

export function popNavStack(stack: number[]): { stack: number[]; index: number } {
  if (stack.length <= 1) return { stack: [0], index: 0 };
  const nextStack = stack.slice(0, -1);
  return { stack: nextStack, index: nextStack[nextStack.length - 1] };
}
