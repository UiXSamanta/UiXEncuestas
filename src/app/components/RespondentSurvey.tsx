import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Loader2, Star, GripVertical, Mic, MicOff } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import * as api from '../lib/api';
import { SurveyLoader } from './SurveyLoader';
import { SurveyThankYou } from './SurveyThankYou';
import { SurveyFooter } from './SurveyFooter';

// Response Document Structure
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
  jump_to_question_id: string; // Can be a question ID or "END_SURVEY" to finish the form
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

interface SectionLogic {
  enabled: boolean;
  jump_to_section_id?: string; // Can be a section ID or "END_SURVEY" to finish the form
}

interface SectionMetadata {
  id: string;
  title: string;
  section_logic?: SectionLogic;
}

interface Question {
  id: string;
  type: 'likert' | 'csat' | 'text' | 'sus' | 'nps' | 'multiple-choice' | 'separator' | 'score-matrix' | 'ranking';
  title: string;
  subtitle?: string;
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
  section_id?: string; // Section grouping
}

// Normalize question from builder schema → viewer schema
function normalizeQuestion(q: any): Question {
  return {
    id: q.id ?? q.pregunta_id ?? `q_${Math.random()}`,
    type: q.type ?? q.tipo ?? 'text',
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
    conditional_logic: q.conditional_logic,
    nps_group_logic: q.nps_group_logic,
    text_logic: q.text_logic,
    section_id: q.section_id,
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

export function RespondentSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [encuesta, setEncuesta] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<SectionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate unique respondent ID automatically
  const [respondentId] = useState(() => {
    const existingId = localStorage.getItem('current_respondent_id');
    if (existingId) return existingId;
    const newId = `respondent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('current_respondent_id', newId);
    return newId;
  });

  const [responseData, setResponseData] = useState<ResponseDocument>({
    responseID: respondentId,
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
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
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

    if (!data.estado) {
      navigate(`/survey-error?type=closed&id=${id}`);
      return;
    }

    console.log('✅ Encuesta cargada:', data);

    // Clean invalid conditional logic before setting state
    const cleanedData = cleanInvalidConditionalLogic(data);
    setEncuesta(cleanedData);

    // Load sections
    if (cleanedData.sections && Array.isArray(cleanedData.sections)) {
      setSections(cleanedData.sections);
      console.log('✅ Secciones cargadas:', cleanedData.sections);
    }

    if (cleanedData.preguntas && Array.isArray(cleanedData.preguntas) && cleanedData.preguntas.length > 0) {
      setQuestions(cleanedData.preguntas.map(normalizeQuestion));
    } else {
      setQuestions([
        { id: 'q_default_1', type: 'likert', title: 'How satisfied are you with our service?' },
        { id: 'q_default_2', type: 'csat', title: 'Rate your overall experience' },
        { id: 'q_default_3', type: 'text', title: 'Any additional comments or feedback?' },
      ]);
    }

    setIsLoading(false);
  };

  // Helper function to clean invalid conditional logic rules
  const cleanInvalidConditionalLogic = (encuesta: any): any => {
    let cleanedCount = 0;
    let convertedCount = 0;

    // Find the most common jump target - this is likely the "end" question
    const findCommonJumpTarget = (): number => {
      const jumpTargetCounts = new Map<string, number>();

      // Count how many times each question is targeted
      encuesta.preguntas.forEach((pregunta: any) => {
        pregunta.conditional_logic?.forEach((logic: ConditionalLogic) => {
          if (logic.jump_to_question_id !== 'END_SURVEY') {
            const count = jumpTargetCounts.get(logic.jump_to_question_id) || 0;
            jumpTargetCounts.set(logic.jump_to_question_id, count + 1);
          }
        });
      });

      console.log('📊 Jump target analysis:', Array.from(jumpTargetCounts.entries()).map(([id, count]) => {
        const idx = encuesta.preguntas.findIndex((q: any) => q.pregunta_id === id || q.id === id);
        return `Q${idx + 1} (${id}): ${count} jumps`;
      }));

      // Find the most common target
      let mostCommonTarget: string | null = null;
      let maxCount = 0;

      jumpTargetCounts.forEach((count, targetId) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonTarget = targetId;
        }
      });

      if (mostCommonTarget) {
        const targetIdx = encuesta.preguntas.findIndex(
          (q: any) => q.pregunta_id === mostCommonTarget || q.id === mostCommonTarget
        );

        if (targetIdx !== -1) {
          console.log(`✅ Most common jump target: Question ${targetIdx + 1} (${maxCount} times)`);
          return targetIdx;
        }
      }

      console.log('⚠️ No common jump target found, using last question');
      return encuesta.preguntas.length - 1; // Default to last question
    };

    const commonEndpointIndex = findCommonJumpTarget();

    const cleanedPreguntas = encuesta.preguntas.map((pregunta: any, index: number) => {
      if (!pregunta.conditional_logic || pregunta.conditional_logic.length === 0) {
        return pregunta;
      }

      const updatedLogic = pregunta.conditional_logic.map((logic: ConditionalLogic) => {
        // END_SURVEY is always valid
        if (logic.jump_to_question_id === 'END_SURVEY') return logic;

        // Check if option exists
        if (!pregunta.opciones || pregunta.opciones[logic.option_index] === undefined) {
          console.warn(`🧹 [Auto-clean] Removed invalid rule: Option index ${logic.option_index} doesn't exist in question ${index + 1}`);
          cleanedCount++;
          return null;
        }

        // Check if target question exists
        const targetIndex = encuesta.preguntas.findIndex(
          (q: any) => q.pregunta_id === logic.jump_to_question_id || q.id === logic.jump_to_question_id
        );

        if (targetIndex === -1) {
          console.warn(`🧹 [Auto-clean] Removed invalid rule: Target question ${logic.jump_to_question_id} not found for question ${index + 1}`);
          cleanedCount++;
          return null;
        }

        // Special case: If jumping to the common endpoint, convert to END_SURVEY
        // This handles cases where the "end" question is used as a common endpoint
        if (targetIndex === commonEndpointIndex && targetIndex < index) {
          console.log(`✅ [Auto-fix] Q${index + 1} option "${pregunta.opciones?.[logic.option_index] || 'unknown'}" → Converted to "Finalizar formulario" (was jumping to common endpoint Q${commonEndpointIndex + 1})`);
          convertedCount++;
          return {
            ...logic,
            jump_to_question_id: 'END_SURVEY',
          };
        }

        // Check for backward jumps (not to the common endpoint)
        if (targetIndex < index) {
          console.warn(`🧹 [Auto-clean] Removed invalid rule: Backward jump from question ${index + 1} to ${targetIndex + 1}`);
          console.warn(`   Option: "${pregunta.opciones?.[logic.option_index] || 'unknown'}"`);
          console.warn(`   💡 If this should end the survey, configure it to jump to "🏁 Finalizar formulario" instead`);
          cleanedCount++;
          return null;
        }

        return logic;
      }).filter((logic: ConditionalLogic | null) => logic !== null) as ConditionalLogic[];

      if (updatedLogic.length !== pregunta.conditional_logic.length || convertedCount > 0) {
        return {
          ...pregunta,
          conditional_logic: updatedLogic.length > 0 ? updatedLogic : undefined,
        };
      }

      return pregunta;
    });

    if (cleanedCount > 0 || convertedCount > 0) {
      console.log(`%c✅ AUTOMATIC FIX APPLIED `, 'background: #10b981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
      if (convertedCount > 0) {
        console.log(`%c   ✓ Fixed ${convertedCount} question${convertedCount > 1 ? 's' : ''} to end the survey correctly`, 'color: #10b981; font-weight: bold;');
        console.log(`     These questions now finish the form instead of jumping to the last question`);
      }
      if (cleanedCount > 0) {
        console.log(`%c   ✓ Removed ${cleanedCount} invalid rule${cleanedCount > 1 ? 's' : ''}`, 'color: #10b981;');
      }
      console.log(`\n💡 This survey now works correctly!`);
      console.log(`📝 To make this permanent: Open the survey editor (fixes will auto-save)`);
    }

    return {
      ...encuesta,
      preguntas: cleanedPreguntas,
    };
  };

  // ──── Early returns BEFORE any computed values that depend on questions ────

  if (isLoading) {
    return <SurveyLoader />;
  }

  if (submitSuccess) {
    return <SurveyThankYou responseId={responseData.responseID} />;
  }

  // ──── Safe to compute after loading is done and questions are populated ────

  if (!questions.length || !encuesta) return null;

  const currentStep = currentQuestion + 1;
  const totalSteps = questions.length;
  const progress = (currentStep / totalSteps) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const currentQ = questions[currentQuestion];
  const currentAnswer = responseData.answers.find(a => a.questionID === currentQ.id);
  const hasAnswer = currentAnswer !== undefined;

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if current answer is valid (for validation purposes)
  const isCurrentAnswerValid = (): boolean => {
    // Separators don't require answers - always valid
    if (currentQ.type === 'separator') {
      return true;
    }

    // If question is optional and type is text, allow to proceed without answer
    if (currentQ.type === 'text' && currentQ.opcional) {
      // If there's no answer, it's valid (can skip)
      if (!hasAnswer) return true;

      // If there's an answer and it's email-only, validate email format
      if (currentQ.solo_email) {
        const value = currentAnswer?.value;
        if (typeof value === 'string' && value.trim().length > 0) {
          return isValidEmail(value.trim());
        }
        // Empty answer is valid for optional questions
        return true;
      }

      // Any answer is valid for optional non-email questions
      return true;
    }

    // Score matrix validation: check that all rows have been answered
    if (currentQ.type === 'score-matrix') {
      if (!hasAnswer) return false;
      try {
        const matrixAnswers = typeof currentAnswer?.value === 'string'
          ? JSON.parse(currentAnswer.value)
          : currentAnswer.value;
        const rows = currentQ.matrix_rows || [];
        return Object.keys(matrixAnswers).length === rows.length;
      } catch (e) {
        return false;
      }
    }

    // Ranking validation: has answer (already initialized with default order)
    if (currentQ.type === 'ranking') {
      return hasAnswer;
    }

    // For required questions, answer must exist
    if (!hasAnswer) return false;

    // Special validation for email-only text questions (required)
    if (currentQ.type === 'text' && currentQ.solo_email) {
      const value = currentAnswer?.value;
      if (typeof value === 'string') {
        return value.trim().length > 0 && isValidEmail(value.trim());
      }
      return false;
    }

    return true;
  };

  const handleAnswer = (value: number | string) => {
    const existingIdx = responseData.answers.findIndex(a => a.questionID === currentQ.id);
    const newAnswers = [...responseData.answers];
    if (existingIdx >= 0) {
      newAnswers[existingIdx].value = value;
    } else {
      newAnswers.push({ questionID: currentQ.id, value });
    }
    setResponseData({ ...responseData, answers: newAnswers });
    try {
      localStorage.setItem(`survey_response_${id}`, JSON.stringify({ ...responseData, answers: newAnswers }));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('📤 Enviando respuesta a Supabase...', responseData);
      const { data, error } = await api.saveRespuesta(id || '', responseData);
      if (error) {
        console.error('❌ Error guardando respuesta:', error);
        const existing = JSON.parse(localStorage.getItem('survey_responses') || '[]');
        existing.push(responseData);
        localStorage.setItem('survey_responses', JSON.stringify(existing));
        alert('Error al guardar en la base de datos. La respuesta se guardó localmente.');
      } else {
        console.log('✅ Respuesta guardada exitosamente:', data);
        localStorage.removeItem(`survey_response_${id}`);
        localStorage.removeItem('current_respondent_id');
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      try {
        const existing = JSON.parse(localStorage.getItem('survey_responses') || '[]');
        existing.push(responseData);
        localStorage.setItem('survey_responses', JSON.stringify(existing));
      } catch (e) { /* ignore */ }
    } finally {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }
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
          setCurrentQuestion(targetIndex);
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
            setCurrentQuestion(targetIndex);
            return;
          }
        }
      }
    }

    if (currentQ.conditional_logic && currentAnswer) {
      // For multiple-choice questions, check if the selected option has logic
      if (currentQ.type === 'multiple-choice' && typeof currentAnswer.value === 'string') {
        // Trim whitespace to avoid matching issues
        const selectedValue = String(currentAnswer.value).trim();
        const selectedOptionIndex = currentQ.opciones?.findIndex(
          opt => String(opt).trim() === selectedValue
        ) ?? -1;

        console.log('🔍 Conditional Logic Debug:', {
          questionTitle: currentQ.title,
          selectedValue,
          selectedOptionIndex,
          availableOptions: currentQ.opciones,
          conditionalRules: currentQ.conditional_logic,
        });

        if (selectedOptionIndex >= 0) {
          const logic = currentQ.conditional_logic.find(l => l.option_index === selectedOptionIndex);

          if (logic) {
            console.log('✅ Logic rule found:', logic);

            // Special case: END_SURVEY
            if (logic.jump_to_question_id === 'END_SURVEY') {
              console.log('🏁 Jump to END_SURVEY - Finishing form');
              handleSubmit();
              return;
            }

            // Find the target question index
            const targetIndex = questions.findIndex(q => q.id === logic.jump_to_question_id);

            console.log('🎯 Target question search:', {
              jump_to_question_id: logic.jump_to_question_id,
              targetIndex,
              currentQuestion,
              totalQuestions: questions.length,
              allQuestionIDs: questions.map((q, i) => ({ index: i, id: q.id, title: q.title })),
            });

            if (targetIndex === -1) {
              console.error('❌ Target question not found! The question may have been deleted.');
              console.error('Looking for ID:', logic.jump_to_question_id);
              console.error('Available question IDs:', questions.map(q => q.id));
              console.error('⚠️ This rule should have been auto-cleaned. If you see this, please report it.');
            } else if (targetIndex === currentQuestion) {
              console.warn('⚠️ Target question is the same as current question (would create infinite loop), ignoring jump');
              console.warn('📝 This rule should have been auto-cleaned. Continuing to next question instead.');
            } else if (targetIndex < currentQuestion) {
              console.warn(`⚠️ Target question (${targetIndex + 1}) is before current question (${currentQuestion + 1}). Backward jumps are not allowed to prevent loops.`);
              console.warn('📝 This rule should have been auto-cleaned but wasn\'t detected during load.');
              console.warn(`💡 The invalid rule will be ignored and you'll proceed to the next question.`);
              console.warn(`💡 To permanently fix this: Open the survey editor, the invalid rules will be auto-cleaned and saved.`);
            } else {
              // Valid jump forward
              console.log(`⏭️ Jumping from question ${currentQuestion + 1} to question ${targetIndex + 1}`);
              setCurrentQuestion(targetIndex);
              return;
            }
          } else {
            console.log('ℹ️ No logic rule configured for this option');
          }
        } else {
          console.warn('⚠️ Could not find selected option in options array');
          console.warn('Looking for:', selectedValue);
          console.warn('Available options:', currentQ.opciones);
        }
      }
    }

    // Check if moving to a different section or leaving current section
    const nextQuestionIndex = currentQuestion + 1;
    const nextQuestion = questions[nextQuestionIndex];
    const currentSectionId = currentQ.section_id;
    const nextSectionId = nextQuestion?.section_id;

    // If we're leaving a section (or at the last question of a section)
    if (currentSectionId && currentSectionId !== nextSectionId) {
      const currentSection = sections.find(s => s.id === currentSectionId);

      if (currentSection?.section_logic?.enabled && currentSection.section_logic.jump_to_section_id) {
        console.log('🔍 Section Logic Debug:', {
          currentSectionId,
          sectionTitle: currentSection.title,
          sectionLogic: currentSection.section_logic,
        });

        // Special case: END_SURVEY
        if (currentSection.section_logic.jump_to_section_id === 'END_SURVEY') {
          console.log('🏁 Section logic: END_SURVEY - Finishing form');
          handleSubmit();
          return;
        }

        // Find the first question in the target section
        const targetSectionId = currentSection.section_logic.jump_to_section_id;
        const targetSection = sections.find(s => s.id === targetSectionId);

        if (targetSection) {
          const firstQuestionInTargetSection = questions.findIndex(q => q.section_id === targetSectionId);

          if (firstQuestionInTargetSection >= 0) {
            console.log(`⏭️ Section logic: Jumping from section "${currentSection.title}" to section "${targetSection.title}" (question ${firstQuestionInTargetSection + 1})`);
            setCurrentQuestion(firstQuestionInTargetSection);
            return;
          } else {
            console.warn(`⚠️ Target section "${targetSection.title}" has no questions, continuing normally`);
          }
        } else {
          console.warn(`⚠️ Target section not found: ${targetSectionId}, continuing normally`);
        }
      }
    }

    // Default: go to next question
    console.log(`➡️ Moving to next question: ${currentQuestion + 1} -> ${currentQuestion + 2}`);
    setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <div className="relative w-full bg-gray-200 h-6">
        <div
          className="bg-blue-600 h-6 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute top-0 left-4 h-6 flex items-center">
          <span className="text-xs font-medium text-[#ffffff]">
            {currentStep} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-10">
            {/* Question Counter */}
            <div className="mb-6">
              <span className="text-xs font-medium text-gray-500">
                Pregunta {currentStep} of {totalSteps}
              </span>
            </div>

            {/* Question Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {currentQ.title}
            </h2>

            {/* Separator - Informational only */}
            {currentQ.type === 'separator' && (
              <div className="mb-8">
                {currentQ.subtitle && (
                  <div className="p-6 rounded-xl bg-slate-50 border-2 border-slate-200">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {currentQ.subtitle}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sección informativa — no requiere respuesta</span>
                </div>
              </div>
            )}

            {/* Likert Scale */}
            {currentQ.type === 'likert' && (
              <div className="space-y-3 mb-8">
                {(currentQ.opciones && currentQ.opciones.length > 0
                  ? currentQ.opciones.map((label, i) => ({ value: i + 1, label }))
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
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                      currentAnswer?.value === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {currentAnswer?.value === option.value && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* SUS Scale (1–5 numeric) */}
            {currentQ.type === 'sus' && (() => {
              const scale = currentQ.escala_sus || 5;
              const scaleValues = Array.from({ length: scale }, (_, i) => i + 1);
              
              return (
                <div className="mb-8">
                  <div className="flex justify-between items-end gap-2">
                    {scaleValues.map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(val)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                          currentAnswer?.value === val
                            ? 'border-purple-600 bg-purple-50 text-purple-900'
                            : 'border-gray-300 hover:border-purple-400 text-gray-600'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    <span className="text-xs text-gray-500">{currentQ.label_izquierda || 'Totalmente en desacuerdo'}</span>
                    <span className="text-xs text-gray-500">{currentQ.label_derecha || 'Totalmente de acuerdo'}</span>
                  </div>
                </div>
              );
            })()}

            {/* CSAT Scale */}
            {currentQ.type === 'csat' && (() => {
              // Detect if this is a star rating CSAT (check if subtitle or options mention "estrella" or "star")
              const isStarRating = 
                currentQ.subtitle?.toLowerCase().includes('estrella') ||
                currentQ.subtitle?.toLowerCase().includes('star') ||
                currentQ.opciones?.some(opt => opt.includes('⭐') || opt.includes('★'));

              if (isStarRating) {
                // Star rating CSAT (cumulative/progressive highlighting)
                const selectedValue = typeof currentAnswer?.value === 'number' ? currentAnswer.value : 0;
                return (
                  <div className="mb-8">
                    {currentQ.subtitle && (
                      <p className="text-sm text-gray-600 mb-4">{currentQ.subtitle}</p>
                    )}
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          onClick={() => handleAnswer(starValue)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                        >
                          <Star
                            className={`w-12 h-12 md:w-16 md:h-16 transition-all ${
                              starValue <= selectedValue
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      <span className="hidden text-xs text-gray-500">Muy insatisfecho</span>
                      <span className="hidden text-xs text-gray-500">Muy satisfecho</span>
                    </div>
                  </div>
                );
              } else {
                // Traditional emoji CSAT (faces)
                return (
                  <div className="mb-8">
                    {currentQ.subtitle && (
                      <p className="text-sm text-gray-600 mb-4">{currentQ.subtitle}</p>
                    )}
                    <div className="flex justify-center gap-2 sm:gap-2 md:gap-4">
                      {[
                        { value: 1, emoji: '😞', label: 'Muy Insatisfecho' },
                        { value: 2, emoji: '😕', label: 'Insatisfecho' },
                        { value: 3, emoji: '😐', label: 'Neutral' },
                        { value: 4, emoji: '🙂', label: 'Satisfecho' },
                        { value: 5, emoji: '😄', label: 'Muy Satisfecho' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          className={`flex flex-col items-center gap-2 p-2 sm:p-4 rounded-xl transition-all ${
                            currentAnswer?.value === option.value
                              ? 'bg-blue-50 scale-110'
                              : 'hover:bg-gray-50 hover:scale-105'
                          }`}
                        >
                          <span className="text-4xl sm:text-5xl md:text-6xl">{option.emoji}</span>
                          <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 text-center whitespace-nowrap">
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
            {currentQ.type === 'nps' && (() => {
              const usar_slider = currentQ.usar_slider !== false; // Default to true if not specified
              const sliderValue = currentAnswer?.value ?? 5;

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
                        <div className="text-sm text-gray-500 mt-1">
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
                            handleAnswer(value);
                          }}
                          className="nps-slider w-full h-3 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 60%, #60a5fa 60%, #60a5fa 80%, #34d399 80%, #34d399 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1 font-medium">
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
                    <div className="flex flex-nowrap justify-start sm:justify-center gap-0.5 sm:gap-2 overflow-x-auto sm:px-0 pb-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                        const isSelected = currentAnswer?.value === value;
                        let bgColor = '#fbbf24'; // Yellow for 0-6
                        if (value >= 7 && value <= 8) bgColor = '#60a5fa'; // Blue for 7-8
                        if (value >= 9) bgColor = '#34d399'; // Green for 9-10

                        return (
                          <button
                            key={value}
                            onClick={() => handleAnswer(value)}
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
                    <div className="flex justify-between text-xs text-gray-600 mt-4 px-4">
                      <span className="font-medium">Nada probable</span>
                      <span className="font-medium">Muy probable</span>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Multiple Choice */}
            {currentQ.type === 'multiple-choice' && (() => {
              const isYesNo = isYesNoQuestion(currentQ.opciones);
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
                const options = currentQ.opciones && currentQ.opciones.length > 0
                  ? currentQ.opciones
                  : ['Yes', 'No'];

                return (
                  <div className="flex justify-center gap-4 mb-8">
                    {options.map((option, i) => {
                      const isSelected = currentAnswer?.value === option;
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option)}
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
                const options = currentQ.opciones && currentQ.opciones.length > 0
                  ? currentQ.opciones
                  : ['Opción 1', 'Opción 2', 'Opción 3'];

                // Show dropdown if usar_dropdown is enabled
                if (currentQ.usar_dropdown) {
                  const selectedValue = currentAnswer?.value as string || '';

                  return (
                    <div className="mb-8">
                      <select
                        value={selectedValue}
                        onChange={(e) => handleAnswer(e.target.value)}
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
                      const isSelected = currentAnswer?.value === option;
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(option)}
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
            {currentQ.type === 'text' && (() => {
              const textValue = typeof currentAnswer?.value === 'string' ? currentAnswer.value : '';
              const isEmailMode = currentQ.solo_email;
              const hasText = textValue.trim().length > 0;
              const emailError = isEmailMode && hasText && !isValidEmail(textValue.trim());
              const isOptional = currentQ.opcional;

              return (
                <div className="mb-8">
                  <div className="items-center justify-between mb-2">
                    {currentQ.subtitle && (
                      <p className="text-sm text-gray-600">{currentQ.subtitle}</p>
                    )}
                    {isOptional && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        Opcional
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={textValue}
                      onChange={(e) => handleAnswer(e.target.value)}
                      rows={6}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none resize-none text-gray-900 transition-colors ${
                        emailError
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      }`}
                      placeholder={isEmailMode ? 'your.email@example.com' : 'Type your answer here...'}
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
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Por favor ingresa un correo electrónico válido
                    </p>
                  )}
                  {!emailError && (
                    <p className="text-xs text-gray-500 mt-2">
                      {textValue.length} characters{isEmailMode ? ' • Formato de email requerido' : ''}{isOptional && !hasText ? ' • Puedes dejar en blanco' : ''}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Score Matrix */}
            {currentQ.type === 'score-matrix' && (() => {
              const rows = currentQ.matrix_rows || ['Statement 1', 'Statement 2'];
              const columns = currentQ.matrix_columns || ['1', '2', '3', '4', '5'];
              const useStars = currentQ.use_stars ?? true;

              // Parse current answer as object (rowIndex -> columnIndex)
              let matrixAnswers: Record<number, number> = {};
              try {
                if (currentAnswer?.value) {
                  matrixAnswers = typeof currentAnswer.value === 'string'
                    ? JSON.parse(currentAnswer.value)
                    : currentAnswer.value;
                }
              } catch (e) {
                matrixAnswers = {};
              }

              const handleMatrixAnswer = (rowIndex: number, columnIndex: number) => {
                const updated = { ...matrixAnswers, [rowIndex]: columnIndex };
                handleAnswer(JSON.stringify(updated));
              };

              return (
                <div className="mb-8">
                  {currentQ.subtitle && (
                    <p className="text-sm text-gray-600 mb-4">{currentQ.subtitle}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    {/* Column Headers */}
                    <div className="flex gap-2 pl-36">
                      {columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex-1 flex justify-center">
                          <p className="text-xs text-gray-600 font-medium">{col}</p>
                        </div>
                      ))}
                    </div>

                    {/* Matrix Rows */}
                    {rows.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-2 items-center">
                        {/* Row Label */}
                        <div className="w-32 flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700 text-right pr-4">{row}</p>
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
                                        : 'fill-gray-300 text-gray-300'
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
                                      : 'border-gray-300 hover:border-gray-400 bg-white'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600'
                                      : 'border-gray-300'
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
            {currentQ.type === 'ranking' && (() => {
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
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <GripVertical className={`w-5 h-5 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${isDragging ? 'text-blue-900' : 'text-gray-700'}`}>{item}</p>
                  </div>
                );
              };

              // Parse current answer as ordered array
              let rankedItems: string[] = [];
              try {
                if (currentAnswer?.value) {
                  rankedItems = typeof currentAnswer.value === 'string'
                    ? JSON.parse(currentAnswer.value)
                    : currentAnswer.value;
                } else {
                  rankedItems = [...(currentQ.opciones || ['Option 1', 'Option 2', 'Option 3'])];
                }
              } catch (e) {
                rankedItems = [...(currentQ.opciones || ['Option 1', 'Option 2', 'Option 3'])];
              }

              const moveItem = (dragIndex: number, hoverIndex: number) => {
                const updated = [...rankedItems];
                const [removed] = updated.splice(dragIndex, 1);
                updated.splice(hoverIndex, 0, removed);
                handleAnswer(JSON.stringify(updated));
              };

              return (
                <div className="mb-8">
                  {currentQ.ranking_instruction && (
                    <p className="text-sm text-gray-600 mb-4">{currentQ.ranking_instruction}</p>
                  )}
                  {!currentQ.ranking_instruction && currentQ.subtitle && (
                    <p className="text-sm text-gray-600 mb-4">{currentQ.subtitle}</p>
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

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    💡 Arrastra y suelta para ordenar tus preferencias
                  </p>
                </div>
              );
            })()}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || isSubmitting}
                className="flex-1 flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!isCurrentAnswerValid() || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Submit
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

          {/* Auto-save Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {hasAnswer ? '✓ Guardado automáticamente' : 'Selecciona una opción para continuar'}
            </p>
          </div>
        </div>
      </div>

      {/* Survey Footer */}
      <SurveyFooter />
    </div>
  );
}