import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Eye,
  GripVertical,
  ListOrdered,
  Star,
  MessageCircle,
  CheckSquare,
  Palette,
  LayoutList,
  Upload,
  CheckCircle,
  Loader,
  Trash2,
  Copy,
  Plus,
  X,
  GitBranch,
  Layers,
  ArrowRight,
  ArrowLeft,
  Minus,
  Check,
  Grid3x3,
  ArrowUpDown,
  Gauge,
} from 'lucide-react';
import * as api from '../lib/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import {
  getBuilderReturnProyecto,
  navigateToAdminProyecto,
} from '../lib/builderNavigation';
import { isCsatStarMode } from '../lib/surveyQuestionUtils';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ConditionalLogic {
  option_index: number;
  jump_to_question_id: string; // Can be a question ID or "END_SURVEY" to finish the form
}

// NPS group logic: 3 ranges instead of 11 individual options
type NPSGroup = 'detractor' | 'passive' | 'promoter'; // 0-6 | 7-8 | 9-10
interface NPSGroupLogic {
  group: NPSGroup;
  jump_to_question_id: string; // question ID or "END_SURVEY"
}

// Text question logic: answered vs skipped
type TextCondition = 'answered' | 'skipped';
interface TextConditionalLogic {
  condition: TextCondition;
  jump_to_question_id: string; // question ID or "END_SURVEY"
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

interface PreguntaSchema {
  pregunta_id: string;
  tipo: 'likert' | 'sus' | 'csat' | 'nps' | 'multiple-choice' | 'text' | 'separator' | 'score-matrix' | 'ranking' ;
  titulo_pregunta: string;
  subtitulo_pregunta?: string;
  solo_email?: boolean;
  opcional?: boolean; // For 'text' type - true = optional (can skip), false/undefined = required
  respuesta_unica?: boolean; // For 'multiple-choice' type - true = radio, false/undefined = checkbox
  usar_dropdown?: boolean; // For 'multiple-choice' type - true = dropdown, false/undefined = radio/checkbox
  usar_slider?: boolean; // For 'nps' type - true = slider, false/undefined = numbers
  opciones: string[];
  orden: number;
  // Labels personalizados para preguntas SUS
  label_izquierda?: string;
  label_derecha?: string;
  escala_sus?: 3 | 5 | 10; // Número de puntos en la escala SUS
  // Score Matrix specific fields
  matrix_rows?: string[]; // Items to rate (e.g., "Hablar", "Escribir", "Leer")
  matrix_columns?: string[]; // Scale labels (e.g., "Malo", "Bajo", "Promedio", "Alto", "Buenísimo")
  use_stars?: boolean; // score-matrix: stars vs radio; CSAT: stars vs caritas
  // Ranking specific fields
  ranking_instruction?: string; // Instructions for ranking (e.g., "Arrastra y ordena de más a menos.")
  // Conditional logic for question flow
  conditional_logic?: ConditionalLogic[];
  // NPS-specific group logic (0-6 / 7-8 / 9-10)
  nps_group_logic?: NPSGroupLogic[];
  // Text question logic (answered / skipped)
  text_logic?: TextConditionalLogic[];
  section_id?: string; // Groups questions into sections
}

interface EncuestaRow {
  id: string;
  nombre_encuesta: string;
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
    color_primario: string;
    modo_visualizacion: 'scroll' | 'paginated';
    bloquear_regreso?: boolean;
  };
  preguntas: PreguntaSchema[];
  sections?: SectionMetadata[]; // Metadata for sections
  estado: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

function editorMetaStamp(): { updated_at: string; updated_by: string } {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      updated_at: new Date().toISOString(),
      updated_by: user.name || 'Usuario',
    };
  } catch {
    return { updated_at: new Date().toISOString(), updated_by: 'Usuario' };
  }
}

function formatUpdatedLabel(iso: string, by?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const date = `${dd}-${mm}-${yyyy}`;
  return by ? `${date}, ${by}` : date;
}

// ── Drag & Drop types ─────────────────────────────────────────────────────────

const QUESTION_DRAG_TYPE = 'SURVEY_QUESTION';

interface DragItem {
  id: string;
  index: number;
}

// ── DraggableQuestionCard ─────────────────────────────────────────────────────
// Defined OUTSIDE SurveyBuilder so hooks are called at the top level of a
// proper React component (not inside a .map() callback).

interface DraggableCardProps {
  question: PreguntaSchema;
  index: number;
  allQuestions: PreguntaSchema[];
  sections: SectionMetadata[];
  moveQuestion: (from: number, to: number) => void;
  updateQuestion: (index: number, field: keyof PreguntaSchema, value: any) => void;
  updateOption: (questionIndex: number, optionIndex: number, value: string) => void;
  addOption: (questionIndex: number) => void;
  removeOption: (questionIndex: number, optionIndex: number) => void;
  deleteQuestion: (index: number) => void;
  duplicateQuestion: (index: number) => void;
  updateSusScale: (questionIndex: number, scale: 3 | 5 | 10) => void;
  updateConditionalLogic: (questionIndex: number, logic: ConditionalLogic[]) => void;
  updateNPSGroupLogic: (questionIndex: number, logic: NPSGroupLogic[]) => void;
  updateTextLogic: (questionIndex: number, logic: TextConditionalLogic[]) => void;
  moveQuestionToSection: (questionIndex: number, sectionId: string | undefined) => void;
}

