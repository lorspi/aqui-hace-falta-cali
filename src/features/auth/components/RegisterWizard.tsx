import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import {
  registerSchema,
  RegisterFormData,
  UserRole,
  DocumentType,
} from '../schemas/registerSchema';
import { Step1Role } from './steps/Step1Role';
import { Step2Location } from './steps/Step2Location';
import { Step3Identity } from './steps/Step3Identity';
import { Step4Account } from './steps/Step4Account';

interface RegisterWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({
  isOpen = true,
  onClose,
  onNavigateToLogin,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicialización de React Hook Form con Zod Resolver
  const {
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'voluntario',
      country: 'Colombia',
      department: 'Quindío',
      city: 'Armenia',
      isAutoDetected: true,
      fullName: '',
      documentType: 'cedula',
      documentNumber: '',
      phoneCountryCode: '+57',
      phoneNumber: '',
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  if (!isOpen) return null;

  // Valores observados en tiempo real
  const role = watch('role');
  const country = watch('country');
  const department = watch('department');
  const city = watch('city');
  const isAutoDetected = watch('isAutoDetected');
  const fullName = watch('fullName');
  const documentType = watch('documentType');
  const documentNumber = watch('documentNumber');
  const phoneCountryCode = watch('phoneCountryCode');
  const phoneNumber = watch('phoneNumber');
  const email = watch('email');
  const password = watch('password');

  // Control de navegación y validación por paso
  const handleNextStep = async () => {
    setServerError(null);
    let isValidStep = false;

    if (currentStep === 1) {
      isValidStep = await trigger(['role']);
    } else if (currentStep === 2) {
      isValidStep = await trigger(['country', 'department', 'city']);
    } else if (currentStep === 3) {
      isValidStep = await trigger(['fullName', 'documentType', 'documentNumber']);
    }

    if (isValidStep && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Envío final del Paso 4 a Supabase Auth
  const onSubmitFinal: SubmitHandler<RegisterFormData> = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const fullPhone = `${data.phoneCountryCode}${data.phoneNumber.trim()}`;

      // Llamada a Supabase Auth signUp con metadata completa
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: fullPhone,
            document_type: data.documentType,
            document_number: data.documentNumber.trim(),
            country: data.country,
            department: data.department,
            city: data.city,
            role: data.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log('[RegisterWizard] Registration Successful:', authData);

      // Si Supabase creó la tabla profiles dinámicamente
      try {
        if (authData.user) {
          await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              full_name: data.fullName.trim(),
              phone: fullPhone,
              document_type: data.documentType,
              document_number: data.documentNumber.trim(),
              country: data.country,
              department: data.department,
              city: data.city,
              role: data.role,
              email: data.email.trim(),
            },
          ]);
        }
      } catch (dbErr) {
        console.warn('[RegisterWizard] Note: profiles table insert handled via trigger or fallback:', dbErr);
      }

      setSuccessMessage('¡Cuenta creada exitosamente! Revisa tu correo si requieres confirmación.');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[RegisterWizard] Error signing up:', err);
      const msg =
        err?.message ||
        'Ocurrió un error al registrar la cuenta. Verifica tus datos e intenta nuevamente.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Contenedor Modal Tarjeta Blanca */}
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Header con indicador de paso y botón cerrar */}
        <div className="px-6 sm:px-8 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
              Paso {currentStep} de 4
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Indicador Superior de Progreso (4 Segmentos Rectangulares) */}
        <div className="px-6 sm:px-8 py-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((stepNum) => {
              const isActive = stepNum <= currentStep;
              return (
                <div
                  key={stepNum}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600 shadow-xs shadow-blue-500/30'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Notificaciones del Servidor (Éxito o Error) */}
        <div className="px-6 sm:px-8">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}
        </div>

        {/* Cuerpo del Formulario Multi-Paso */}
        <form onSubmit={handleSubmit(onSubmitFinal)} className="flex flex-col justify-between flex-1">
          <div className="px-6 sm:px-8 py-4 flex-1">
            {currentStep === 1 && (
              <Step1Role
                selectedRole={role}
                onSelectRole={(r: UserRole) => setValue('role', r, { shouldValidate: true })}
              />
            )}

            {currentStep === 2 && (
              <Step2Location
                country={country}
                department={department}
                city={city}
                isAutoDetected={isAutoDetected}
                onChangeCountry={(c) => setValue('country', c, { shouldValidate: true })}
                onChangeDepartment={(d) => setValue('department', d, { shouldValidate: true })}
                onChangeCity={(ct) => setValue('city', ct, { shouldValidate: true })}
              />
            )}

            {currentStep === 3 && (
              <Step3Identity
                fullName={fullName}
                documentType={documentType}
                documentNumber={documentNumber}
                errors={{
                  fullName: errors.fullName?.message,
                  documentNumber: errors.documentNumber?.message,
                }}
                onChangeFullName={(val) => setValue('fullName', val, { shouldValidate: true })}
                onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
              />
            )}

            {currentStep === 4 && (
              <Step4Account
                phoneCountryCode={phoneCountryCode}
                phoneNumber={phoneNumber}
                email={email}
                password={password}
                isSubmitting={isSubmitting}
                errors={{
                  phoneCountryCode: errors.phoneCountryCode?.message,
                  phoneNumber: errors.phoneNumber?.message,
                  email: errors.email?.message,
                  password: errors.password?.message,
                }}
                onChangePhoneCountryCode={(val) => setValue('phoneCountryCode', val, { shouldValidate: true })}
                onChangePhoneNumber={(val) => setValue('phoneNumber', val, { shouldValidate: true })}
                onChangeEmail={(val) => setValue('email', val, { shouldValidate: true })}
                onChangePassword={(val) => setValue('password', val, { shouldValidate: true })}
                onSubmitForm={handleSubmit(onSubmitFinal)}
              />
            )}
          </div>

          {/* Botones Inferiores de Navegación */}
          <div className="px-6 sm:px-8 pt-4 pb-6 bg-slate-50/50 border-t border-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 ml-auto cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 ml-auto cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear cuenta</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Pie de Tarjeta: "¿Ya tienes cuenta? Iniciar sesión" */}
            <div className="text-center pt-2 border-t border-slate-200/60">
              <p className="text-xs text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
