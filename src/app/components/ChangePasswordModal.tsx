import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, X, AlertCircle } from 'lucide-react';
import * as api from '../lib/api';

interface ChangePasswordModalProps {
  onSuccess: () => void;
}

export function ChangePasswordModal({ onSuccess }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');

  // Password strength validation
  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return checks;
  };

  const passwordChecks = validatePassword(newPassword);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos mínimos');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsChanging(true);
    setError('');

    const { data, error: apiError } = await api.changePassword(newPassword);

    if (apiError) {
      setError(apiError);
      setIsChanging(false);
      return;
    }

    console.log('✅ Password changed successfully:', data);

    // Update user in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.must_change_password = false;
    localStorage.setItem('user', JSON.stringify(user));

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-border bg-gradient-to-r from-[#597AFF]/5 to-[#8C59FE]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#597AFF] to-[#8C59FE] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Cambio de Contraseña Obligatorio</h3>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Por seguridad, debes cambiar tu contraseña temporal</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Alert */}
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium mb-1">Primera vez iniciando sesión</p>
                <p>
                  Debes crear una contraseña nueva y segura. Esta contraseña reemplazará la temporal que recibiste por email.
                </p>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-border rounded-lg text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-[#597AFF]"
                placeholder="Escribe tu nueva contraseña"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-muted rounded-lg space-y-1.5">
              <p className="text-xs font-medium text-gray-700 dark:text-muted-foreground mb-2">Requisitos de contraseña:</p>
              <div className="space-y-1">
                <RequirementItem met={passwordChecks.length} text="Mínimo 8 caracteres" />
                <RequirementItem met={passwordChecks.uppercase} text="Al menos una mayúscula (A-Z)" />
                <RequirementItem met={passwordChecks.lowercase} text="Al menos una minúscula (a-z)" />
                <RequirementItem met={passwordChecks.number} text="Al menos un número (0-9)" />
                <RequirementItem met={passwordChecks.special} text="Al menos un carácter especial (!@#$...)" />
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-muted-foreground mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 dark:border-border focus:ring-[#597AFF]'
                }`}
                placeholder="Confirma tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`mt-1.5 text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Las contraseñas coinciden
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Las contraseñas no coinciden
                  </>
                )}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isPasswordValid || !passwordsMatch || isChanging}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChanging ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
          </button>
        </form>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-muted border-t border-gray-200 dark:border-border rounded-b-2xl">
          <p className="text-xs text-gray-600 dark:text-muted-foreground text-center">
            🔒 Tu contraseña será encriptada y almacenada de forma segura
          </p>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-500 dark:text-muted-foreground'}`}>
      {met ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-border shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}
