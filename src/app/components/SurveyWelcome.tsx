import { ArrowRight } from 'lucide-react';
import { SurveyFooter } from './SurveyFooter';

interface SurveyWelcomeProps {
  titulo: string;
  descripcion: string;
  botonTexto?: string;
  notaPrivacidad?: string;
  colorPrimario?: string;
  imagenFondo?: string;
  imagenFondoEnabled?: boolean;
  thumbnailUrl?: string;
  thumbnailEnabled?: boolean;
  onStart: () => void;
}

export function SurveyWelcome({
  titulo,
  descripcion,
  botonTexto = 'Empezar',
  notaPrivacidad = 'Tus respuestas son confidenciales.',
  colorPrimario,
  imagenFondo,
  imagenFondoEnabled = true,
  thumbnailUrl,
  thumbnailEnabled = false,
  onStart,
}: SurveyWelcomeProps) {
  const activeFondo = imagenFondoEnabled ? imagenFondo : undefined;
  const showThumbnail = thumbnailEnabled && !!thumbnailUrl;

  const bgStyle: React.CSSProperties = activeFondo
    ? {
        backgroundImage: `url(${activeFondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        backgroundColor: colorPrimario || '#303C48',
      };

  const contentBlock = (
    <div className={`flex flex-col ${showThumbnail ? 'items-start text-left' : 'items-center text-center'}`}>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
        {titulo}
      </h1>
      <p className="text-lg text-gray-500 italic leading-relaxed mb-10">
        {descripcion}
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-3 px-9 py-4 text-white text-base font-semibold rounded-full active:scale-95 transition-all shadow-md hover:opacity-90"
        style={{ backgroundColor: colorPrimario || '#303C48' }}
      >
        {botonTexto}
        <ArrowRight className="w-5 h-5" />
      </button>
      {notaPrivacidad && (
        <p className="mt-8 text-sm text-gray-400">{notaPrivacidad}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={bgStyle}>
      {activeFondo && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      )}

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        {showThumbnail ? (
          /* Two-column layout for thumbnail */
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[672px] overflow-hidden flex flex-col md:flex-row">
            {/* Image column */}
            <div className="md:flex-[0_0_40%] h-[240px] md:h-auto bg-[#c1c1c1] shrink-0">
              <img
                src={thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {/* Content column */}
            <div className="flex-1 px-8 py-10 md:py-14">
              {contentBlock}
            </div>
          </div>
        ) : (
          /* Single-column layout (original) */
          <div className="relative bg-white rounded-2xl shadow-2xl p-10 md:p-14 max-w-2xl w-full text-center">
            {contentBlock}
          </div>
        )}
      </div>

      <div className="relative z-10" style={{ backgroundColor: activeFondo ? 'transparent' : (colorPrimario || '#303C48') }}>
        <SurveyFooter />
      </div>
    </div>
  );
}