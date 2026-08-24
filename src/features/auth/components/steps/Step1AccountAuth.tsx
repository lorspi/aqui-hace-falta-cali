import React, { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../../../i18n/LanguageContext';
import { Turnstile } from '../../../../components/Turnstile';

interface Step1AccountAuthProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** Token string from Turnstile (empty string = not verified) */
  captchaToken: string;
  acceptTerms: boolean;
  isSubmitting?: boolean;
  errors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    captchaToken?: string;
    acceptTerms?: string;
  };
  onChangeFirstName: (val: string) => void;
  onChangeLastName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onChangeConfirmPassword: (val: string) => void;
  onCaptchaVerify: (token: string) => void;
  onCaptchaExpire: () => void;
  onChangeAcceptTerms: (val: boolean) => void;
}

export const Step1AccountAuth: React.FC<Step1AccountAuthProps> = ({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  captchaToken,
  acceptTerms,
  isSubmitting = false,
  errors,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onChangePassword,
  onChangeConfirmPassword,
  onCaptchaVerify,
  onCaptchaExpire,
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

        {/* Cloudflare Turnstile (interaction-only: invisible hasta que sea necesario) */}
        <div className="pt-2">
          <Turnstile
            onVerify={onCaptchaVerify}
            onError={onCaptchaExpire}
            onExpire={onCaptchaExpire}
            appearance="always"
            size="flexible"
            theme="light"
            language="es"
          />
          {errors?.captchaToken && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.captchaToken}
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
