import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, X, UserPlus, Loader2 } from 'lucide-react';
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

interface RegisterMultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin?: () => void;
  onCompleteRegister?: (data: RegisterFormData) => Promise<void>;
}

export const RegisterMultiStepModal: React.FC<RegisterMultiStepModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLogin,
  onCompleteRegister,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  // Valores en tiempo real para cada paso
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

  // Avance entre pasos con validación por esquema Zod
  const handleNextStep = async () => {
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
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Envío final del formulario completo
  const onFinalSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      if (onCompleteRegister) {
        await onCompleteRegister(data);
      } else {
        console.log('[Register] Form Data Validated Successfully:', data);
      }
      onClose();
    } catch (err) {
      console.error('[Register] Submission Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Tarjeta Modal Blanca */}
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92dvh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Header con indicador de paso y botón cerrar */}
        <div className="px-6 sm:px-8 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
              Paso {currentStep} de 4
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Cuerpo del Modal (Formulario Multi-Paso) */}
        <form onSubmit={handleSubmit(onFinalSubmit)} className="flex flex-col justify-between flex-1">
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
                onSubmitForm={handleSubmit(onFinalSubmit)}
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
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-xs"
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
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 ml-auto"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creando...</span>
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
