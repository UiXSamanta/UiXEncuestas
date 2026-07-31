import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Eye } from 'lucide-react';
import * as api from '../lib/api';
import { SurveyLoader } from './SurveyLoader';
import { SurveyWelcome } from './SurveyWelcome';

export function PreviewWelcome() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [encuesta, setEncuesta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEncuesta();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEncuesta = async () => {
    if (!id) { navigate(`/survey-error?type=not-found`); return; }
    setIsLoading(true);
    const { data, error } = await api.getEncuestaById(id);
    if (error || !data) { navigate(`/survey-error?type=not-found&id=${id}`); return; }
    setEncuesta(data);
    setIsLoading(false);
  };

  if (isLoading) return <SurveyLoader />;
  if (!encuesta) return null;

  const titulo = encuesta.pantalla_bienvenida?.titulo || encuesta.nombre_encuesta || 'Welcome to Our Survey';
  const descripcion = encuesta.pantalla_bienvenida?.descripcion || 'Your feedback helps us improve our products and services.';
  const colorPrimario = encuesta.configuracion?.color_primario;
  const imagenFondo = encuesta.pantalla_bienvenida?.imagen_url;
  const imagenFondoEnabled = encuesta.pantalla_bienvenida?.imagen_fondo_enabled ?? true;
  const thumbnailUrl = encuesta.pantalla_bienvenida?.thumbnail_url;
  const thumbnailEnabled = encuesta.pantalla_bienvenida?.thumbnail_enabled ?? false;

  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-gray-900 py-2.5 px-4 z-50 shadow">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <Eye className="w-4 h-4" />
          MODO PREVIEW — Las respuestas NO se guardarán en la base de datos
        </div>
      </div>

      <div className="pt-10">
        <SurveyWelcome
          titulo={titulo}
          descripcion={descripcion}
          colorPrimario={colorPrimario}
          imagenFondo={imagenFondo}
          imagenFondoEnabled={imagenFondoEnabled}
          thumbnailUrl={thumbnailUrl}
          thumbnailEnabled={thumbnailEnabled}
          onStart={() => navigate(`/preview/${id}/questions`)}
        />
      </div>
    </div>
  );
}