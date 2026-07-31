import { Check } from 'lucide-react';
import { SurveyFooter } from './SurveyFooter';

interface SurveyThankYouProps {
  titulo?: string;
  mensaje?: string;
  responseId?: string;
}

export function SurveyThankYou({
  titulo = '¡Gracias!',
  mensaje = 'Hasta la próxima ☺️',
  responseId,
}: SurveyThankYouProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-10 md:p-14 max-w-md w-full text-center">
          {/* Check icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-7">
            <Check className="w-8 h-8 text-green-500 stroke-[2.5]" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{titulo}</h2>

          {/* Message */}
          <p className="text-gray-500 mb-7">{mensaje}<br/><br/></p>
          {/* Response ID */}
          {/* {responseId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500 font-mono leading-relaxed break-all">
              Response ID: {responseId}
            </div> 
          )}*/}
        </div>
      </div>
      
      {/* Survey Footer */}
      <SurveyFooter />
    </div>
  );
}