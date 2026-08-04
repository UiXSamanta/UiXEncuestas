import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader, AlertCircle } from 'lucide-react';
import Logo from '../../imports/Logo';
import svgPaths from '../../imports/svg-krr2tnmyh7';
import * as api from '../lib/api';
import { ChangePasswordModal } from './ChangePasswordModal';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: session, error: signInError } = await api.signIn(email, password);

      if (signInError || !session) {
        setError(signInError || 'Error al iniciar sesión');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('access_token', session.access_token);

      // Verify if user must change password
      const { data: verifyData, error: verifyError } = await api.verifyUser();

      const mustChangePassword = verifyData?.must_change_password || session.user.user_metadata?.must_change_password || false;

      const user = {
        id: session.user.id,
        email: session.user.email,
        name: verifyData?.name || session.user.user_metadata?.name || session.user.email,
        must_change_password: mustChangePassword,
        can_access_notifications: verifyData?.can_access_notifications || false,
        can_access_settings: verifyData?.can_access_settings || false,
      };
      localStorage.setItem('user', JSON.stringify(user));

      setIsLoading(false);

      // If user must change password, show modal
      if (mustChangePassword) {
        console.log('🔐 User must change password - showing modal');
        setShowChangePasswordModal(true);
        return;
      }

      // Otherwise, proceed to admin
      navigate('/admin');
    } catch (err) {
      console.error('Error inesperado en login:', err);
      setError('Error al iniciar sesión. Por favor intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    console.log('✅ Password changed successfully - proceeding to admin');
    setShowChangePasswordModal(false);
    navigate('/admin');
  };

  return (
    <>
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal onSuccess={handlePasswordChangeSuccess} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] dark:from-[#597AFF]/5 dark:via-[#8C59FE]/5 dark:to-background flex items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-[440px] px-[32px] py-[40px]">

        {/* Header with Logo */}
        <div className="text-center mb-[32px] flex flex-col items-center">
          <div className="w-20 h-9 mb-4">
            <Logo />
          </div>
          <h1 className="font-semibold text-[24px] leading-[32px] tracking-[-0.4492px] text-[#303C48] dark:text-foreground mb-[6px]">
            Encuestas
          </h1>
          <p className="font-normal text-[14px] leading-[20px] text-[#81878E] dark:text-muted-foreground">
            Inicia sesión para acceder al panel de administración
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-[20px] p-4 bg-red-50 border border-red-200 rounded-[10px] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
          {/* Email field */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="email"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="admin@ejemplo.com"
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border font-normal text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="password"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="••••••••"
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border font-normal text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] relative rounded-[10px] w-full flex items-center justify-center gap-[10px] font-medium text-[16px] text-white tracking-[-0.3125px] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                {/* Arrow icon from Figma SVG paths */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                  <path
                    d={svgPaths.pca41100}
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.66667"
                  />
                  <path
                    d={svgPaths.p75fc300}
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.66667"
                  />
                  <path
                    d="M12.5 10H2.5"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.66667"
                  />
                </svg>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Secondary links */}
        <div className="flex flex-col items-center mt-[4px]">
          <button
            onClick={() => navigate('/admin-request')}
            className="w-full py-[10px] font-medium leading-[24px] text-[#597AFF] text-[16px] text-center tracking-[-0.3125px] underline decoration-solid hover:text-[#8C59FE] transition-colors"
          >
            Solicitar acceso como admin
          </button>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-[10px] font-medium leading-[24px] text-[#597AFF] text-[16px] text-center tracking-[-0.3125px] underline decoration-solid hover:text-[#8C59FE] transition-colors"
          >
            Olvidé mi contraseña
          </button>
        </div>
      </div>
    </div>
    </>
  );
}