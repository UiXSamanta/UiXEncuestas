import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSettings } from './components/AdminSettings';
import { AdminRequestPage } from './components/AdminRequestPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { NotificationsPage } from './components/NotificationsPage';
import { SurveyBuilder } from './components/SurveyBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ComparadorResultados } from './components/ComparadorResultados';
import { RespondentWelcome } from './components/RespondentWelcome';
import { RespondentSurvey } from './components/RespondentSurvey';
import { PreviewWelcome } from './components/PreviewWelcome';
import { PreviewSurvey } from './components/PreviewSurvey';
import { NotFound } from './components/NotFound';
import { SurveyError } from './components/SurveyError';
import { ProtectedLayout } from './components/ProtectedLayout';
import { PublicLayout } from './components/PublicLayout';
import { SurveyLoader } from './components/SurveyLoader';
import { SurveyWelcome } from './components/SurveyWelcome';
import { SurveyThankYou } from './components/SurveyThankYou';

export const router = createBrowserRouter([
  // Public routes (no authentication required)
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/login" replace />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/admin-request',
        element: <AdminRequestPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      // ── Design preview routes (static, sample data) ──
      {
        path: '/survey-loader',
        element: <SurveyLoader message="Cargando encuesta..." />,
      },
      {
        path: '/survey-welcome',
        element: (
          <SurveyWelcome
            titulo="Queremos ser los mejores para ti"
            descripcion="Tu opinión nos ayuda a mejorar nuestros productos y servicios. Esta encuesta tomará aproximadamente 3 minutos."
            botonTexto="Comenzar"
            notaPrivacidad="Tus respuestas son confidenciales."
            onStart={() => {}}
          />
        ),
      },
      {
        path: '/survey-thankyou',
        element: (
          <SurveyThankYou
            titulo="¡Gracias!"
            mensaje="Recibimos tus respuestas."
          />
        ),
      },
      // Survey respondent pages (public access - SAVES to database)
      {
        path: '/survey/:id',
        element: <RespondentWelcome />,
      },
      {
        path: '/survey/:id/questions',
        element: <RespondentSurvey />,
      },
      // Preview pages (public access - DOES NOT SAVE to database)
      {
        path: '/preview/:id',
        element: <PreviewWelcome />,
      },
      {
        path: '/preview/:id/questions',
        element: <PreviewSurvey />,
      },
      {
        path: '/survey-error',
        element: <SurveyError />,
      },
      // Direct UUID access from root (for Figma Sites URLs like /UUID)
      // This must be LAST in the public routes to avoid conflicts
      {
        path: '/:id',
        element: <RespondentWelcome />,
      },
      {
        path: '/:id/questions',
        element: <RespondentSurvey />,
      },
    ],
  },
  // Protected routes (authentication required)
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboard />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/settings',
        element: <AdminSettings />,
      },
      {
        path: '/builder/:id',
        element: <SurveyBuilder />,
      },
      {
        path: '/analytics/:id',
        element: <AnalyticsDashboard />,
      },
      {
        path: '/comparador',
        element: <ComparadorResultados />,
      },
    ],
  },
  // 404 Not Found
  {
    path: '*',
    element: <NotFound />,
  },
]);