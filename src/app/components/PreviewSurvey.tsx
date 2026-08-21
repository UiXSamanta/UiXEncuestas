import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Loader2, Eye, Star, GripVertical, Mic, MicOff } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import * as api from '../lib/api';
import {
  hasSurveyLogic,
  normalizeEncuestaConfig,
  popNavStack,
  pruneAnswersToStack,
  pushNavStack,
} from '../lib/surveyNavigation';
import { SurveyLoader } from './SurveyLoader';
import { SurveyThankYou } from './SurveyThankYou';
import { SurveyFooter } from './SurveyFooter';

interface ResponseDocument {
  responseID: string;
  surveyID: string;
  timestamp: string;
  answers: Array<{
    questionID: string;
    value: number | string;
  }>;
}

interface ConditionalLogic {
  option_index: number;
  jump_to_question_id: string;
}

type NPSGroup = 'detractor' | 'passive' | 'promoter';
interface NPSGroupLogic {
  group: NPSGroup;
  jump_to_question_id: string;
}

type TextCondition = 'answered' | 'skipped';
interface TextConditionalLogic {
  condition: TextCondition;
  jump_to_question_id: string;
}

interface Question {
  id: string;
  type: 'likert' | 'csat' | 'text' | 'sus' | 'nps' | 'multiple-choice' | 'separator' | 'score-matrix' | 'ranking';
  title: string;
  subtitle?: string;
  section_id?: string;
  opciones?: string[];
  solo_email?: boolean;
  opcional?: boolean;
  respuesta_unica?: boolean;
  usar_dropdown?: boolean;
  usar_slider?: boolean; // For NPS - true = slider, false = number buttons
  label_izquierda?: string;
  label_derecha?: string;
  escala_sus?: 3 | 5 | 10;
  matrix_rows?: string[];
  matrix_columns?: string[];
  use_stars?: boolean;
  ranking_instruction?: string;
  conditional_logic?: ConditionalLogic[];
  nps_group_logic?: NPSGroupLogic[];
  text_logic?: TextConditionalLogic[];
}

interface SectionMetadata {
  id: string;
  title: string;
  section_logic?: {
    enabled?: boolean;
    jump_to_section_id?: string;
  };
}

// Normalize question from builder schema → viewer schema
function normalizeQuestion(q: any): Question {
  const rawType = String(q.type ?? q.tipo ?? 'text').toLowerCase();
  return {
    id: q.id ?? q.pregunta_id ?? `q_${Math.random()}`,
    type: (rawType === 'separator' ? 'separator' : rawType) as Question['type'],
    title: q.title ?? q.titulo_pregunta ?? 'Pregunta sin título',
    subtitle: q.subtitle ?? q.subtitulo_pregunta,
    opciones: q.opciones ?? [],
    solo_email: q.solo_email ?? false,
    opcional: q.opcional ?? false,
    respuesta_unica: q.respuesta_unica ?? true,
    usar_dropdown: q.usar_dropdown ?? false,
    usar_slider: q.usar_slider ?? true, // Default to slider for NPS
    label_izquierda: q.label_izquierda,
    label_derecha: q.label_derecha,
    escala_sus: q.escala_sus ?? 5,
    matrix_rows: q.matrix_rows,
    matrix_columns: q.matrix_columns,
    use_stars: q.use_stars ?? true,
    ranking_instruction: q.ranking_instruction,
    section_id: q.section_id,
    conditional_logic: q.conditional_logic,
    nps_group_logic: q.nps_group_logic,
    text_logic: q.text_logic,
  };
}

// Helper to generate a light version of a color for backgrounds
function getLightColor(hexColor?: string): string {
  if (!hexColor) return 'rgb(254, 243, 199)'; // Default yellow-50 fallback
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Create a very light version (mix with white ~90%)
  const lightR = Math.round(r + (255 - r) * 0.9);
  const lightG = Math.round(g + (255 - g) * 0.9);
  const lightB = Math.round(b + (255 - b) * 0.9);
  
  return `rgb(${lightR}, ${lightG}, ${lightB})`;
}

// Helper to detect if options are Yes/No type questions
function isYesNoQuestion(opciones?: string[]): boolean {
  if (!opciones || opciones.length !== 2) return false;
  
  const normalized = opciones.map(opt => opt.toLowerCase().trim());
  
  // Check for various Yes/No combinations
  const yesNoPatterns = [
    ['yes', 'no'],
    ['sí', 'no'],
    ['si', 'no'],
  ];
  
  return yesNoPatterns.some(pattern => {
    return (
      (normalized.includes(pattern[0]) && normalized.includes(pattern[1])) ||
      (normalized.includes(pattern[1]) && normalized.includes(pattern[0]))
    );
  });
}

