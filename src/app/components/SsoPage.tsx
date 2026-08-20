import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as api from '../lib/api';
import {
  consumeSsoToken,
  UIX_SSO_FUNCTION_URL,
  UIX_SPACE_URL,
} from '../lib/uixSso';

export function SsoPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = consumeSsoToken();
    window.history.replaceState(null, '', window.location.pathname);

    if (!token) {
      setError('No se recibió un token de UiX Space. Abre Encuestas desde el hub.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(UIX_SSO_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          setError('No se pudo validar la sesión con UiX Space.');
          return;
        }

        const { token_hash, error: fnError } = await res.json();
        if (fnError || !token_hash) {
          setError('Respuesta inválida del servidor SSO.');
          return;
        }

        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'magiclink',
        });

        if (otpError || !data.session) {
          setError('No se pudo abrir la sesión. Intenta de nuevo desde UiX Space.');
          return;
        }

        localStorage.setItem('access_token', data.session.access_token);

        const { data: verifyData } = await api.verifyUser();
        const user = {
          id: data.session.user.id,
          email: data.session.user.email,
          name:
            verifyData?.name ||
            data.session.user.user_metadata?.name ||
            data.session.user.email,
          must_change_password: false,
          can_access_notifications: verifyData?.can_access_notifications || false,
          can_access_settings: verifyData?.can_access_settings || false,
        };
        localStorage.setItem('user', JSON.stringify(user));

        navigate('/admin', { replace: true });
      } catch {
        setError('Error de conexión al iniciar sesión.');
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se pudo iniciar sesión
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <a
              href={UIX_SPACE_URL}
              className="inline-flex justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Ir a UiX Space
            </a>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Acceso con contraseña (usuarios externos)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Iniciando sesión desde UiX Space…</p>
      </div>
    </div>
  );
}
