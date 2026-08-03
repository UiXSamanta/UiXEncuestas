import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AppNav } from './AppNav';
import { ChangePasswordModal } from './ChangePasswordModal';
import { supabase } from '../lib/supabase';

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

        // Check if user must change password (from localStorage, set during login)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.must_change_password === true) {
          setMustChangePassword(true);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />
      <Outlet />
      {mustChangePassword && (
        <ChangePasswordModal onSuccess={handlePasswordChanged} />
      )}
    </div>
  );
}
