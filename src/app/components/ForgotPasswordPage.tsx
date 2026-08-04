import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, CheckCircle2, Loader, AlertCircle } from 'lucide-react';
import Logo from '../../imports/Logo';
import { supabase } from '../lib/supabase';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error al enviar correo de recuperación:', err);
      setError('Error al enviar el correo. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] dark:from-[#597AFF]/5 dark:via-[#8C59FE]/5 dark:to-background flex items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-[420px] px-[24px] py-[40px] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#597AFF]/20 to-[#8C59FE]/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-[#8C59FE]" />
          </div>
          <h2 className="font-semibold text-[22px] leading-[30px] text-[#303C48] dark:text-foreground mb-3">
            Correo enviado
          </h2>
          <p className="text-[15px] leading-[22px] text-[#5C6671] dark:text-muted-foreground mb-2">
            Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-[13px] leading-[20px] text-[#81878E] dark:text-muted-foreground mb-8">
            Revisa tu bandeja de entrada y la carpeta de spam.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] rounded-[10px] font-medium text-[16px] text-white hover:shadow-lg transition-all"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] dark:from-[#597AFF]/5 dark:via-[#8C59FE]/5 dark:to-background flex items-center justify-center p-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-[420px] px-[24px] py-[32px]">

        {/* Back */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[#81878E] dark:text-muted-foreground hover:text-[#303C48] dark:hover:text-foreground transition-colors mb-[24px] text-[14px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Login
        </button>

        {/* Header with Logo */}
        <div className="flex flex-col items-start gap-3 mb-[24px]">
          <div className="w-16 h-7 mb-2">
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#597AFF]/20 to-[#8C59FE]/20 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#8C59FE]" />
            </div>
            <div>
              <h1 className="font-semibold text-[20px] leading-[28px] tracking-[-0.4492px] text-[#303C48] dark:text-foreground">
                Recuperar contraseña
              </h1>
              <p className="text-[13px] leading-[18px] text-[#81878E] dark:text-muted-foreground">
                Te enviaremos un enlace para restablecerla
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-[10px] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
          {/* Email */}
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
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] rounded-[10px] w-full flex items-center justify-center gap-[10px] font-medium text-[16px] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Enviar enlace de recuperación
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}