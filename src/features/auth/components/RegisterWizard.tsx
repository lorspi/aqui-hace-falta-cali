import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ArrowLeft, ArrowRight, X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { upsertUserProfile, upsertOrganization } from '../../../lib/supabaseService';
import {
  UserRole,
  OrganizationType,
  DocumentType,
} from '../schemas/registerSchema';
import { Step1AccountAuth } from './steps/Step1AccountAuth';
import { Step1Role } from './steps/Step1Role';
import { Step2Location } from './steps/Step2Location';
import { Step3Identity } from './steps/Step3Identity';
import { Step3IdentityLocation } from './steps/Step3IdentityLocation';
import { StepModeratorApplication } from './steps/StepModeratorApplication';
import { Step4Account } from './steps/Step4Account';
import { StepOrgCategory } from './steps/StepOrgCategory';
import { StepOrgMapLocation } from './steps/StepOrgMapLocation';
import { StepOrgDetails } from './steps/StepOrgDetails';
import { StepOrgAccount } from './steps/StepOrgAccount';

interface RegisterWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToLogin?: () => void;
  onSuccess?: (savedProfile?: any) => void;
  initialStep?: number;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({
  isOpen = true,
  onClose,
  onNavigateToLogin,
  onSuccess,
  initialStep = 1,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Synchronize currentStep whenever the modal opens or initialStep changes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Inicialización de React Hook Form
  const {
    watch,
    setValue,
    setError,
    clearErrors,
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
      moderatorCommunityCollective: '',
      moderatorMotivation: '',
      firstName: '',
      lastName: '',
      fullName: '',
      documentType: 'cedula',
      documentNumber: '',
      phoneCountryCode: '+57',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      captchaVerified: false,
      acceptTerms: false,
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
  const moderatorCommunityCollective: string = watch('moderatorCommunityCollective');
  const moderatorMotivation: string = watch('moderatorMotivation');
  const firstName: string = watch('firstName');
  const lastName: string = watch('lastName');
  const rawFullName: string = watch('fullName');
  const fullName: string = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || rawFullName;
  const documentType: DocumentType = watch('documentType');
  const documentNumber: string = watch('documentNumber');
  const phoneCountryCode: string = watch('phoneCountryCode');
  const phoneNumber: string = watch('phoneNumber');
  const email: string = watch('email');
  const password: string = watch('password');
  const confirmPassword: string = watch('confirmPassword');
  const captchaVerified: boolean = watch('captchaVerified');
  const acceptTerms: boolean = watch('acceptTerms');

  // Determinar el tipo de flujo y número de pasos totales
  const isOrgFlow = role === 'entidad_profesional';
  const isModeratorFlow = role === 'moderador';
  const totalSteps = isOrgFlow ? 7 : (isModeratorFlow ? 4 : 3);

  // Control de navegación y validación dinámica por paso
  const handleNextStep = async () => {
    setServerError(null);
    setSuccessMessage(null);
    let isValidStep = false;

    if (currentStep === 1) {
      // Paso 1: Autenticación, Nombres, Apellidos, Claves, Captcha y Términos
      clearErrors(['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'captchaVerified', 'acceptTerms']);
      let localValid = true;

      if (!firstName?.trim() || firstName.trim().length < 2) {
        setError('firstName', { type: 'manual', message: 'El nombre es obligatorio' });
        localValid = false;
      }

      if (!lastName?.trim() || lastName.trim().length < 2) {
        setError('lastName', { type: 'manual', message: 'El apellido es obligatorio' });
        localValid = false;
      }

      if (!email?.trim()) {
        setError('email', { type: 'manual', message: 'El correo electrónico es obligatorio' });
        localValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        setError('email', { type: 'manual', message: 'Ingresa un correo electrónico válido' });
        localValid = false;
      }

      if (!password?.trim() || password.length < 6) {
        setError('password', { type: 'manual', message: 'La contraseña debe tener al menos 6 caracteres' });
        localValid = false;
      }

      if (!confirmPassword) {
        setError('confirmPassword', { type: 'manual', message: 'Confirma tu contraseña' });
        localValid = false;
      } else if (password !== confirmPassword) {
        setError('confirmPassword', { type: 'manual', message: 'Las contraseñas no coinciden' });
        localValid = false;
      }

      if (!captchaVerified) {
        setError('captchaVerified', { type: 'manual', message: 'Por favor confirma que no eres un robot' });
        localValid = false;
      }

      if (!acceptTerms) {
        setError('acceptTerms', { type: 'manual', message: 'Debes aceptar los términos y la política de privacidad' });
        localValid = false;
      }

      isValidStep = localValid;
    } else if (currentStep === 2) {
      // Paso 2: Rol
      isValidStep = await trigger(['role']);
    } else if (!isOrgFlow) {
      // Flujo Moderador o Usuario Regular
      if (isModeratorFlow) {
        if (currentStep === 3) {
          // Paso 3 Moderador: Postulación como Moderador
          clearErrors(['moderatorMotivation']);
          if (!moderatorMotivation?.trim() || moderatorMotivation.trim().length < 10) {
            setError('moderatorMotivation', {
              type: 'manual',
              message: 'Describe tu motivación o experiencia para moderar (mínimo 10 caracteres)',
            });
            isValidStep = false;
          } else {
            isValidStep = true;
          }
        } else if (currentStep === 4) {
          // Paso 4 Moderador: Identificación y Ubicación
          clearErrors(['documentNumber']);
          const isLocValid = await trigger(['documentNumber', 'country', 'department', 'city']);
          if (!documentNumber?.trim()) {
            setError('documentNumber', { type: 'manual', message: 'El número de documento es obligatorio' });
            isValidStep = false;
          } else {
            isValidStep = isLocValid;
          }
        }
      } else {
        // Flujo Individual Regular (3 Pasos Totales): Paso 3 Identificación y Ubicación
        if (currentStep === 3) {
          clearErrors(['documentNumber']);
          const isLocValid = await trigger(['documentNumber', 'country', 'department', 'city']);
          if (!documentNumber?.trim()) {
            setError('documentNumber', { type: 'manual', message: 'El número de documento es obligatorio' });
            isValidStep = false;
          } else {
            isValidStep = isLocValid;
          }
        }
      }
    } else {
      // Flujo Organización (7 Pasos)
      if (currentStep === 3) {
        isValidStep = await trigger(['organizationType']);
      } else if (currentStep === 4) {
        isValidStep = await trigger(['orgName']);
      } else if (currentStep === 5) {
        isValidStep = await trigger(['fullName', 'documentType', 'documentNumber', 'phoneNumber']);
      } else if (currentStep === 6) {
        isValidStep = await trigger(['country', 'department', 'city']);
      } else if (currentStep === 7) {
        isValidStep = await trigger(['searchAddress', 'latitude', 'longitude']);
      }
    }

    if (isValidStep && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const isGoogleProfileOnboarding = initialStep === 2;
  const displayStep = isGoogleProfileOnboarding ? currentStep - 1 : currentStep;
  const displayTotalSteps = isGoogleProfileOnboarding ? totalSteps - 1 : totalSteps;

  const handlePrevStep = () => {
    setServerError(null);
    if (currentStep > initialStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Envío final del Formulario a Supabase Auth y Base de Datos
  const onSubmitFinal: SubmitHandler<any> = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const fullPhone = `${data.phoneCountryCode || '+57'}${data.phoneNumber ? data.phoneNumber.trim() : ''}`;
      const isOrg = data.role === 'entidad_profesional';

      // 1. Obtener la sesión / usuario activo (por ejemplo, si inició con Google OAuth)
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      let targetUserId = currentUser?.id;
      let targetEmail = currentUser?.email || (data.email ? data.email.trim() : '');

      // 2. Si NO hay usuario activo de Google, registrar la cuenta en Supabase Auth con Correo y Contraseña
      if (!targetUserId) {
        if (!data.email?.trim() || !data.password?.trim()) {
          throw new Error('Por favor ingresa un correo electrónico y una contraseña válida.');
        }

        const userMetadata: Record<string, any> = {
          full_name: data.fullName?.trim() || '',
          phone: fullPhone,
          document_type: data.documentType || 'cedula',
          document_number: data.documentNumber?.trim() || '',
          country: data.country || 'Colombia',
          department: data.department || 'Quindío',
          city: data.city || 'Armenia',
          role: data.role || 'voluntario',
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

        if (data.role === 'moderador') {
          userMetadata.moderator_community_collective = data.moderatorCommunityCollective?.trim();
          userMetadata.moderator_motivation = data.moderatorMotivation?.trim();
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: userMetadata,
          },
        });

        if (authError) throw authError;
        targetUserId = authData.user?.id;
        targetEmail = authData.user?.email || data.email.trim();
      }

      if (!targetUserId) {
        throw new Error('No se pudo determinar el ID de usuario para completar el registro.');
      }

      // 3. Sincronizar en la tabla `profiles` de Supabase
      const savedProfile = await upsertUserProfile({
        id: targetUserId,
        email: targetEmail,
        full_name: data.fullName?.trim() || currentUser?.user_metadata?.full_name || 'Usuario',
        phone: fullPhone,
        document_type: data.documentType,
        document_number: data.documentNumber,
        country: data.country,
        department: data.department,
        city: data.city,
        role: data.role || 'voluntario',
      });

      if (!savedProfile) {
        throw new Error('No se pudo guardar la información del perfil en la base de datos.');
      }

      // 4. Si es un registro de Entidad / Organización, guardar en la tabla `organizations`
      if (isOrg) {
        await upsertOrganization({
          user_id: targetUserId,
          org_name: data.orgName?.trim() || '',
          organization_type: data.organizationType || 'bomberos_defensa_civil',
          description: data.orgDescription?.trim() || '',
          website_or_social: data.orgWebsiteOrSocial?.trim() || '',
          address: data.searchAddress?.trim() || '',
          latitude: data.latitude || 3.4516,
          longitude: data.longitude || -76.532,
        });
      }

      setSuccessMessage(
        isOrg
          ? '¡Solicitud de organización registrada! Verificaremos la información y activaremos tu insignia.'
          : '¡Perfil y cuenta guardados exitosamente!'
      );

      setTimeout(() => {
        if (onSuccess) onSuccess(savedProfile);
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[RegisterWizard] Error signing up:', err);
      const msg = err?.message || 'Ocurrió un error al registrar la cuenta. Verifica tus datos e intenta nuevamente.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Contenedor Modal Tarjeta Blanca */}
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92dvh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Header con indicador de paso y botón cerrar */}
        <div className="px-6 sm:px-8 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
              {isGoogleProfileOnboarding ? 'Completar Perfil — ' : ''}Paso {displayStep} de {displayTotalSteps}
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

        {/* Indicador Superior de Progreso (Segmentos Rectangulares Adaptables 3 o 4 u 6 o 7) */}
        <div className="px-6 sm:px-8 py-3">
          <div className={`grid gap-1.5 ${displayTotalSteps === 3 ? 'grid-cols-3' : displayTotalSteps === 6 ? 'grid-cols-6' : isOrgFlow ? 'grid-cols-7' : 'grid-cols-4'}`}>
            {Array.from({ length: displayTotalSteps }, (_, i) => (isGoogleProfileOnboarding ? i + 2 : i + 1)).map((stepNum) => {
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
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col justify-between flex-1"
        >
          <div className="px-6 sm:px-8 py-4 flex-1">
            
            {/* Paso 1: Autenticación, Nombres, Apellidos, Claves, Captcha y Términos */}
            {currentStep === 1 && (
              <Step1AccountAuth
                firstName={firstName}
                lastName={lastName}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                captchaVerified={captchaVerified}
                acceptTerms={acceptTerms}
                isSubmitting={isSubmitting}
                errors={{
                  firstName: errStr(errors.firstName),
                  lastName: errStr(errors.lastName),
                  email: errStr(errors.email),
                  password: errStr(errors.password),
                  confirmPassword: errStr(errors.confirmPassword),
                  captchaVerified: errStr(errors.captchaVerified),
                  acceptTerms: errStr(errors.acceptTerms),
                }}
                onChangeFirstName={(val) => setValue('firstName', val, { shouldValidate: true })}
                onChangeLastName={(val) => setValue('lastName', val, { shouldValidate: true })}
                onChangeEmail={(val) => setValue('email', val, { shouldValidate: true })}
                onChangePassword={(val) => setValue('password', val, { shouldValidate: true })}
                onChangeConfirmPassword={(val) => setValue('confirmPassword', val, { shouldValidate: true })}
                onChangeCaptchaVerified={(val) => setValue('captchaVerified', val, { shouldValidate: true })}
                onChangeAcceptTerms={(val) => setValue('acceptTerms', val, { shouldValidate: true })}
              />
            )}

            {/* Paso 2: Selección de Rol */}
            {currentStep === 2 && (
              <Step1Role
                selectedRole={role}
                onSelectRole={(r: UserRole) => {
                  setValue('role', r, { shouldValidate: true });
                }}
              />
            )}

            {/* Renderizado para Flujos Individuales y Moderador */}
            {!isOrgFlow && (
              <>
                {/* Paso 3 Moderador: Postulación como Moderador */}
                {isModeratorFlow && currentStep === 3 && (
                  <StepModeratorApplication
                    moderatorCommunityCollective={moderatorCommunityCollective}
                    moderatorMotivation={moderatorMotivation}
                    isSubmitting={isSubmitting}
                    errors={{
                      moderatorCommunityCollective: errStr(errors.moderatorCommunityCollective),
                      moderatorMotivation: errStr(errors.moderatorMotivation),
                    }}
                    onChangeCommunityCollective={(val) => setValue('moderatorCommunityCollective', val, { shouldValidate: true })}
                    onChangeMotivation={(val) => setValue('moderatorMotivation', val, { shouldValidate: true })}
                  />
                )}

                {/* Paso 3 Regular (3 de 3) o Paso 4 Moderador (4 de 4): Identificación y Ubicación */}
                {((!isModeratorFlow && currentStep === 3) || (isModeratorFlow && currentStep === 4)) && (
                  <Step3IdentityLocation
                    documentType={documentType}
                    documentNumber={documentNumber}
                    country={country}
                    department={department}
                    city={city}
                    isSubmitting={isSubmitting}
                    errors={{
                      documentNumber: errStr(errors.documentNumber),
                      city: errStr(errors.city),
                    }}
                    onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                    onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
                    onChangeCountry={(c) => setValue('country', c, { shouldValidate: true })}
                    onChangeDepartment={(d) => setValue('department', d, { shouldValidate: true })}
                    onChangeCity={(ct) => setValue('city', ct, { shouldValidate: true })}
                  />
                )}
              </>
            )}

            {/* Renderizado para Flujo de Organización (7 Pasos) */}
            {isOrgFlow && (
              <>
                {/* Paso 3 Org: Tipo de Organización */}
                {currentStep === 3 && (
                  <StepOrgCategory
                    selectedType={organizationType}
                    onSelectType={(t) => setValue('organizationType', t, { shouldValidate: true })}
                  />
                )}

                {/* Paso 4 Org: Tu organización (Datos Entidad) */}
                {currentStep === 4 && (
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

                {/* Paso 5 Org: Identificación Representante */}
                {currentStep === 5 && (
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

                {/* Paso 6 Org: Ubicación Territorio */}
                {currentStep === 6 && (
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

                {/* Paso 7 Org: Mapa y Dirección */}
                {currentStep === 7 && (
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
                  type="button"
                  onClick={() => handleSubmit(onSubmitFinal)()}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 ml-auto cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isGoogleProfileOnboarding ? 'Guardando perfil...' : 'Creando cuenta...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{isGoogleProfileOnboarding ? 'Guardar perfil' : 'Crear cuenta'}</span>
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
