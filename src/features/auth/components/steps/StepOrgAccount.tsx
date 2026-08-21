import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone, UserPlus, Loader2, ShieldCheck } from 'lucide-react';

interface StepOrgAccountProps {
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

export const StepOrgAccount: React.FC<StepOrgAccountProps> = ({
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
    <div className="space-y-5">
      {/* Encabezado del Paso 7 (Cuenta de Organización) */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Tu cuenta
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configura las credenciales oficiales y datos de contacto de tu organización.
        </p>
      </div>

      {/* Banner Informativo Destacado en Menta / Turquesa Claro */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <p className="text-xs sm:text-xs leading-relaxed font-semibold text-emerald-900">
          Verificamos antes de publicar. La insignia aparece cuando confirmemos la organización por su canal oficial.
        </p>
      </div>

      <div className="space-y-4">
        {/* Teléfono de Contacto Oficial */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Teléfono de contacto oficial
          </label>
          <div className="flex gap-2">
            {/* Selector Código de País */}
            <div className="relative shrink-0 w-28">
              <select
                value={phoneCountryCode}
                onChange={(e) => onChangePhoneCountryCode(e.target.value)}
                className="w-full py-3 pl-3 pr-6 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 appearance-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Número Telefónico */}
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
                      ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                      : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                  }
                `}
              />
            </div>
          </div>
          {errors?.phoneNumber && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Correo Electrónico Institucional / Oficial */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo electrónico oficial
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="contacto@organizacion.org"
              className={`
                w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.email
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600'
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

        {/* Contraseña con Icono Ojo para Conmutar Visibilidad */}
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
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
    </div>
  );
};
