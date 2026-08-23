import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone, UserPlus, Loader2 } from 'lucide-react';
import { UserRole } from '../../schemas/registerSchema';
import { signInWithGoogle } from '../../../../lib/supabaseService';

interface Step4AccountProps {
  role?: UserRole;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  password: string;
  isSubmitting?: boolean;
  errors?: {
    phoneCountryCode?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
  };
  onChangePhoneCountryCode: (val: string) => void;
  onChangePhoneNumber: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onSubmitForm?: () => void;
}

const COUNTRY_CODES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia (+57)' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela (+58)' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador (+593)' },
  { code: '+51', flag: '🇵🇪', name: 'Perú (+51)' },
  { code: '+52', flag: '🇲🇽', name: 'México (+52)' },
  { code: '+1', flag: '🇺🇸', name: 'EE.UU. (+1)' },
];

export const Step4Account: React.FC<Step4AccountProps> = ({
  role,
  phoneCountryCode,
  phoneNumber,
  email,
  password,
  isSubmitting = false,
  errors,
  onChangePhoneCountryCode,
  onChangePhoneNumber,
  onChangeEmail,
  onChangePassword,
  onSubmitForm,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getRoleBadge = (r?: UserRole) => {
    switch (r) {
      case 'rescatista':
        return { label: 'Rescatista / Operativo', icon: '🚚', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'acopio':
        return { label: 'Centro de Acopio', icon: '📦', color: 'bg-purple-50 text-purple-900 border-purple-200' };
      case 'entidad_profesional':
        return { label: 'Entidad / Profesional', icon: '🛡️', color: 'bg-slate-100 text-slate-900 border-slate-300' };
      case 'voluntario':
      default:
        return { label: 'Voluntario / Donante', icon: '❤️', color: 'bg-blue-50 text-blue-900 border-blue-200' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 4 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tu cuenta
          </h2>
          {role && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Configura tus datos de contacto y credenciales de acceso seguras.
        </p>
      </div>

      <div className="space-y-4">
        {/* Teléfono de contacto con prefijo de país */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Teléfono de contacto / WhatsApp
          </label>
          <div className="flex gap-2">
            <select
              value={phoneCountryCode}
              onChange={(e) => onChangePhoneCountryCode(e.target.value)}
              className="py-3 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer shrink-0"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => onChangePhoneNumber(e.target.value)}
                placeholder="Ej: 3001234567"
                className={`
                  w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                  ${
                    errors?.phoneNumber
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                      : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                  }
                `}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Elige tu país y escribe el número de celular activo para coordinaciones directas.
          </p>
          {errors?.phoneNumber && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Correo Electrónico */}
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
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
              className={`
                w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.email
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
          </div>
          {errors?.email && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Contraseña (mínimo 6 caracteres)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              placeholder="••••••••"
              className={`
                w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.password
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors?.password && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {/* Botón Principal Verde Esmeralda de Acción Final */}
      {onSubmitForm && (
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={onSubmitForm}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Crear cuenta</span>
              </>
            )}
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">o registrate con</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err: any) {
                alert('Error al conectar con Google: ' + (err?.message || err));
              }
            }}
            className="w-full py-3 px-6 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>
      )}
    </div>
  );
};
