import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import * as api from '../lib/api';
import { SurveyLoader } from './SurveyLoader';
import { SurveyWelcome } from './SurveyWelcome';

export function RespondentWelcome() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
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
    if (!data.estado) { navigate(`/survey-error?type=closed&id=${id}`); return; }
    setEncuesta(data);
    setIsLoading(false);
  };

  // Derive values unconditionally so hooks below are always called
  const titulo = encuesta?.pantalla_bienvenida?.titulo || encuesta?.nombre_encuesta || 'Welcome to Our Survey';
  const descripcion = encuesta?.pantalla_bienvenida?.descripcion || 'Your feedback helps us improve our products and services.';
  const ogImage = (encuesta?.pantalla_bienvenida?.opengraph_enabled !== false)
    ? encuesta?.pantalla_bienvenida?.opengraph_url
    : undefined;

  // Inject OG meta tags at runtime (helps crawlers that execute JS, e.g. Google)
  useEffect(() => {
    if (!encuesta) return;
    const prev = document.title;
    document.title = titulo;
    const setMeta = (prop: string, val: string, attr = 'property') => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', val);
    };
    setMeta('og:title', titulo);
    setMeta('og:description', descripcion);
    setMeta('og:url', window.location.href);
    if (ogImage) setMeta('og:image', ogImage);
    setMeta('twitter:title', titulo, 'name');
    setMeta('twitter:description', descripcion, 'name');
    if (ogImage) setMeta('twitter:image', ogImage, 'name');
    return () => { document.title = prev; };
  }, [encuesta, titulo, descripcion, ogImage]);

  if (isLoading) return <SurveyLoader />;
  if (!encuesta) return null;

  const colorPrimario = encuesta.configuracion?.color_primario;
  const imagenFondo = encuesta.pantalla_bienvenida?.imagen_url;
  const imagenFondoEnabled = encuesta.pantalla_bienvenida?.imagen_fondo_enabled ?? true;
  const thumbnailUrl = encuesta.pantalla_bienvenida?.thumbnail_url;
  const thumbnailEnabled = encuesta.pantalla_bienvenida?.thumbnail_enabled ?? false;

  const handleStart = () => {
    const questionsPath = location.pathname.startsWith('/survey/')
      ? `/survey/${id}/questions`
      : `/${id}/questions`;
    navigate(questionsPath);
  };

  return (
    <SurveyWelcome
      titulo={titulo}
      descripcion={descripcion}
      colorPrimario={colorPrimario}
      imagenFondo={imagenFondo}
      imagenFondoEnabled={imagenFondoEnabled}
      thumbnailUrl={thumbnailUrl}
      thumbnailEnabled={thumbnailEnabled}
      onStart={handleStart}
    />
  );
}