function DraggableQuestionCard({
  question,
  index,
  allQuestions,
  sections,
  moveQuestion,
  updateQuestion,
  updateOption,
  addOption,
  removeOption,
  deleteQuestion,
  duplicateQuestion,
  updateSusScale,
  updateConditionalLogic,
  updateNPSGroupLogic,
  updateTextLogic,
  moveQuestionToSection,
}: DraggableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const [showLogicModal, setShowLogicModal] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  // Drag source — only the grip handle activates drag
  const [{ isDragging }, drag, dragPreview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: QUESTION_DRAG_TYPE,
    item: () => ({ id: question.pregunta_id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Drop target — each card is a drop zone
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: QUESTION_DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!cardRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverRect = cardRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      // Only move when cursor crosses the midpoint of the hovered card
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveQuestion(dragIndex, hoverIndex);
      // Mutate item to reflect new index so hover keeps working
      item.index = hoverIndex;
    },
  });

  // Connect refs:
  // - dragPreview + drop → whole card (shows full card as drag ghost)
  // - drag → handle button only
  dragPreview(drop(cardRef));
  drag(dragHandleRef);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-card rounded-[10px] relative w-full shrink-0"
      style={{ opacity: isDragging ? 0.35 : 1 }}
    >
      {/* Border overlay — highlights when a card is being dragged over */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none rounded-[10px] border transition-all ${
          isOver
            ? 'border-2 border-[#8C59FE] shadow-[0_0_0_3px_rgba(140,89,254,0.15)]'
            : 'border border-[#e5e7eb] dark:border-border'
        } hover:shadow-md group`}
      />

      <div className="flex flex-col gap-[16px] items-start pt-[25px] px-[25px] pb-[25px] relative w-full">
        <div className="flex items-start gap-3 w-full">

          {/* ── Drag handle ── */}
          <button
            ref={dragHandleRef}
            className="text-[#99a1af] dark:text-muted-foreground hover:text-[#364153] dark:text-foreground cursor-grab active:cursor-grabbing mt-0.5 touch-none select-none"
            title="Arrastrar para reordenar"
            // Prevent click events from bubbling so the handle doesn't interfere
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          <div className="flex-1">
            {/* Question meta + actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#6a7282] dark:text-muted-foreground uppercase tracking-[0.5px]">
                  Pregunta {index + 1} · {question.tipo}
                </span>
                {/* Logic badge */}
                {(question.tipo === 'multiple-choice' || question.tipo === 'likert' || question.tipo === 'csat' || question.tipo === 'nps' || question.tipo === 'text') && (() => {
                  const activeRules = question.tipo === 'nps'
                    ? (question.nps_group_logic?.length ?? 0)
                    : question.tipo === 'text'
                    ? (question.text_logic?.length ?? 0)
                    : (question.conditional_logic?.length ?? 0);
                  return (
                  <button
                    onClick={() => setShowLogicModal(true)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-[0.5px] transition-colors ${
                      activeRules > 0
                        ? 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white'
                        : 'bg-[#f3f4f6] dark:bg-muted text-[#6a7282] dark:text-muted-foreground hover:bg-[#e5e7eb]'
                    }`}
                    title={`Configurar lógica condicional${activeRules > 0 ? ` (${activeRules} regla${activeRules > 1 ? 's' : ''} activa${activeRules > 1 ? 's' : ''})` : ''}`}
                  >
                    <GitBranch className="w-3 h-3" />
                    Logic
                    {activeRules > 0 && (
                      <span className="ml-0.5">({activeRules})</span>
                    )}
                  </button>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1">
                {/* Move to section button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSectionMenu(!showSectionMenu)}
                    className="text-[#99a1af] dark:text-muted-foreground hover:text-[#8C59FE] transition-colors p-1.5 rounded-[6px] hover:bg-[#8C59FE]/10"
                    title="Mover a sección"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  {showSectionMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSectionMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-card border border-[#e5e7eb] dark:border-border rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] z-20 min-w-[180px] overflow-hidden">
                        <button
                          onClick={() => {
                            moveQuestionToSection(index, undefined);
                            setShowSectionMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f9fafb] dark:hover:bg-accent transition-colors ${!question.section_id ? 'bg-[#f0f4ff] dark:bg-accent text-[#8C59FE]' : 'text-[#364153] dark:text-foreground'}`}
                        >
                          {!question.section_id && <Check className="w-3 h-3" />}
                          <span className="flex-1">Sin sección</span>
                        </button>
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => {
                              moveQuestionToSection(index, section.id);
                              setShowSectionMenu(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f9fafb] dark:hover:bg-accent transition-colors border-t border-[#f3f4f6] dark:border-border ${question.section_id === section.id ? 'bg-[#f0f4ff] dark:bg-accent text-[#8C59FE]' : 'text-[#364153] dark:text-foreground'}`}
                          >
                            {question.section_id === section.id && <Check className="w-3 h-3" />}
                            <span className="flex-1">{section.title}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => duplicateQuestion(index)}
                  className="text-[#99a1af] dark:text-muted-foreground hover:text-[#8C59FE] transition-colors p-1.5 rounded-[6px] hover:bg-[#8C59FE]/10"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(index)}
                  className="text-[#99a1af] dark:text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info box for specific question types - BEFORE title */}
            {question.tipo === 'separator' && (
              <div className="flex items-center gap-2 px-[12px] py-[8px] rounded-[8px] bg-slate-50 border border-slate-200 mb-3">
                <Minus className="w-[14px] h-[14px] shrink-0 text-slate-600" />
                <span className="text-[11px] text-slate-700 leading-[16px]">
                  Este elemento es solo informativo — no requiere respuesta del usuario
                </span>
              </div>
            )}
            {question.tipo === 'sus' && (
              <div className="flex items-center gap-2 px-[12px] py-[8px] rounded-[8px] bg-purple-50 border border-purple-200 mb-3">
                <Star className="w-[14px] h-[14px] shrink-0 text-purple-600" />
                <span className="text-[11px] text-purple-700 leading-[16px]">
                  Escala SUS de 1 a {question.escala_sus || 5} — Los labels aparecerán en los extremos
                </span>
              </div>
            )}
            {question.tipo === 'score-matrix' && (
              <div className="flex items-center gap-2 px-[12px] py-[8px] rounded-[8px] bg-yellow-50 border border-yellow-200 mb-3">
                <Grid3x3 className="w-[14px] h-[14px] shrink-0 text-yellow-600" />
                <span className="text-[11px] text-yellow-700 leading-[16px]">
                  Los usuarios podrán calificar cada fila con {question.use_stars ? 'estrellas' : 'radio buttons'} según las columnas de escala
                </span>
              </div>
            )}
            {question.tipo === 'ranking' && (
              <div className="flex items-center gap-2 px-[12px] py-[8px] rounded-[8px] bg-pink-50 border border-pink-200 mb-3">
                <ArrowUpDown className="w-[14px] h-[14px] shrink-0 text-pink-600" />
                <span className="text-[11px] text-pink-700 leading-[16px]">
                  Los usuarios podrán arrastrar y reordenar las opciones según su preferencia
                </span>
              </div>
            )}
            {question.tipo === 'nps' && (
              <div className="flex items-center gap-2 px-[12px] py-[8px] rounded-[8px] bg-teal-50 border border-teal-200 mb-3">
                <Gauge className="w-[14px] h-[14px] shrink-0 text-teal-600" />
                <span className="text-[11px] text-teal-700 leading-[16px]">
                  NPS de 0 a 10 — {question.usar_slider ? 'Vista slider con emojis en 9 y 10' : 'Vista de botones numéricos'}
                </span>
              </div>
            )}

            {/* Question title */}
            <input
              type="text"
              value={question.titulo_pregunta}
              onChange={(e) => updateQuestion(index, 'titulo_pregunta', e.target.value)}
              className="w-full text-[16px] font-medium text-[#101828] dark:text-foreground border-0 border-b-2 border-transparent hover:border-[#d1d5dc] dark:border-border focus:border-blue-400 focus:ring-0 px-0 py-1 mb-4 outline-none tracking-[-0.3125px]"
              placeholder="Título de la pregunta..."
            />

            {/* Type-specific fields */}
            {question.tipo === 'separator' ? (
              /* ── Separador informativo ── */
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Descripción <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(opcional)</span>
                  </label>
                  <textarea
                    value={question.subtitulo_pregunta ?? ''}
                    onChange={(e) => updateQuestion(index, 'subtitulo_pregunta', e.target.value)}
                    className="w-full h-[64px] px-[12px] py-[8px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px] placeholder:text-[rgba(10,10,10,0.35)] resize-none"
                    placeholder="Información adicional o instrucciones para esta sección..."
                  />
                </div>
              </div>
            ) : question.tipo === 'text' ? (
              /* ── Pregunta abierta ── */
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Subtítulo <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={question.subtitulo_pregunta ?? ''}
                    onChange={(e) => updateQuestion(index, 'subtitulo_pregunta', e.target.value)}
                    className="w-full h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px] placeholder:text-[rgba(10,10,10,0.35)]"
                    placeholder="Ej. Por favor escribe tu respuesta aquí..."
                  />
                </div>

                {/* Solo email toggle */}
                <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted">
                  <div className="flex items-center gap-[8px]">
                    <svg className="w-[14px] h-[14px] shrink-0" fill="none" viewBox="0 0 16 16">
                      <path d="M2.667 2.667h10.666c.737 0 1.334.597 1.334 1.333v8c0 .736-.597 1.333-1.334 1.333H2.667A1.333 1.333 0 0 1 1.333 12V4c0-.736.597-1.333 1.334-1.333Z" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"/>
                      <path d="m14.667 4-6.667 4.667L1.333 4" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2"/>
                    </svg>
                    <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                      Solo acepta emails
                    </span>
                    <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                      — valida formato correo electrónico
                    </span>
                  </div>
                  <button
                    onClick={() => updateQuestion(index, 'solo_email', !question.solo_email)}
                    className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                      question.solo_email ? 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE]' : 'bg-[#d1d5dc]'
                    }`}
                  >
                    <span
                      className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                        question.solo_email ? 'translate-x-[19px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>

                {/* Opcional toggle */}
                <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted">
                  <div className="flex items-center gap-[8px]">
                    <svg className="w-[14px] h-[14px] shrink-0 text-[#6A7282]" fill="none" viewBox="0 0 16 16" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M8 8v4m0 0h4m-4 0H4M8 1v3m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                    </svg>
                    <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                      Pregunta opcional
                    </span>
                    <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                      — permite avanzar sin responder
                    </span>
                  </div>
                  <button
                    onClick={() => updateQuestion(index, 'opcional', !question.opcional)}
                    className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                      question.opcional ? 'bg-gradient-to-r from-[#00C4B3] to-[#ACE738]' : 'bg-[#d1d5dc]'
                    }`}
                  >
                    <span
                      className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                        question.opcional ? 'translate-x-[19px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : question.tipo === 'sus' ? (
              /* ── Pregunta SUS - Labels editables ── */
              <div className="flex flex-col gap-[12px]">
                {/* Selector de escala */}
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Escala de puntos
                  </label>
                  <div className="flex gap-[8px]">
                    {[3, 5, 10].map((scale) => (
                      <button
                        key={scale}
                        onClick={() => updateSusScale(index, scale as 3 | 5 | 10)}
                        className={`flex-1 h-[36px] rounded-[8px] border-2 font-medium text-[14px] transition-all ${
                          (question.escala_sus || 5) === scale
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-[#d1d5dc] dark:border-border bg-white dark:bg-card text-[#6a7282] dark:text-muted-foreground hover:border-purple-300'
                        }`}
                      >
                        {scale} puntos
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Label izquierdo <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(valor mínimo)</span>
                  </label>
                  <input
                    type="text"
                    value={question.label_izquierda ?? 'Totalmente en desacuerdo'}
                    onChange={(e) => updateQuestion(index, 'label_izquierda', e.target.value)}
                    className="w-full h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px] placeholder:text-[rgba(10,10,10,0.35)]"
                    placeholder="Totalmente en desacuerdo"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Label derecho <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(valor máximo)</span>
                  </label>
                  <input
                    type="text"
                    value={question.label_derecha ?? 'Totalmente de acuerdo'}
                    onChange={(e) => updateQuestion(index, 'label_derecha', e.target.value)}
                    className="w-full h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px] placeholder:text-[rgba(10,10,10,0.35)]"
                    placeholder="Totalmente de acuerdo"
                  />
                </div>
              </div>
            ) : question.tipo === 'score-matrix' ? (
              /* ── Score Matrix ── */
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Statement <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(mínimo 2)</span>:
                  </label>
                  {(question.matrix_rows || []).map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={row}
                        onChange={(e) => {
                          const rows = [...(question.matrix_rows || [])];
                          rows[rowIndex] = e.target.value;
                          updateQuestion(index, 'matrix_rows', rows);
                        }}
                        className="flex-1 h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px]"
                        placeholder={`Fila ${rowIndex + 1}`}
                      />
                      {(question.matrix_rows || []).length > 2 && (
                        <button
                          onClick={() => {
                            const rows = [...(question.matrix_rows || [])];
                            rows.splice(rowIndex, 1);
                            updateQuestion(index, 'matrix_rows', rows);
                          }}
                          className="text-[#99a1af] dark:text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const rows = [...(question.matrix_rows || []), `Fila ${(question.matrix_rows || []).length + 1}`];
                      updateQuestion(index, 'matrix_rows', rows);
                    }}
                    className="h-[32px] rounded-[6px] border border-dashed border-[#d1d5dc] dark:border-border text-[#99a1af] dark:text-muted-foreground hover:text-[#6a7282] dark:text-muted-foreground hover:border-[#6a7282] transition-all text-[12px] font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Agregar fila
                  </button>
                </div>

                {/* Toggle: Estrellas vs Radio Buttons */}
                <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[13px]">⭐️</span>
                    <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                      Estrellas
                    </span>
                    <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                      Al apagar esta opción el usuario verá radio buttons
                    </span>
                  </div>
                  <button
                    onClick={() => updateQuestion(index, 'use_stars', !question.use_stars)}
                    className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                      question.use_stars ? 'bg-gradient-to-r from-[#00C4B3] to-[#ACE738]' : 'bg-[#d1d5dc]'
                    }`}
                  >
                    <span
                      className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                        question.use_stars ? 'translate-x-[19px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Columnas con valor <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(etiquetas de escala, mínimo 2, máximo 5)</span>:
                  </label>
                  {(question.matrix_columns || []).map((col, colIndex) => (
                    <div key={colIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => {
                          const cols = [...(question.matrix_columns || [])];
                          cols[colIndex] = e.target.value;
                          updateQuestion(index, 'matrix_columns', cols);
                        }}
                        className="flex-1 h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px]"
                        placeholder={`Columna ${colIndex + 1}`}
                      />
                      {(question.matrix_columns || []).length > 2 && (
                        <button
                          onClick={() => {
                            const cols = [...(question.matrix_columns || [])];
                            cols.splice(colIndex, 1);
                            updateQuestion(index, 'matrix_columns', cols);
                          }}
                          className="text-[#99a1af] dark:text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(question.matrix_columns || []).length < 5 && (
                    <button
                      onClick={() => {
                        const cols = [...(question.matrix_columns || []), `Columna ${(question.matrix_columns || []).length + 1}`];
                        updateQuestion(index, 'matrix_columns', cols);
                      }}
                      className="h-[32px] rounded-[6px] border border-dashed border-[#d1d5dc] dark:border-border text-[#99a1af] dark:text-muted-foreground hover:text-[#6a7282] dark:text-muted-foreground hover:border-[#6a7282] transition-all text-[12px] font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Agregar columna
                    </button>
                  )}
                  {(question.matrix_columns || []).length >= 5 && (
                    <div className="h-[32px] rounded-[6px] border border-[#e5e7eb] dark:border-border bg-[#f9fafb] dark:bg-muted text-[#99a1af] dark:text-muted-foreground text-[11px] font-medium flex items-center justify-center gap-2">
                      Máximo 5 columnas alcanzado
                    </div>
                  )}
                </div>
              </div>
            ) : question.tipo === 'ranking' ? (
              /* ── Ranking ── */
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Instrucción:
                  </label>
                  <input
                    type="text"
                    value={question.ranking_instruction ?? 'Arrastra y deja hasta arriba el favorito'}
                    onChange={(e) => updateQuestion(index, 'ranking_instruction', e.target.value)}
                    className="w-full h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px] placeholder:text-[rgba(10,10,10,0.35)]"
                    placeholder="Arrastra y deja hasta arriba el favorito"
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Opciones <span className="font-normal text-[#99a1af] dark:text-muted-foreground">(mínimo 2)</span>:
                  </label>
                  {question.opciones.map((option, optIndex) => (
                    <div key={optIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, optIndex, e.target.value)}
                        className="flex-1 h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px]"
                        placeholder={`Opción ${optIndex + 1}`}
                      />
                      {question.opciones.length > 2 && (
                        <button
                          onClick={() => removeOption(index, optIndex)}
                          className="text-[#99a1af] dark:text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(index)}
                    className="h-[32px] rounded-[6px] border border-dashed border-[#d1d5dc] dark:border-border text-[#99a1af] dark:text-muted-foreground hover:text-[#6a7282] dark:text-muted-foreground hover:border-[#6a7282] transition-all text-[12px] font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Agregar opción
                  </button>
                </div>
              </div>
            ) : (
              /* ── Options list ── */
              <div className="flex flex-col gap-[8px]">
                {/* Single/Multiple choice toggle for multiple-choice type */}
                {question.tipo === 'multiple-choice' && (
                  <>
                    <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted mb-2">
                      <div className="flex items-center gap-[8px]">
                        <CheckSquare className="w-[14px] h-[14px] shrink-0 text-[#6A7282]" />
                        <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                          Respuesta única
                        </span>
                        <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                          — radio button vs checkbox
                        </span>
                      </div>
                      <button
                        onClick={() => updateQuestion(index, 'respuesta_unica', !question.respuesta_unica)}
                        className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                          question.respuesta_unica ? 'bg-blue-500' : 'bg-[#d1d5dc]'
                        }`}
                      >
                        <span
                          className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                            question.respuesta_unica ? 'translate-x-[19px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted mb-2">
                      <div className="flex items-center gap-[8px]">
                        <LayoutList className="w-[14px] h-[14px] shrink-0 text-[#6A7282]" />
                        <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                          Mostrar como dropdown
                        </span>
                        <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                          — menú desplegable vs lista
                        </span>
                      </div>
                      <button
                        onClick={() => updateQuestion(index, 'usar_dropdown', !question.usar_dropdown)}
                        className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                          question.usar_dropdown ? 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE]' : 'bg-[#d1d5dc]'
                        }`}
                      >
                        <span
                          className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                            question.usar_dropdown ? 'translate-x-[19px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* Stars/Faces toggle for CSAT type */}
                {question.tipo === 'csat' && (
                  <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted mb-2">
                    <div className="flex items-center gap-[8px]">
                      <span className="text-[13px]">⭐️</span>
                      <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                        Estrellas
                      </span>
                      <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                        — al apagar se muestran caritas
                      </span>
                    </div>
                    <button
                      onClick={() => updateQuestion(index, 'use_stars', !isCsatStarMode(question))}
                      className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                        isCsatStarMode(question) ? 'bg-gradient-to-r from-[#00C4B3] to-[#ACE738]' : 'bg-[#d1d5dc]'
                      }`}
                    >
                      <span
                        className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                          isCsatStarMode(question) ? 'translate-x-[19px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Slider/Numbers toggle for NPS type */}
                {question.tipo === 'nps' && (
                  <div className="flex items-center justify-between h-[36px] px-[12px] rounded-[8px] border border-[#d1d5dc] dark:border-border bg-[#f9fafb] dark:bg-muted mb-2">
                    <div className="flex items-center gap-[8px]">
                      <Gauge className="w-[14px] h-[14px] shrink-0 text-[#6A7282]" />
                      <span className="font-medium text-[13px] leading-[18px] text-[#364153] dark:text-foreground tracking-[-0.1px]">
                        Usar slider
                      </span>
                      <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground">
                        — deslizador vs botones numéricos
                      </span>
                    </div>
                    <button
                      onClick={() => updateQuestion(index, 'usar_slider', !question.usar_slider)}
                      className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                        question.usar_slider ? 'bg-gradient-to-r from-teal-400 to-teal-600' : 'bg-[#d1d5dc]'
                      }`}
                    >
                      <span
                        className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                          question.usar_slider ? 'translate-x-[19px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {question.tipo !== 'nps' && !(question.tipo === 'csat' && isCsatStarMode(question)) && (
                  <label className="font-medium text-[12px] leading-[16px] text-[#6a7282] dark:text-muted-foreground">
                    Opciones{question.tipo === 'multiple-choice' && <span className="font-normal text-[#99a1af] dark:text-muted-foreground"> (mínimo 2)</span>}:
                  </label>
                )}
                {question.tipo === 'csat' && isCsatStarMode(question) && (
                  <p className="text-[11px] text-[#99a1af] dark:text-muted-foreground mb-1">
                    Modo estrellas: escala fija de 1 a 5
                  </p>
                )}
                {question.tipo !== 'nps' && !(question.tipo === 'csat' && isCsatStarMode(question)) && question.opciones.map((option, optIndex) => (
                  <div key={optIndex} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, optIndex, e.target.value)}
                      className="flex-1 h-[36px] px-[12px] text-[14px] border border-[#d1d5dc] dark:border-border rounded-[8px] focus:border-blue-400 focus:ring-0 outline-none tracking-[-0.1504px]"
                      placeholder={`Opción ${optIndex + 1}`}
                    />
                    <span className="text-[11px] text-[#99a1af] dark:text-muted-foreground font-mono shrink-0">[{optIndex}]</span>
                    {question.tipo === 'multiple-choice' && question.opciones.length > 2 && (
                      <button
                        onClick={() => removeOption(index, optIndex)}
                        className="text-[#99a1af] dark:text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                        title="Eliminar opción"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {question.tipo === 'multiple-choice' && (
                  <button
                    onClick={() => addOption(index)}
                    className="flex items-center gap-2 text-[#99a1af] dark:text-muted-foreground hover:text-blue-500 transition-colors p-1.5 rounded-[6px] hover:bg-blue-50 w-full justify-center border border-dashed border-[#d1d5dc] dark:border-border hover:border-blue-400"
                    title="Agregar opción"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[12px] font-medium">Agregar opción</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conditional Logic Modal */}
        {showLogicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLogicModal(false)}>
            <div
              className="bg-white dark:bg-card rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[520px] max-h-[600px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] dark:border-border">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#8C59FE]" />
                  <h3 className="font-semibold text-[16px] text-[#101828] dark:text-foreground">Lógica Condicional</h3>
                </div>
                <button
                  onClick={() => setShowLogicModal(false)}
                  className="text-[#99a1af] dark:text-muted-foreground hover:text-[#364153] dark:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 max-h-[440px] overflow-y-auto">

                {/* ── Text Question Logic (answered / skipped) ── */}
                {question.tipo === 'text' ? (() => {
                  const TEXT_CONDITIONS: { condition: TextCondition; label: string; description: string; color: string }[] = [
                    { condition: 'answered', label: 'Respondió', description: 'Escribió cualquier texto', color: 'bg-green-50 border-green-200 text-green-700' },
                    { condition: 'skipped',  label: 'Omitió',    description: 'No escribió nada (pregunta opcional)', color: 'bg-gray-50 dark:bg-background border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground' },
                  ];

                  return (
                    <>
                      <p className="text-[13px] text-[#6a7282] dark:text-muted-foreground mb-4">
                        Define a qué pregunta saltar según si el usuario respondió o dejó vacía la pregunta.
                      </p>
                      {!question.opcional && (
                        <div className="mb-4 p-3 rounded-[8px] bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                          <span className="font-semibold">Nota:</span> La condición "Omitió" solo aplica si la pregunta está marcada como <span className="font-semibold">opcional</span>.
                        </div>
                      )}
                      <div className="space-y-3">
                        {TEXT_CONDITIONS.map(({ condition, label, description, color }) => {
                          const existingRule = question.text_logic?.find(r => r.condition === condition);
                          const isEndSurvey = existingRule?.jump_to_question_id === 'END_SURVEY';
                          const targetQ = (existingRule && !isEndSurvey)
                            ? allQuestions.find(q => q.pregunta_id === existingRule.jump_to_question_id)
                            : null;

                          return (
                            <div
                              key={condition}
                              className={`p-3 rounded-[8px] border transition-all ${
                                existingRule
                                  ? 'bg-gradient-to-r from-[#597AFF]/5 to-[#8C59FE]/5 border-[#8C59FE]/30'
                                  : 'bg-[#f9fafb] dark:bg-muted border-[#e5e7eb] dark:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                                  {label}
                                </span>
                                <span className="text-[12px] text-[#6a7282] dark:text-muted-foreground">{description}</span>
                                {existingRule && (isEndSurvey || targetQ) && (
                                  <span className="text-[10px] text-[#8C59FE] font-medium flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    {isEndSurvey
                                      ? '🏁 Finalizar'
                                      : `${targetQ!.titulo_pregunta.substring(0, 25)}${targetQ!.titulo_pregunta.length > 25 ? '...' : ''}`
                                    }
                                  </span>
                                )}
                              </div>
                              <select
                                value={existingRule?.jump_to_question_id || ''}
                                onChange={(e) => {
                                  const newLogic = [...(question.text_logic || [])].filter(r => r.condition !== condition);
                                  if (e.target.value) newLogic.push({ condition, jump_to_question_id: e.target.value });
                                  updateTextLogic(index, newLogic);
                                }}
                                className="w-full h-[32px] px-3 text-[13px] border border-[#d1d5dc] dark:border-border rounded-[6px] bg-white dark:bg-card focus:border-[#8C59FE] focus:ring-0 outline-none"
                              >
                                <option value="">Sin lógica (continuar normalmente)</option>
                                <option value="END_SURVEY">🏁 Finalizar formulario (enviar respuestas)</option>
                                <optgroup label="Saltar a pregunta:">
                                  {allQuestions
                                    .map((q, realIndex) => ({ question: q, realIndex }))
                                    .filter(({ question: q, realIndex }) =>
                                      q.pregunta_id !== question.pregunta_id && realIndex > index
                                    )
                                    .map(({ question: q, realIndex }) => (
                                      <option key={q.pregunta_id} value={q.pregunta_id}>
                                        Pregunta {realIndex + 1} - {q.titulo_pregunta.substring(0, 30)}{q.titulo_pregunta.length > 30 ? '...' : ''}
                                      </option>
                                    ))}
                                  {allQuestions.every((q, realIndex) => q.pregunta_id === question.pregunta_id || realIndex <= index) && (
                                    <option disabled>No hay preguntas posteriores disponibles</option>
                                  )}
                                </optgroup>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })() : /* ── NPS Group Logic (3 ranges) ── */
                question.tipo === 'nps' ? (() => {
                  const NPS_GROUPS: { group: NPSGroup; label: string; range: string; color: string }[] = [
                    { group: 'detractor', label: 'Detractores',  range: '0 – 6',  color: 'bg-red-50 border-red-200 text-red-700' },
                    { group: 'passive',   label: 'Pasivos',      range: '7 – 8',  color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                    { group: 'promoter',  label: 'Promotores',   range: '9 – 10', color: 'bg-green-50 border-green-200 text-green-700' },
                  ];

                  return (
                    <>
                      <p className="text-[13px] text-[#6a7282] dark:text-muted-foreground mb-4">
                        Define a qué pregunta saltar según el grupo NPS seleccionado.
                      </p>
                      <div className="space-y-3">
                        {NPS_GROUPS.map(({ group, label, range, color }) => {
                          const existingRule = question.nps_group_logic?.find(r => r.group === group);
                          const isEndSurvey = existingRule?.jump_to_question_id === 'END_SURVEY';
                          const targetQ = (existingRule && !isEndSurvey)
                            ? allQuestions.find(q => q.pregunta_id === existingRule.jump_to_question_id)
                            : null;

                          return (
                            <div
                              key={group}
                              className={`p-3 rounded-[8px] border transition-all ${
                                existingRule
                                  ? 'bg-gradient-to-r from-[#597AFF]/5 to-[#8C59FE]/5 border-[#8C59FE]/30'
                                  : 'bg-[#f9fafb] dark:bg-muted border-[#e5e7eb] dark:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                                  {range}
                                </span>
                                <span className="text-[13px] font-medium text-[#364153] dark:text-foreground">{label}</span>
                                {existingRule && (isEndSurvey || targetQ) && (
                                  <span className="text-[10px] text-[#8C59FE] font-medium flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    {isEndSurvey
                                      ? '🏁 Finalizar'
                                      : `${targetQ!.titulo_pregunta.substring(0, 25)}${targetQ!.titulo_pregunta.length > 25 ? '...' : ''}`
                                    }
                                  </span>
                                )}
                              </div>
                              <select
                                value={existingRule?.jump_to_question_id || ''}
                                onChange={(e) => {
                                  const newLogic = [...(question.nps_group_logic || [])].filter(r => r.group !== group);
                                  if (e.target.value) {
                                    newLogic.push({ group, jump_to_question_id: e.target.value });
                                  }
                                  updateNPSGroupLogic(index, newLogic);
                                }}
                                className="w-full h-[32px] px-3 text-[13px] border border-[#d1d5dc] dark:border-border rounded-[6px] bg-white dark:bg-card focus:border-[#8C59FE] focus:ring-0 outline-none"
                              >
                                <option value="">Sin lógica (continuar normalmente)</option>
                                <option value="END_SURVEY">🏁 Finalizar formulario (enviar respuestas)</option>
                                <optgroup label="Saltar a pregunta:">
                                  {allQuestions
                                    .map((q, realIndex) => ({ question: q, realIndex }))
                                    .filter(({ question: q, realIndex }) =>
                                      q.pregunta_id !== question.pregunta_id && realIndex > index
                                    )
                                    .map(({ question: q, realIndex }) => (
                                      <option key={q.pregunta_id} value={q.pregunta_id}>
                                        Pregunta {realIndex + 1} - {q.titulo_pregunta.substring(0, 30)}
                                        {q.titulo_pregunta.length > 30 ? '...' : ''}
                                      </option>
                                    ))}
                                  {allQuestions.every((q, realIndex) => q.pregunta_id === question.pregunta_id || realIndex <= index) && (
                                    <option disabled>No hay preguntas posteriores disponibles</option>
                                  )}
                                </optgroup>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })() : (
                  /* ── Standard conditional logic (multiple-choice, likert, csat) ── */
                  <>
                    <p className="text-[13px] text-[#6a7282] dark:text-muted-foreground mb-4">
                      Define a qué pregunta saltar cuando se selecciona una opción específica.
                    </p>

                    {/* Summary of active rules */}
                    {question.conditional_logic && question.conditional_logic.length > 0 && (() => {
                      const invalidRules = question.conditional_logic.filter(logic => {
                        if (logic.jump_to_question_id === 'END_SURVEY') return false;
                        const targetQ = allQuestions.find(q => q.pregunta_id === logic.jump_to_question_id);
                        if (!targetQ) return true;
                        const targetIndex = allQuestions.findIndex(q => q.pregunta_id === logic.jump_to_question_id);
                        return targetIndex <= index;
                      });
                      const hasInvalidRules = invalidRules.length > 0;

                      return (
                        <div className={`mb-4 p-3 rounded-[8px] border ${hasInvalidRules ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-start gap-2">
                            {hasInvalidRules ? (
                              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            )}
                            <div className={`text-[12px] ${hasInvalidRules ? 'text-red-800' : 'text-blue-800'}`}>
                              <span className="font-semibold">
                                {question.conditional_logic.length} regla{question.conditional_logic.length > 1 ? 's' : ''} configurada{question.conditional_logic.length > 1 ? 's' : ''}
                                {hasInvalidRules && ` (${invalidRules.length} inválida${invalidRules.length > 1 ? 's' : ''})`}
                              </span>
                              <div className="mt-1 space-y-1">
                                {question.conditional_logic.map((logic, idx) => {
                                  const isEndSurvey = logic.jump_to_question_id === 'END_SURVEY';
                                  const targetQ = isEndSurvey ? null : allQuestions.find(q => q.pregunta_id === logic.jump_to_question_id);
                                  const targetIndex = targetQ ? allQuestions.findIndex(q => q.pregunta_id === logic.jump_to_question_id) : -1;
                                  const optionName = question.opciones[logic.option_index] || `[índice ${logic.option_index}]`;
                                  const isInvalid = !isEndSurvey && (!targetQ || targetIndex <= index);
                                  return (
                                    <div key={idx} className={`text-[11px] flex items-center gap-1 ${isInvalid ? 'text-red-700' : ''}`}>
                                      <span className="font-mono bg-white dark:bg-card px-1.5 py-0.5 rounded">[{logic.option_index}]</span>
                                      <span className="font-medium">{optionName}</span>
                                      <ArrowRight className="w-3 h-3 mx-1" />
                                      <span>
                                        {isEndSurvey ? '🏁 Finalizar formulario' : targetQ ? (
                                          <>{targetQ.titulo_pregunta}{targetIndex <= index && ' ⚠️ (salto hacia atrás no permitido)'}</>
                                        ) : '❌ Pregunta eliminada'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Current Logic Rules */}
                    <div className="space-y-3">
                      {question.opciones.map((option, optIndex) => {
                        const existingLogic = question.conditional_logic?.find(l => l.option_index === optIndex);
                        const isEndSurvey = existingLogic?.jump_to_question_id === 'END_SURVEY';
                        const targetQuestion = (existingLogic && !isEndSurvey)
                          ? allQuestions.find(q => q.pregunta_id === existingLogic.jump_to_question_id)
                          : null;

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-[8px] border transition-all ${
                              existingLogic
                                ? 'bg-gradient-to-r from-[#597AFF]/5 to-[#8C59FE]/5 border-[#8C59FE]/30'
                                : 'bg-[#f9fafb] dark:bg-muted border-[#e5e7eb] dark:border-border'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[11px] font-mono text-[#99a1af] dark:text-muted-foreground bg-white dark:bg-card px-2 py-0.5 rounded">[{optIndex}]</span>
                                <span className="text-[13px] font-medium text-[#364153] dark:text-foreground">{option}</span>
                                {existingLogic && (isEndSurvey || targetQuestion) && (
                                  <span className="text-[10px] text-[#8C59FE] font-medium flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    {isEndSurvey
                                      ? '🏁 Finalizar'
                                      : `${targetQuestion!.titulo_pregunta.substring(0, 25)}${targetQuestion!.titulo_pregunta.length > 25 ? '...' : ''}`
                                    }
                                  </span>
                                )}
                              </div>
                              <select
                                value={existingLogic?.jump_to_question_id || ''}
                                onChange={(e) => {
                                  const newLogic = [...(question.conditional_logic || [])].filter(l => l.option_index !== optIndex);
                                  if (e.target.value) newLogic.push({ option_index: optIndex, jump_to_question_id: e.target.value });
                                  updateConditionalLogic(index, newLogic);
                                }}
                                className="w-full h-[32px] px-3 text-[13px] border border-[#d1d5dc] dark:border-border rounded-[6px] bg-white dark:bg-card focus:border-[#8C59FE] focus:ring-0 outline-none"
                              >
                                <option value="">Sin lógica (continuar normalmente)</option>
                                <option value="END_SURVEY">🏁 Finalizar formulario (enviar respuestas)</option>
                                <optgroup label="Saltar a pregunta:">
                                  {allQuestions
                                    .map((q, realIndex) => ({ question: q, realIndex }))
                                    .filter(({ question: q, realIndex }) => q.pregunta_id !== question.pregunta_id && realIndex > index)
                                    .map(({ question: q, realIndex }) => (
                                      <option key={q.pregunta_id} value={q.pregunta_id}>
                                        Pregunta {realIndex + 1} - {q.titulo_pregunta.substring(0, 30)}{q.titulo_pregunta.length > 30 ? '...' : ''}
                                      </option>
                                    ))}
                                  {allQuestions.every((q, realIndex) => q.pregunta_id === question.pregunta_id || realIndex <= index) && (
                                    <option disabled>No hay preguntas posteriores disponibles</option>
                                  )}
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.opciones.length === 0 && (
                      <div className="text-center py-6 text-[13px] text-[#99a1af] dark:text-muted-foreground">
                        Agrega opciones a esta pregunta para configurar lógica condicional.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e7eb] dark:border-border">
                <button
                  onClick={() => {
                    if (question.tipo === 'text') {
                      const rules = question.text_logic || [];
                      let invalidCount = 0;
                      const validLogic: TextConditionalLogic[] = [];
                      rules.forEach(rule => {
                        if (rule.jump_to_question_id === 'END_SURVEY') { validLogic.push(rule); return; }
                        const targetQ = allQuestions.find(q => q.pregunta_id === rule.jump_to_question_id);
                        const targetIndex = targetQ ? allQuestions.findIndex(q => q.pregunta_id === rule.jump_to_question_id) : -1;
                        if (!targetQ || targetIndex <= index) { invalidCount++; } else { validLogic.push(rule); }
                      });
                      if (invalidCount > 0) {
                        updateTextLogic(index, validLogic);
                        alert(`Se eliminaron ${invalidCount} regla(s) de texto inválida(s).`);
                      } else {
                        alert('✅ Todas las reglas de pregunta abierta son válidas.');
                      }
                      return;
                    }

                    if (question.tipo === 'nps') {
                      const rules = question.nps_group_logic || [];
                      let invalidCount = 0;
                      const validLogic: NPSGroupLogic[] = [];
                      rules.forEach(rule => {
                        if (rule.jump_to_question_id === 'END_SURVEY') { validLogic.push(rule); return; }
                        const targetQ = allQuestions.find(q => q.pregunta_id === rule.jump_to_question_id);
                        const targetIndex = targetQ ? allQuestions.findIndex(q => q.pregunta_id === rule.jump_to_question_id) : -1;
                        if (!targetQ || targetIndex <= index) { invalidCount++; } else { validLogic.push(rule); }
                      });
                      if (invalidCount > 0) {
                        updateNPSGroupLogic(index, validLogic);
                        alert(`Se eliminaron ${invalidCount} regla(s) NPS inválida(s).`);
                      } else {
                        alert('✅ Todas las reglas NPS son válidas.');
                      }
                      return;
                    }

                    // Standard logic validation
                    let invalidCount = 0;
                    const validLogic: ConditionalLogic[] = [];
                    if (question.conditional_logic) {
                      question.conditional_logic.forEach((logic) => {
                        const isEndSurvey = logic.jump_to_question_id === 'END_SURVEY';
                        const optionExists = question.opciones[logic.option_index] !== undefined;
                        const targetQ = isEndSurvey ? null : allQuestions.find(q => q.pregunta_id === logic.jump_to_question_id);
                        const targetIndex = targetQ ? allQuestions.findIndex(q => q.pregunta_id === logic.jump_to_question_id) : -1;
                        const isBackwardJump = !isEndSurvey && targetIndex >= 0 && targetIndex <= index;
                        if (!optionExists || (!isEndSurvey && !targetQ) || isBackwardJump) { invalidCount++; } else { validLogic.push(logic); }
                      });
                      if (invalidCount > 0) {
                        updateConditionalLogic(index, validLogic);
                        alert(`Se eliminaron ${invalidCount} regla(s) inválida(s).`);
                      } else {
                        alert('✅ Todas las reglas son válidas.');
                      }
                    } else {
                      alert('No hay reglas de lógica condicional configuradas.');
                    }
                  }}
                  className="px-3 py-2 text-[12px] font-medium text-[#6a7282] dark:text-muted-foreground bg-[#f3f4f6] dark:bg-muted rounded-[8px] hover:bg-[#e5e7eb] transition-colors"
                >
                  🔍 Verificar y Limpiar
                </button>
                <button
                  onClick={() => setShowLogicModal(false)}
                  className="px-4 py-2 text-[14px] font-medium text-white bg-gradient-to-r from-[#597AFF] to-[#8C59FE] rounded-[8px] hover:opacity-90 transition-opacity"
                >
                  Guardar y cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SurveyBuilder ─────────────────────────────────────────────────────────────

export function SurveyBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnProyectoId =
    (location.state as { returnProyectoId?: string } | null)?.returnProyectoId ??
    getBuilderReturnProyecto();

  const handleBackToFolder = () => {
    navigateToAdminProyecto(navigate, returnProyectoId);
  };
  const { id } = useParams();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isUploadingOGImage, setIsUploadingOGImage] = useState(false);
  const [ogUploadError, setOGUploadError] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);
  const [showQuestionTypeMenu, setShowQuestionTypeMenu] = useState(false);
  const [autoCleanedRules, setAutoCleanedRules] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputOGRef = useRef<HTMLInputElement>(null);
  const fileInputThumbnailRef = useRef<HTMLInputElement>(null);
  const skipAutoSaveRef = useRef(true);

  const [encuestaData, setEncuestaData] = useState<EncuestaRow>({
    id: id || crypto.randomUUID(),
    nombre_encuesta: 'Encuesta Sin Título',
    pantalla_bienvenida: {
      titulo: 'Bienvenido a Nuestra Encuesta',
      descripcion: 'Tu opinión nos ayuda a mejorar nuestros productos y servicios.',
      imagen_fondo_enabled: false,
      opengraph_enabled: false,
      thumbnail_enabled: false,
    },
    configuracion: {
      color_primario: '#2563eb',
      modo_visualizacion: 'paginated',
      bloquear_regreso: false,
    },
    preguntas: [],
    sections: [],
    estado: false,
    created_at: new Date().toISOString(),
    ...editorMetaStamp(),
  });

  useEffect(() => {
    if (id) {
      skipAutoSaveRef.current = true;
      loadEncuesta();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const loadEncuesta = async () => {
    if (!id) return;
    setIsLoading(true);
    const { data, error } = await api.getEncuestaById(id);
    if (error) console.error('Error loading encuesta:', error);
    else if (data) {
      // Clean invalid conditional logic rules before loading
      const { cleanedData, cleanedCount } = cleanInvalidConditionalLogic(data);
      setEncuestaData({
        ...cleanedData,
        configuracion: {
          color_primario: '#2563eb',
          modo_visualizacion: 'paginated',
          bloquear_regreso: false,
          ...cleanedData.configuracion,
        },
      });

      // If rules were cleaned, save immediately
      if (cleanedCount > 0) {
        console.log(`💾 Auto-saving after cleaning ${cleanedCount} invalid rules...`);
        const { error: saveError } = await api.saveEncuesta({
          ...cleanedData,
          ...editorMetaStamp(),
        });
        if (saveError) {
          console.error('Error auto-saving cleaned rules:', saveError);
        } else {
          console.log('✅ Cleaned rules saved successfully');
        }
      }
    }
    setIsLoading(false);
  };

  // Helper function to clean invalid conditional logic
  const cleanInvalidConditionalLogic = (encuesta: EncuestaRow): { cleanedData: EncuestaRow; cleanedCount: number } => {
    let cleanedCount = 0;
    let convertedCount = 0;

    // Find the most common jump target - this is likely the "end" question
    const findCommonJumpTarget = (): number => {
      const jumpTargetCounts = new Map<string, number>();

      // Count how many times each question is targeted
      encuesta.preguntas.forEach((pregunta) => {
        pregunta.conditional_logic?.forEach((logic) => {
          if (logic.jump_to_question_id !== 'END_SURVEY') {
            const count = jumpTargetCounts.get(logic.jump_to_question_id) || 0;
            jumpTargetCounts.set(logic.jump_to_question_id, count + 1);
          }
        });
      });

      console.log('📊 Jump target analysis:', Array.from(jumpTargetCounts.entries()).map(([id, count]) => {
        const idx = encuesta.preguntas.findIndex((q) => q.pregunta_id === id);
        return `Q${idx + 1} (${id.substring(0, 8)}...): ${count} jumps`;
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
          (q) => q.pregunta_id === mostCommonTarget
        );

        if (targetIdx !== -1) {
          console.log(`✅ Most common jump target detected: Question ${targetIdx + 1} (${maxCount} questions jump to it)`);
          if (targetIdx < encuesta.preguntas.length - 1) {
            console.log(`   Note: There are ${encuesta.preguntas.length - targetIdx - 1} questions after this endpoint`);
          }
          return targetIdx;
        }
      }

      console.log('⚠️ No common jump target found, using last question');
      return encuesta.preguntas.length - 1; // Default to last question
    };

    const commonEndpointIndex = findCommonJumpTarget();

    const cleanedPreguntas = encuesta.preguntas.map((pregunta, index) => {
      if (!pregunta.conditional_logic || pregunta.conditional_logic.length === 0) {
        return pregunta;
      }

      const updatedLogic = pregunta.conditional_logic.map((logic) => {
        // END_SURVEY is always valid
        if (logic.jump_to_question_id === 'END_SURVEY') return logic;

        // Check if option exists
        if (!pregunta.opciones || pregunta.opciones[logic.option_index] === undefined) {
          console.warn(`🧹 Cleaning: Option index ${logic.option_index} doesn't exist in question ${index + 1}`);
          cleanedCount++;
          return null;
        }

        // Check if target question exists
        const targetIndex = encuesta.preguntas.findIndex(
          (q) => q.pregunta_id === logic.jump_to_question_id
        );

        if (targetIndex === -1) {
          console.warn(`🧹 Cleaning: Target question ${logic.jump_to_question_id} not found for question ${index + 1}`);
          cleanedCount++;
          return null;
        }

        // Special case: If jumping to the common endpoint from a later question,
        // convert to END_SURVEY as this is likely the intended "end of survey" behavior
        if (targetIndex === commonEndpointIndex && targetIndex < index) {
          console.log(`✅ Fixed Q${index + 1} option [${logic.option_index}] "${pregunta.opciones?.[logic.option_index] || 'unknown'}" → "Finalizar formulario" (was jumping to common endpoint Q${commonEndpointIndex + 1})`);
          convertedCount++;
          return {
            ...logic,
            jump_to_question_id: 'END_SURVEY',
          };
        }

        // Check for other backward jumps
        if (targetIndex < index) {
          console.warn(`🧹 Cleaning: Backward jump from question ${index + 1} to ${targetIndex + 1}`);
          console.warn(`   💡 If this should end the survey, use "🏁 Finalizar formulario" instead`);
          cleanedCount++;
          return null;
        }

        return logic;
      }).filter((logic) => logic !== null) as ConditionalLogic[];

      if (updatedLogic.length !== pregunta.conditional_logic.length || convertedCount > 0) {
        return {
          ...pregunta,
          conditional_logic: updatedLogic.length > 0 ? updatedLogic : undefined,
        };
      }

      return pregunta;
    });

    const totalChanges = cleanedCount + convertedCount;

    if (totalChanges > 0) {
      console.log(`%c✅ SURVEY AUTOMATICALLY FIXED & SAVED `, 'background: #3b82f6; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
      if (convertedCount > 0) {
        console.log(`%c   ✓ Fixed ${convertedCount} question${convertedCount > 1 ? 's' : ''} to "Finalizar formulario"`, 'color: #3b82f6; font-weight: bold;');
        console.log(`     These were jumping to question ${commonEndpointIndex + 1} (detected common endpoint)`);
      }
      if (cleanedCount > 0) {
        console.log(`%c   ✓ Removed ${cleanedCount} invalid rule${cleanedCount > 1 ? 's' : ''}`, 'color: #3b82f6;');
      }
      console.log(`\n🎉 Your survey now works correctly!`);
      console.log(`💾 Changes have been saved to the database`);
      setAutoCleanedRules(totalChanges);
      // Hide banner after 15 seconds
      setTimeout(() => {
        setAutoCleanedRules(0);
      }, 15000);
    }

    return {
      cleanedData: {
        ...encuesta,
        preguntas: cleanedPreguntas,
      },
      cleanedCount: totalChanges,
    };
  };

  // Auto-save with debounce (skip first run after load to avoid overwriting metadata)
  useEffect(() => {
    if (!isLoading && id) {
      if (skipAutoSaveRef.current) {
        skipAutoSaveRef.current = false;
        return;
      }
      const t = setTimeout(saveEncuesta, 1000);
      return () => clearTimeout(t);
    }
  }, [encuestaData, isLoading]);

  const saveEncuesta = async () => {
    setIsSaving(true);
    const payload = { ...encuestaData, ...editorMetaStamp() };
    const { data, error } = await api.saveEncuesta(payload);
    if (error) {
      console.error('Error saving encuesta:', error);
    } else if (data) {
      skipAutoSaveRef.current = true;
      setEncuestaData((prev) => ({
        ...prev,
        ...data,
        updated_by: data.updated_by ?? payload.updated_by,
      }));
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploadError(null);

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setImageUploadError('Formato no permitido. Solo JPG o PNG.');
      e.target.value = '';
      return;
    }
    if (file.size > 204800) {
      setImageUploadError(`La imagen supera el límite de 200 KB (${Math.round(file.size / 1024)} KB).`);
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    const { data, error } = await api.uploadSurveyImage(file);
    setIsUploadingImage(false);
    e.target.value = '';

    if (error || !data) { setImageUploadError(error || 'Error al subir la imagen.'); return; }
    setEncuestaData({ ...encuestaData, pantalla_bienvenida: { ...encuestaData.pantalla_bienvenida, imagen_url: data.url } });
  };

  const handleOGImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOGUploadError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setOGUploadError('Formato no permitido. Solo JPG o PNG.'); e.target.value = ''; return; }
    if (file.size > 204800) { setOGUploadError(`La imagen supera el límite de 200 KB (${Math.round(file.size / 1024)} KB).`); e.target.value = ''; return; }
    setIsUploadingOGImage(true);
    const { data, error } = await api.uploadSurveyImage(file);
    setIsUploadingOGImage(false);
    e.target.value = '';
    if (error || !data) { setOGUploadError(error || 'Error al subir la imagen.'); return; }
    setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, opengraph_url: data.url } }));
  };

  const handleThumbnailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploadError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setThumbnailUploadError('Formato no permitido. Solo JPG o PNG.'); e.target.value = ''; return; }
    if (file.size > 204800) { setThumbnailUploadError(`La imagen supera el límite de 200 KB (${Math.round(file.size / 1024)} KB).`); e.target.value = ''; return; }
    setIsUploadingThumbnail(true);
    const { data, error } = await api.uploadSurveyImage(file);
    setIsUploadingThumbnail(false);
    e.target.value = '';
    if (error || !data) { setThumbnailUploadError(error || 'Error al subir la imagen.'); return; }
    setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, thumbnail_url: data.url } }));
  };

  const questionTypes = [
    { type: 'likert',          icon: ListOrdered,  label: 'Escala de Likert',    color: 'bg-blue-50 text-blue-600',   defaultOptions: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'] },
    { type: 'sus',             icon: Star,         label: 'SUS (System Usability)', color: 'bg-purple-50 text-purple-600', defaultOptions: ['1', '2', '3', '4', '5'] },
    { type: 'csat',            icon: MessageCircle,label: 'CSAT',                color: 'bg-green-50 text-green-600', defaultOptions: ['😞', '😕', '😐', '🙂', '😄'] },
    { type: 'nps',             icon: Gauge,        label: 'NPS (Net Promoter)',  color: 'bg-teal-50 text-teal-600', defaultOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    { type: 'multiple-choice', icon: CheckSquare,  label: 'Opción Múltiple',     color: 'bg-orange-50 text-orange-600', defaultOptions: ['Opción 1', 'Opción 2', 'Opción 3'] },
    { type: 'text',            icon: MessageCircle,label: 'Pregunta abierta',    color: 'bg-gray-50 dark:bg-background text-gray-600 dark:text-muted-foreground',  defaultOptions: [] },
    { type: 'separator',       icon: Minus,        label: 'Separador',           color: 'bg-slate-50 text-slate-600', defaultOptions: [] },
    { type: 'score-matrix',    icon: Grid3x3,      label: 'Score Matrix',        color: 'bg-yellow-50 text-yellow-600', defaultOptions: [] },
    { type: 'ranking',         icon: ArrowUpDown,  label: 'Ranking',             color: 'bg-pink-50 text-pink-600', defaultOptions: ['Opción 1', 'Opción 2', 'Opción 3'] },
  ];

  const addQuestion = (type: string) => {
    const qt = questionTypes.find(q => q.type === type);
    const newQ: PreguntaSchema = {
      pregunta_id: `q_${Date.now()}`,
      tipo: type as PreguntaSchema['tipo'],
      titulo_pregunta: type === 'separator' ? 'Sección informativa' : `Nueva pregunta ${type}`,
      opciones: qt?.defaultOptions || [],
      orden: encuestaData.preguntas.length,
    };

    // Add default configuration for SUS questions
    if (type === 'sus') {
      newQ.label_izquierda = 'Totalmente en desacuerdo';
      newQ.label_derecha = 'Totalmente de acuerdo';
      newQ.escala_sus = 5; // Default to 5-point scale
    }

    if (type === 'csat') {
      newQ.use_stars = false; // Default to caritas
    }

    // Add default configuration for Score Matrix questions
    if (type === 'score-matrix') {
      newQ.matrix_rows = ['Fila 1', 'Fila 2', 'Fila 3'];
      newQ.matrix_columns = ['Malo', 'Bajo', 'Promedio', 'Alto', 'Buenísimo'];
      newQ.use_stars = true; // Default to stars
    }

    // Add default configuration for Ranking questions
    if (type === 'ranking') {
      newQ.ranking_instruction = 'Arrastra y deja hasta arriba el favorito';
    }

    // Add default configuration for NPS questions
    if (type === 'nps') {
      newQ.usar_slider = true; // Default to slider view
      newQ.subtitulo_pregunta = '0 = Nada probable, 10 = Muy probable';
    }

    setEncuestaData({ ...encuestaData, preguntas: [...encuestaData.preguntas, newQ], ...editorMetaStamp() });
  };

  const updateQuestion = (index: number, field: keyof PreguntaSchema, value: any) => {
    const updated = [...encuestaData.preguntas];
    updated[index] = { ...updated[index], [field]: value };
    setEncuestaData({ ...encuestaData, preguntas: updated, ...editorMetaStamp() });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex].opciones[optionIndex] = value;
    setEncuestaData({ ...encuestaData, preguntas: updated });
  };

  const addOption = (questionIndex: number) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex].opciones.push(`Opción ${updated[questionIndex].opciones.length + 1}`);
    setEncuestaData({ ...encuestaData, preguntas: updated });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...encuestaData.preguntas];
    const question = updated[questionIndex];
    
    // For multiple-choice, enforce minimum of 2 options
    if (question.tipo === 'multiple-choice' && question.opciones.length <= 2) {
      return; // Don't allow removal if only 2 options remain
    }
    
    updated[questionIndex].opciones.splice(optionIndex, 1);
    setEncuestaData({ ...encuestaData, preguntas: updated });
  };

  const deleteQuestion = (questionIndex: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) return;
    const updated = encuestaData.preguntas
      .filter((_, i) => i !== questionIndex)
      .map((q, i) => ({ ...q, orden: i }));
    setEncuestaData({ ...encuestaData, preguntas: updated });
  };

  const duplicateQuestion = (questionIndex: number) => {
    const src = encuestaData.preguntas[questionIndex];
    const copy: PreguntaSchema = { ...src, pregunta_id: `preg_${Date.now()}`, titulo_pregunta: `${src.titulo_pregunta} (Copia)`, orden: questionIndex + 1 };
    const updated = [...encuestaData.preguntas];
    updated.splice(questionIndex + 1, 0, copy);
    setEncuestaData({ ...encuestaData, preguntas: updated.map((q, i) => ({ ...q, orden: i })) });
  };

  // ── Update SUS scale (both escala_sus and opciones in single operation) ──
  const updateSusScale = (questionIndex: number, scale: 3 | 5 | 10) => {
    const updated = [...encuestaData.preguntas];
    const newOpciones = Array.from({ length: scale }, (_, i) => String(i + 1));
    updated[questionIndex] = {
      ...updated[questionIndex],
      escala_sus: scale,
      opciones: newOpciones
    };
    setEncuestaData({
      ...encuestaData,
      preguntas: updated,
      ...editorMetaStamp()
    });
  };

  // ── Update Conditional Logic ──
  const updateConditionalLogic = (questionIndex: number, logic: ConditionalLogic[]) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex] = {
      ...updated[questionIndex],
      conditional_logic: logic.length > 0 ? logic : undefined
    };
    setEncuestaData({ ...encuestaData, preguntas: updated, ...editorMetaStamp() });
  };

  const updateNPSGroupLogic = (questionIndex: number, logic: NPSGroupLogic[]) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex] = {
      ...updated[questionIndex],
      nps_group_logic: logic.length > 0 ? logic : undefined
    };
    setEncuestaData({ ...encuestaData, preguntas: updated, ...editorMetaStamp() });
  };

  const updateTextLogic = (questionIndex: number, logic: TextConditionalLogic[]) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex] = {
      ...updated[questionIndex],
      text_logic: logic.length > 0 ? logic : undefined
    };
    setEncuestaData({ ...encuestaData, preguntas: updated, ...editorMetaStamp() });
  };

  // ── Update Section Title ──
  const updateSectionTitle = (sectionId: string, title: string) => {
    const updatedSections = (encuestaData.sections || []).map(s =>
      s.id === sectionId ? { ...s, title } : s
    );
    setEncuestaData({
      ...encuestaData,
      sections: updatedSections,
      ...editorMetaStamp()
    });
  };

  // ── Update Section Logic ──
  const updateSectionLogic = (sectionId: string, logic: SectionLogic) => {
    const updatedSections = (encuestaData.sections || []).map(s =>
      s.id === sectionId ? { ...s, section_logic: logic } : s
    );
    setEncuestaData({
      ...encuestaData,
      sections: updatedSections,
      ...editorMetaStamp()
    });
  };

  // ── Add Question to Section ──
  const addQuestionToSection = (sectionId: string, type: string) => {
    const qt = questionTypes.find(q => q.type === type);
    const newQ: PreguntaSchema = {
      pregunta_id: `q_${Date.now()}`,
      tipo: type as PreguntaSchema['tipo'],
      titulo_pregunta: type === 'separator' ? 'Sección informativa' : `Nueva pregunta ${type}`,
      opciones: qt?.defaultOptions || [],
      orden: encuestaData.preguntas.length,
      section_id: sectionId,
    };

    if (type === 'sus') {
      newQ.label_izquierda = 'Totalmente en desacuerdo';
      newQ.label_derecha = 'Totalmente de acuerdo';
      newQ.escala_sus = 5;
    }

    if (type === 'csat') {
      newQ.use_stars = false;
    }

    if (type === 'score-matrix') {
      newQ.matrix_rows = ['Fila 1', 'Fila 2', 'Fila 3'];
      newQ.matrix_columns = ['Malo', 'Bajo', 'Promedio', 'Alto', 'Buenísimo'];
      newQ.use_stars = true;
    }

    if (type === 'ranking') {
      newQ.ranking_instruction = 'Arrastra y deja hasta arriba el favorito';
    }

    if (type === 'nps') {
      newQ.usar_slider = true;
      newQ.subtitulo_pregunta = '0 = Nada probable, 10 = Muy probable';
    }

    setEncuestaData({
      ...encuestaData,
      preguntas: [...encuestaData.preguntas, newQ],
      ...editorMetaStamp()
    });
  };

  // ── Move Question to/from Section ──
  const moveQuestionToSection = (questionIndex: number, targetSectionId: string | undefined) => {
    const updated = [...encuestaData.preguntas];
    updated[questionIndex] = {
      ...updated[questionIndex],
      section_id: targetSectionId
    };
    setEncuestaData({
      ...encuestaData,
      preguntas: updated,
      ...editorMetaStamp()
    });
  };

  // ── Duplicate Section ──
  const duplicateSection = (sectionId: string) => {
    const section = (encuestaData.sections || []).find(s => s.id === sectionId);
    if (!section) return;

    const newSectionId = `section_${Date.now()}`;
    const timestamp = Date.now();

    // Duplicate section metadata
    const newSection: SectionMetadata = {
      id: newSectionId,
      title: `${section.title} (Copia)`,
    };

    // Find and duplicate all questions in this section
    const sectionQuestions = encuestaData.preguntas.filter(q => q.section_id === sectionId);
    const duplicatedQuestions: PreguntaSchema[] = sectionQuestions.map((q, index) => ({
      ...q,
      pregunta_id: `q_${timestamp}_${index}`,
      section_id: newSectionId,
      orden: encuestaData.preguntas.length + index,
    }));

    setEncuestaData({
      ...encuestaData,
      sections: [...(encuestaData.sections || []), newSection],
      preguntas: [...encuestaData.preguntas, ...duplicatedQuestions],
      ...editorMetaStamp()
    });
  };

  // ── Delete Section ──
  const deleteSection = (sectionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sección? Las preguntas dentro quedarán sueltas.')) return;

    // Remove section metadata
    const updatedSections = (encuestaData.sections || []).filter(s => s.id !== sectionId);

    // Remove section_id from all questions in this section
    const updatedQuestions = encuestaData.preguntas.map(q =>
      q.section_id === sectionId ? { ...q, section_id: undefined } : q
    );

    setEncuestaData({
      ...encuestaData,
      sections: updatedSections,
      preguntas: updatedQuestions,
      ...editorMetaStamp()
    });
  };

  // ── moveQuestion uses functional setState to always read fresh state ──────
  const moveQuestion = useCallback((dragIndex: number, hoverIndex: number) => {
    setEncuestaData((prev) => {
      const updated = [...prev.preguntas];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      return { ...prev, preguntas: updated.map((q, i) => ({ ...q, orden: i })), ...editorMetaStamp() };
    });
  }, []);

  const handlePublishToLive = async () => {
    setIsPublishing(true);
    const updatedEncuesta = { ...encuestaData, estado: true, ...editorMetaStamp() };
    const { error } = await api.saveEncuesta(updatedEncuesta);
    if (error) { console.error('Error publishing:', error); alert('Error al publicar: ' + error); setIsPublishing(false); return; }
    setIsPublishing(false);
    setPublishSuccess(true);
    setEncuestaData(updatedEncuesta);
    setTimeout(() => setPublishSuccess(false), 3000);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-background">
        {/* ── Top Bar ── */}
        <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBackToFolder}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-border text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-accent transition-colors shrink-0"
                title={returnProyectoId ? 'Volver a carpeta' : 'Volver al dashboard'}
                aria-label={returnProyectoId ? 'Volver a carpeta' : 'Volver al dashboard'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={encuestaData.nombre_encuesta}
                    onChange={(e) => setEncuestaData({ ...encuestaData, nombre_encuesta: e.target.value, ...editorMetaStamp() })}
                    className="text-xl font-semibold text-gray-900 dark:text-foreground border-0 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-border focus:border-blue-500 focus:ring-0 px-2 py-1"
                    placeholder="Nombre de la encuesta"
                  />
                  {isSaving && (
                    <span className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" /> Guardando...
                    </span>
                  )}
                  {!isSaving && !isLoading && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Guardado
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground font-mono">Document ID: {encuestaData.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${encuestaData.estado ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground'}`}>
                {encuestaData.estado ? 'Live' : 'Draft'}
              </span>
              <button onClick={() => navigate(`/preview/${id || encuestaData.id}`)} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-muted-foreground bg-white dark:bg-card border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={handlePublishToLive}
                disabled={isPublishing || publishSuccess}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${publishSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-70`}
              >
                {isPublishing ? <><Loader className="w-4 h-4 animate-spin" /> Publishing...</>
                  : publishSuccess ? <><CheckCircle className="w-4 h-4" /> Published!</>
                  : <><Upload className="w-4 h-4" /> Publish to Live</>}
              </button>
            </div>
          </div>
        </header>

        {/* Auto-clean notification banner */}
        {autoCleanedRules > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 px-6 py-4 shadow-sm">
            <div className="flex items-start gap-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-blue-900 mb-1">
                  ✅ Lógica condicional corregida automáticamente
                </h3>
                <p className="text-sm text-blue-900 mb-2">
                  Se procesaron <strong>{autoCleanedRules} regla{autoCleanedRules > 1 ? 's' : ''}</strong> de lógica condicional. Los saltos hacia atrás fueron convertidos a "Finalizar formulario" y los cambios se guardaron automáticamente.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log('📋 Ver detalles de las reglas corregidas');
                      setAutoCleanedRules(0);
                    }}
                    className="text-xs font-medium text-blue-900 hover:text-blue-700 underline"
                  >
                    Ver detalles en consola (F12)
                  </button>
                  <span className="text-xs text-blue-700">
                    • Convertidas a END_SURVEY • Reglas inválidas eliminadas
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAutoCleanedRules(0)}
                className="text-blue-700 hover:text-blue-900 transition-colors shrink-0 p-1"
                title="Cerrar notificación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Sidebar ── */}
          <aside className="w-72 bg-white dark:bg-card border-r border-gray-200 dark:border-border overflow-auto">
            <div className="p-6 space-y-4">
              <Accordion type="multiple" defaultValue={[]}>
                <AccordionItem value="configuracion" className="border-none">
                  <AccordionTrigger className="py-2 text-sm font-semibold text-gray-900 dark:text-foreground hover:no-underline">
                    Configuración
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 space-y-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-muted-foreground mb-3">
                        <Palette className="w-4 h-4" /> Color principal
                      </label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={encuestaData.configuracion.color_primario} onChange={(e) => setEncuestaData({ ...encuestaData, configuracion: { ...encuestaData.configuracion, color_primario: e.target.value } })} className="w-12 h-12 rounded-lg border border-gray-300 dark:border-border cursor-pointer" />
                        <input type="text" value={encuestaData.configuracion.color_primario} onChange={(e) => setEncuestaData({ ...encuestaData, configuracion: { ...encuestaData.configuracion, color_primario: e.target.value } })} className="flex-1 px-3 py-2 border border-gray-300 dark:border-border rounded-lg text-sm font-mono" />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-background rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <LayoutList className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-foreground">Vista</p>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">{encuestaData.configuracion.modo_visualizacion === 'paginated' ? 'En pasos' : 'Una página'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEncuestaData({ ...encuestaData, configuracion: { ...encuestaData.configuracion, modo_visualizacion: encuestaData.configuracion.modo_visualizacion === 'scroll' ? 'paginated' : 'scroll' }, ...editorMetaStamp() })}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${encuestaData.configuracion.modo_visualizacion === 'paginated' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-muted'}`}
                          aria-pressed={encuestaData.configuracion.modo_visualizacion === 'paginated'}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${encuestaData.configuracion.modo_visualizacion === 'paginated' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-background rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-foreground">Bloquear regreso</p>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Botón de &quot;Anterior&quot; oculto</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEncuestaData({ ...encuestaData, configuracion: { ...encuestaData.configuracion, bloquear_regreso: !encuestaData.configuracion.bloquear_regreso }, ...editorMetaStamp() })}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${encuestaData.configuracion.bloquear_regreso ? 'bg-blue-600' : 'bg-gray-300 dark:bg-muted'}`}
                          aria-pressed={!!encuestaData.configuracion.bloquear_regreso}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${encuestaData.configuracion.bloquear_regreso ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      Última actualización: {formatUpdatedLabel(encuestaData.updated_at, encuestaData.updated_by)}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Accordion type="multiple" defaultValue={['question-types']}>
                <AccordionItem value="question-types" className="border-none">
                  <AccordionTrigger className="py-2 text-sm font-semibold text-gray-900 dark:text-foreground hover:no-underline">
                    Question Types
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-2">
                      {questionTypes.map((qt) => (
                        <button key={qt.type} onClick={() => addQuestion(qt.type)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${qt.color} hover:opacity-80 transition-opacity`}>
                          <qt.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{qt.label}</span>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4">Agrupación</h3>
                <button
                  onClick={() => {
                    const sectionId = `section_${Date.now()}`;
                    const newSection: SectionMetadata = {
                      id: sectionId,
                      title: 'Nueva Sección',
                    };
                    setEncuestaData({
                      ...encuestaData,
                      sections: [...(encuestaData.sections || []), newSection],
                      ...editorMetaStamp(),
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#597AFF]/10 to-[#8C59FE]/10 border-2 border-dashed border-[#8C59FE]/30 hover:border-[#8C59FE]/60 transition-all"
                >
                  <Layers className="w-5 h-5 text-[#8C59FE]" />
                  <span className="text-sm font-medium text-[#8C59FE]">Crear Sección</span>
                </button>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2 px-1">
                  Agrupa preguntas con lógica condicional
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-background rounded-lg text-xs text-gray-600 dark:text-muted-foreground" style={{ display: 'none' }}>
                <p className="font-semibold mb-2">Estructura de Datos:</p>
                <code className="block font-mono text-[10px] leading-relaxed">
                  /encuestas/{'{id}'}<br/>
                  &nbsp;&nbsp;- preguntas: Array<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• pregunta_id<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• titulo_pregunta<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• opciones[]
                </code>
              </div>
            </div>
          </aside>

          {/* ── Center Canvas ── */}
          <main className="flex-1 overflow-auto">
            <div className="flex flex-col gap-[40px] items-start pt-[32px] px-[32px] pb-[32px] max-w-3xl mx-auto">

              {/* Welcome screen card */}
              <div className="bg-white dark:bg-card rounded-[10px] relative w-full shrink-0">
                <div aria-hidden="true" className="absolute border border-[#e5e7eb] dark:border-border border-solid inset-0 pointer-events-none rounded-[10px]" />
                <div className="flex flex-col gap-[16px] items-start p-[25px] relative w-full">
                  <div className="flex gap-[8px] h-[20px] items-center w-full shrink-0">
                    <div className="relative shrink-0 size-[20px]">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                        <path d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M7.5 9.16667C8.42047 9.16667 9.16667 8.42047 9.16667 7.5C9.16667 6.57953 8.42047 5.83333 7.5 5.83333C6.57953 5.83333 5.83333 6.57953 5.83333 7.5C5.83333 8.42047 6.57953 9.16667 7.5 9.16667Z" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M17.5 12.5L14.9283 9.92833C14.6158 9.61588 14.1919 9.44036 13.75 9.44036C13.3081 9.44036 12.8842 9.61588 12.5717 9.92833L5 17.5" stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-[14px] leading-[20px] text-[#101828] dark:text-foreground tracking-[-0.1504px]">Pantalla de Bienvenida</h3>
                  </div>

                  <div className="flex flex-col gap-[16px] items-start w-full shrink-0">
                    {/* Título */}
                    <div className="flex flex-col gap-[8px] items-start w-full shrink-0">
                      <label className="block font-medium text-[14px] leading-[20px] text-[#364153] dark:text-foreground tracking-[-0.1504px]">Título</label>
                      <input
                        type="text"
                        value={encuestaData.pantalla_bienvenida.titulo}
                        onChange={(e) => setEncuestaData({ ...encuestaData, pantalla_bienvenida: { ...encuestaData.pantalla_bienvenida, titulo: e.target.value } })}
                        className="w-full h-[42px] px-[16px] py-[8px] rounded-[10px] text-[16px] text-[rgba(10,10,10,0.8)] tracking-[-0.3125px] outline-none border border-[#d1d5dc] dark:border-border focus:border-blue-400 placeholder:text-[rgba(10,10,10,0.5)]"
                        placeholder="Bienvenido a Nuestra Encuesta"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col gap-[8px] items-start w-full shrink-0">
                      <label className="block font-medium text-[14px] leading-[20px] text-[#364153] dark:text-foreground tracking-[-0.1504px]">Descripción</label>
                      <textarea
                        value={encuestaData.pantalla_bienvenida.descripcion}
                        onChange={(e) => setEncuestaData({ ...encuestaData, pantalla_bienvenida: { ...encuestaData.pantalla_bienvenida, descripcion: e.target.value } })}
                        className="w-full h-[90px] px-[16px] py-[8px] rounded-[10px] text-[16px] text-[rgba(10,10,10,0.8)] tracking-[-0.3125px] outline-none border border-[#d1d5dc] dark:border-border resize-none focus:border-blue-400 placeholder:text-[rgba(10,10,10,0.5)]"
                        placeholder="Enter description..."
                      />
                    </div>

                    {/* ── Imagen de fondo ───────────────────────────── */}
                    <div className="flex flex-col gap-[8px] items-start w-full shrink-0">
                      <div className="flex items-center justify-between w-full">
                        <label className="block font-medium text-[14px] leading-[20px] text-[#364153] dark:text-foreground tracking-[-0.1504px]">Imagen de fondo</label>
                        <button
                          type="button"
                          onClick={() => setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, imagen_fondo_enabled: !(prev.pantalla_bienvenida.imagen_fondo_enabled ?? false) } }))}
                          className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors shrink-0 ${(encuestaData.pantalla_bienvenida.imagen_fondo_enabled ?? false) ? 'bg-[#8C59FE]' : 'bg-[#D1D5DC]'}`}
                        >
                          <span className={`inline-block size-[16px] transform rounded-full bg-white dark:bg-card shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] transition-transform ${(encuestaData.pantalla_bienvenida.imagen_fondo_enabled ?? false) ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                      {(encuestaData.pantalla_bienvenida.imagen_fondo_enabled ?? false) && (
                        <>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/jpeg,image/png" />
                          <div
                            onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                            className={`h-[128px] relative rounded-[10px] w-full shrink-0 overflow-hidden flex items-center justify-center transition-colors ${isUploadingImage ? 'border-2 border-blue-300 cursor-wait' : 'border-2 border-[#d1d5dc] dark:border-border hover:border-blue-400 cursor-pointer'}`}
                          >
                            {encuestaData.pantalla_bienvenida.imagen_url && !isUploadingImage && (
                              <img src={encuestaData.pantalla_bienvenida.imagen_url} alt="Imagen de fondo" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            )}
                            <div className="relative z-10 flex flex-col items-center">
                              {isUploadingImage ? (
                                <><Loader className="w-8 h-8 text-blue-500 animate-spin mb-[8px]" /><p className="text-[14px] text-blue-600 font-medium">Subiendo...</p></>
                              ) : encuestaData.pantalla_bienvenida.imagen_url ? (
                                <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="text-[14px] text-white drop-shadow font-medium">Cambiar imagen</p></>
                              ) : (
                                <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="font-normal leading-[20px] text-[#6a7282] dark:text-muted-foreground text-[14px] text-center tracking-[-0.3008px]">Recomendado 1080x1900 px</p><p className="font-normal leading-[18px] text-[#99a1af] dark:text-muted-foreground text-[12px] text-center mt-px">JPG o PNG · Máx. 200 KB</p></>
                              )}
                            </div>
                          </div>
                          {encuestaData.pantalla_bienvenida.imagen_url && !isUploadingImage && (
                            <button onClick={() => { setImageUploadError(null); setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, imagen_url: undefined } })); }} className="text-[12px] text-red-500 hover:text-red-700 underline">
                              Eliminar imagen
                            </button>
                          )}
                          {imageUploadError && <p className="text-[12px] text-red-500">{imageUploadError}</p>}
                        </>
                      )}
                    </div>

                    {/* ── Imagen Open Graph ─────────────────────────── */}
                    <div className="relative shrink-0 w-full border-t border-[#EBEEF4] dark:border-border pt-[17px]">
                      <div className="flex flex-col gap-[8px] items-start w-full">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium leading-[20px] text-[#364153] dark:text-foreground text-[14px] tracking-[-0.3008px]">Imagen Open Graph</p>
                            <p className="font-normal leading-[16px] text-[#81878e] text-[12px]">Vista previa en redes sociales y mensajería</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, opengraph_enabled: !(prev.pantalla_bienvenida.opengraph_enabled ?? false) } }))}
                            className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors shrink-0 ${(encuestaData.pantalla_bienvenida.opengraph_enabled ?? false) ? 'bg-[#8C59FE]' : 'bg-[#D1D5DC]'}`}
                          >
                            <span className={`inline-block size-[16px] transform rounded-full bg-white dark:bg-card shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] transition-transform ${(encuestaData.pantalla_bienvenida.opengraph_enabled ?? false) ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                          </button>
                        </div>
                        {(encuestaData.pantalla_bienvenida.opengraph_enabled ?? false) && (
                          <>
                            <input type="file" ref={fileInputOGRef} onChange={handleOGImageUpload} className="hidden" accept="image/jpeg,image/png" />
                            <div
                              onClick={() => !isUploadingOGImage && fileInputOGRef.current?.click()}
                              className={`h-[128px] relative rounded-[10px] w-full shrink-0 overflow-hidden flex items-center justify-center transition-colors ${isUploadingOGImage ? 'border-2 border-blue-300 cursor-wait' : 'border-2 border-[#d1d5dc] dark:border-border hover:border-blue-400 cursor-pointer'}`}
                            >
                              {encuestaData.pantalla_bienvenida.opengraph_url && !isUploadingOGImage && (
                                <img src={encuestaData.pantalla_bienvenida.opengraph_url} alt="Open Graph" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              )}
                              <div className="relative z-10 flex flex-col items-center">
                                {isUploadingOGImage ? (
                                  <><Loader className="w-8 h-8 text-blue-500 animate-spin mb-[8px]" /><p className="text-[14px] text-blue-600 font-medium">Subiendo...</p></>
                                ) : encuestaData.pantalla_bienvenida.opengraph_url ? (
                                  <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="text-[14px] text-white drop-shadow font-medium">Cambiar imagen OG</p></>
                                ) : (
                                  <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="font-normal leading-[18px] text-[#6a7282] dark:text-muted-foreground text-[13px] text-center tracking-[-0.0762px]">Recomendado 1200×630 px</p><p className="font-normal leading-[16.5px] text-[#99a1af] dark:text-muted-foreground text-[11px] text-center mt-px">JPG o PNG · Máx. 200 KB</p></>
                                )}
                              </div>
                            </div>
                            {encuestaData.pantalla_bienvenida.opengraph_url && !isUploadingOGImage && (
                              <button onClick={() => { setOGUploadError(null); setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, opengraph_url: undefined } })); }} className="text-[12px] text-red-500 hover:text-red-700 underline">
                                Eliminar imagen OG
                              </button>
                            )}
                            {ogUploadError && <p className="text-[12px] text-red-500">{ogUploadError}</p>}
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Imagen Thumbnail de bienvenida ────────────── */}
                    <div className="relative shrink-0 w-full border-t border-[#EBEEF4] dark:border-border pt-[17px]">
                      <div className="flex flex-col gap-[8px] items-start w-full">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium leading-[20px] text-[#364153] dark:text-foreground text-[14px] tracking-[-0.3008px]">Imagen de bienvenida</p>
                            <p className="font-normal leading-[16px] text-[#81878e] text-[12px]">Se muestra junto al texto en desktop (dos columnas)</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, thumbnail_enabled: !(prev.pantalla_bienvenida.thumbnail_enabled ?? false) } }))}
                            className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors shrink-0 ${(encuestaData.pantalla_bienvenida.thumbnail_enabled ?? false) ? 'bg-[#8C59FE]' : 'bg-[#D1D5DC]'}`}
                          >
                            <span className={`inline-block size-[16px] transform rounded-full bg-white dark:bg-card shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] transition-transform ${(encuestaData.pantalla_bienvenida.thumbnail_enabled ?? false) ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                          </button>
                        </div>
                        {(encuestaData.pantalla_bienvenida.thumbnail_enabled ?? false) && (
                          <>
                            <input type="file" ref={fileInputThumbnailRef} onChange={handleThumbnailImageUpload} className="hidden" accept="image/jpeg,image/png" />
                            <div
                              onClick={() => !isUploadingThumbnail && fileInputThumbnailRef.current?.click()}
                              className={`h-[128px] relative rounded-[10px] w-full shrink-0 overflow-hidden flex items-center justify-center transition-colors ${isUploadingThumbnail ? 'border-2 border-blue-300 cursor-wait' : 'border-2 border-[#d1d5dc] dark:border-border hover:border-blue-400 cursor-pointer'}`}
                            >
                              {encuestaData.pantalla_bienvenida.thumbnail_url && !isUploadingThumbnail && (
                                <img src={encuestaData.pantalla_bienvenida.thumbnail_url} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              )}
                              <div className="relative z-10 flex flex-col items-center">
                                {isUploadingThumbnail ? (
                                  <><Loader className="w-8 h-8 text-blue-500 animate-spin mb-[8px]" /><p className="text-[14px] text-blue-600 font-medium">Subiendo...</p></>
                                ) : encuestaData.pantalla_bienvenida.thumbnail_url ? (
                                  <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="text-[14px] text-white drop-shadow font-medium">Cambiar imagen</p></>
                                ) : (
                                  <><div className="relative size-[32px] mb-[8px]"><svg className="absolute block size-full" fill="none" viewBox="0 0 32 32"><path d="M25.3333 4H6.66667C5.19391 4 4 5.19391 4 6.66667V25.3333C4 26.8061 5.19391 28 6.66667 28H25.3333C26.8061 28 28 26.8061 28 25.3333V6.66667C28 5.19391 26.8061 4 25.3333 4Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M12 14.6667C13.4728 14.6667 14.6667 13.4728 14.6667 12C14.6667 10.5272 13.4728 9.33333 12 9.33333C10.5272 9.33333 9.33333 10.5272 9.33333 12C9.33333 13.4728 10.5272 14.6667 12 14.6667Z" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /><path d="M28 20L23.8853 15.8853C23.3853 15.3854 22.7071 15.1046 22 15.1046C21.2929 15.1046 20.6147 15.3854 20.1147 15.8853L8 28" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" /></svg></div><p className="font-normal leading-[18px] text-[#6a7282] dark:text-muted-foreground text-[13px] text-center tracking-[-0.0762px]">Recomendado 600×800 px</p><p className="font-normal leading-[16.5px] text-[#99a1af] dark:text-muted-foreground text-[11px] text-center mt-px">JPG o PNG · Máx. 200 KB</p></>
                                )}
                              </div>
                            </div>
                            {encuestaData.pantalla_bienvenida.thumbnail_url && !isUploadingThumbnail && (
                              <button onClick={() => { setThumbnailUploadError(null); setEncuestaData((prev) => ({ ...prev, pantalla_bienvenida: { ...prev.pantalla_bienvenida, thumbnail_url: undefined } })); }} className="text-[12px] text-red-500 hover:text-red-700 underline">
                                Eliminar imagen
                              </button>
                            )}
                            {thumbnailUploadError && <p className="text-[12px] text-red-500">{thumbnailUploadError}</p>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add question card */}
              <div className="bg-white dark:bg-card rounded-[10px] relative w-full shrink-0">
                <div aria-hidden="true" className="absolute border border-[#e5e7eb] dark:border-border border-solid inset-0 pointer-events-none rounded-[10px]" />
                <div className="flex flex-col gap-[16px] items-start pb-px pt-[25px] px-[25px] relative w-full">
                  <div className="flex gap-[8px] h-[20px] items-center w-full shrink-0">
                    <div className="shrink-0 size-[20px]" />
                    <h3 className="font-semibold text-[14px] leading-[20px] text-[#101828] dark:text-foreground tracking-[-0.1504px]">Agregar una pregunta</h3>
                  </div>
                  <div className="flex flex-col items-start w-full shrink-0 pb-[27px] relative">
                    <button
                      onClick={() => setShowQuestionTypeMenu((prev) => !prev)}
                      className="w-full h-[42px] rounded-[10px] border border-[#d1d5dc] dark:border-border flex items-center justify-center text-[16px] text-[rgba(10,10,10,0.5)] tracking-[-0.3125px] hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      +
                    </button>
                    {showQuestionTypeMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowQuestionTypeMenu(false)} />
                        <div className="absolute top-[44px] left-0 right-0 bg-white dark:bg-card border border-[#e5e7eb] dark:border-border rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] z-20 overflow-hidden">
                          {questionTypes.map((qt, i) => (
                            <button
                              key={qt.type}
                              onClick={() => { addQuestion(qt.type); setShowQuestionTypeMenu(false); }}
                              className={`w-full flex items-center gap-[10px] px-[16px] py-[12px] hover:bg-[#f9fafb] dark:hover:bg-accent transition-colors text-left ${i < questionTypes.length - 1 ? 'border-b border-[#f3f4f6] dark:border-border' : ''}`}
                            >
                              <div className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] shrink-0 ${qt.color}`}>
                                <qt.icon className="w-[14px] h-[14px]" />
                              </div>
                              <span className="font-medium text-[14px] leading-[20px] text-[#101828] dark:text-foreground tracking-[-0.1504px]">{qt.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Draggable questions list with section grouping ── */}
              {(() => {
                const rendered: JSX.Element[] = [];
                const processedSections = new Set<string>();

                // First, render all sections (including empty ones)
                (encuestaData.sections || []).forEach((section) => {
                  const sectionQuestions = encuestaData.preguntas
                    .map((q, i) => ({ q, i }))
                    .filter(({ q }) => q.section_id === section.id);

                  processedSections.add(section.id);

                  // Render section container
                  rendered.push(
                    <div
                      key={section.id}
                      className="w-full relative bg-gradient-to-br from-[#f0f4ff] to-[#f8f4ff] rounded-[12px] border-2 border-[#8C59FE]/20"
                    >
                      {/* Section header */}
                      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
                        <Layers className="w-5 h-5 text-[#8C59FE]" />
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="font-semibold text-[15px] text-[#8C59FE] bg-transparent border-0 border-b-2 border-transparent hover:border-[#8C59FE]/30 focus:border-[#8C59FE] focus:ring-0 px-2 py-1 outline-none flex-1"
                          placeholder="Título de la sección"
                        />
                        <span className="text-xs text-[#8C59FE] bg-white dark:bg-card/70 px-2 py-1 rounded-full">
                          {sectionQuestions.length} pregunta{sectionQuestions.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => duplicateSection(section.id)}
                          className="text-[#8C59FE] hover:text-[#597AFF] transition-colors p-1.5 rounded-[6px] hover:bg-[#8C59FE]/10"
                          title="Duplicar sección"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="text-[#8C59FE] hover:text-red-500 transition-colors p-1.5 rounded-[6px] hover:bg-red-50"
                          title="Eliminar sección"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Section questions */}
                      {sectionQuestions.length > 0 ? (
                        <div className="space-y-6 pb-4 px-5 min-h-[150px]">
                          {sectionQuestions.map(({ q, i }) => (
                            <div key={q.pregunta_id} className="relative w-full">
                              <DraggableQuestionCard
                                question={q}
                                index={i}
                                allQuestions={encuestaData.preguntas}
                                sections={encuestaData.sections || []}
                                moveQuestion={moveQuestion}
                                updateQuestion={updateQuestion}
                                updateOption={updateOption}
                                addOption={addOption}
                                removeOption={removeOption}
                                deleteQuestion={deleteQuestion}
                                duplicateQuestion={duplicateQuestion}
                                updateSusScale={updateSusScale}
                                updateConditionalLogic={updateConditionalLogic}
                                updateNPSGroupLogic={updateNPSGroupLogic}
                                updateTextLogic={updateTextLogic}
                                moveQuestionToSection={moveQuestionToSection}
                              />

                              {/* Visual flow connectors */}
                              {q.conditional_logic && q.conditional_logic.length > 0 && (
                                <div className="mt-4 mb-2">
                                  {q.conditional_logic.map((logic, logicIndex) => {
                                    const targetQuestion = encuestaData.preguntas.find(
                                      (tq) => tq.pregunta_id === logic.jump_to_question_id
                                    );
                                    const targetIndex = encuestaData.preguntas.findIndex(
                                      (tq) => tq.pregunta_id === logic.jump_to_question_id
                                    );

                                    if (!targetQuestion) return null;

                                    return (
                                      <div
                                        key={logicIndex}
                                        className="flex items-center gap-3 py-2 px-4 bg-white dark:bg-card border-l-4 border-[#8C59FE] rounded-[6px] mb-2 shadow-sm"
                                      >
                                        <GitBranch className="w-4 h-4 text-[#8C59FE] shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-[12px] font-medium text-[#364153] dark:text-foreground">
                                            Si selecciona{' '}
                                            <span className="font-mono bg-[#f0f4ff] dark:bg-accent px-2 py-0.5 rounded text-[#8C59FE]">
                                              {q.opciones[logic.option_index]}
                                            </span>
                                          </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-[#8C59FE] shrink-0" />
                                        <div className="flex-1 text-right">
                                          <p className="text-[12px] text-[#6a7282] dark:text-muted-foreground">
                                            Saltar a <span className="font-semibold text-[#364153] dark:text-foreground">Pregunta {targetIndex + 1}</span>
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Section Logic Control - At the bottom of section questions */}
                          <div className="pt-4 pb-2 border-t-2 border-dashed border-[#8C59FE]/20">
                            <div className="bg-white dark:bg-card rounded-[10px] border-2 border-[#8C59FE]/30 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <GitBranch className="w-4 h-4 text-[#8C59FE]" />
                                  <span className="font-semibold text-[13px] text-[#364153] dark:text-foreground">Lógica de Sección</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const currentLogic = section.section_logic || { enabled: false };
                                    updateSectionLogic(section.id, {
                                      ...currentLogic,
                                      enabled: !currentLogic.enabled,
                                    });
                                  }}
                                  className={`relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors shrink-0 ${
                                    section.section_logic?.enabled ? 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE]' : 'bg-[#d1d5dc]'
                                  }`}
                                  title={section.section_logic?.enabled ? 'Desactivar lógica de sección' : 'Activar lógica de sección'}
                                >
                                  <span
                                    className={`inline-block h-[14px] w-[14px] transform rounded-full bg-white dark:bg-card shadow-sm transition-transform ${
                                      section.section_logic?.enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'
                                    }`}
                                  />
                                </button>
                              </div>

                              {section.section_logic?.enabled && (
                                <div className="flex flex-col gap-2">
                                  <p className="text-[11px] text-[#6a7282] dark:text-muted-foreground mb-1">
                                    Al completar esta sección:
                                  </p>
                                  <select
                                    value={section.section_logic?.jump_to_section_id || ''}
                                    onChange={(e) => {
                                      updateSectionLogic(section.id, {
                                        enabled: true,
                                        jump_to_section_id: e.target.value || undefined,
                                      });
                                    }}
                                    className="w-full h-[32px] px-3 text-[13px] border border-[#d1d5dc] dark:border-border rounded-[6px] bg-white dark:bg-card focus:border-[#8C59FE] focus:ring-0 outline-none"
                                  >
                                    <option value="">Continuar normalmente</option>
                                    <option value="END_SURVEY">🏁 Finalizar formulario (enviar respuestas)</option>
                                    <optgroup label="Saltar a sección:">
                                      {(encuestaData.sections || [])
                                        .filter(s => s.id !== section.id)
                                        .map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.title}
                                          </option>
                                        ))}
                                      {(encuestaData.sections || []).filter(s => s.id !== section.id).length === 0 && (
                                        <option disabled>No hay otras secciones disponibles</option>
                                      )}
                                    </optgroup>
                                  </select>

                                  {section.section_logic?.jump_to_section_id && (
                                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-[#f0f4ff] to-[#f8f4ff] rounded-[6px] border border-[#8C59FE]/20">
                                      <ArrowRight className="w-3 h-3 text-[#8C59FE] shrink-0" />
                                      <span className="text-[11px] font-medium text-[#8C59FE]">
                                        {section.section_logic.jump_to_section_id === 'END_SURVEY'
                                          ? 'Finalizar formulario al completar esta sección'
                                          : `Saltar a "${(encuestaData.sections || []).find(s => s.id === section.section_logic?.jump_to_section_id)?.title}" al completar esta sección`
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!section.section_logic?.enabled && (
                                <p className="text-[11px] text-[#99a1af] dark:text-muted-foreground italic">
                                  Activa el switch para configurar hacia dónde saltar al completar esta sección
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Empty section - show add question button */
                        <div className="px-6 pb-6 min-h-[150px]">
                          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#8C59FE]/30 rounded-[8px] bg-white dark:bg-card/50 min-h-[120px]">
                            <p className="text-sm text-[#6a7282] dark:text-muted-foreground mb-3">Sección vacía</p>
                            <div className="relative">
                              <button
                                onClick={() => {
                                  const menu = document.getElementById(`section-menu-${section.id}`);
                                  const overlay = document.getElementById(`section-overlay-${section.id}`);
                                  if (menu && overlay) {
                                    menu.classList.toggle('hidden');
                                    overlay.classList.toggle('hidden');
                                  }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8C59FE] bg-white dark:bg-card border-2 border-[#8C59FE] rounded-[8px] hover:bg-[#8C59FE]/5 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Agregar pregunta
                              </button>
                              <div
                                id={`section-overlay-${section.id}`}
                                className="hidden fixed inset-0 z-10"
                                onClick={() => {
                                  const menu = document.getElementById(`section-menu-${section.id}`);
                                  const overlay = document.getElementById(`section-overlay-${section.id}`);
                                  if (menu && overlay) {
                                    menu.classList.add('hidden');
                                    overlay.classList.add('hidden');
                                  }
                                }}
                              />
                              <div
                                id={`section-menu-${section.id}`}
                                className="hidden absolute top-full left-0 mt-2 bg-white dark:bg-card border border-[#e5e7eb] dark:border-border rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] z-20 min-w-[200px] max-h-[300px] overflow-y-auto"
                              >
                                {questionTypes.map((qt, i) => (
                                  <button
                                    key={qt.type}
                                    onClick={() => {
                                      addQuestionToSection(section.id, qt.type);
                                      const menu = document.getElementById(`section-menu-${section.id}`);
                                      const overlay = document.getElementById(`section-overlay-${section.id}`);
                                      if (menu && overlay) {
                                        menu.classList.add('hidden');
                                        overlay.classList.add('hidden');
                                      }
                                    }}
                                    className={`w-full flex items-center gap-[10px] px-[16px] py-[12px] hover:bg-[#f9fafb] dark:hover:bg-accent transition-colors text-left ${i < questionTypes.length - 1 ? 'border-b border-[#f3f4f6] dark:border-border' : ''}`}
                                  >
                                    <div className={`flex items-center justify-center w-[28px] h-[28px] rounded-[6px] shrink-0 ${qt.color}`}>
                                      <qt.icon className="w-[14px] h-[14px]" />
                                    </div>
                                    <span className="font-medium text-[14px] leading-[20px] text-[#101828] dark:text-foreground tracking-[-0.1504px]">{qt.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });

                // Then render standalone questions (not in sections)
                encuestaData.preguntas.forEach((question, index) => {
                  if (!question.section_id) {
                    // Render standalone question (not in a section)
                    rendered.push(
                      <div key={question.pregunta_id} className="relative w-full">
                        <DraggableQuestionCard
                          question={question}
                          index={index}
                          allQuestions={encuestaData.preguntas}
                          sections={encuestaData.sections || []}
                          moveQuestion={moveQuestion}
                          updateQuestion={updateQuestion}
                          updateOption={updateOption}
                          addOption={addOption}
                          removeOption={removeOption}
                          deleteQuestion={deleteQuestion}
                          duplicateQuestion={duplicateQuestion}
                          updateSusScale={updateSusScale}
                          updateConditionalLogic={updateConditionalLogic}
                          updateNPSGroupLogic={updateNPSGroupLogic}
                          updateTextLogic={updateTextLogic}
                          moveQuestionToSection={moveQuestionToSection}
                        />

                        {/* Visual flow connectors */}
                        {question.conditional_logic && question.conditional_logic.length > 0 && (
                          <div className="mt-4 mb-2">
                            {question.conditional_logic.map((logic, logicIndex) => {
                              const targetQuestion = encuestaData.preguntas.find(
                                (q) => q.pregunta_id === logic.jump_to_question_id
                              );
                              const targetIndex = encuestaData.preguntas.findIndex(
                                (q) => q.pregunta_id === logic.jump_to_question_id
                              );

                              if (!targetQuestion) return null;

                              return (
                                <div
                                  key={logicIndex}
                                  className="flex items-center gap-3 py-2 px-4 bg-gradient-to-r from-[#f0f4ff] to-[#f8f4ff] border-l-4 border-[#8C59FE] rounded-[6px] mb-2"
                                >
                                  <GitBranch className="w-4 h-4 text-[#8C59FE] shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-[12px] font-medium text-[#364153] dark:text-foreground">
                                      Si selecciona{' '}
                                      <span className="font-mono bg-white dark:bg-card px-2 py-0.5 rounded text-[#8C59FE]">
                                        {question.opciones[logic.option_index]}
                                      </span>
                                    </p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-[#8C59FE] shrink-0" />
                                  <div className="flex-1 text-right">
                                    <p className="text-[12px] text-[#6a7282] dark:text-muted-foreground">
                                      Saltar a <span className="font-semibold text-[#364153] dark:text-foreground">Pregunta {targetIndex + 1}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                });

                return rendered;
              })()}

            </div>
          </main>
        </div>
      </div>
    </DndProvider>
  );
}