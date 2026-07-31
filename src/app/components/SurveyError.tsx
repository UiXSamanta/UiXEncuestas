import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';

export function SurveyError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const errorType = searchParams.get('type') || 'not-found';
  const surveyId = searchParams.get('id');

  const errorMessages = {
    'not-found': {
      title: 'Encuesta No Encontrada',
      description: 'Lo sentimos, esta encuesta no existe o ha sido eliminada.',
    },
    'closed': {
      title: 'Encuesta Cerrada',
      description: 'Esta encuesta ya no está aceptando respuestas.',
    },
    'error': {
      title: 'Error al Cargar la Encuesta',
      description: 'Hubo un problema al cargar esta encuesta. Por favor, intenta de nuevo más tarde.',
    },
  };

  const currentError = errorMessages[errorType as keyof typeof errorMessages] || errorMessages['error'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {currentError.title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {currentError.description}
        </p>

        {surveyId && (
          <div className="text-xs text-gray-500 font-mono bg-gray-50 p-3 rounded border border-gray-200 mb-6">
            ID: {surveyId}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full"
        >
          <Home className="w-5 h-5" />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
