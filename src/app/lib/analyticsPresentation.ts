import {
  formatMultipleChoiceAnswerDisplay,
  isCsatStarMode,
  isYesNoQuestion,
  parseMultipleChoiceAnswer,
} from './surveyQuestionUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PresentationBar {
  label: string;
  count: number;
  pct: number;
  widthPct: number;
  variant: 'primary' | 'alt' | 'no' | 'yes';
  fillLabel: string;
  segments?: Array<{ widthPct: number; variant: 'primary' | 'alt' | 'no' | 'yes'; fillLabel: string }>;
}

export type PresentationSlide =
  | {
      id: string;
      railLabel: string;
      kind: 'cover';
      eyebrow: string;
      title: string;
      lede: string;
      responseCount: number;
      questionCount: number;
      dateLabel: string;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'kpi-summary';
      eyebrow: string;
      title: string;
      kpis: Array<{ value: string; label: string }>;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'question-bars';
      eyebrow: string;
      title: string;
      bars: PresentationBar[];
      flag?: string;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'hero-stat';
      eyebrow: string;
      title: string;
      lede: string;
      pct: number;
      pctLabel: string;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'word-chips';
      eyebrow: string;
      title: string;
      tags: Array<{ word: string; count: number }>;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'quotes';
      eyebrow: string;
      title: string;
      quotes: string[];
    }
  | {
      id: string;
      railLabel: string;
      kind: 'empty';
      title: string;
      message: string;
    }
  | {
      id: string;
      railLabel: string;
      kind: 'closing';
      title: string;
      lede: string;
      footnote: string;
    };

export interface PresentationMeta {
  surveyName: string;
  stamp: string;
}

const BAR_COLORS: Record<string, string> = {
  likert: '#597AFF',
  csat: '#00C4B3',
  sus: '#8C59FE',
  nps: '#14b8a6',
  'multiple-choice': '#ACE738',
  ranking: '#EC4899',
  'score-matrix': '#FDC700',
  text: '#81878E',
};

