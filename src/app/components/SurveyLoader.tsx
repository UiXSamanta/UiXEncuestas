import { Loader2 } from 'lucide-react';

interface SurveyLoaderProps {
  message?: string;
}

export function SurveyLoader({ message = 'Cargando encuesta...' }: SurveyLoaderProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 dark:text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
