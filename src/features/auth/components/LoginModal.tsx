import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, LogIn, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { signInWithGoogle, fetchUserProfile } from '../../../lib/supabaseService';
import { useTranslation } from '../../../i18n/LanguageContext';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenRegisterModal?: () => void;
  onSuccess?: (userObj?: { name: string; email?: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onClose,
  onOpenRegisterModal,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setServerError(t('authLoginErrorGoogle') + (err?.message || err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setServerError(t('authLoginErrorEmail'));
      return;
    }
    if (!password) {
      setServerError(t('authLoginErrorPassword'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(t('authLoginErrorInvalid'));
        }
        throw error;
      }

      if (data.user) {
        let name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuario';
        try {
          const profile = await fetchUserProfile(data.user.id);
          if (profile?.full_name) {
            name = profile.full_name;
          }
        } catch (pErr) {
          console.warn('[LoginModal] Fetch profile note:', pErr);
        }

        const userObj = { name, email: data.user.email };
        setSuccessMessage(t('authLoginSuccess'));

        setTimeout(() => {
          if (onSuccess) onSuccess(userObj);
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('[LoginModal] Error logging in:', err);
      setServerError(err?.message || t('authLoginErrorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Tarjeta Modal Blanca */}
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Cabecera con Botón Cerrar */}
        <div className="px-6 sm:px-8 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-white z-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
            {t('authLoginBadge')}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="px-6 sm:px-8 py-4 space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('authLoginTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('authLoginSubtitle')}
            </p>
          </div>

          {/* Notificaciones de Error o Éxito */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}



          {/* Formulario Tradicional */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('authLoginEmailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('authLoginEmailPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('authLoginPasswordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('authLoginPasswordPlaceholder')}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? t('authHidePassword') : t('authShowPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('authLoginSubmitting')}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{t('authLoginSubmit')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie de Modal: ¿No tienes cuenta? Regístrate aquí */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {t('authLoginNoAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenRegisterModal) onOpenRegisterModal();
              }}
              className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
            >
              {t('authLoginRegisterLink')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