export function PreviewSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [navStack, setNavStack] = useState<number[]>([0]);
  const [sections, setSections] = useState<SectionMetadata[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [encuesta, setEncuesta] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [responseData, setResponseData] = useState<ResponseDocument>({
    responseID: 'preview_mode',
    surveyID: id || '',
    timestamp: new Date().toISOString(),
    answers: [],
  });

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleDictation = (currentText: string, onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      onResult((currentText ? currentText + ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  };

  useEffect(() => {
    loadEncuesta();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEncuesta = async () => {
    if (!id) {
      navigate(`/survey-error?type=not-found`);
      return;
    }

    setIsLoading(true);
    const { data, error } = await api.getEncuestaById(id);

    if (error || !data) {
      console.error('❌ Error cargando encuesta:', error);
      navigate(`/survey-error?type=not-found&id=${id}`);
      return;
    }

    console.log('✅ Encuesta cargada (PREVIEW MODE):', data);
    setEncuesta(data);

    if (data.sections && Array.isArray(data.sections)) {
      setSections(data.sections);
    } else {
      setSections([]);
    }

    if (data.preguntas && Array.isArray(data.preguntas) && data.preguntas.length > 0) {
      setQuestions(data.preguntas.map(normalizeQuestion));
    } else {
      setQuestions([
        { id: 'q_default_1', type: 'likert', title: 'How satisfied are you with our service?' },
        { id: 'q_default_2', type: 'csat', title: 'Rate your overall experience' },
        { id: 'q_default_3', type: 'text', title: 'Any additional comments or feedback?' },
      ]);
    }

    setIsLoading(false);
  };

  // ──── Early returns BEFORE any computed values that depend on questions ────

  if (isLoading) {
    return <SurveyLoader />;
  }

  if (submitSuccess) {
    return <SurveyThankYou />;
  }

  // ──── Safe to compute after loading is done and questions are populated ────

  if (!questions.length || !encuesta) return null;

  const configuracion = normalizeEncuestaConfig(encuesta?.configuracion);
  const surveyHasLogic = hasSurveyLogic(questions, sections);
  const blockBack = configuracion.bloquear_regreso === true;
  const isScrollMode = configuracion.modo_visualizacion === 'scroll';
  const useScrollLayout = isScrollMode && !surveyHasLogic;

  const navigateToQuestion = (targetIndex: number) => {
    setNavStack((prev) => {
      const nextStack = pushNavStack(prev, targetIndex);
      setResponseData((prevData) => ({
        ...prevData,
        answers: pruneAnswersToStack(prevData.answers, questions, nextStack),
      }));
      return nextStack;
    });
    setCurrentQuestion(targetIndex);
  };

  const currentStep = currentQuestion + 1;
  const totalSteps = questions.length;
  const progress = surveyHasLogic
    ? Math.min(100, (navStack.length / Math.max(totalSteps, 1)) * 100)
    : (currentStep / totalSteps) * 100;
  const progressLabel = surveyHasLogic ? `${currentStep}` : `${currentStep} / ${totalSteps}`;
  const stepLabel = surveyHasLogic
    ? `Pregunta ${currentStep}`
    : `Pregunta ${currentStep} de ${totalSteps}`;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const currentQ = questions[currentQuestion];
  const currentAnswer = responseData.answers.find(a => a.questionID === currentQ.id);
  const displayQuestions = useScrollLayout ? questions : [currentQ];

  const getAnswerFor = (questionId: string) =>
    responseData.answers.find((a) => a.questionID === questionId);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isAnswerValid = (q: Question, answer?: { value: number | string }): boolean => {
    const answered = answer !== undefined;
    if (q.type === 'separator') return true;
    if (q.type === 'text' && q.opcional) {
      if (!answered) return true;
      if (q.solo_email) {
        const value = answer?.value;
        if (typeof value === 'string' && value.trim().length > 0) {
          return isValidEmail(value.trim());
        }
        return true;
      }
      return true;
    }
    if (q.type === 'score-matrix') {
      if (!answered) return false;
      try {
        const matrixAnswers =
          typeof answer?.value === 'string' ? JSON.parse(answer.value) : answer?.value;
        const rows = q.matrix_rows || [];
        return Object.keys(matrixAnswers).length === rows.length;
      } catch {
        return false;
      }
    }
    if (q.type === 'ranking') return answered;
    if (!answered) return false;
    if (q.type === 'text' && q.solo_email) {
      const value = answer?.value;
      if (typeof value === 'string') {
        return value.trim().length > 0 && isValidEmail(value.trim());
      }
      return false;
    }
    return true;
  };

  const isAllAnswersValid = () =>
    questions.every((q) => isAnswerValid(q, getAnswerFor(q.id)));

  const isCurrentAnswerValid = (): boolean => isAnswerValid(currentQ, currentAnswer);

  /** Preview: fake submit — last step always reaches thank-you; separators never block. */
  const canProceedInPreview = (): boolean => {
    if (useScrollLayout) return isAllAnswersValid();
    if (isLastQuestion) return true;
    if (currentQ.type === 'separator') return true;
    return isCurrentAnswerValid();
  };

  const handleAnswer = (value: number | string, questionId?: string) => {
    const qId = questionId ?? currentQ.id;
    const existingIdx = responseData.answers.findIndex(a => a.questionID === qId);
    const newAnswers = [...responseData.answers];
    if (existingIdx >= 0) {
      newAnswers[existingIdx].value = value;
    } else {
      newAnswers.push({ questionID: qId, value });
    }
    setResponseData({ ...responseData, answers: newAnswers });
  };

  const handleSubmit = () => {
    console.log('🔍 PREVIEW MODE: Respuesta NO guardada en base de datos:', responseData);
    setSubmitSuccess(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
      return;
    }

    // Check for conditional logic
    const currentQ = questions[currentQuestion];
    const currentAnswer = responseData.answers.find((a) => a.questionID === currentQ.id);

    // Text question logic (answered / skipped)
    if (currentQ.type === 'text' && currentQ.text_logic && currentQ.text_logic.length > 0) {
      const textValue = currentAnswer?.value;
      const answered = typeof textValue === 'string' && textValue.trim().length > 0;
      const condition: TextCondition = answered ? 'answered' : 'skipped';
      const rule = currentQ.text_logic.find(r => r.condition === condition);

      if (rule) {
        if (rule.jump_to_question_id === 'END_SURVEY') {
          handleSubmit();
          return;
        }
        const targetIndex = questions.findIndex(q => q.id === rule.jump_to_question_id);
        if (targetIndex > currentQuestion) {
          navigateToQuestion(targetIndex);
          return;
        }
      }
    }

    // NPS group logic (0-6 detractor / 7-8 passive / 9-10 promoter)
    if (currentQ.type === 'nps' && currentQ.nps_group_logic && currentQ.nps_group_logic.length > 0 && currentAnswer) {
      const npsValue = typeof currentAnswer.value === 'number'
        ? currentAnswer.value
        : parseInt(String(currentAnswer.value), 10);

      if (!isNaN(npsValue)) {
        const group: NPSGroup = npsValue <= 6 ? 'detractor' : npsValue <= 8 ? 'passive' : 'promoter';
        const rule = currentQ.nps_group_logic.find(r => r.group === group);

        if (rule) {
          if (rule.jump_to_question_id === 'END_SURVEY') {
            handleSubmit();
            return;
          }
          const targetIndex = questions.findIndex(q => q.id === rule.jump_to_question_id);
          if (targetIndex > currentQuestion) {
            navigateToQuestion(targetIndex);
            return;
          }
        }
      }
    }

    if (currentQ.conditional_logic && currentAnswer) {
      // For multiple-choice questions, check if the selected option has logic
      if (currentQ.type === 'multiple-choice' && typeof currentAnswer.value === 'string') {
        const selectedValue = String(currentAnswer.value).trim();
        const selectedOptionIndex = currentQ.opciones?.findIndex(
          opt => String(opt).trim() === selectedValue
        ) ?? -1;

        if (selectedOptionIndex >= 0) {
          const logic = currentQ.conditional_logic.find(l => l.option_index === selectedOptionIndex);

          if (logic) {
            if (logic.jump_to_question_id === 'END_SURVEY') {
              handleSubmit();
              return;
            }
            const targetIndex = questions.findIndex(q => q.id === logic.jump_to_question_id);

            if (targetIndex > currentQuestion) {
              navigateToQuestion(targetIndex);
              return;
            }
          }
        }
      }
    }

    const nextQuestionIndex = currentQuestion + 1;
    const nextQuestion = questions[nextQuestionIndex];
    const currentSectionId = currentQ.section_id;
    const nextSectionId = nextQuestion?.section_id;

    if (currentSectionId && currentSectionId !== nextSectionId) {
      const currentSection = sections.find(s => s.id === currentSectionId);

      if (currentSection?.section_logic?.enabled && currentSection.section_logic.jump_to_section_id) {
        if (currentSection.section_logic.jump_to_section_id === 'END_SURVEY') {
          handleSubmit();
          return;
        }

        const targetSectionId = currentSection.section_logic.jump_to_section_id;
        const targetSection = sections.find(s => s.id === targetSectionId);

        if (targetSection) {
          const firstQuestionInTargetSection = questions.findIndex(q => q.section_id === targetSectionId);
          if (firstQuestionInTargetSection >= 0) {
            navigateToQuestion(firstQuestionInTargetSection);
            return;
          }
        }
      }
    }

    // Default: go to next question
    navigateToQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    if (blockBack || navStack.length <= 1) return;
    const { stack, index } = popNavStack(navStack);
    setNavStack(stack);
    setCurrentQuestion(index);
  };

  const handleForward = () => {
    if (useScrollLayout) {
      handleSubmit();
      return;
    }
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      {/* PREVIEW MODE BANNER */}
      <div className="bg-yellow-500 text-gray-900 dark:text-foreground py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <Eye className="w-5 h-5" />
          <span className="font-semibold text-sm md:text-base">
            MODO PREVIEW — Las respuestas NO se guardarán en la base de datos
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {!useScrollLayout && (
      <div className="relative w-full bg-gray-200 dark:bg-muted h-6">
        <div
          className="bg-blue-600 h-6 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute top-0 left-4 h-6 flex items-center">
          <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
            {progressLabel}
          </span>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 p-4 md:p-8 ${useScrollLayout ? 'overflow-y-auto' : 'flex items-center justify-center'}`}>
        <div className="mx-auto w-full max-w-2xl">
          <div className={`bg-white dark:bg-card rounded-2xl shadow-lg p-6 md:p-10 ${useScrollLayout ? 'pb-8' : ''}`}>
            {!useScrollLayout && (
            <div className="mb-6">
              <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                {stepLabel}
              </span>
            </div>
            )}

            {displayQuestions.map((activeQ, mapIdx) => {
              const activeAnswer = getAnswerFor(activeQ.id);

              return (
                <div
                  key={activeQ.id}
                  className={useScrollLayout && mapIdx > 0 ? 'mt-10 pt-10 border-t border-gray-200 dark:border-border' : ''}
                >
                  {useScrollLayout && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 dark:text-muted-foreground">
                        Pregunta {mapIdx + 1} de {totalSteps}
                      </span>
                    </div>
                  )}

            {/* Question Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground mb-8">
              {activeQ.title}
            </h2>

            {/* Question Subtitle */}
            {activeQ.subtitle && activeQ.type !== 'separator' && (
              <p className="text-sm text-gray-500 dark:text-muted-foreground mb-8">
                {activeQ.subtitle}
              </p>
            )}

            {/* Separator - Informational only */}
            {activeQ.type === 'separator' && (
              <div className="mb-8">
                {activeQ.subtitle && (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-muted border-2 border-slate-200 dark:border-border">
                    <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap leading-relaxed">
                      {activeQ.subtitle}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sección informativa — no requiere respuesta</span>
                </div>
              </div>
            )}

            {/* Likert Scale */}
            {activeQ.type === 'likert' && (
              <div className="space-y-3 mb-8">
                {(activeQ.opciones && activeQ.opciones.length > 0
                  ? activeQ.opciones.map((label, i) => ({ value: i + 1, label }))
                  : [
                      { value: 1, label: 'Strongly Disagree' },
                      { value: 2, label: 'Disagree' },
                      { value: 3, label: 'Neutral' },
                      { value: 4, label: 'Agree' },
                      { value: 5, label: 'Strongly Agree' },
                    ]
                ).reverse().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value, activeQ.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                      activeAnswer?.value === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 dark:border-border hover:border-gray-400 text-gray-700 dark:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {activeAnswer?.value === option.value && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* SUS Scale (1–5 numeric) */}
            {activeQ.type === 'sus' && (() => {
              const scale = activeQ.escala_sus || 5;
              const scaleValues = Array.from({ length: scale }, (_, i) => i + 1);
              
              return (
                <div className="mb-8">
                  <div className="flex justify-between items-end gap-2">
                    {scaleValues.map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(val, activeQ.id)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                          activeAnswer?.value === val
                            ? 'border-purple-600 bg-purple-50 text-purple-900'
                            : 'border-gray-300 dark:border-border hover:border-purple-400 text-gray-600 dark:text-muted-foreground'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">{activeQ.label_izquierda || 'Totalmente en desacuerdo'}</span>
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">{activeQ.label_derecha || 'Totalmente de acuerdo'}</span>
                  </div>
                </div>
              );
            })()}

            {/* CSAT Scale */}
            {activeQ.type === 'csat' && (() => {
              // Detect if this is a star rating CSAT (check if subtitle or options mention "estrella" or "star")
              const isStarRating = 
                activeQ.subtitle?.toLowerCase().includes('estrella') ||
                activeQ.subtitle?.toLowerCase().includes('star') ||
                activeQ.opciones?.some(opt => opt.includes('⭐') || opt.includes('★'));

              if (isStarRating) {
                // Star rating CSAT (cumulative/progressive highlighting)
                const selectedValue = typeof activeAnswer?.value === 'number' ? activeAnswer.value : 0;
                return (
                  <div className="mb-8">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          onClick={() => handleAnswer(starValue, activeQ.id)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                        >
                          <Star
                            className={`w-12 h-12 md:w-16 md:h-16 transition-all ${
                              starValue <= selectedValue
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 text-gray-300 dark:fill-muted-foreground dark:text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="hidden flex justify-between mt-2 px-1">
                      <span className="hidden text-xs text-gray-500 dark:text-muted-foreground">Muy insatisfecho</span>
                      <span className="hidden text-xs text-gray-500 dark:text-muted-foreground">Muy satisfecho</span>
                    </div>
                  </div>
                );
              } else {
                // Traditional emoji CSAT (faces) - no flex-wrap to keep in one line
                return (
                  <div className="mb-8">
                    <div className="flex justify-center gap-2 sm:gap-4 md:gap-8">
                      {[
                        { value: 1, emoji: '😞', label: 'Very Dissatisfied' },
                        { value: 2, emoji: '😕', label: 'Dissatisfied' },
                        { value: 3, emoji: '😐', label: 'Neutral' },
                        { value: 4, emoji: '🙂', label: 'Satisfied' },
                        { value: 5, emoji: '😄', label: 'Very Satisfied' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value, activeQ.id)}
                          className={`flex flex-col items-center gap-2 p-2 sm:p-4 rounded-xl transition-all ${
                            activeAnswer?.value === option.value
                              ? 'bg-blue-50 scale-110'
                              : 'hover:bg-gray-50 dark:hover:bg-accent hover:scale-105'
                          }`}
                        >
                          <span className="text-4xl sm:text-4xl md:text-5xl">{option.emoji}</span>
                          <span className="text-[10px] sm:text-xs md:text-xm text-gray-600 dark:text-muted-foreground text-center whitespace-nowrap">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
            })()}

            {/* NPS (Net Promoter Score) - 0 to 10 */}
            {activeQ.type === 'nps' && (() => {
              const usar_slider = activeQ.usar_slider !== false; // Default to true if not specified
              const sliderValue = activeAnswer?.value ?? 5;

              const getSliderColor = (value: number) => {
                if (value <= 6) return '#fbbf24'; // Yellow for detractors (0-6)
                if (value <= 8) return '#60a5fa'; // Blue for passives (7-8)
                return '#34d399'; // Green for promoters (9-10)
              };

              const getEmoji = (value: number) => {
                if (value === 9) return '😊';
                if (value === 10) return '😍';
                return '';
              };

              if (usar_slider) {
                // Slider view with emoji at 9 and 10
                return (
                  <div className="mb-8 px-4">
                    <div className="flex flex-col items-center gap-6">
                      {/* Emoji display */}
                      <div className="h-16">
                        {sliderValue >= 9 && (
                          <span className="text-6xl animate-pulse">{getEmoji(sliderValue)}</span>
                        )}
                      </div>

                      {/* Current value display */}
                      <div className="text-center">
                        <div className="text-5xl font-bold" style={{ color: getSliderColor(sliderValue) }}>
                          {sliderValue}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                          {sliderValue === 0 && 'Nada probable'}
                          {(sliderValue === 1 || sliderValue === 2) && 'Muy poco probable'}
                          {(sliderValue >= 3 && sliderValue <= 6) && 'Poco probable'}
                          {(sliderValue === 7 || sliderValue === 8) && 'Neutral'}
                          {sliderValue >= 9 && 'Muy probable'}
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="w-full max-w-md">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={sliderValue}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            handleAnswer(value, activeQ.id);
                          }}
                          className="nps-slider w-full h-3 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 60%, #60a5fa 60%, #60a5fa 80%, #34d399 80%, #34d399 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-muted-foreground mt-2">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-muted-foreground mt-1 font-medium">
                          <span>Nada probable</span>
                          <span>Muy probable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Number buttons view (0-10)
                return (
                  <div className="mb-8">
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                        const isSelected = activeAnswer?.value === value;
                        let bgColor = '#fbbf24'; // Yellow for 0-6
                        if (value >= 7 && value <= 8) bgColor = '#60a5fa'; // Blue for 7-8
                        if (value >= 9) bgColor = '#34d399'; // Green for 9-10

                        return (
                          <button
                            key={value}
                            onClick={() => handleAnswer(value, activeQ.id)}
                            className={`w-[24px] h-11 md:w-10 sm:w-8 sm:h-12 flex-shrink-0 rounded-md font-bold text-base sm:text-lg transition-all ${
                              isSelected
                                ? 'scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: isSelected ? bgColor : '#f3f4f6',
                              color: isSelected ? 'white' : '#374151',
                              border: isSelected ? '2px solid white' : '2px solid #e5e7eb',
                            }}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-muted-foreground mt-4 px-4">
                      <span className="font-medium">Nada probable</span>
                      <span className="font-medium">Muy probable</span>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Multiple Choice */}
            {activeQ.type === 'multiple-choice' && (() => {
              const isYesNo = isYesNoQuestion(activeQ.opciones);
              const brandColor = encuesta?.configuracion?.color_primario || '#f97316'; // orange-500 as fallback
              const lightBrandColor = getLightColor(brandColor);

              // Helper to get emoji for Yes/No answers
              const getYesNoEmoji = (option: string): string => {
                const normalized = option.toLowerCase().trim();
                if (normalized === 'yes' || normalized === 'sí' || normalized === 'si') {
                  return '✅';
                }
                if (normalized === 'no') {
                  return '❌';
                }
                return '';
              };

              if (isYesNo) {
                // Yes/No special design with large emojis
                const options = activeQ.opciones && activeQ.opciones.length > 0
                  ? activeQ.opciones
                  : ['Yes', 'No'];

                return (
                  <div className="flex justify-center gap-4 mb-8">
                    {options.map((option, i) => {
                      const isSelected = activeAnswer?.value === option;
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option, activeQ.id)}
                          className="flex-1 max-w-[180px] flex flex-col items-center gap-4 p-6 rounded-2xl border-2 font-medium transition-all hover:scale-105"
                          style={{
                            borderColor: isSelected ? brandColor : '#d1d5dc',
                            backgroundColor: isSelected ? lightBrandColor : 'white',
                            color: isSelected ? brandColor : '#374151',
                          }}
                        >
                          <span className="text-6xl">{getYesNoEmoji(option)}</span>
                          <span className="text-lg font-semibold">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              } else {
                // Standard multiple choice list
                const options = activeQ.opciones && activeQ.opciones.length > 0
                  ? activeQ.opciones
                  : ['Opción 1', 'Opción 2', 'Opción 3'];

                // Show dropdown if usar_dropdown is enabled
                if (activeQ.usar_dropdown) {
                  const selectedValue = activeAnswer?.value as string || '';

                  return (
                    <div className="mb-8">
                      <select
                        value={selectedValue}
                        onChange={(e) => handleAnswer(e.target.value, activeQ.id)}
                        className="w-full px-4 py-3 rounded-xl border-2 text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{
                          borderColor: selectedValue ? brandColor : '#d1d5dc',
                          backgroundColor: 'white',
                          color: selectedValue ? brandColor : '#6b7280',
                          boxShadow: selectedValue ? `0 0 0 3px ${brandColor}20` : 'none',
                        }}
                      >
                        <option value="" disabled>Selecciona una opción...</option>
                        {options.map((option, i) => (
                          <option key={i} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // Default list view (radio/checkbox style)
                return (
                  <div className="space-y-3 mb-8">
                    {options.map((option, i) => {
                      const isSelected = activeAnswer?.value === option;
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option, activeQ.id)}
                          className="w-full p-4 rounded-xl border-2 text-left font-medium transition-all"
                          style={{
                            borderColor: isSelected ? brandColor : '#d1d5dc',
                            backgroundColor: isSelected ? lightBrandColor : 'white',
                            color: isSelected ? brandColor : '#374151',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {isSelected && (
                              <Check className="w-5 h-5" style={{ color: brandColor }} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              }
            })()}

            {/* Text Input */}
            {activeQ.type === 'text' && (() => {
              const textValue = typeof activeAnswer?.value === 'string' ? activeAnswer.value : '';
              const isEmailMode = activeQ.solo_email;
              const hasText = textValue.trim().length > 0;
              const emailError = isEmailMode && hasText && !isValidEmail(textValue.trim());
              const isOptional = activeQ.opcional;

              return (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    {activeQ.subtitle && (
                      <p className="hidden text-sm text-gray-600 dark:text-muted-foreground">{activeQ.subtitle}</p>
                    )}
                    {isOptional && (
                      <span className="text-xs text-gray-500 dark:text-muted-foreground bg-gray-100 dark:bg-muted px-2 py-1 rounded-md">
                        Opcional
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={textValue}
                      onChange={(e) => handleAnswer(e.target.value, activeQ.id)}
                      rows={6}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none resize-none text-gray-900 dark:text-foreground ${
                        emailError
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 dark:border-border focus:border-blue-500 focus:ring-blue-200'
                      }`}
                      placeholder={isEmailMode ? 'ejemplo@correo.com' : 'Type your answer here...'}
                    />
                    {!isEmailMode && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {isRecording && (
                          <div className="flex items-end gap-[2px] h-5" aria-label="Escuchando">
                            {[3, 6, 9, 12, 9, 6, 3, 6, 9, 6].map((h, i) => (
                              <span
                                key={i}
                                className="w-[3px] rounded-full bg-red-400"
                                style={{
                                  height: `${h}px`,
                                  animation: `dictWave 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDictation(textValue, handleAnswer)}
                          title={isRecording ? 'Detener dictado' : 'Dictar respuesta'}
                          className={`p-2 rounded-full transition-all ${
                            isRecording
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted hover:text-gray-700 dark:hover:text-foreground'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <span className="text-red-500">⚠️</span>
                      Por favor ingresa un email válido
                    </p>
                  )}
                  {!emailError && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                      {textValue.length} characters{isEmailMode ? ' • Formato de email requerido' : ''}{isOptional && !hasText ? ' • Puedes dejar en blanco' : ''}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Score Matrix */}
            {activeQ.type === 'score-matrix' && (() => {
              const rows = activeQ.matrix_rows || ['Statement 1', 'Statement 2'];
              const columns = activeQ.matrix_columns || ['1', '2', '3', '4', '5'];
              const useStars = activeQ.use_stars ?? true;

              // Parse current answer as object (rowIndex -> columnIndex)
              let matrixAnswers: Record<number, number> = {};
              try {
                if (activeAnswer?.value) {
                  matrixAnswers = typeof activeAnswer.value === 'string'
                    ? JSON.parse(activeAnswer.value)
                    : activeAnswer.value;
                }
              } catch (e) {
                matrixAnswers = {};
              }

              const handleMatrixAnswer = (rowIndex: number, columnIndex: number) => {
                const updated = { ...matrixAnswers, [rowIndex]: columnIndex };
                handleAnswer(JSON.stringify(updated), activeQ.id);
              };

              return (
                <div className="mb-8">
                  {activeQ.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">{activeQ.subtitle}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    {/* Column Headers */}
                    <div className="flex gap-2 pl-36">
                      {columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex-1 flex justify-center">
                          <p className="text-xs text-gray-600 dark:text-muted-foreground font-medium">{col}</p>
                        </div>
                      ))}
                    </div>

                    {/* Matrix Rows */}
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-2 items-center">
                        {/* Row Label */}
                        <div className="w-32 flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-foreground text-right pr-4">{row}</p>
                        </div>

                        {/* Column Buttons/Stars */}
                        <div className="flex gap-2 flex-1">
                          {columns.map((_, colIdx) => {
                            const selectedColIdx = matrixAnswers[rowIdx];

                            if (useStars) {
                              // Stars: progressive fill (light up all from 0 to selected)
                              const isLit = selectedColIdx !== undefined && colIdx <= selectedColIdx;

                              return (
                                <button
                                  key={colIdx}
                                  onClick={() => handleMatrixAnswer(rowIdx, colIdx)}
                                  className="flex-1 p-2 rounded-lg transition-all hover:scale-110 flex justify-center items-center"
                                >
                                  <Star
                                    className={`w-10 h-10 transition-all ${
                                      isLit
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-gray-300 text-gray-300 dark:fill-muted-foreground dark:text-muted-foreground'
                                    }`}
                                  />
                                </button>
                              );
                            } else {
                              // Radio buttons: only exact match is selected (no progressive)
                              const isSelected = selectedColIdx === colIdx;

                              return (
                                <button
                                  key={colIdx}
                                  onClick={() => handleMatrixAnswer(rowIdx, colIdx)}
                                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-50'
                                      : 'border-gray-300 dark:border-border hover:border-gray-400 bg-white dark:bg-card'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600'
                                      : 'border-gray-300 dark:border-border'
                                  }`} />
                                </button>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Ranking */}
            {activeQ.type === 'ranking' && (() => {
              const RankingItem = ({ item, index, moveItem }: { item: string; index: number; moveItem: (dragIndex: number, hoverIndex: number) => void }) => {
                const [{ isDragging }, drag] = useDrag({
                  type: 'ranking-item',
                  item: { index },
                  collect: (monitor) => ({
                    isDragging: monitor.isDragging(),
                  }),
                });

                const [, drop] = useDrop({
                  accept: 'ranking-item',
                  hover: (draggedItem: { index: number }) => {
                    if (draggedItem.index !== index) {
                      moveItem(draggedItem.index, index);
                      draggedItem.index = index;
                    }
                  },
                });

                return (
                  <div
                    ref={(node) => drag(drop(node))}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-move ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 dark:border-border bg-white dark:bg-card hover:border-gray-400'
                    }`}
                  >
                    <GripVertical className={`w-5 h-5 ${isDragging ? 'text-blue-600' : 'text-gray-400 dark:text-muted-foreground'}`} />
                    <p className={`font-medium ${isDragging ? 'text-blue-900' : 'text-gray-700 dark:text-foreground'}`}>{item}</p>
                  </div>
                );
              };

              // Parse current answer as ordered array
              let rankedItems: string[] = [];
              try {
                if (activeAnswer?.value) {
                  rankedItems = typeof activeAnswer.value === 'string'
                    ? JSON.parse(activeAnswer.value)
                    : activeAnswer.value;
                } else {
                  rankedItems = [...(activeQ.opciones || ['Option 1', 'Option 2', 'Option 3'])];
                }
              } catch (e) {
                rankedItems = [...(activeQ.opciones || ['Option 1', 'Option 2', 'Option 3'])];
              }

              const moveItem = (dragIndex: number, hoverIndex: number) => {
                const updated = [...rankedItems];
                const [removed] = updated.splice(dragIndex, 1);
                updated.splice(hoverIndex, 0, removed);
                handleAnswer(JSON.stringify(updated), activeQ.id);
              };

              return (
                <div className="mb-8">
                  {activeQ.ranking_instruction && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">{activeQ.ranking_instruction}</p>
                  )}
                  {!activeQ.ranking_instruction && activeQ.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">{activeQ.subtitle}</p>
                  )}

                  <DndProvider backend={HTML5Backend}>
                    <div className="flex flex-col gap-3">
                      {rankedItems.map((item, idx) => (
                        <RankingItem
                          key={`${item}-${idx}`}
                          item={item}
                          index={idx}
                          moveItem={moveItem}
                        />
                      ))}
                    </div>
                  </DndProvider>

                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-3 text-center">
                    💡 Arrastra y suelta para ordenar tus preferencias
                  </p>
                </div>
              );
            })()}

                </div>
              );
            })}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-border">
              {!useScrollLayout && !blockBack && (
                <button
                  onClick={handlePrevious}
                  disabled={navStack.length <= 1}
                  className="flex-1 flex items-center gap-2 px-6 py-3 bg-white dark:bg-card border-2 border-gray-300 dark:border-border text-gray-700 dark:text-foreground rounded-lg hover:bg-gray-50 dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              <button
                onClick={handleForward}
                disabled={!canProceedInPreview()}
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors ${useScrollLayout || blockBack ? 'flex-1 w-full' : 'flex-1'}`}
              >
                {useScrollLayout || isLastQuestion ? (
                  <>
                    Submit Preview
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              🔍 Preview Mode: {useScrollLayout
                ? (isAllAnswersValid() ? 'Listo para enviar preview (no se guardará)' : 'Completa todas las preguntas requeridas')
                : isLastQuestion
                  ? 'Submit Preview te llevará a la pantalla de gracias (no se guardará en la base de datos)'
                  : currentQ.type === 'separator'
                    ? 'Puedes continuar — no se guardará en la base de datos'
                    : (canProceedInPreview()
                      ? 'Listo para continuar (no se guardará en la base de datos)'
                      : 'Selecciona una opción para continuar')}
            </p>
          </div>
        </div>
      </div>

      {/* Survey Footer */}
      <SurveyFooter />
    </div>
  );
}
