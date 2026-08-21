import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone, UserPlus, Loader2 } from 'lucide-react';

interface Step4AccountProps {
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

  return (
    <div className="space-y-6">
      {/* Encabezado del Paso 4 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Tu cuenta
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
        <div className="pt-2">
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
        </div>
      )}
    </div>
  );
};