const PRESENTATION_STOPWORDS = new Set([
  'que', 'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'por', 'con', 'no', 'se', 'es', 'su', 'para', 'al', 'del', 'lo', 'como', 'más', 'mas', 'muy', 'pero', 'sus', 'le', 'ya', 'o', 'u', 'e', 'si', 'sí', 'me', 'mi', 'te', 'tu', 'nos', 'les', 'ha', 'he', 'hay', 'fue', 'ser', 'esta', 'este', 'esto', 'eso', 'esa', 'ese', 'tan', 'bien', 'mal', 'solo', 'sólo', 'todo', 'toda', 'todos', 'todas', 'más', 'menos', 'sobre', 'entre', 'desde', 'hasta', 'donde', 'dónde', 'cuando', 'cuándo', 'porque', 'porqué', 'cual', 'cuál', 'quien', 'quién', 'qué', 'que',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAnswersForQuestion(questionId: string, respuestasData: any[]): any[] {
  return respuestasData
    .map((r) => (r.respuestas?.answers || []).find((a: any) => a.questionID === questionId))
    .filter(Boolean)
    .map((a: any) => a.value);
}

function numericAvg(values: any[]): number | null {
  if (!values.length) return null;
  const nums = values.map(Number).filter((n) => !Number.isNaN(n));
  if (!nums.length) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function railLabel(text: string): string {
  return truncate(text.replace(/\s+/g, ' '), 14);
}

function formatPresentationDate(respuestasData: any[]): string {
  const dates = respuestasData
    .map((r) => (r.created_at ? new Date(r.created_at) : null))
    .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));
  if (!dates.length) {
    return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  dates.sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates[dates.length - 1];
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  if (fmt(first) === fmt(last)) return fmt(last);
  return `${fmt(first)} – ${fmt(last)}`;
}

function extractWordTags(textValues: string[]): Array<{ word: string; count: number }> {
  const wordMap = new Map<string, number>();
  textValues.forEach((text) => {
    text
      .toLowerCase()
      .replace(/[^\wáéíóúüñ\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !PRESENTATION_STOPWORDS.has(w))
      .forEach((word) => wordMap.set(word, (wordMap.get(word) || 0) + 1));
  });
  return [...wordMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

function topQuotes(textValues: string[], limit = 5): string[] {
  return [...textValues]
    .map((t) => String(t).trim())
    .filter((t) => t.length >= 12)
    .sort((a, b) => b.length - a.length)
    .slice(0, limit);
}

function countMultipleChoice(opciones: string[], values: any[]): number[] {
  return opciones.map((label, i) =>
    values.filter((v) => {
      const parsed = parseMultipleChoiceAnswer(v);
      if (parsed.length > 1 || (typeof v === 'string' && v.trim().startsWith('['))) {
        return parsed.includes(label);
      }
      return Number(v) === i || v === label;
    }).length,
  );
}

function buildYesNoBars(opciones: string[], values: any[]): PresentationBar[] {
  const total = values.length;
  const counts = countMultipleChoice(opciones, values);
  const yesIdx = opciones.findIndex((opt) => ['yes', 'sí', 'si'].includes(opt.toLowerCase().trim()));
  const noIdx = opciones.findIndex((opt) => opt.toLowerCase().trim() === 'no');
  const yesCount = yesIdx >= 0 ? counts[yesIdx] : 0;
  const noCount = noIdx >= 0 ? counts[noIdx] : 0;
  const yesPct = total > 0 ? (yesCount / total) * 100 : 0;
  const noPct = total > 0 ? (noCount / total) * 100 : 0;
  const yesLabel = yesIdx >= 0 ? opciones[yesIdx] : 'Sí';
  const noLabel = noIdx >= 0 ? opciones[noIdx] : 'No';

  if (noCount === 0) {
    return [
      {
        label: '',
        count: yesCount,
        pct: yesPct,
        widthPct: 100,
        variant: 'yes',
        fillLabel: `${yesLabel} · ${Math.round(yesPct)}% (${yesCount})`,
      },
    ];
  }

  if (yesCount === 0) {
    return [
      {
        label: '',
        count: noCount,
        pct: noPct,
        widthPct: 100,
        variant: 'no',
        fillLabel: `${noLabel} · ${Math.round(noPct)}% (${noCount})`,
      },
    ];
  }

  return [
    {
      label: '',
      count: yesCount,
      pct: yesPct,
      widthPct: 100,
      variant: 'yes',
      fillLabel: `${yesLabel} · ${Math.round(yesPct)}% (${yesCount})`,
      segments: [
        {
          widthPct: yesPct,
          variant: 'yes',
          fillLabel: `${yesLabel} · ${Math.round(yesPct)}% (${yesCount})`,
        },
        {
          widthPct: noPct,
          variant: 'no',
          fillLabel: `${noLabel} · ${Math.round(noPct)}% (${noCount})`,
        },
      ],
    },
  ];
}

function buildOptionBars(
  labels: string[],
  counts: number[],
  total: number,
  variantAlternate = true,
): PresentationBar[] {
  const maxCount = Math.max(...counts, 1);
  return labels
    .map((label, i) => ({
      label,
      count: counts[i],
      pct: total > 0 ? (counts[i] / total) * 100 : 0,
      widthPct: (counts[i] / maxCount) * 100,
      variant: (variantAlternate && i % 2 === 1 ? 'alt' : 'primary') as 'primary' | 'alt',
      fillLabel:
        total > 0
          ? `${Math.round((counts[i] / total) * 100)}% (${counts[i]})`
          : `0% (0)`,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildLikertBars(question: any, values: any[]): PresentationBar[] {
  const opciones: string[] =
    question.opciones?.length > 0
      ? question.opciones
      : ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'];
  const total = values.length;
  const counts = opciones.map((_, i) => values.filter((v) => Number(v) === i + 1).length);
  return buildOptionBars(opciones, counts, total);
}

function buildScaleBars(question: any, values: any[]): PresentationBar[] {
  const scale = question.escala_sus || question.opciones?.length || 5;
  const labels = Array.from({ length: scale }, (_, i) => String(i + 1));
  const total = values.length;
  const counts = labels.map((_, i) => values.filter((v) => Number(v) === i + 1).length);
  return buildOptionBars(labels, counts, total, false);
}

function buildCsatBars(question: any, values: any[]): PresentationBar[] {
  const total = values.length;
  if (isCsatStarMode(question)) {
    const labels = ['1', '2', '3', '4', '5'];
    const counts = labels.map((_, i) => values.filter((v) => Number(v) === i + 1).length);
    return buildOptionBars(labels.map((n) => `${n} ★`), counts, total, false);
  }
  const opciones = question.opciones?.length ? question.opciones : ['😞', '😕', '😐', '🙂', '😄'];
  const counts = opciones.map((_, i) => values.filter((v) => Number(v) === i + 1).length);
  return buildOptionBars(opciones, counts, total);
}

function buildRankingBars(question: any, values: any[]): PresentationBar[] {
  const options: string[] = question.opciones || [];
  const total = values.length;
  if (!options.length || !total) return [];

  const parsedValues = values
    .map((v) => {
      try {
        return typeof v === 'string' ? JSON.parse(v) : v;
      } catch {
        return [];
      }
    })
    .filter((arr) => Array.isArray(arr));

  const counts = options.map((option) => {
    let pickCount = 0;
    parsedValues.forEach((ranking) => {
      if (ranking.includes(option)) pickCount += 1;
    });
    return pickCount;
  });

  return buildOptionBars(options, counts, total);
}

function buildMatrixBars(question: any, values: any[]): PresentationBar[] {
  const rows: string[] = question.matrix_rows || [];
  const columns = question.matrix_columns || [];
  const total = values.length;
  if (!rows.length || !total) return [];

  const parsedValues = values.map((v) => {
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return {};
    }
  });

  const avgs = rows.map((rowLabel, rowIdx) => {
    const rowValues = parsedValues.map((matrix) => matrix[rowIdx]).filter((v) => v !== undefined);
    const avg =
      rowValues.length > 0
        ? rowValues.reduce((sum, v) => sum + Number(v), 0) / rowValues.length
        : 0;
    return { label: rowLabel, score: avg + 1, max: columns.length || 5 };
  });

  const maxScore = Math.max(...avgs.map((a) => a.score), 1);
  return avgs.map((item, i) => ({
    label: item.label,
    count: Math.round(item.score * 10) / 10,
    pct: columns.length ? (item.score / columns.length) * 100 : 0,
    widthPct: (item.score / maxScore) * 100,
    variant: (i % 2 === 1 ? 'alt' : 'primary') as 'primary' | 'alt',
    fillLabel: `Promedio ${item.score.toFixed(1)} / ${columns.length || item.max}`,
  }));
}

interface HeroCandidate {
  pct: number;
  pctLabel: string;
  eyebrow: string;
  title: string;
  lede: string;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildPresentationSlides(encuesta: any, respuestasData: any[]): {
  slides: PresentationSlide[];
  meta: PresentationMeta;
} {
  const preguntas: any[] = (encuesta?.preguntas || []).filter((q: any) => q.tipo !== 'separator');
  const responseCount = respuestasData.length;
  const questionCount = preguntas.length;
  const surveyName = encuesta?.nombre_encuesta || 'Encuesta';
  const dateLabel = formatPresentationDate(respuestasData);

  const meta: PresentationMeta = {
    surveyName,
    stamp: truncate(surveyName, 42),
  };

  if (responseCount === 0) {
    return {
      meta,
      slides: [
        {
          id: 'cover',
          railLabel: 'Portada',
          kind: 'cover',
          eyebrow: surveyName,
          title: 'Aún no hay respuestas',
          lede: 'Cuando lleguen respuestas, esta presentación se generará automáticamente con los resultados.',
          responseCount: 0,
          questionCount,
          dateLabel,
        },
        {
          id: 'empty',
          railLabel: 'Sin datos',
          kind: 'empty',
          title: 'Sin datos para presentar',
          message: 'Comparte la encuesta o espera respuestas para ver slides con resultados.',
        },
        {
          id: 'closing',
          railLabel: 'Cierre',
          kind: 'closing',
          title: surveyName,
          lede: 'Vuelve a abrir la presentación cuando tengas respuestas.',
          footnote: `UiX Encuestas · ${surveyName}`,
        },
      ],
    };
  }

  const slides: PresentationSlide[] = [];
  let heroCandidate: HeroCandidate | null = null;
  const kpiCandidates: Array<{ value: string; label: string; sort: number }> = [];

  slides.push({
    id: 'cover',
    railLabel: 'Portada',
    kind: 'cover',
    eyebrow: surveyName,
    title: `${responseCount} respuesta${responseCount === 1 ? '' : 's'}`,
    lede: `Resultados de ${surveyName}. Datos extraídos tal como fueron registrados, listos para compartir.`,
    responseCount,
    questionCount,
    dateLabel,
  });

  preguntas.forEach((question, index) => {
    const values = getAnswersForQuestion(question.pregunta_id, respuestasData);
    if (!values.length) return;

    const title = question.titulo_pregunta || `Pregunta ${index + 1}`;
    const eyebrow = truncate(title, 72);
    const slideId = `q-${question.pregunta_id}`;

    if (question.tipo === 'multiple-choice') {
      const opciones: string[] = question.opciones?.length ? question.opciones : [];
      if (isYesNoQuestion(opciones)) {
        const bars = buildYesNoBars(opciones, values);
        const yesBar = bars[0];
        const yesPct = Math.round(yesBar.pct);
        kpiCandidates.push({
          value: `${yesPct}%`,
          label: truncate(title, 48),
          sort: yesPct,
        });
        if (!heroCandidate || yesPct > heroCandidate.pct) {
          heroCandidate = {
            pct: yesPct,
            pctLabel: 'dice que sí',
            eyebrow: 'El dato destacado',
            title: `${yesPct}%`,
            lede: truncate(title, 120),
          };
        }
        const lowest = yesPct <= 70;
        slides.push({
          id: slideId,
          railLabel: railLabel(title),
          kind: 'question-bars',
          eyebrow,
          title,
          bars,
          flag: lowest ? 'punto más bajo' : undefined,
        });
      } else {
        const counts = countMultipleChoice(opciones, values);
        const bars = buildOptionBars(opciones, counts, values.length);
        slides.push({
          id: slideId,
          railLabel: railLabel(title),
          kind: 'question-bars',
          eyebrow,
          title,
          bars: bars.slice(0, 8),
        });
      }
      return;
    }

    if (question.tipo === 'likert') {
      const avg = numericAvg(values);
      if (avg !== null) {
        kpiCandidates.push({
          value: avg.toFixed(1),
          label: truncate(title, 48),
          sort: avg,
        });
      }
      slides.push({
        id: slideId,
        railLabel: railLabel(title),
        kind: 'question-bars',
        eyebrow,
        title,
        bars: buildLikertBars(question, values),
      });
      return;
    }

    if (question.tipo === 'sus' || question.tipo === 'csat') {
      const avg = numericAvg(values);
      const max = question.tipo === 'sus' ? question.escala_sus || 5 : question.opciones?.length || 5;
      if (avg !== null) {
        kpiCandidates.push({
          value: question.tipo === 'csat' ? `${Math.round((avg / max) * 100)}%` : avg.toFixed(1),
          label: truncate(title, 48),
          sort: avg,
        });
      }
      slides.push({
        id: slideId,
        railLabel: railLabel(title),
        kind: 'question-bars',
        eyebrow,
        title,
        bars: question.tipo === 'csat' ? buildCsatBars(question, values) : buildScaleBars(question, values),
      });
      return;
    }

    if (question.tipo === 'nps') {
      const promoters = values.filter((v) => Number(v) >= 9).length;
      const detractors = values.filter((v) => Number(v) <= 6).length;
      const nps = Math.round(((promoters / values.length) * 100) - ((detractors / values.length) * 100));
      kpiCandidates.push({ value: String(nps), label: 'NPS', sort: nps + 100 });
      if (!heroCandidate) {
        heroCandidate = {
          pct: Math.max(0, Math.round((promoters / values.length) * 100)),
          pctLabel: 'promotores',
          eyebrow: 'NPS',
          title: `${nps}`,
          lede: `Net Promoter Score calculado con ${values.length} respuesta${values.length === 1 ? '' : 's'}.`,
        };
      }
      const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      const counts = labels.map((label) => values.filter((v) => String(v) === label).length);
      slides.push({
        id: slideId,
        railLabel: 'NPS',
        kind: 'question-bars',
        eyebrow,
        title,
        bars: buildOptionBars(labels, counts, values.length, false),
      });
      return;
    }

    if (question.tipo === 'ranking') {
      slides.push({
        id: slideId,
        railLabel: railLabel(title),
        kind: 'question-bars',
        eyebrow,
        title,
        bars: buildRankingBars(question, values),
      });
      return;
    }

    if (question.tipo === 'score-matrix') {
      slides.push({
        id: slideId,
        railLabel: railLabel(title),
        kind: 'question-bars',
        eyebrow,
        title,
        bars: buildMatrixBars(question, values),
      });
      return;
    }

    if (question.tipo === 'text' && !question.solo_email) {
      const textValues = values
        .map((v) => formatMultipleChoiceAnswerDisplay(v, question.respuesta_unica === false, question.opciones))
        .filter((t) => t.trim().length > 0);
      const tags = extractWordTags(textValues);
      const quotes = topQuotes(textValues);

      if (tags.length) {
        slides.push({
          id: `${slideId}-words`,
          railLabel: 'Palabras',
          kind: 'word-chips',
          eyebrow: `${truncate(title, 60)} · ${textValues.length} de ${responseCount} respondieron`,
          title: 'Palabras que más se repiten',
          tags,
        });
      }

      if (quotes.length) {
        slides.push({
          id: `${slideId}-quotes`,
          railLabel: 'Voces',
          kind: 'quotes',
          eyebrow: `${truncate(title, 60)} · ${textValues.length} de ${responseCount} respondieron`,
          title: 'Lo que escribieron',
          quotes,
        });
      }
    }
  });

  const kpis = kpiCandidates
    .sort((a, b) => b.sort - a.sort)
    .slice(0, 4)
    .map(({ value, label }) => ({ value, label }));

  if (kpis.length >= 2) {
    slides.splice(1, 0, {
      id: 'kpi-summary',
      railLabel: 'Resumen',
      kind: 'kpi-summary',
      eyebrow: 'El resumen rápido',
      title: 'Lo más relevante de esta encuesta',
      kpis,
    });
  }

  if (heroCandidate) {
    const insertAt = slides.findIndex((s) => s.kind === 'kpi-summary') >= 0 ? 2 : 1;
    slides.splice(insertAt, 0, {
      id: 'hero-stat',
      railLabel: 'El dato',
      kind: 'hero-stat',
      eyebrow: heroCandidate.eyebrow,
      title: heroCandidate.title,
      lede: heroCandidate.lede,
      pct: heroCandidate.pct,
      pctLabel: heroCandidate.pctLabel,
    });
  }

  slides.push({
    id: 'closing',
    railLabel: 'Cierre',
    kind: 'closing',
    title: surveyName,
    lede: `${responseCount} persona${responseCount === 1 ? '' : 's'} compartieron su perspectiva. Gracias por revisar estos resultados.`,
    footnote: `UiX Encuestas · ${surveyName} · ${dateLabel}`,
  });

  return { slides, meta };
}

export function getPresentationBarColor(tipo: string): string {
  return BAR_COLORS[tipo] || BAR_COLORS.text;
}
