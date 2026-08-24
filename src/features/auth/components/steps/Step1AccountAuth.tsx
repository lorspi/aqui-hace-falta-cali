import React, { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useTranslation } from '../../../../i18n/LanguageContext';

interface Step1AccountAuthProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  captchaVerified: boolean;
  acceptTerms: boolean;
  isSubmitting?: boolean;
  errors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    captchaVerified?: string;
    acceptTerms?: string;
  };
  onChangeFirstName: (val: string) => void;
  onChangeLastName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onChangeConfirmPassword: (val: string) => void;
  onChangeCaptchaVerified: (val: boolean) => void;
  onChangeAcceptTerms: (val: boolean) => void;
}

export const Step1AccountAuth: React.FC<Step1AccountAuthProps> = ({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  captchaVerified,
  acceptTerms,
  isSubmitting = false,
  errors,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onChangePassword,
  onChangeConfirmPassword,
  onChangeCaptchaVerified,
  onChangeAcceptTerms,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-5 py-2">
      {/* Encabezado del Paso 1 */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('authStep1Title')}
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          {t('authStep1Subtitle')}
        </p>
      </div>

      <div className="space-y-4 pt-1">
        {/* Campos: Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombres */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {t('authStep1FirstName')} <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onChangeFirstName(e.target.value)}
              placeholder={t('authStep1FirstNamePlaceholder')}
              disabled={isSubmitting}
              className={`
                w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
                ${
                  errors?.firstName
                    ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
                }
              `}
            />
            {errors?.firstName && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {t('authStep1LastName')} <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => onChangeLastName(e.target.value)}
              placeholder={t('authStep1LastNamePlaceholder')}
              disabled={isSubmitting}
              className={`
                w-full px-4 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
                ${
                  errors?.lastName
                    ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
                }
              `}
            />
            {errors?.lastName && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Campo: Correo electrónico */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            {t('authStep1Email')} <span className="text-blue-600">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            placeholder={t('authStep1EmailPlaceholder')}
            disabled={isSubmitting}
            className={`
              w-full px-4 py-3 bg-blue-50/60 border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
              ${
                errors?.email
                  ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                  : 'border-blue-100 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
              }
            `}
          />
          {errors?.email && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Campo: Contraseña */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            {t('authStep1Password')} <span className="text-blue-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              placeholder={t('authStep1PasswordPlaceholder')}
              disabled={isSubmitting}
              className={`
                w-full pl-4 pr-12 py-3 bg-blue-50/60 border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
                ${
                  errors?.password
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-blue-100 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title={showPassword ? t('authHidePassword') : t('authShowPassword')}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors?.password && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Campo: Confirma contraseña */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            {t('authStep1ConfirmPassword')} <span className="text-blue-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => onChangeConfirmPassword(e.target.value)}
              placeholder={t('authStep1ConfirmPasswordPlaceholder')}
              disabled={isSubmitting}
              className={`
                w-full pl-4 pr-12 py-3 bg-white border rounded-2xl text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none
                ${
                  errors?.confirmPassword
                    ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs'
                }
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title={showConfirmPassword ? t('authHidePassword') : t('authShowPassword')}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors?.confirmPassword && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Widget Captcha (Cloudflare Turnstile) */}
        <div className="pt-2">
          <div className={`rounded-2xl border ${errors?.captchaVerified ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-slate-50/40'} overflow-hidden shadow-2xs transition-all`}>
            <div className="p-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="captcha-check"
                checked={captchaVerified}
                onChange={(e) => onChangeCaptchaVerified(e.target.checked)}
                disabled={isSubmitting}
                className="w-6 h-6 rounded-md border-2 border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="captcha-check" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                {t('authStep1CaptchaLabel')}
              </label>
            </div>
            <div className="bg-slate-100/80 px-4 py-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                {/* Cloudflare SVG logo */}
                <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
                </svg>
                <span className="font-medium text-slate-600 text-[11px]">Cloudflare Turnstile</span>
              </div>
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            </div>
          </div>
          {errors?.captchaVerified && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.captchaVerified}
            </p>
          )}
        </div>

        {/* Checkbox: Términos y Condiciones */}
        <div className="pt-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms-check"
              checked={acceptTerms}
              onChange={(e) => onChangeAcceptTerms(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="terms-check" className="text-xs font-medium text-slate-700 leading-snug cursor-pointer select-none">
              {t('authStep1TermsAccept')}{' '}
              <a href="/terminos" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">
                {t('authStep1TermsLink')}
              </a>{' '}
              {t('authStep1TermsAnd')}{' '}
              <a href="/privacidad" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">
                {t('authStep1PrivacyLink')}
              </a>
            </label>
          </div>
          {errors?.acceptTerms && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.acceptTerms}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
