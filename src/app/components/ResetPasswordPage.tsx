import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Loader, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '../../imports/Logo';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase puts tokens in the URL hash after email link click
    // It also puts errors in query params when the link is invalid/expired
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.replace('#', ''));

    const urlError = params.get('error') || hashParams.get('error');
    const errorCode = params.get('error_code') || hashParams.get('error_code');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (urlError) {
      if (errorCode === 'otp_expired') {
        setError('El enlace de recuperación ha expirado. Por favor solicita uno nuevo.');
      } else {
        setError(errorDesc?.replace(/\+/g, ' ') || 'Enlace inválido. Por favor solicita uno nuevo.');
      }
      setIsValidSession(false);
      return;
    }

    // Check if Supabase set a session (recovery type)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Enlace inválido o expirado. Por favor solicita uno nuevo.');
        setIsValidSession(false);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      setError('Error al actualizar la contraseña. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] px-[24px] py-[40px] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-semibold text-[22px] leading-[30px] text-[#303C48] mb-3">
            Contraseña actualizada
          </h2>
          <p className="text-[15px] leading-[22px] text-[#5C6671] mb-8">
            Tu contraseña fue cambiada exitosamente. Serás redirigido al login en unos segundos.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] rounded-[10px] font-medium text-[16px] text-white hover:shadow-lg transition-all"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] px-[24px] py-[32px]">

        <div className="flex flex-col items-start gap-3 mb-[24px]">
          <div className="w-16 h-7 mb-2">
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#597AFF]/20 to-[#8C59FE]/20 rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#8C59FE]" />
            </div>
            <div>
              <h1 className="font-semibold text-[20px] leading-[28px] tracking-[-0.4492px] text-[#303C48]">
                Nueva contraseña
              </h1>
              <p className="text-[13px] leading-[18px] text-[#81878E]">
                Ingresa tu nueva contraseña
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-[10px] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              {isValidSession === false && (
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-[#8C59FE] font-medium underline mt-2"
                >
                  Solicitar nuevo enlace
                </button>
              )}
            </div>
          </div>
        )}

        {isValidSession !== false && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[8px]">
              <label className="font-medium leading-[20px] text-[#303C48] text-[14px] tracking-[-0.1504px]">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  placeholder="Mínimo 8 caracteres"
                  className="h-[50px] w-full px-[16px] pr-[48px] rounded-[10px] border border-[#C3C5C9] text-[16px] text-[#303C48] placeholder:text-[#81878E] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#81878E] hover:text-[#303C48]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <label className="font-medium leading-[20px] text-[#303C48] text-[14px] tracking-[-0.1504px]">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Repite la contraseña"
                  className="h-[50px] w-full px-[16px] pr-[48px] rounded-[10px] border border-[#C3C5C9] text-[16px] text-[#303C48] placeholder:text-[#81878E] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#81878E] hover:text-[#303C48]"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] rounded-[10px] w-full flex items-center justify-center gap-[10px] font-medium text-[16px] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Cambiar contraseña
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
