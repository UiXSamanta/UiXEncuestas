import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Copy, Eye, Check, Mail, Trash2, Power,
  BarChart2, MessageSquare, Star, CheckSquare,
  ListOrdered, ChevronDown, ChevronUp, Users, Calendar, Edit, Cloud,
  Grid3x3, ArrowUpDown, Gauge
} from 'lucide-react';
import * as api from '../lib/api';

// ── Type helpers ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bar: string; badge: string; icon: any }> = {
  likert:          { label: 'Escala de Likert', bar: '#597AFF', badge: 'bg-[#597AFF]/10 text-[#597AFF] border-[#597AFF]/20',   icon: ListOrdered },
  sus:             { label: 'SUS',              bar: '#8C59FE', badge: 'bg-[#8C59FE]/10 text-[#8C59FE] border-[#8C59FE]/20', icon: Star },
  csat:            { label: 'CSAT',             bar: '#00C4B3', badge: 'bg-[#00C4B3]/10 text-[#00C4B3] border-[#00C4B3]/20',  icon: Star },
  nps:             { label: 'NPS',              bar: '#14b8a6', badge: 'bg-teal-50 text-teal-600 border-teal-200', icon: Gauge },
  'multiple-choice': { label: 'Opción Múltiple', bar: '#ACE738', badge: 'bg-[#ACE738]/10 text-[#5C6671] border-[#ACE738]/20', icon: CheckSquare },
  text:            { label: 'Pregunta abierta', bar: '#81878E', badge: 'bg-[#EBEEF4] text-[#5C6671] border-[#C3C5C9]',    icon: MessageSquare },
  'score-matrix':  { label: 'Score Matrix',     bar: '#FDC700', badge: 'bg-[#FDC700]/10 text-[#FDC700] border-[#FDC700]/20', icon: Grid3x3 },
  'ranking':       { label: 'Ranking',          bar: '#EC4899', badge: 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20', icon: ArrowUpDown },
};

const CSAT_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
const CSAT_LABELS = ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];

// ── Per-question stats helpers ────────────────────────────────────────────────

function getAnswersForQuestion(questionId: string, respuestasData: any[]): any[] {
  return respuestasData
    .map(r => (r.respuestas?.answers || []).find((a: any) => a.questionID === questionId))
    .filter(Boolean)
    .map((a: any) => a.value);
}

