import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
  BarChart3,
  Users,
  Target,
  Zap,
  Brain,
} from 'lucide-react';
import * as api from '../lib/api';
import { AdminSidebar } from './AdminSidebar';

interface Encuesta {
  id: string;
  nombre_encuesta: string;
  estado: boolean;
  conteo_respuestas: number;
  preguntas: any[];
  created_at: string;
  updated_at: string;
}

interface ComparacionStats {
  encuestaId: string;
  nombre: string;
  totalRespuestas: number;
  promedioGeneral: number;
  promedioSUS?: number;
  promedioCSAT?: number;
  promedioLikert?: number;
  satisfaccionGeneral: number;
  tasaCompletado: number;
  mejorPregunta?: { titulo: string; promedio: number };
  peorPregunta?: { titulo: string; promedio: number };
}

interface AIRecomendacion {
  tipo: 'exito' | 'advertencia' | 'mejora';
  titulo: string;
  descripcion: string;
  icono: any;
}

export function ComparadorResultados() {
  const navigate = useNavigate();
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparacionData, setComparacionData] = useState<ComparacionStats[]>([]);
  const [aiRecomendaciones, setAiRecomendaciones] = useState<AIRecomendacion[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Check authentication
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }
    loadEncuestas();
  }, []);

  const loadEncuestas = async () => {
    setIsLoading(true);
    const { data, error } = await api.getAllEncuestas();
    
    if (error) {
      console.error('Error loading encuestas:', error);
    }
    
    // Only show surveys with responses
    const encuestasConRespuestas = (data || []).filter(e => e.conteo_respuestas > 0);
    setEncuestas(encuestasConRespuestas);
    setIsLoading(false);
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const calcularPromedioNumerico = (respuestas: any[]): number => {
    const numericos = respuestas
      .map(r => {
        if (typeof r === 'number') return r;
        if (typeof r === 'string') {
          const num = parseFloat(r);
          return isNaN(num) ? null : num;
        }
        return null;
      })
      .filter(v => v !== null) as number[];

    if (numericos.length === 0) return 0;
    return numericos.reduce((a, b) => a + b, 0) / numericos.length;
  };

  const analizarEncuesta = async (encuestaId: string): Promise<ComparacionStats | null> => {
    const encuesta = encuestas.find(e => e.id === encuestaId);
    if (!encuesta) return null;

    const { data: respuestas } = await api.getRespuestasByEncuesta(encuestaId);
    if (!respuestas || respuestas.length === 0) return null;

    let promedioSUS: number | undefined;
    let promedioCSAT: number | undefined;
    let promedioLikert: number | undefined;
    const promediosPorPregunta: { titulo: string; promedio: number }[] = [];

    encuesta.preguntas.forEach((pregunta, idx) => {
      const respuestasPregunta = respuestas
        .map(r => r.respuestas?.[idx])
        .filter(v => v !== undefined && v !== null && v !== '');

      if (respuestasPregunta.length === 0) return;

      const promedio = calcularPromedioNumerico(respuestasPregunta);

      if (pregunta.tipo === 'sus') {
        promedioSUS = (promedioSUS || 0) + promedio;
      } else if (pregunta.tipo === 'csat') {
        promedioCSAT = (promedioCSAT || 0) + promedio;
      } else if (pregunta.tipo === 'likert') {
        promedioLikert = (promedioLikert || 0) + promedio;
      }

      if (promedio > 0) {
        promediosPorPregunta.push({
          titulo: pregunta.titulo_pregunta || 'Sin título',
          promedio,
        });
      }
    });

    // Normalize SUS to 0-100 scale (SUS is 1-5, so multiply by 20)
    if (promedioSUS !== undefined) {
      promedioSUS = promedioSUS * 20;
    }

    // Calculate general average
    const promedioGeneral =
      promediosPorPregunta.length > 0
        ? promediosPorPregunta.reduce((a, b) => a + b.promedio, 0) / promediosPorPregunta.length
        : 0;

    // Calculate satisfaction (0-100 scale)
    let satisfaccionGeneral = 0;
    if (promedioSUS !== undefined) {
      satisfaccionGeneral = promedioSUS;
    } else if (promedioCSAT !== undefined) {
      satisfaccionGeneral = (promedioCSAT / 5) * 100;
    } else if (promedioLikert !== undefined) {
      satisfaccionGeneral = (promedioLikert / 5) * 100;
    } else {
      satisfaccionGeneral = (promedioGeneral / 5) * 100;
    }

    // Find best and worst questions
    const mejorPregunta = promediosPorPregunta.sort((a, b) => b.promedio - a.promedio)[0];
    const peorPregunta = promediosPorPregunta.sort((a, b) => a.promedio - b.promedio)[0];

    return {
      encuestaId,
      nombre: encuesta.nombre_encuesta,
      totalRespuestas: respuestas.length,
      promedioGeneral,
      promedioSUS,
      promedioCSAT,
      promedioLikert,
      satisfaccionGeneral,
      tasaCompletado: 100, // Assume 100% for now since we're getting completed responses
      mejorPregunta,
      peorPregunta,
    };
  };

  const generarRecomendacionesIA = (stats: ComparacionStats[]): AIRecomendacion[] => {
    const recomendaciones: AIRecomendacion[] = [];

    if (stats.length === 0) return recomendaciones;

    // Find winner and loser
    const ordenPorSatisfaccion = [...stats].sort((a, b) => b.satisfaccionGeneral - a.satisfaccionGeneral);
    const ganadora = ordenPorSatisfaccion[0];
    const ultimaPos = ordenPorSatisfaccion[ordenPorSatisfaccion.length - 1];

    // Winner analysis
    if (ganadora.satisfaccionGeneral >= 80) {
      recomendaciones.push({
        tipo: 'exito',
        titulo: `🏆 "${ganadora.nombre}" es la ganadora absoluta`,
        descripcion: `Con ${ganadora.satisfaccionGeneral.toFixed(1)}% de satisfacción y ${ganadora.totalRespuestas} respuestas, esta encuesta ha demostrado excelente recepción. Considera replicar su estructura y preguntas en futuras encuestas.`,
        icono: Award,
      });
    } else if (ganadora.satisfaccionGeneral >= 60) {
      recomendaciones.push({
        tipo: 'exito',
        titulo: `✅ "${ganadora.nombre}" lidera con buen desempeño`,
        descripcion: `Satisfacción de ${ganadora.satisfaccionGeneral.toFixed(1)}%. Hay margen de mejora, pero la dirección es positiva.`,
        icono: CheckCircle2,
      });
    }

    // Response volume analysis
    const totalRespuestas = stats.reduce((sum, s) => sum + s.totalRespuestas, 0);
    const promedioRespuestas = totalRespuestas / stats.length;
    const encuestasMasRespuestas = stats.filter(s => s.totalRespuestas > promedioRespuestas * 1.5);

    if (encuestasMasRespuestas.length > 0) {
      encuestasMasRespuestas.forEach(enc => {
        recomendaciones.push({
          tipo: 'exito',
          titulo: `📊 "${enc.nombre}" tiene alto engagement`,
          descripcion: `Con ${enc.totalRespuestas} respuestas (${((enc.totalRespuestas / promedioRespuestas) * 100).toFixed(0)}% sobre el promedio), esta encuesta ha capturado más atención. Analiza qué elementos generaron mayor participación.`,
          icono: Users,
        });
      });
    }

    // Low satisfaction warning
    if (ultimaPos.satisfaccionGeneral < 50) {
      recomendaciones.push({
        tipo: 'advertencia',
        titulo: `⚠️ "${ultimaPos.nombre}" necesita atención urgente`,
        descripcion: `Satisfacción de solo ${ultimaPos.satisfaccionGeneral.toFixed(1)}%. Revisa las preguntas con menor puntuación y considera rediseñar la encuesta o el producto/servicio evaluado.`,
        icono: AlertCircle,
      });
    }

    // SUS-specific recommendations
    const encuestasSUS = stats.filter(s => s.promedioSUS !== undefined);
    if (encuestasSUS.length > 0) {
      const mejorSUS = encuestasSUS.sort((a, b) => (b.promedioSUS || 0) - (a.promedioSUS || 0))[0];
      if (mejorSUS.promedioSUS && mejorSUS.promedioSUS >= 80) {
        recomendaciones.push({
          tipo: 'exito',
          titulo: `⭐ "${mejorSUS.nombre}" tiene excelente usabilidad`,
          descripcion: `Score SUS de ${mejorSUS.promedioSUS.toFixed(1)} (escala 0-100) indica que el sistema es altamente usable. Mantén estos estándares en futuras versiones.`,
          icono: Target,
        });
      } else if (mejorSUS.promedioSUS && mejorSUS.promedioSUS < 60) {
        recomendaciones.push({
          tipo: 'mejora',
          titulo: `🔧 "${mejorSUS.nombre}" requiere mejoras de UX`,
          descripcion: `Score SUS de ${mejorSUS.promedioSUS.toFixed(1)} está por debajo del promedio aceptable (68). Prioriza mejoras en la experiencia de usuario.`,
          icono: Zap,
        });
      }
    }

    // Comparative insights
    if (stats.length >= 2) {
      const diferenciaSatisfaccion = ganadora.satisfaccionGeneral - ultimaPos.satisfaccionGeneral;
      if (diferenciaSatisfaccion > 30) {
        recomendaciones.push({
          tipo: 'mejora',
          titulo: '📈 Brecha significativa entre encuestas',
          descripcion: `Hay una diferencia de ${diferenciaSatisfaccion.toFixed(1)}% entre la mejor y peor encuesta. Identifica los factores clave que diferencian "${ganadora.nombre}" de "${ultimaPos.nombre}" y aplica las mejores prácticas.`,
          icono: TrendingUp,
        });
      }
    }

    // Best question insights
    stats.forEach(stat => {
      if (stat.mejorPregunta && stat.mejorPregunta.promedio >= 4.5) {
        recomendaciones.push({
          tipo: 'exito',
          titulo: `💡 Pregunta destacada en "${stat.nombre}"`,
          descripcion: `"${stat.mejorPregunta.titulo}" obtuvo ${stat.mejorPregunta.promedio.toFixed(1)}/5. Esta pregunta resonó muy bien con los usuarios. Considera usarla como benchmark.`,
          icono: Sparkles,
        });
      }
    });

    // Worst question warnings
    stats.forEach(stat => {
      if (stat.peorPregunta && stat.peorPregunta.promedio < 2.5) {
        recomendaciones.push({
          tipo: 'mejora',
          titulo: `⚠️ Área de mejora en "${stat.nombre}"`,
          descripcion: `"${stat.peorPregunta.titulo}" obtuvo solo ${stat.peorPregunta.promedio.toFixed(1)}/5. Esta es una señal clara de insatisfacción que requiere acción inmediata.`,
          icono: TrendingDown,
        });
      }
    });

    return recomendaciones.slice(0, 8); // Limit to 8 recommendations
  };

  const handleComparar = async () => {
    if (selectedIds.length < 2) {
      alert('Selecciona al menos 2 encuestas para comparar');
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);

    // Analyze each selected survey
    const resultados: ComparacionStats[] = [];
    for (const id of selectedIds) {
      const stats = await analizarEncuesta(id);
      if (stats) {
        resultados.push(stats);
      }
    }

    setComparacionData(resultados);

    // Generate AI recommendations using Gemini
    console.log('🤖 Requesting AI analysis from Gemini...');
    const { data: aiRecomendaciones, error: aiError } = await api.compareWithAI(resultados);
    
    if (aiError) {
      console.error('Error getting AI recommendations:', aiError);
      // Fallback to local recommendations if Gemini fails
      const localRecomendaciones = generarRecomendacionesIA(resultados);
      setAiRecomendaciones(localRecomendaciones);
    } else if (aiRecomendaciones && aiRecomendaciones.length > 0) {
      console.log(`✅ Received ${aiRecomendaciones.length} AI recommendations from Gemini`);
      // Map AI response to our interface
      const mappedRecomendaciones = aiRecomendaciones.map((rec: any) => ({
        tipo: rec.tipo,
        titulo: rec.titulo,
        descripcion: rec.descripcion,
        icono: rec.tipo === 'exito' ? CheckCircle2 : rec.tipo === 'advertencia' ? AlertCircle : Sparkles,
      }));
      setAiRecomendaciones(mappedRecomendaciones);
    } else {
      // Fallback to local recommendations
      const localRecomendaciones = generarRecomendacionesIA(resultados);
      setAiRecomendaciones(localRecomendaciones);
    }

    setIsAnalyzing(false);
    setShowResults(true);
  };

  const getColorBySatisfaccion = (satisfaccion: number): string => {
    if (satisfaccion >= 80) return 'from-[#ACE738] to-[#00C4B3]';
    if (satisfaccion >= 60) return 'from-[#597AFF] to-[#8C59FE]';
    if (satisfaccion >= 40) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-red-600';
  };

  const getBadgeColor = (tipo: 'exito' | 'advertencia' | 'mejora'): string => {
    if (tipo === 'exito') return 'bg-gradient-to-r from-[#ACE738] to-[#00C4B3]';
    if (tipo === 'advertencia') return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    return 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE]';
  };

  return (
    <div className="flex h-screen bg-[#EBEEF4]">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#597AFF] to-[#8C59FE] flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-[#303C48]">Comparador de Resultados con IA</h2>
            </div>
            <p className="text-sm text-[#81878E]">
              Selecciona 2 o más encuestas para analizar resultados, identificar ganadores y obtener recomendaciones inteligentes
            </p>
          </div>

          {/* Selection Section */}
          {!showResults && (
            <div className="space-y-6">
              {/* Instructions Card */}
              <div className="bg-gradient-to-r from-[#597AFF]/10 to-[#8C59FE]/10 border border-[#8C59FE]/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-6 h-6 text-[#8C59FE] shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#303C48] mb-2">
                      ¿Cómo funciona el análisis con IA?
                    </h3>
                    <ul className="space-y-2 text-sm text-[#5C6671]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#8C59FE] shrink-0 mt-0.5" />
                        <span>Identifica automáticamente las encuestas con mejor desempeño</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#8C59FE] shrink-0 mt-0.5" />
                        <span>Analiza patrones en satisfacción, engagement y tasas de respuesta</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#8C59FE] shrink-0 mt-0.5" />
                        <span>Genera recomendaciones personalizadas basadas en los datos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#8C59FE] shrink-0 mt-0.5" />
                        <span>Destaca preguntas con mejor y peor rendimiento</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Survey Selection */}
              <div className="bg-white rounded-xl border border-[#C3C5C9] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#C3C5C9] bg-[#EBEEF4]">
                  <h3 className="text-lg font-semibold text-[#303C48]">
                    Selecciona Encuestas para Comparar
                  </h3>
                  <p className="text-xs text-[#81878E] mt-1">
                    {selectedIds.length} de {encuestas.length} encuestas seleccionadas
                  </p>
                </div>

                {isLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#8C59FE] animate-spin mx-auto mb-3" />
                    <p className="text-[#5C6671]">Cargando encuestas...</p>
                  </div>
                ) : encuestas.length === 0 ? (
                  <div className="p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-[#81878E] mx-auto mb-3" />
                    <p className="text-[#5C6671] mb-2">No hay encuestas con respuestas disponibles</p>
                    <p className="text-xs text-[#81878E]">
                      Las encuestas deben tener al menos 1 respuesta para ser comparadas
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-3">
                    {encuestas.map((encuesta) => (
                      <div
                        key={encuesta.id}
                        onClick={() => toggleSelection(encuesta.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedIds.includes(encuesta.id)
                            ? 'border-[#8C59FE] bg-[#8C59FE]/5 shadow-md'
                            : 'border-[#C3C5C9] hover:border-[#8C59FE]/50 hover:bg-[#EBEEF4]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#303C48] mb-1">
                              {encuesta.nombre_encuesta}
                            </h4>
                            <p className="text-xs text-[#81878E]">
                              {encuesta.conteo_respuestas} respuestas • {encuesta.preguntas?.length || 0}{' '}
                              preguntas
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              selectedIds.includes(encuesta.id)
                                ? 'border-[#8C59FE] bg-gradient-to-r from-[#597AFF] to-[#8C59FE]'
                                : 'border-[#C3C5C9]'
                            }`}
                          >
                            {selectedIds.includes(encuesta.id) && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {encuestas.length > 0 && (
                  <div className="px-6 py-4 border-t border-[#C3C5C9] bg-[#EBEEF4] flex justify-end">
                    <button
                      onClick={handleComparar}
                      disabled={selectedIds.length < 2 || isAnalyzing}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analizando con IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Comparar con IA
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {showResults && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-[#5C6671] hover:text-[#8C59FE] transition-colors"
              >
                ← Volver a selección
              </button>

              {/* Winners Section */}
              <div className="bg-white rounded-xl border border-[#C3C5C9] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#C3C5C9] bg-gradient-to-r from-[#ACE738]/10 to-[#00C4B3]/10">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-[#00C4B3]" />
                    <h3 className="text-lg font-semibold text-[#303C48]">Resultados Comparativos</h3>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparacionData
                    .sort((a, b) => b.satisfaccionGeneral - a.satisfaccionGeneral)
                    .map((stat, index) => (
                      <div
                        key={stat.encuestaId}
                        className="relative bg-white border-2 border-[#C3C5C9] rounded-xl p-5 hover:shadow-lg transition-all"
                      >
                        {/* Winner Badge */}
                        {index === 0 && (
                          <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-[#ACE738] to-[#00C4B3] rounded-full flex items-center justify-center shadow-lg">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                        )}

                        {/* Position */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-[#81878E]">#{index + 1}</span>
                          <div
                            className={`px-3 py-1 rounded-full text-white text-xs font-semibold bg-gradient-to-r ${getColorBySatisfaccion(
                              stat.satisfaccionGeneral
                            )}`}
                          >
                            {stat.satisfaccionGeneral.toFixed(1)}%
                          </div>
                        </div>

                        {/* Survey Name */}
                        <h4 className="font-semibold text-[#303C48] mb-4 line-clamp-2 min-h-[3rem]">
                          {stat.nombre}
                        </h4>

                        {/* Stats Grid */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#81878E]">Respuestas:</span>
                            <span className="font-semibold text-[#303C48]">{stat.totalRespuestas}</span>
                          </div>

                          {stat.promedioSUS !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-[#81878E]">SUS Score:</span>
                              <span className="font-semibold text-[#303C48]">
                                {stat.promedioSUS.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {stat.promedioCSAT !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-[#81878E]">CSAT:</span>
                              <span className="font-semibold text-[#303C48]">
                                {stat.promedioCSAT.toFixed(1)}/5
                              </span>
                            </div>
                          )}

                          {stat.promedioLikert !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-[#81878E]">Likert:</span>
                              <span className="font-semibold text-[#303C48]">
                                {stat.promedioLikert.toFixed(1)}/5
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-[#81878E]">Promedio:</span>
                            <span className="font-semibold text-[#303C48]">
                              {stat.promedioGeneral.toFixed(1)}/5
                            </span>
                          </div>
                        </div>

                        {/* Best/Worst Questions */}
                        {stat.mejorPregunta && (
                          <div className="mt-4 pt-4 border-t border-[#C3C5C9]">
                            <p className="text-xs text-[#81878E] mb-1">Mejor pregunta:</p>
                            <p className="text-xs text-[#303C48] font-medium line-clamp-2">
                              {stat.mejorPregunta.titulo} ({stat.mejorPregunta.promedio.toFixed(1)})
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-white rounded-xl border border-[#C3C5C9] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#C3C5C9] bg-gradient-to-r from-[#597AFF]/10 to-[#8C59FE]/10">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-[#8C59FE]" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#303C48]">
                        Análisis y Recomendaciones con IA
                      </h3>
                      <p className="text-xs text-[#81878E]">
                        Insights automáticos basados en {comparacionData.length} encuestas analizadas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {aiRecomendaciones.map((rec, index) => {
                    const Icon = rec.icono;
                    return (
                      <div
                        key={index}
                        className={`p-5 rounded-xl border-2 ${
                          rec.tipo === 'exito'
                            ? 'border-[#00C4B3] bg-[#00C4B3]/5'
                            : rec.tipo === 'advertencia'
                            ? 'border-yellow-400 bg-yellow-400/5'
                            : 'border-[#8C59FE] bg-[#8C59FE]/5'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getBadgeColor(
                              rec.tipo
                            )} shadow-md`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#303C48] mb-2">{rec.titulo}</h4>
                            <p className="text-sm text-[#5C6671] leading-relaxed">{rec.descripcion}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {aiRecomendaciones.length === 0 && (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-[#81878E] mx-auto mb-3" />
                      <p className="text-[#5C6671]">
                        No se generaron recomendaciones para esta comparación
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}