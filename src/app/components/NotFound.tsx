import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 dark:text-muted-foreground">404</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-4">
          Página No Encontrada
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-muted-foreground mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-card border border-gray-300 dark:border-border text-gray-700 dark:text-muted-foreground rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver Atrás
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
