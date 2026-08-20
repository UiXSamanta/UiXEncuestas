import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AppNav } from './AppNav';
import { ChangePasswordModal } from './ChangePasswordModal';
import { supabase } from '../lib/supabase';
import * as api from '../lib/api';
import { markUixSpaceSsoSession } from '../lib/uixSso';

/**
 * ProtectedLayout - Layout for admin routes that require authentication.
 * Shows ChangePasswordModal when must_change_password is true.
 */
export function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
      } else if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('access_token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.log('🔒 No hay sesión activa, redirigiendo a login...');
        setIsAuthenticated(false);
        navigate('/login', { state: { from: location.pathname } });
      } else {
        console.log('✅ Sesión autenticada:', session.user.email);
        setIsAuthenticated(true);

        const { data: verifyData } = await api.verifyUser();
        if (verifyData) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const user = {
            ...storedUser,
            id: verifyData.id ?? storedUser.id,
            email: verifyData.email ?? storedUser.email,
            name: verifyData.name ?? storedUser.name,
            must_change_password: verifyData.must_change_password ?? storedUser.must_change_password,
            can_access_notifications: verifyData.can_access_notifications ?? storedUser.can_access_notifications,
            can_access_settings: verifyData.can_access_settings ?? storedUser.can_access_settings,
            source: verifyData.source ?? storedUser.source ?? null,
          };
          localStorage.setItem('user', JSON.stringify(user));
          if (verifyData.source === 'uix-space-sso') {
            markUixSpaceSsoSession();
          }
          if (user.must_change_password === true) {
            setMustChangePassword(true);
          }
        } else {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.must_change_password === true) {
            setMustChangePassword(true);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error verificando autenticación:', err);
      setIsAuthenticated(false);
      navigate('/login', { state: { from: location.pathname } });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    // Update localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.must_change_password = false;
    localStorage.setItem('user', JSON.stringify(user));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <AppNav />
      <Outlet />
      {mustChangePassword && (
        <ChangePasswordModal onSuccess={handlePasswordChanged} />
      )}
    </div>
  );
}