function numericAvg(values: any[]): number | null {
  if (!values.length) return null;
  const nums = values.map(Number).filter(n => !isNaN(n));
  if (!nums.length) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

// ── Stopwords en español ──────────────────────────────────────────────────────
const SPANISH_STOPWORDS = new Set([
  // Artículos
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al',
  // Pronombres personales
  'yo', 'tú', 'tu', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas',
  'me', 'te', 'le', 'lo', 'la', 'nos', 'os', 'les', 'se', 'mi', 'ti', 'mí', 'sí',
  // Pronombres posesivos
  'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas',
  'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras',
  'su', 'sus', 'tu', 'tus',
  // Pronombres demostrativos
  'este', 'esta', 'esto', 'estos', 'estas', 'ese', 'esa', 'eso', 'esos', 'esas',
  'aquel', 'aquella', 'aquello', 'aquellos', 'aquellas',
  // Pronombres indefinidos y relativos
  'algo', 'alguien', 'alguno', 'alguna', 'algunos', 'algunas', 'nada', 'nadie', 'ninguno', 'ninguna',
  'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas',
  'que', 'cual', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos', 'cuyas', 'qué', 'cuál', 'cuáles', 'quién', 'quiénes',
  // Preposiciones
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta',
  'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'versus', 'vía', 'salvo', 'excepto',
  // Conjunciones
  'y', 'e', 'o', 'u', 'ni', 'pero', 'mas', 'sino', 'aunque', 'porque', 'pues', 'si', 'como', 'cuando',
  'donde', 'mientras', 'apenas', 'luego', 'entonces', 'así', 'tal', 'tanto', 'ya',
  // Verbos auxiliares y modales comunes
  'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'deber', 'querer', 'saber', 'decir', 'ir', 'ver',
  'dar', 'poner', 'llevar', 'dejar', 'seguir', 'quedar', 'creer', 'hablar', 'encontrar', 'llegar', 'pasar',
  'parecer',
  // Conjugaciones verbales más comunes
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'será', 'serán', 'sería', 'serían', 'siendo', 'sido',
  'está', 'están', 'estaba', 'estaban', 'estuvo', 'estuvieron', 'estará', 'estarán', 'estaría', 'estarían',
  'estoy', 'estás', 'estamos', 'estáis',
  'ha', 'han', 'había', 'habían', 'hubo', 'hubieron', 'habrá', 'habrán', 'habría', 'habrían',
  'he', 'has', 'hemos', 'habéis', 'hay',
  'tengo', 'tienes', 'tiene', 'tienen', 'tenía', 'tenían', 'tuvo', 'tuvieron', 'tendrá', 'tendrán',
  'soy', 'eres', 'somos', 'sois', 'sea', 'seas', 'seamos', 'seáis', 'sean',
  'voy', 'vas', 'va', 'van', 'iba', 'iban', 'ido',
  'puedo', 'puedes', 'puede', 'pueden', 'podía', 'podían', 'pudo', 'pudieron', 'podrá', 'podrán',
  // Adverbios comunes
  'muy', 'más', 'menos', 'tan', 'tanto', 'mucho', 'poco', 'bien', 'mal', 'solo', 'sólo', 'solamente',
  'también', 'tampoco', 'siempre', 'nunca', 'jamás', 'ahora', 'después', 'antes', 'luego', 'aún', 'todavía',
  'aquí', 'ahí', 'allí', 'acá', 'allá', 'cerca', 'lejos', 'arriba', 'abajo', 'adelante', 'atrás',
  'sí', 'no', 'quizá', 'quizás', 'acaso', 'apenas',
  // Otros comunes
  'vez', 'veces', 'año', 'años', 'día', 'días', 'tiempo', 'parte', 'cosa', 'cosas', 'caso', 'modo',
  'forma', 'tipo', 'vez', 'gente', 'mundo', 'vida', 'hombre', 'mujer', 'ciudad', 'país',
  'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'primero', 'segundo', 'tercero', 'último', 'único', 'grande', 'pequeño', 'nuevo', 'viejo'
]);

// ── Extracción de palabras y frases frecuentes ────────────────────────────────
interface FrequencyTag {
  text: string;
  count: number;
  size: number; // 0-1, proporcional a la frecuencia máxima
}

function extractFrequencyTags(textValues: string[]): FrequencyTag[] {
  if (textValues.length === 0) return [];

  const threshold = Math.ceil(textValues.length * 0.30); // 30% mínimo
  const allText = textValues.join(' ');

  // ── Extraer palabras individuales ──
  const wordMap = new Map<string, number>();
  const emailRegex = /\S+@\S+\.\S+/; // Regex simple para detectar emails
  const words = allText
    .toLowerCase()
    .replace(/[^\wáéíóúüñ\s@.]/gi, ' ') // Mantener letras, números, @ y . para detectar emails
    .split(/\s+/)
    .filter(w => w.length >= 3); // Palabras de al menos 3 caracteres

  words.forEach(word => {
    // Excluir stopwords y emails
    if (!SPANISH_STOPWORDS.has(word) && !emailRegex.test(word)) {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    }
  });

  // ── Extraer frases de 3+ palabras ──
  const phraseMap = new Map<string, number>();
  textValues.forEach(text => {
    // Skip if text contains email
    if (emailRegex.test(text)) return;

    const normalized = text.toLowerCase().replace(/[^\wáéíóúüñ\s]/gi, ' ').trim();
    const phraseWords = normalized.split(/\s+/).filter(w => !SPANISH_STOPWORDS.has(w));

    // Buscar frases de 3, 4 y 5 palabras
    for (let len = 3; len <= 5; len++) {
      for (let i = 0; i <= phraseWords.length - len; i++) {
        const phrase = phraseWords.slice(i, i + len).join(' ');
        if (phrase.split(' ').length === len) {
          phraseMap.set(phrase, (phraseMap.get(phrase) || 0) + 1);
        }
      }
    }
  });

  // ── Combinar y filtrar por umbral ──
  const combined: Array<{ text: string; count: number }> = [];

  wordMap.forEach((count, text) => {
    if (count >= threshold) {
      combined.push({ text, count });
    }
  });

  phraseMap.forEach((count, text) => {
    if (count >= threshold) {
      combined.push({ text, count });
    }
  });

  // ── Ordenar por frecuencia descendente y tomar top 15 ──
  combined.sort((a, b) => b.count - a.count);
  const top15 = combined.slice(0, 15);

  if (top15.length === 0) return [];

  // ── Calcular tamaño proporcional (0-1) ──
  const maxCount = top15[0].count;
  const minCount = top15[top15.length - 1].count;
  const range = maxCount - minCount || 1;

  return top15.map(item => ({
    text: item.text,
    count: item.count,
    size: (item.count - minCount) / range, // 0 = menos frecuente, 1 = más frecuente
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Horizontal bar row */
function BarRow({ label, count, total, color, emoji }: { label: string; count: number; total: number; color: string; emoji?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      {emoji && <span className="text-xl w-7 text-center shrink-0">{emoji}</span>}
      <span className="text-[13px] text-gray-600 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[10px] bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-semibold text-gray-700 w-6 text-right shrink-0">{count}</span>
      <span className="text-[11px] text-gray-400 w-9 text-right shrink-0">{pct}%</span>
    </div>
  );
}

/** Gauge for CSAT / SUS avg */
function ScoreGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value.toFixed(1)}</span>
        <span className="text-[10px] text-gray-500">/ {max}</span>
      </div>
    </div>
  );
}

/** NPS Gauge (Tacómetro from -100 to +100) */
function NPSGauge({ score }: { score: number }) {
  // Normalize score from -100/+100 to 0-180 degrees
  const angle = ((score + 100) / 200) * 180;

  // Determine color based on score
  let color = '#ef4444'; // Red for negative
  if (score >= 0 && score < 50) color = '#fbbf24'; // Yellow for 0-49
  if (score >= 50) color = '#34d399'; // Green for 50+

  return (
    <div className="relative w-32 h-20">
      <svg className="w-full h-full" viewBox="0 0 140 80">
        {/* Background arc (gray) */}
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Color segments */}
        <defs>
          <linearGradient id="npsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#ef4444' }} />
            <stop offset="50%" style={{ stopColor: '#fbbf24' }} />
            <stop offset="100%" style={{ stopColor: '#34d399' }} />
          </linearGradient>
        </defs>

        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke="url(#npsGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="188.4"
          strokeDashoffset={188.4 - (188.4 * angle / 180)}
        />

        {/* Needle */}
        <g transform={`rotate(${angle - 90} 70 70)`}>
          <line
            x1="70"
            y1="70"
            x2="70"
            y2="20"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="70" cy="70" r="4" fill="#374151" />
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-500">NPS Score</span>
      </div>
    </div>
  );
}

/** Card wrapper for one question */
function QuestionCard({ question, index, respuestasData }: { question: any; index: number; respuestasData: any[] }) {
  const [expanded, setExpanded] = useState(true);
  const tipo = question.tipo as string;

  // Separator: only show title, no accordion
  if (tipo === 'separator') {
    return (
      <div className="py-4">
        <h3 className="text-[16px] font-bold text-[#101828]">
          {question.titulo_pregunta}
        </h3>
        {question.subtitulo_pregunta && (
          <p className="text-[13px] text-gray-500 mt-1">{question.subtitulo_pregunta}</p>
        )}
      </div>
    );
  }

  const meta = TYPE_META[tipo] || TYPE_META.text;
  const Icon = meta.icon;

  const values = getAnswersForQuestion(question.pregunta_id, respuestasData);
  const totalAnswers = values.length;
  const totalResponses = respuestasData.length;
  const answered = `${totalAnswers} / ${totalResponses}`;

  return (
    <div className="bg-white rounded-[12px] border border-[#e5e7eb] overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-6 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-[12px] font-bold text-gray-500 shrink-0">
          {index + 1}
        </span>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${meta.badge}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
        <h3 className="flex-1 text-[14px] font-semibold text-[#101828] leading-snug">
          {question.titulo_pregunta}
        </h3>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12px] text-gray-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {answered} resp.
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="border-t border-[#f3f4f6] px-6 py-5">
          {totalAnswers === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[13px] text-gray-400 font-medium">Sin respuestas aún</p>
              <p className="text-[12px] text-gray-300 mt-1">Los resultados aparecerán aquí cuando lleguen respuestas.</p>
            </div>
          ) : (
            <>
              {/* ── Likert ── */}
              {tipo === 'likert' && <LikertChart question={question} values={values} meta={meta} />}
              {/* ── SUS ── */}
              {tipo === 'sus' && <SusChart question={question} values={values} meta={meta} />}
              {/* ── CSAT ── */}
              {tipo === 'csat' && <CsatChart values={values} meta={meta} />}
              {/* ── Multiple Choice ─ */}
              {tipo === 'multiple-choice' && <MultipleChoiceChart question={question} values={values} meta={meta} />}
              {/* ── Score Matrix ── */}
              {tipo === 'score-matrix' && <ScoreMatrixChart question={question} values={values} meta={meta} />}
              {/* ── Ranking ── */}
              {tipo === 'ranking' && <RankingChart question={question} values={values} meta={meta} />}
              {/* ── NPS ── */}
              {tipo === 'nps' && <NpsChart values={values} />}
              {/* ── Text / Pregunta abierta ── */}
              {tipo === 'text' && <TextAnswers values={values} question={question} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Section Summary Component */
function SectionSummary({ sectionQuestions, respuestasData }: { sectionQuestions: any[]; respuestasData: any[] }) {
  // Calculate CSAT average
  const csatQuestions = sectionQuestions.filter(q => q.tipo === 'csat');
  const csatValues = csatQuestions.flatMap(q => getAnswersForQuestion(q.pregunta_id, respuestasData));
  const csatAvg = numericAvg(csatValues);

  // Calculate SUS average
  const susQuestions = sectionQuestions.filter(q => q.tipo === 'sus');
  const susValues = susQuestions.flatMap(q => getAnswersForQuestion(q.pregunta_id, respuestasData));
  const susAvg = numericAvg(susValues);
  const susMax = susQuestions[0]?.escala_sus || 5;

  // Calculate NPS score
  const npsQuestions = sectionQuestions.filter(q => q.tipo === 'nps');
  const npsValues = npsQuestions.flatMap(q => getAnswersForQuestion(q.pregunta_id, respuestasData));
  let npsScore: number | null = null;
  if (npsValues.length > 0) {
    const promoters = npsValues.filter(v => v >= 9).length;
    const detractors = npsValues.filter(v => v <= 6).length;
    const total = npsValues.length;
    npsScore = Math.round(((promoters / total) * 100) - ((detractors / total) * 100));
  }

  // Collect all text responses for word cloud
  const textQuestions = sectionQuestions.filter(q => q.tipo === 'text' && !q.solo_email);
  const textValues = textQuestions.flatMap(q =>
    getAnswersForQuestion(q.pregunta_id, respuestasData)
      .filter(v => typeof v === 'string' && v.trim().length > 0)
  );
  const frequencyTags = extractFrequencyTags(textValues);

  // Don't show summary if nothing to show
  if (!csatAvg && !susAvg && npsScore === null && frequencyTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-[12px] border border-gray-200 p-6 mt-4">
      <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Resumen de Sección</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CSAT Average */}
        {csatAvg !== null && (
          <div className="flex flex-col items-center justify-center bg-white rounded-[8px] p-4 border border-gray-200">
            <ScoreGauge value={csatAvg} max={5} color="#00C4B3" />
            <span className="text-[12px] text-gray-500 mt-2">Promedio CSAT</span>
          </div>
        )}

        {/* SUS Average */}
        {susAvg !== null && (
          <div className="flex flex-col items-center justify-center bg-white rounded-[8px] p-4 border border-gray-200">
            <ScoreGauge value={susAvg} max={susMax} color="#8C59FE" />
            <span className="text-[12px] text-gray-500 mt-2">Promedio SUS</span>
          </div>
        )}

        {/* NPS Score */}
        {npsScore !== null && (
          <div className="flex flex-col items-center justify-center bg-white rounded-[8px] p-4 border border-gray-200">
            <NPSGauge score={npsScore} />
            <span className="text-[12px] text-gray-500 mt-2">Net Promoter Score</span>
          </div>
        )}

        {/* Word Cloud */}
        {frequencyTags.length > 0 && (
          <div className="bg-white rounded-[8px] p-4 border border-gray-200 col-span-full">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-700">Palabras clave (preguntas abiertas)</span>
            </div>
            <WordCloud tags={frequencyTags} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Section Container Component */
function SectionContainer({ section, questions, respuestasData, startIndex }: {
  section: any;
  questions: any[];
  respuestasData: any[];
  startIndex: number;
}) {
  return (
    <div className="border border-gray-200 rounded-[12px] p-6 bg-gray-50/30">
      {/* Section Title */}
      <h2 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-gray-400">#</span>
        {section.title}
      </h2>

      {/* Section Questions */}
      <div className="space-y-4">
        {questions.map((q: any, localIndex: number) => (
          <QuestionCard
            key={q.pregunta_id}
            question={q}
            index={startIndex + localIndex}
            respuestasData={respuestasData}
          />
        ))}
      </div>

      {/* Section Summary */}
      <SectionSummary sectionQuestions={questions} respuestasData={respuestasData} />
    </div>
  );
}

function LikertChart({ question, values, meta }: { question: any; values: any[]; meta: any }) {
  const opciones: string[] = question.opciones?.length > 0
    ? question.opciones
    : ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'];
  const total = values.length;
  const counts = opciones.map((_, i) => values.filter(v => Number(v) === i + 1).length);
  const avg = numericAvg(values);

  // Create reversed array for display (highest value first)
  const reversedOpciones = [...opciones].reverse();
  const reversedCounts = [...counts].reverse();

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-3">
        {reversedOpciones.map((label, i) => (
          <BarRow key={i} label={label} count={reversedCounts[i]} total={total} color={meta.bar} />
        ))}
      </div>
      {avg !== null && (
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <ScoreGauge value={avg} max={opciones.length} color={meta.bar} />
          <span className="text-[11px] text-gray-400 text-center">Promedio</span>
        </div>
      )}
    </div>
  );
}

function SusChart({ question, values, meta }: { question: any; values: any[]; meta: any }) {
  const scale = question.escala_sus || 5;
  const scaleValues = Array.from({ length: scale }, (_, i) => i + 1);
  const total = values.length;
  const counts = scaleValues.map(v => values.filter(r => Number(r) === v).length);
  const avg = numericAvg(values);

  // Labels dinámicos
  const leftLabel = question.label_izquierda || 'Totalmente en desacuerdo';
  const rightLabel = question.label_derecha || 'Totalmente de acuerdo';

  // Generar labels intermedios
  const getLabel = (value: number, scale: number) => {
    if (value === 1) return leftLabel;
    if (value === scale) return rightLabel;
    
    // Para escalas de 3: solo extremos
    if (scale === 3) return 'Neutral';
    
    // Para escalas de 5 o 10: interpolación
    const midPoint = Math.ceil(scale / 2);
    if (value === midPoint) return 'Neutral';
    if (value < midPoint) {
      return value === 2 ? 'En desacuerdo' : `${value}`;
    } else {
      return value === scale - 1 ? 'De acuerdo' : `${value}`;
    }
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-3">
        {scaleValues.map((v) => (
          <BarRow 
            key={v} 
            label={`${v} — ${getLabel(v, scale)}`}
            count={counts[v - 1]} 
            total={total} 
            color={meta.bar} 
          />
        ))}
      </div>
      {avg !== null && (
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <ScoreGauge value={avg} max={scale} color={meta.bar} />
          <span className="text-[11px] text-gray-400 text-center">Promedio</span>
        </div>
      )}
    </div>
  );
}

function NpsChart({ values }: { values: any[] }) {
  const total = values.length;
  const nums = values.map(v => Number(v));
  const promoters  = nums.filter(v => v >= 9).length;
  const passives   = nums.filter(v => v === 7 || v === 8).length;
  const detractors = nums.filter(v => v <= 6).length;
  const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

  const promoterPct  = total > 0 ? (promoters  / total) * 100 : 0;
  const passivePct   = total > 0 ? (passives   / total) * 100 : 0;
  const detractorPct = total > 0 ? (detractors / total) * 100 : 0;

  // SVG donut: radius 54, strokeWidth 12 → circumference ≈ 339.3
  const r = 54;
  const sw = 13;
  const circ = 2 * Math.PI * r;
  const gap = 2; // px gap between segments

  // Dash lengths for each segment (clockwise: promoters → passives → detractors)
  const promoterDash  = (promoterPct  / 100) * circ - gap;
  const passiveDash   = (passivePct   / 100) * circ - gap;
  const detractorDash = (detractorPct / 100) * circ - gap;

  // Offsets: start at -90° (top), each segment offset = sum of previous
  const promoterOffset  = 0;
  const passiveOffset   = -(promoterPct  / 100) * circ;
  const detractorOffset = -(promoterPct + passivePct) / 100 * circ;

  const scoreColor = score >= 50 ? '#20C997' : score >= 0 ? '#FBBF24' : '#F87171';

  const legendItems = [
    { label: 'Promotores',  color: '#20C997', count: promoters,  pct: promoterPct  },
    { label: 'Pasivos',     color: '#FBBF24', count: passives,   pct: passivePct   },
    { label: 'Detractores', color: '#F87171', count: detractors, pct: detractorPct },
  ];

  return (
    <div className="flex items-center gap-8">
      {/* Donut chart */}
      <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
        <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
          {/* Track */}
          <circle cx="74" cy="74" r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          {/* Promoters — teal */}
          {promoterDash > 0 && (
            <circle cx="74" cy="74" r={r} fill="none"
              stroke="#20C997" strokeWidth={sw} strokeLinecap="butt"
              strokeDasharray={`${promoterDash} ${circ}`}
              strokeDashoffset={promoterOffset}
            />
          )}
          {/* Passives — yellow */}
          {passiveDash > 0 && (
            <circle cx="74" cy="74" r={r} fill="none"
              stroke="#FBBF24" strokeWidth={sw} strokeLinecap="butt"
              strokeDasharray={`${passiveDash} ${circ}`}
              strokeDashoffset={passiveOffset}
            />
          )}
          {/* Detractors — red */}
          {detractorDash > 0 && (
            <circle cx="74" cy="74" r={r} fill="none"
              stroke="#F87171" strokeWidth={sw} strokeLinecap="butt"
              strokeDasharray={`${detractorDash} ${circ}`}
              strokeDashoffset={detractorOffset}
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold leading-none" style={{ color: scoreColor }}>{score}</span>
          <span className="text-[11px] text-gray-400 font-medium mt-0.5">NPS</span>
        </div>
      </div>

      {/* Right side: legend + count */}
      <div className="flex flex-col-2 gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-gray-400">Total respuestas</span>
          <span className="text-[22px] font-bold text-gray-800">{total}</span>
        </div>
        <div className="space-y-2.5">
          {legendItems.map(({ label, color, count, pct }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[13px] text-gray-600 flex-1">{label}</span>
              <span className="text-[12px] font-semibold text-gray-800">{count}</span>
              <span className="text-[11px] text-gray-400 w-9 text-right">{Math.round(pct)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CsatChart({ values, meta }: { values: any[]; meta: any }) {
  const total = values.length;
  const counts = [1, 2, 3, 4, 5].map(v => values.filter(r => Number(r) === v).length);
  const avg = numericAvg(values);
  const satisfiedCount = values.filter(v => Number(v) >= 4).length;
  const satisfiedPct = total > 0 ? Math.round((satisfiedCount / total) * 100) : 0;

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-3">
        {CSAT_EMOJIS.map((emoji, i) => (
          <BarRow key={i} label={CSAT_LABELS[i]} count={counts[i]} total={total} color={meta.bar} emoji={emoji} />
        ))}
      </div>
      <div className="flex flex-col items-center justify-center gap-4 shrink-0">
        {avg !== null && (
          <>
            <ScoreGauge value={avg} max={5} color={meta.bar} />
            <div className="text-center">
              <p className="text-[20px] font-bold text-gray-900">{satisfiedPct}%</p>
              <p className="text-[11px] text-gray-400">satisfechos</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MultipleChoiceChart({ question, values, meta }: { question: any; values: any[]; meta: any }) {
  const opciones: string[] = question.opciones?.length > 0 ? question.opciones : [];
  const total = values.length;

  // Values can be 0-based index (number) or the string label itself
  const counts = opciones.map((label, i) =>
    values.filter(v => Number(v) === i || v === label).length
  );

  return (
    <div className="space-y-3">
      {opciones.map((label, i) => (
        <BarRow key={i} label={label} count={counts[i]} total={total} color={meta.bar} />
      ))}
      {opciones.length === 0 && (
        <p className="text-[13px] text-gray-400 text-center py-4">Sin opciones definidas</p>
      )}
    </div>
  );
}

function ScoreMatrixChart({ question, values, meta }: { question: any; values: any[]; meta: any }) {
  const rows = question.matrix_rows || [];
  const columns = question.matrix_columns || [];
  const useStars = question.use_stars ?? true;
  const total = values.length;

  // Color based on star mode
  const barColor = useStars ? '#FDC700' : '#155DFC';
  const gaugeColor = useStars ? '#FDC700' : '#155DFC';

  if (rows.length === 0) {
    return <p className="text-[13px] text-gray-400 text-center py-4">Sin filas definidas</p>;
  }

  // Parse all matrix answers
  const parsedValues = values.map(v => {
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch (e) {
      return {};
    }
  });

  return (
    <div className="space-y-6">
      {rows.map((rowLabel, rowIdx) => {
        // Count responses for each column for this row
        const counts = columns.map((_, colIdx) =>
          parsedValues.filter(matrix => matrix[rowIdx] === colIdx).length
        );

        // Calculate average for this row
        const rowValues = parsedValues
          .map(matrix => matrix[rowIdx])
          .filter(v => v !== undefined);
        const avg = rowValues.length > 0
          ? rowValues.reduce((sum, v) => sum + v, 0) / rowValues.length
          : null;

        return (
          <div key={rowIdx} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex gap-8 items-start">
              {/* Left side: Bars */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[14px] font-semibold text-gray-700">{rowLabel}</h4>
                  {avg !== null && useStars && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {columns.map((colLabel, colIdx) => (
                    <BarRow
                      key={colIdx}
                      label={colLabel}
                      count={counts[colIdx]}
                      total={total}
                      color={barColor}
                    />
                  ))}
                </div>
              </div>

              {/* Right side: Gauge */}
              {avg !== null && (
                <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                  <ScoreGauge value={avg + 1} max={columns.length} color={gaugeColor} />
                  <span className="text-[11px] text-gray-400 text-center">Promedio</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingChart({ question, values, meta }: { question: any; values: any[]; meta: any }) {
  const options = question.opciones || [];
  const total = values.length;

  if (options.length === 0) {
    return <p className="text-[13px] text-gray-400 text-center py-4">Sin opciones definidas</p>;
  }

  // Parse all ranking answers
  const parsedValues = values.map(v => {
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch (e) {
      return [];
    }
  }).filter(arr => Array.isArray(arr));

  // Calculate average position for each option (lower is better)
  const optionScores = options.map(option => {
    let totalPosition = 0;
    let count = 0;

    parsedValues.forEach(ranking => {
      const position = ranking.indexOf(option);
      if (position !== -1) {
        totalPosition += position;
        count++;
      }
    });

    const avgPosition = count > 0 ? totalPosition / count : options.length - 1;
    // Calculate score: higher score = better ranking
    const score = options.length - avgPosition;

    return {
      option,
      avgPosition,
      score,
      count,
    };
  });

  // Sort by average position (ascending = best rank first)
  const sortedOptions = [...optionScores].sort((a, b) => a.avgPosition - b.avgPosition);

  return (
    <div className="space-y-3">
      {sortedOptions.map((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

        return (
          <div key={item.option} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 w-12 shrink-0">
              {medal && <span className="text-2xl">{medal}</span>}
              {!medal && (
                <span className="text-[16px] font-bold text-gray-400 w-full text-center">
                  {idx + 1}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-gray-900">{item.option}</p>
              <p className="text-[11px] text-gray-500">
                Posición promedio: {(item.avgPosition + 1).toFixed(1)} • Puntuación: {item.score.toFixed(1)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-semibold text-gray-700">{item.count}</p>
              <p className="text-[11px] text-gray-400">{percentage}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Word Cloud Component ──────────────────────────────────────────────────────

interface WordCloudItem {
  text: string;
  count: number;
  size: number; // 0-1 normalized
  color: string;
  x: number;
  y: number;
  fontSize: number;
}

function WordCloud({ tags }: { tags: FrequencyTag[] }) {
  const colors = ['#8C59FE', '#597AFF', '#ACE738', '#00C4B3']; // UIX colors

  // Sort by size descending to place largest words first
  const sortedTags = [...tags].sort((a, b) => b.size - a.size);

  // Generate word cloud items with positions
  const cloudItems: WordCloudItem[] = sortedTags.map((tag, i) => {
    // Font size: 16px to 56px based on frequency
    const fontSize = Math.round(16 + tag.size * 40);

    // Assign color rotating through UIX palette
    const color = colors[i % colors.length];

    // Improved spiral layout algorithm for better distribution
    const angle = i * 137.5; // Golden angle in degrees
    const radius = Math.sqrt(i + 1) * 25;
    const x = 50 + (radius * Math.cos(angle * Math.PI / 180)) * 0.8; // Slightly compress horizontally
    const y = 50 + (radius * Math.sin(angle * Math.PI / 180)) * 1.1; // Slightly expand vertically

    return {
      text: tag.text,
      count: tag.count,
      size: tag.size,
      color,
      x: Math.max(5, Math.min(95, x)), // Clamp to viewBox bounds
      y: Math.max(10, Math.min(90, y)),
      fontSize,
    };
  });

  return (
    <div className="relative w-full h-[450px] bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/50 rounded-lg border border-purple-100 overflow-hidden shadow-sm">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="word-glow">
            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {cloudItems.map((item, i) => (
          <g key={i} className="cursor-default hover:opacity-90 transition-opacity duration-300">
            <text
              x={item.x}
              y={item.y}
              fontSize={item.fontSize / 10} // Scale for SVG viewBox
              fontWeight={item.size > 0.6 ? 700 : item.size > 0.3 ? 600 : 500}
              fill={item.color}
              textAnchor="middle"
              dominantBaseline="middle"
              className="select-none"
              filter="url(#word-glow)"
              style={{
                opacity: 0.95,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {item.text}
            </text>
            {/* Badge with count */}
            <g transform={`translate(${item.x + item.text.length * (item.fontSize / 30)}, ${item.y - item.fontSize / 15})`}>
              <circle
                r={item.fontSize / 16}
                fill="white"
                stroke={item.color}
                strokeWidth="0.4"
                className="opacity-95 drop-shadow-sm"
              />
              <text
                fontSize={item.fontSize / 18}
                fontWeight="800"
                fill={item.color}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none"
              >
                {item.count}
              </text>
            </g>
          </g>
        ))}
      </svg>

      {/* Legend in corner */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-200/50 shadow-sm">
        <p className="text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
          <Cloud className="w-3 h-3 text-purple-500" />
          Tamaño = frecuencia de aparición
        </p>
      </div>

      {/* Count badge in top-left */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-indigo-200/50 shadow-sm">
        <p className="text-[10px] text-gray-600 font-semibold">
          {cloudItems.length} {cloudItems.length === 1 ? 'palabra' : 'palabras'}
        </p>
      </div>
    </div>
  );
}

function TextAnswers({ values, question }: { values: any[]; question: any }) {
  const [showAll, setShowAll] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);
  const isEmail = question.solo_email;
  const textValues = values.map(String).filter(v => v.trim());
  const visible = showAll ? textValues : textValues.slice(0, 5);

  // ── Análisis de frecuencia de palabras y frases ──
  const frequencyTags = !isEmail ? extractFrequencyTags(textValues) : [];

  return (
    <div className="space-y-2">
      {/* ── Tags de palabras/frases frecuentes (solo si NO es email) ── */}
      {!isEmail && frequencyTags.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[13px] text-indigo-700 font-semibold">Palabras y frases más frecuentes</span>
            <span className="text-[11px] text-indigo-500">—  mínimo 30% de repetición</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {frequencyTags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                style={{
                  fontSize: `${Math.max(11, Math.min(16, 11 + tag.size * 5))}px`,
                  fontWeight: tag.size > 0.6 ? 600 : tag.size > 0.3 ? 500 : 400,
                }}
              >
                <span className="text-indigo-900">{tag.text}</span>
                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                  {tag.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Switch: Respuestas vs Word Cloud (solo si NO es email y hay tags) ── */}
      {!isEmail && frequencyTags.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mb-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-[13px] font-medium text-gray-700">
              {showWordCloud ? 'Nube de palabras' : 'Respuestas completas'}
            </span>
          </div>
          <button
            onClick={() => setShowWordCloud(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-[12px] font-medium text-gray-700"
          >
            {showWordCloud ? (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                Ver respuestas
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                Ver nube de palabras
              </>
            )}
          </button>
        </div>
      )}

      {isEmail && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 16 16">
            <path d="M2.667 2.667h10.666c.737 0 1.334.597 1.334 1.333v8c0 .736-.597 1.333-1.334 1.333H2.667A1.333 1.333 0 0 1 1.333 12V4c0-.736.597-1.333 1.334-1.333Z" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"/>
            <path d="m14.667 4-6.667 4.667L1.333 4" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"/>
          </svg>
          <span className="text-[12px] text-blue-700 font-medium">Respuestas de tipo email</span>
        </div>
      )}
      {/* ── Conditional view: Word Cloud OR Responses ── */}
      {!isEmail && showWordCloud && frequencyTags.length > 0 ? (
        <WordCloud tags={frequencyTags} />
      ) : (
        <>
          {visible.map((text, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 bg-[#f9fafb] rounded-[8px] border border-[#f3f4f6]">
              <span className="text-[11px] text-gray-400 font-mono shrink-0 mt-0.5">#{i + 1}</span>
              <p className="text-[13px] text-gray-700 leading-relaxed break-words flex-1">{text}</p>
            </div>
          ))}
          {textValues.length > 5 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="w-full py-2 text-[12px] text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
            >
              {showAll ? <><ChevronUp className="w-3.5 h-3.5" /> Ver menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver {textValues.length - 5} más</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [encuesta, setEncuesta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [respuestasData, setRespuestasData] = useState<any[]>([]);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showIndividualResponses, setShowIndividualResponses] = useState(false);

  useEffect(() => {
    if (id) { loadEncuesta(); loadRespuestas(); }
  }, [id]);

  const loadEncuesta = async () => {
    if (!id) return;
    setIsLoading(true);
    const { data, error } = await api.getEncuestaById(id);
    if (error) console.error('Error loading encuesta:', error);
    else if (data) { setEncuesta(data); setIsLive(data.estado); }
    setIsLoading(false);
  };

  const loadRespuestas = async () => {
    if (!id) return;
    const { data, error } = await api.getRespuestasByEncuesta(id);
    if (error) console.error('Error loading respuestas:', error);
    else if (data) { setRespuestasData(data); setResponses(data.length); }
  };

  const handleToggleStatus = async () => {
    if (!id || !encuesta) return;
    setIsTogglingStatus(true);
    const newEstado = !isLive;
    const { error } = await api.updateEncuesta(id, { estado: newEstado });
    if (error) { console.error('❌ Error actualizando estado:', error); alert('Error al actualizar el estado de la encuesta'); }
    else { setIsLive(newEstado); setEncuesta({ ...encuesta, estado: newEstado }); }
    setIsTogglingStatus(false);
  };

  const handleDeleteData = async () => {
    if (!id) return;
    const confirmDelete = window.confirm(
      `🗑️ BORRAR TODAS LAS RESPUESTAS\n\nEsta acción eliminará permanentemente ${responses} respuesta(s) de la base de datos de Supabase.\n\n⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER\n\n¿Estás seguro de que deseas continuar?`
    );
    if (!confirmDelete) return;
    setIsDeletingData(true);
    const { data, error } = await api.deleteRespuestasByEncuesta(id);
    if (error) { alert(`❌ Error al borrar las respuestas:\n${error}`); setIsDeletingData(false); return; }
    const deletedCount = data?.deleted || 0;
    alert(`✅ DATOS BORRADOS EXITOSAMENTE\n\nSe eliminaron ${deletedCount} respuesta(s) de la base de datos.`);
    setResponses(0); setRespuestasData([]);
    await loadEncuesta(); await loadRespuestas();
    setIsDeletingData(false);
  };

  const getDaysSinceCreation = () => {
    if (!encuesta?.created_at) return 0;
    const diff = Math.abs(new Date().getTime() - new Date(encuesta.created_at).getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const FIGMA_BASE = 'https://uix-encuestas.figma.site';
  const surveyLink  = `${FIGMA_BASE}/${id}`;
  const previewLink = `${FIGMA_BASE}/preview/${id}`;

  const copyToClipboard = (link: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = link; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { alert('Copia manualmente: ' + link); }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Por favor completa nuestra encuesta');
    const body = encodeURIComponent(`Hola,\n\nNos encantaría conocer tu opinión. Por favor toma un momento para completar nuestra encuesta:\n\n${surveyLink}\n\n¡Gracias!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ── CSV Download ─────────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    const qs: any[] = encuesta?.preguntas || [];
    const escapeCell = (val: string) => '"' + val.replace(/"/g, '""') + '"';

    const headerRow = [
      'ID Respuesta',
      'Fecha',
      ...qs.map((q: any) => escapeCell(String(q.titulo_pregunta || q.pregunta_id))),
    ].join(',');

    const dataRows = respuestasData.map((r: any) => {
      const answers: any[] = r.respuestas?.answers || [];
      const fecha = r.created_at
        ? new Date(r.created_at).toLocaleString('es-MX')
        : '';
      const cells = qs.map((q: any) => {
        const a = answers.find((ans: any) => ans.questionID === q.pregunta_id);
        return escapeCell(a ? String(a.value ?? '') : '');
      });
      return [escapeCell(r.id), escapeCell(fecha), ...cells].join(',');
    });

    const csv = [headerRow, ...dataRows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = (encuesta?.nombre_encuesta || 'encuesta').replace(/\s+/g, '_');
    link.href = url;
    link.download = filename + '_resultados.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Derived: completion rate per question
  const preguntas: any[] = encuesta?.preguntas || [];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="sticky top-0 z-[9999] bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-[12px] text-[#99a1af]">Analytics & Resultados</h1>
            {encuesta && <p className="mt-0.5 text-[#101828] font-bold text-[30px]">{encuesta.nombre_encuesta}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* ── Descargar CSV ── */}
            <button
              disabled={responses === 0}
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title={responses === 0 ? 'No hay respuestas para descargar' : `Descargar ${responses} respuesta(s) en CSV`}
            >
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 16 16">
                <path d="M8 1v9m0 0L5 7m3 3 3-3M2 11v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Descargar CSV
              {responses > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded">
                  {responses}
                </span>
              )}
            </button>

            <button
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isLive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <Power className="w-4 h-4" />
              {isTogglingStatus ? 'Actualizando...' : isLive ? 'Encuesta Activa' : 'Encuesta Pausada'}
            </button>
            <button
              onClick={() => navigate(`/builder/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium text-sm"
              title="Editar encuesta"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={handleDeleteData}
              disabled={isDeletingData || responses === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeletingData ? 'Borrando...' : `Borrar Datos (${responses})`}
            </button>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-8">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Respuestas', value: responses, sub: 'guardadas en BD', icon: Users, color: 'text-blue-600' },
            { label: 'Preguntas', value: preguntas.length, sub: 'en esta encuesta', icon: BarChart2, color: 'text-purple-600' },
            { label: 'Estado', value: isLive ? 'Live' : 'Draft', sub: isLive ? 'aceptando respuestas' : 'pausada', icon: Power, color: isLive ? 'text-green-600' : 'text-gray-500' },
            { label: 'Activa desde', value: getDaysSinceCreation(), sub: 'días', icon: Calendar, color: 'text-orange-600' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-[12px] border border-[#e5e7eb] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] text-gray-500 font-medium">{kpi.label}</p>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-[28px] font-bold text-gray-900 leading-none">{kpi.value}</p>
              <p className="text-[11px] text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Deployment & Links ── */}
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Deployment & Links</h2>
          <div className="bg-white rounded-[12px] border border-[#e5e7eb] px-[25px] py-[24px]">
            {/* Status row */}
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-gray-300' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{isLive ? 'Survey is Live' : 'Survey is Offline'}</p>
                  <p className="text-[11px] text-gray-400">{isLive ? 'Publicada y aceptando respuestas' : 'Pausada - no acepta respuestas'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-[10px] items-start">
              {/* Links section */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Live link */}
                <div className="bg-gradient-to-r from-[#eff6ff] to-[#eef2ff] rounded-[10px] border border-[#bedbff] px-4 py-2">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#00c950]" />
                    <span className="text-[11px] font-semibold text-[#364153] uppercase tracking-[0.34px]">Encuesta en vivo</span>
                  </div>
                  <p className="text-[11px] text-[#155dfc] font-mono break-all mb-2.5 leading-[16.5px]">{surveyLink}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => copyToClipboard(surveyLink)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155dfc] text-white rounded-[10px] text-[12px] font-medium hover:bg-blue-700 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar link'}
                    </button>
                    <a href={surveyLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d1d5dc] text-[#364153] rounded-[10px] text-[12px] font-medium hover:bg-gray-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </a>
                  </div>
                </div>

                {/* Preview link */}
                <div className="bg-[#fefce8] rounded-[10px] border border-[#fff085] px-4 py-2">
                  <div className="flex items-center gap-1 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#fdc700]" />
                    <span className="text-[11px] font-semibold text-[#364153] uppercase tracking-[0.34px]">Preview</span>
                    <span className="text-[10px] text-[#99a1af] tracking-[0.12px]">No guarda en BD</span>
                  </div>
                  <p className="text-[11px] text-[#a65f00] font-mono break-all mb-2.5 leading-[16.5px]">{previewLink}</p>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(previewLink)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#f0b100] text-white rounded-[10px] text-[12px] font-medium hover:bg-yellow-600 transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Copiar link
                    </button>
                    <a href={previewLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#fff085] text-[#894b00] rounded-[10px] text-[12px] font-medium hover:bg-yellow-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </a>
                  </div>
                </div>
              </div>

              {/* QR section - only show if published */}
              {isLive && (
                <div className="w-[364px] shrink-0">
                  <div className="bg-[#f8f9fb] rounded-[10px] border border-[#d1d5dc] px-4 py-2 relative min-h-[240px]">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-2 justify-end">
                        <p className="text-[11px] font-semibold text-[#364153] uppercase tracking-[0.34px] w-[113px]">QR – encuesta en vivo</p>
                        <span className="w-2 h-2 rounded-full bg-[#00c950] mt-[5px]" />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(surveyLink)}`;
                            const response = await fetch(qrUrl);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `qr-encuesta-${id}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Error downloading QR:', error);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#155dfc] text-white rounded-[10px] text-[12px] font-medium hover:bg-blue-700 transition-colors w-fit">
                        <Copy className="w-3.5 h-3.5" /> Descargar QR
                      </button>
                    </div>
                    {/* QR code image positioned absolutely on the right */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[185px] h-[185px] rounded-[20px] overflow-hidden">
                      <img
                        src={surveyLink ? `https://api.qrserver.com/v1/create-qr-code/?size=185x185&data=${encodeURIComponent(surveyLink)}` : ''}
                        alt="QR Code"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Resultados por pregunta ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Resultados por Pregunta</h2>
            <span className="text-[12px] text-gray-400 bg-white border border-[#e5e7eb] rounded-full px-3 py-1">
              {responses} respuesta{responses !== 1 ? 's' : ''} · {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-gray-400">Cargando datos...</p>
              </div>
            </div>
          ) : preguntas.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-[#e5e7eb] p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-[14px] text-gray-500 font-medium">Esta encuesta no tiene preguntas</p>
              <p className="text-[12px] text-gray-400 mt-1">Agrega preguntas desde el constructor de encuestas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const sections = encuesta?.sections || [];
                const rendered: JSX.Element[] = [];
                const processedSections = new Set<string>();
                let questionIndex = 0;

                // First render all sections
                sections.forEach((section: any) => {
                  const sectionQuestions = preguntas.filter((q: any) => q.section_id === section.id);
                  if (sectionQuestions.length > 0) {
                    processedSections.add(section.id);
                    rendered.push(
                      <SectionContainer
                        key={section.id}
                        section={section}
                        questions={sectionQuestions}
                        respuestasData={respuestasData}
                        startIndex={questionIndex}
                      />
                    );
                    questionIndex += sectionQuestions.length;
                  }
                });

                // Then render standalone questions (not in any section)
                const standaloneQuestions = preguntas.filter((q: any) => !q.section_id);
                standaloneQuestions.forEach((q: any) => {
                  rendered.push(
                    <QuestionCard
                      key={q.pregunta_id}
                      question={q}
                      index={questionIndex}
                      respuestasData={respuestasData}
                    />
                  );
                  questionIndex++;
                });

                return rendered;
              })()}
            </div>
          )}
        </div>

        {/* ── Tabla de respuestas individuales ── */}
        {respuestasData.length > 0 && (
          <div>
            <button
              onClick={() => setShowIndividualResponses(!showIndividualResponses)}
              className="flex items-center justify-between w-full mb-4 text-left"
            >
              <h2 className="text-[15px] font-semibold text-gray-900">Respuestas Individuales</h2>
              {showIndividualResponses ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showIndividualResponses && (
              <div className="bg-white rounded-[12px] border border-[#e5e7eb] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">ID Respuesta</th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Respuestas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {respuestasData.map((r, idx) => {
                        const answers = r.respuestas?.answers || [];
                        const date = new Date(r.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        return (
                          <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                            <td className="px-5 py-3 text-[12px] text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-5 py-3 text-[11px] text-gray-400 font-mono truncate max-w-[140px]">
                              {(r.respuestas?.responseID || r.id || '').slice(0, 20)}…
                            </td>
                            <td className="px-5 py-3 text-[12px] text-gray-500 whitespace-nowrap">{date}</td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {preguntas.map((q: any) => {
                                  const ans = answers.find((a: any) => a.questionID === q.pregunta_id);
                                  if (!ans) return null;
                                  const meta = TYPE_META[q.tipo] || TYPE_META.text;
                                  // Display value
                                  let displayVal = String(ans.value);
                                  if (q.tipo === 'csat') {
                                    const idx2 = Number(ans.value) - 1;
                                    displayVal = `${CSAT_EMOJIS[idx2] ?? ''} ${ans.value}`;
                                  } else if ((q.tipo === 'likert' || q.tipo === 'multiple-choice') && q.opciones?.length > 0) {
                                    const oIdx = q.tipo === 'likert' ? Number(ans.value) - 1 : Number(ans.value);
                                    displayVal = q.opciones[oIdx] ?? String(ans.value);
                                  } else if (q.tipo === 'score-matrix') {
                                    try {
                                      const matrix = typeof ans.value === 'string' ? JSON.parse(ans.value) : ans.value;
                                      const responses = Object.entries(matrix).map(([rowIdx, colIdx]) => {
                                        const row = q.matrix_rows?.[Number(rowIdx)] || `Row ${Number(rowIdx) + 1}`;
                                        const col = q.matrix_columns?.[Number(colIdx)] || `${Number(colIdx) + 1}`;
                                        return `${row}: ${col}`;
                                      });
                                      displayVal = responses.join(', ');
                                    } catch (e) {
                                      displayVal = 'Invalid matrix';
                                    }
                                  } else if (q.tipo === 'ranking') {
                                    try {
                                      const ranking = typeof ans.value === 'string' ? JSON.parse(ans.value) : ans.value;
                                      displayVal = Array.isArray(ranking) ? ranking.join(' > ') : String(ans.value);
                                    } catch (e) {
                                      displayVal = String(ans.value);
                                    }
                                  }
                                  return (
                                    <span key={q.pregunta_id}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${meta.badge}`}
                                      title={q.titulo_pregunta}
                                    >
                                      Q{preguntas.indexOf(q) + 1}: {displayVal.length > 20 ? displayVal.slice(0, 20) + '…' : displayVal}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}