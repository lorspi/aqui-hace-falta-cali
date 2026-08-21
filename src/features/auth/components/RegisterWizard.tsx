import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ArrowLeft, ArrowRight, X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import {
  UserRole,
  OrganizationType,
  DocumentType,
} from '../schemas/registerSchema';
import { Step1Role } from './steps/Step1Role';
import { Step2Location } from './steps/Step2Location';
import { Step3Identity } from './steps/Step3Identity';
import { Step4Account } from './steps/Step4Account';
import { StepOrgCategory } from './steps/StepOrgCategory';
import { StepOrgMapLocation } from './steps/StepOrgMapLocation';
import { StepOrgDetails } from './steps/StepOrgDetails';
import { StepOrgAccount } from './steps/StepOrgAccount';

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

  // Inicialización de React Hook Form
  const {
    watch,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      role: 'voluntario',
      organizationType: 'bomberos_defensa_civil',
      country: 'Colombia',
      department: 'Quindío',
      city: 'Armenia',
      isAutoDetected: true,
      searchAddress: '',
      latitude: 3.4516,
      longitude: -76.532,
      orgName: '',
      orgDescription: '',
      orgWebsiteOrSocial: '',
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

  const errStr = (err: any): string | undefined => (err?.message ? String(err.message) : undefined);

  // Valores observados en tiempo real
  const role: UserRole = watch('role');
  const organizationType: OrganizationType = watch('organizationType');
  const country: string = watch('country');
  const department: string = watch('department');
  const city: string = watch('city');
  const isAutoDetected: boolean = watch('isAutoDetected');
  const searchAddress: string = watch('searchAddress');
  const latitude: number = watch('latitude');
  const longitude: number = watch('longitude');
  const orgName: string = watch('orgName');
  const orgDescription: string = watch('orgDescription');
  const orgWebsiteOrSocial: string = watch('orgWebsiteOrSocial');
  const fullName: string = watch('fullName');
  const documentType: DocumentType = watch('documentType');
  const documentNumber: string = watch('documentNumber');
  const phoneCountryCode: string = watch('phoneCountryCode');
  const phoneNumber: string = watch('phoneNumber');
  const email: string = watch('email');
  const password: string = watch('password');

  // Determinar si es flujo de organización o individual (Únicamente entidad_profesional usa 7 pasos)
  const isOrgFlow = role === 'entidad_profesional';
  const totalSteps = isOrgFlow ? 7 : 4;

  // Control de navegación y validación dinámica por paso
  const handleNextStep = async () => {
    setServerError(null);
    let isValidStep = false;

    if (!isOrgFlow) {
      // Flujo Individual (4 Pasos)
      if (currentStep === 1) {
        isValidStep = await trigger(['role']);
      } else if (currentStep === 2) {
        isValidStep = await trigger(['country', 'department', 'city']);
      } else if (currentStep === 3) {
        isValidStep = await trigger(['fullName', 'documentType', 'documentNumber']);
      }
    } else {
      // Flujo Organización (7 Pasos)
      if (currentStep === 1) {
        isValidStep = await trigger(['role']);
      } else if (currentStep === 2) {
        isValidStep = await trigger(['organizationType']);
      } else if (currentStep === 3) {
        isValidStep = await trigger(['country', 'department', 'city']);
      } else if (currentStep === 4) {
        isValidStep = await trigger(['searchAddress', 'latitude', 'longitude']);
      } else if (currentStep === 5) {
        isValidStep = await trigger(['orgName']);
      } else if (currentStep === 6) {
        isValidStep = await trigger(['fullName', 'documentType', 'documentNumber']);
      }
    }

    if (isValidStep && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Envío final del Formulario a Supabase Auth y Base de Datos
  const onSubmitFinal: SubmitHandler<any> = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const fullPhone = `${data.phoneCountryCode}${data.phoneNumber.trim()}`;
      const isOrg = data.role === 'entidad_profesional';

      // Construcción de la Metadata de Usuario para Supabase Auth
      const userMetadata: Record<string, any> = {
        full_name: data.fullName.trim(),
        phone: fullPhone,
        document_type: data.documentType,
        document_number: data.documentNumber.trim(),
        country: data.country,
        department: data.department,
        city: data.city,
        role: data.role,
        is_verified: false,
      };

      if (isOrg) {
        userMetadata.organization_type = data.organizationType;
        userMetadata.org_name = data.orgName?.trim();
        userMetadata.org_description = data.orgDescription?.trim();
        userMetadata.org_website = data.orgWebsiteOrSocial?.trim();
        userMetadata.search_address = data.searchAddress?.trim();
        userMetadata.latitude = data.latitude;
        userMetadata.longitude = data.longitude;
      }

      // Registro en Supabase Auth
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: userMetadata,
        },
      });

      if (error) {
        throw error;
      }

      console.log('[RegisterWizard] Registration Successful:', authData);

      // Inserción / Sincronización en la base de datos de Supabase
      if (authData.user) {
        // Sincronización en tabla de Perfiles
        try {
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
              is_verified: false,
            },
          ]);
        } catch (dbErr) {
          console.warn('[RegisterWizard] Profiles table insert note:', dbErr);
        }

        // Sincronización en la tabla de Organizaciones si aplica
        if (isOrg) {
          try {
            await supabase.from('organizations').insert([
              {
                user_id: authData.user.id,
                org_name: data.orgName?.trim(),
                organization_type: data.organizationType,
                description: data.orgDescription?.trim(),
                website_or_social: data.orgWebsiteOrSocial?.trim(),
                address: data.searchAddress?.trim(),
                latitude: data.latitude,
                longitude: data.longitude,
                is_verified: false,
              },
            ]);
          } catch (orgErr) {
            console.warn('[RegisterWizard] Organizations table insert note:', orgErr);
          }
        }
      }

      setSuccessMessage(
        isOrg
          ? '¡Solicitud de organización registrada! Verificaremos la información y activaremos tu insignia.'
          : '¡Cuenta registrada exitosamente! Revisa tu correo si requieres confirmación.'
      );

      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2500);
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
              Paso {currentStep} de {totalSteps}
            </span>
            {isOrgFlow && (
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Organización / Entidad
              </span>
            )}
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

        {/* Indicador Superior de Progreso (Segmentos Rectangulares Adaptables 4 o 7) */}
        <div className="px-6 sm:px-8 py-3">
          <div className={`grid gap-1.5 ${isOrgFlow ? 'grid-cols-7' : 'grid-cols-4'}`}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => {
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

        {/* Cuerpo del Formulario Multi-Paso Adaptable */}
        <form onSubmit={handleSubmit(onSubmitFinal)} className="flex flex-col justify-between flex-1">
          <div className="px-6 sm:px-8 py-4 flex-1">
            
            {/* Paso 1: Selección de Rol (Común para ambos flujos) */}
            {currentStep === 1 && (
              <Step1Role
                selectedRole={role}
                onSelectRole={(r: UserRole) => {
                  setValue('role', r, { shouldValidate: true });
                  // Si cambia el rol y pasa de individual a org o viceversa, resetear a paso 1
                  setCurrentStep(1);
                }}
              />
            )}

            {/* Renderizado para Flujo Individual (4 Pasos) */}
            {!isOrgFlow && (
              <>
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
                    role={role}
                    fullName={fullName}
                    documentType={documentType}
                    documentNumber={documentNumber}
                    errors={{
                      fullName: errStr(errors.fullName),
                      documentNumber: errStr(errors.documentNumber),
                    }}
                    onChangeFullName={(val) => setValue('fullName', val, { shouldValidate: true })}
                    onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                    onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
                  />
                )}

                {currentStep === 4 && (
                  <Step4Account
                    role={role}
                    phoneCountryCode={phoneCountryCode}
                    phoneNumber={phoneNumber}
                    email={email}
                    password={password}
                    isSubmitting={isSubmitting}
                    errors={{
                      phoneCountryCode: errStr(errors.phoneCountryCode),
                      phoneNumber: errStr(errors.phoneNumber),
                      email: errStr(errors.email),
                      password: errStr(errors.password),
                    }}
                    onChangePhoneCountryCode={(val) => setValue('phoneCountryCode', val, { shouldValidate: true })}
                    onChangePhoneNumber={(val) => setValue('phoneNumber', val, { shouldValidate: true })}
                    onChangeEmail={(val) => setValue('email', val, { shouldValidate: true })}
                    onChangePassword={(val) => setValue('password', val, { shouldValidate: true })}
                    onSubmitForm={handleSubmit(onSubmitFinal)}
                  />
                )}
              </>
            )}

            {/* Renderizado para Flujo de Organización (7 Pasos) */}
            {isOrgFlow && (
              <>
                {/* Paso 2 Org: ¿Qué representas? */}
                {currentStep === 2 && (
                  <StepOrgCategory
                    selectedType={organizationType}
                    onSelectType={(t) => setValue('organizationType', t, { shouldValidate: true })}
                  />
                )}

                {/* Paso 3 Org: ¿Dónde estás? (Territorio) */}
                {currentStep === 3 && (
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

                {/* Paso 4 Org: ¿Dónde están ubicados? (Mapa y Pin) */}
                {currentStep === 4 && (
                  <StepOrgMapLocation
                    searchAddress={searchAddress}
                    latitude={latitude}
                    longitude={longitude}
                    cityName={city}
                    errors={{
                      searchAddress: errStr(errors.searchAddress),
                    }}
                    onChangeSearchAddress={(val) => setValue('searchAddress', val, { shouldValidate: true })}
                    onChangeCoordinates={(lat, lng) => {
                      setValue('latitude', lat, { shouldValidate: true });
                      setValue('longitude', lng, { shouldValidate: true });
                    }}
                  />
                )}

                {/* Paso 5 Org: Tu organización (Datos Entidad) */}
                {currentStep === 5 && (
                  <StepOrgDetails
                    orgName={orgName}
                    orgDescription={orgDescription}
                    orgWebsiteOrSocial={orgWebsiteOrSocial}
                    errors={{
                      orgName: errStr(errors.orgName),
                    }}
                    onChangeOrgName={(val) => setValue('orgName', val, { shouldValidate: true })}
                    onChangeOrgDescription={(val) => setValue('orgDescription', val, { shouldValidate: true })}
                    onChangeOrgWebsiteOrSocial={(val) => setValue('orgWebsiteOrSocial', val, { shouldValidate: true })}
                  />
                )}

                {/* Paso 6 Org: ¿Quién eres? (Representante) */}
                {currentStep === 6 && (
                  <Step3Identity
                    role={role}
                    fullName={fullName}
                    documentType={documentType}
                    documentNumber={documentNumber}
                    errors={{
                      fullName: errStr(errors.fullName),
                      documentNumber: errStr(errors.documentNumber),
                    }}
                    onChangeFullName={(val) => setValue('fullName', val, { shouldValidate: true })}
                    onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                    onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
                  />
                )}

                {/* Paso 7 Org: Tu cuenta (Variante Org con Banner Verificación) */}
                {currentStep === 7 && (
                  <StepOrgAccount
                    phoneCountryCode={phoneCountryCode}
                    phoneNumber={phoneNumber}
                    email={email}
                    password={password}
                    isSubmitting={isSubmitting}
                    errors={{
                      phoneCountryCode: errStr(errors.phoneCountryCode),
                      phoneNumber: errStr(errors.phoneNumber),
                      email: errStr(errors.email),
                      password: errStr(errors.password),
                    }}
                    onChangePhoneCountryCode={(val) => setValue('phoneCountryCode', val, { shouldValidate: true })}
                    onChangePhoneNumber={(val) => setValue('phoneNumber', val, { shouldValidate: true })}
                    onChangeEmail={(val) => setValue('email', val, { shouldValidate: true })}
                    onChangePassword={(val) => setValue('password', val, { shouldValidate: true })}
                    onSubmitForm={handleSubmit(onSubmitFinal)}
                  />
                )}
              </>
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

              {currentStep < totalSteps ? (
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
