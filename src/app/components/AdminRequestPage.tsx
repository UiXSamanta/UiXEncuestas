import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Loader, AlertCircle, UserPlus } from 'lucide-react';
import Logo from '../../imports/Logo';
import * as api from '../lib/api';

export function AdminRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    motivo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: apiError } = await api.createNotification({
      type: 'admin_request',
      nombre: form.nombre,
      apellidos: form.apellidos,
      email: form.email,
      motivo: form.motivo,
    });

    if (apiError) {
      console.error('Error al enviar solicitud:', apiError);
      setError('No se pudo enviar la solicitud. Por favor intenta de nuevo.');
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#597AFF]/10 via-[#8C59FE]/10 to-[#EBEEF4] dark:from-[#597AFF]/5 dark:via-[#8C59FE]/5 dark:to-background flex items-center justify-center p-4">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-[440px] px-[24px] py-[40px] text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00C4B3]/20 to-[#ACE738]/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#00C4B3]" />
          </div>
          <h2 className="font-semibold text-[22px] leading-[30px] text-[#303C48] dark:text-foreground mb-3">
            ¡Solicitud enviada!
          </h2>
          <p className="text-[15px] leading-[22px] text-[#5C6671] dark:text-muted-foreground mb-2">
            Tu solicitud fue registrada correctamente.
          </p>
          <p className="text-[13px] leading-[20px] text-[#81878E] dark:text-muted-foreground mb-8">
            El administrador revisará tu solicitud y se pondrá en contacto contigo.
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
      <div className="bg-white dark:bg-card rounded-2xl shadow-xl w-full max-w-[480px] px-[24px] py-[32px]">

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
              <UserPlus className="w-5 h-5 text-[#8C59FE]" />
            </div>
            <div>
              <h1 className="font-semibold text-[20px] leading-[28px] tracking-[-0.4492px] text-[#303C48] dark:text-foreground">Solicitar acceso de admin</h1>
              <p className="text-[13px] leading-[18px] text-[#81878E] dark:text-muted-foreground">Revisaremos tu solicitud</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          {/* Nombre */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="nombre"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Tu nombre"
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Apellidos */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="apellidos"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              value={form.apellidos}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Tus apellidos"
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="email"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="tu@email.com"
              className="h-[50px] w-full px-[16px] rounded-[10px] border border-[#C3C5C9] dark:border-border text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all"
            />
          </div>

          {/* Motivo */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="motivo"
              className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]"
            >
              Motivo de solicitud <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivo"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows={4}
              placeholder="Explica brevemente por qué necesitas acceso de administrador..."
              className="w-full px-[16px] py-[14px] rounded-[10px] border border-[#C3C5C9] dark:border-border text-[16px] text-[#303C48] dark:text-foreground placeholder:text-[#81878E] dark:placeholder:text-muted-foreground tracking-[-0.3125px] focus:outline-none focus:ring-2 focus:ring-[#8C59FE] focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[48px] rounded-[10px] w-full flex items-center justify-center gap-[10px] font-medium text-[16px] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-[4px]"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Enviando solicitud...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Enviar solicitud
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#EBEEF4] dark:border-border text-center">
          <p className="text-[12px] text-[#81878E] dark:text-muted-foreground">
            La solicitud será notificada a{' '}
            <span className="font-medium text-[#5C6671] dark:text-muted-foreground">samanta.camacho@upax.com.mx</span>
          </p>
        </div>
      </div>
    </div>
  );
}