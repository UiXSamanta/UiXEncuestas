import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import * as api from '../lib/api';
import { buildPresentationSlides } from '../lib/analyticsPresentation';
import { AnalyticsPresentationDeck } from './AnalyticsPresentationDeck';
import { SurveyLoader } from './SurveyLoader';

export function AnalyticsPresentationPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<ReturnType<typeof buildPresentationSlides> | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [{ data: encuesta, error: encuestaError }, { data: respuestas, error: respuestasError }] =
        await Promise.all([api.getEncuestaById(id), api.getRespuestasByEncuesta(id)]);

      if (cancelled) return;

      if (encuestaError || !encuesta) {
        setError('No se pudo cargar la encuesta.');
        setLoading(false);
        return;
      }

      if (respuestasError) {
        setError('No se pudieron cargar las respuestas.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setBuilding(true);

      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const built = buildPresentationSlides(encuesta, respuestas || []);
        setDeck(built);
        setBuilding(false);
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (deck?.meta.surveyName) {
      document.title = `Presentación · ${deck.meta.surveyName}`;
    }
    return () => {
      document.title = 'UiX Encuestas';
    };
  }, [deck?.meta.surveyName]);

  if (loading) {
    return <SurveyLoader message="Cargando presentación..." />;
  }

  if (building || !deck) {
    return <SurveyLoader message="Generando presentación..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFE] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-[#170F2A] font-semibold text-lg">{error}</p>
          <p className="text-[#5C6671] text-sm mt-2">Cierra esta pestaña e inténtalo de nuevo desde analytics.</p>
        </div>
      </div>
    );
  }

  return <AnalyticsPresentationDeck slides={deck.slides} meta={deck.meta} />;
}
