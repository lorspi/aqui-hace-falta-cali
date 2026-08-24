import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, LogIn, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { signInWithGoogle, fetchUserProfile } from '../../../lib/supabaseService';

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
      setServerError('Error al conectar con Google: ' + (err?.message || err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setServerError('Ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setServerError('Ingresa tu contraseña.');
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
          throw new Error('Correo o contraseña incorrectos. Verifica tus datos.');
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
        setSuccessMessage('¡Sesión iniciada exitosamente!');

        setTimeout(() => {
          if (onSuccess) onSuccess(userObj);
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('[LoginModal] Error logging in:', err);
      setServerError(err?.message || 'Ocurrió un error al iniciar sesión.');
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
            Acceso a la plataforma
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
              Inicia sesión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Accede de forma segura con tu cuenta de Google o tu correo registrado.
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

          {/* Opción 1-Clic con Google (Deshabilitada temporalmente) */}
          <div>
            <button
              type="button"
              disabled={true}
              title="Deshabilitado temporalmente"
              className="w-full py-3.5 px-6 bg-slate-100 border-2 border-slate-200 text-slate-400 font-extrabold text-sm rounded-2xl shadow-xs flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
            >
              <svg className="w-5 h-5 shrink-0 grayscale opacity-60" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar con Google (Deshabilitado)</span>
            </button>
          </div>

          <div className="relative flex items-center my-3">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">o con tu correo</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Formulario Tradicional */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie de Modal: ¿No tienes cuenta? Regístrate aquí */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            ¿No tienes cuenta todavía?{' '}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenRegisterModal) onOpenRegisterModal();
              }}
              className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
