import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { ArrowLeft, ArrowRight, X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { upsertUserProfile, upsertOrganization } from '../../../lib/supabaseService';
import { useTranslation } from '../../../i18n/LanguageContext';
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
import { getCityCoordinates, findCityById, findDepartmentByCityId, getCityDisplayName } from '../../../data/colombiaCities';

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
  const { t } = useTranslation();

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
      role: 'regular',
      organizationType: 'bomberos_defensa_civil',
      country: 'Colombia',
      department: '',
      city: '',
      cityId: '',
      departmentId: '',
      searchAddress: '',
      latitude: 0,
      longitude: 0,
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
      captchaToken: '',
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
  const cityId: string = watch('cityId');
  const departmentId: string = watch('departmentId');
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
  const captchaToken: string = watch('captchaToken');
  const acceptTerms: boolean = watch('acceptTerms');

  // Determinar el tipo de flujo y número de pasos totales
  const isOrgFlow = role === 'entidad_profesional';
  const isModeratorFlow = role === 'moderador';
  const totalSteps = isOrgFlow ? 5 : (isModeratorFlow ? 4 : 3);

  // Control de navegación y validación dinámica por paso
  const handleNextStep = async () => {
    setServerError(null);
    setSuccessMessage(null);
    let isValidStep = false;

    if (currentStep === 1) {
      // Paso 1: Autenticación, Nombres, Apellidos, Claves, Captcha y Términos
      clearErrors(['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'captchaToken', 'acceptTerms']);
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

      if (!captchaToken) {
        setError('captchaToken', { type: 'manual', message: 'Por favor confirma que no eres un robot' });
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
      // Flujo Organización (5 Pasos Totales)
      if (currentStep === 3) {
        clearErrors(['orgName']);
        if (!orgName?.trim() || orgName.trim().length < 2) {
          setError('orgName', { type: 'manual', message: 'El nombre de la organización es obligatorio' });
          isValidStep = false;
        } else {
          isValidStep = true;
        }
      } else if (currentStep === 4) {
        clearErrors(['documentNumber']);
        const isLocValid = await trigger(['documentNumber', 'country', 'department', 'city']);
        if (!documentNumber?.trim()) {
          setError('documentNumber', { type: 'manual', message: 'El número de documento es obligatorio' });
          isValidStep = false;
        } else {
          isValidStep = isLocValid;
          if (isLocValid && cityId) {
            const coords = getCityCoordinates(cityId, departmentId);
            if (coords && coords.lat && coords.lng) {
              setValue('latitude', coords.lat, { shouldValidate: true });
              setValue('longitude', coords.lng, { shouldValidate: true });
            }
          }
        }
      } else if (currentStep === 5) {
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
      const hasPhone = !!data.phoneNumber?.trim();
      const fullPhone = hasPhone ? `${data.phoneCountryCode || '+57'}${data.phoneNumber.trim()}` : null;
      const isOrg = data.role === 'entidad_profesional';

      // 1. Obtener la sesión / usuario activo (por ejemplo, si inició con Google OAuth)
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      let targetUserId = currentUser?.id;
      let targetEmail = currentUser?.email || (data.email ? data.email.trim() : '');

      // Resolver nombres reales de ciudad y departamento desde cityId
      const selectedCityObj = data.cityId ? findCityById(data.cityId) : null;
      const selectedDeptObj = data.cityId ? findDepartmentByCityId(data.cityId) : null;
      const resolvedCity = data.city?.trim() || (selectedCityObj ? selectedCityObj.name : 'Cali');
      const resolvedDept = data.department?.trim() || (selectedDeptObj ? selectedDeptObj.name : 'Valle del Cauca');

      // 2. Si NO hay usuario activo de Google, registrar la cuenta en Supabase Auth con Correo y Contraseña
      if (!targetUserId) {
        if (!data.email?.trim() || !data.password?.trim()) {
          throw new Error(t('authRegisterErrorNoEmail'));
        }

        const userMetadata: Record<string, any> = {
          first_name: data.firstName?.trim() || '',
          last_name: data.lastName?.trim() || '',
          full_name: `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim() || data.fullName?.trim() || 'Usuario',
          phone_country_code: hasPhone ? (data.phoneCountryCode || '+57') : null,
          phone_number: hasPhone ? data.phoneNumber.trim() : null,
          phone: fullPhone,
          document_type: data.documentType || 'cedula',
          document_number: data.documentNumber?.trim() || '',
          country: data.country || 'Colombia',
          department: resolvedDept,
          city: resolvedCity,
          is_auto_detected_location: false,
          role: data.role || 'regular',
          accept_terms: true,
          terms_accepted_at: new Date().toISOString(),
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
        if (authData.user) {
          targetUserId = authData.user.id;
          targetEmail = authData.user.email || data.email.trim();
        }
      }

      if (!targetUserId) {
        throw new Error(t('authRegisterErrorNoUser'));
      }

      // 3. Normalizar y guardar el perfil en la tabla `public.profiles`
      const savedProfile = await upsertUserProfile({
        id: targetUserId,
        email: targetEmail,
        first_name: data.firstName?.trim(),
        last_name: data.lastName?.trim(),
        full_name: `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim() || data.orgName?.trim() || data.email,
        phone_country_code: hasPhone ? (data.phoneCountryCode || '+57') : null,
        phone_number: hasPhone ? data.phoneNumber.trim() : null,
        phone: fullPhone,
        document_type: data.documentType,
        document_number: data.documentNumber,
        country: data.country || 'Colombia',
        department: resolvedDept,
        city: resolvedCity,
        is_auto_detected_location: false,
        role: data.role || 'regular',
        accept_terms: true,
        terms_accepted_at: new Date().toISOString(),
        moderator_community_collective: data.moderatorCommunityCollective,
        moderator_motivation: data.moderatorMotivation,
      });

      if (!savedProfile) {
        throw new Error(t('authRegisterErrorProfile'));
      }

      // 4. Si es un registro de Entidad / Organización, guardar en la tabla `organizations`
      if (isOrg) {
        try {
          await upsertOrganization({
            user_id: targetUserId,
            org_name: data.orgName?.trim() || data.orgDescription?.trim() || `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim() || 'Organización Registrada',
            organization_type: data.organizationType || 'bomberos_defensa_civil',
            description: data.orgDescription?.trim() || '',
            website_or_social: data.orgWebsiteOrSocial?.trim() || '',
            address: data.searchAddress?.trim() || '',
            latitude: data.latitude || 3.4516,
            longitude: data.longitude || -76.532,
            document_type: data.documentType || 'nit',
            document_number: data.documentNumber?.trim(),
          });
        } catch (orgErr: any) {
          console.error('[RegisterWizard] Error al guardar datos de la organización:', orgErr);
          // Si el perfil principal guardó con éxito, notificamos el registro exitoso
        }
      }

      setSuccessMessage(
        isOrg
          ? t('authRegisterSuccessOrg')
          : t('authRegisterSuccessProfile')
      );

      setTimeout(() => {
        if (onSuccess) onSuccess(savedProfile);
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[RegisterWizard] Error signing up:', err);
      const msg = err?.message || t('authRegisterErrorGeneric');
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Contenedor Modal Tarjeta Blanca */}
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92dvh] overflow-y-auto modal-scroll shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Header con indicador de paso y botón cerrar */}
        <div className="px-6 sm:px-8 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-white z-20 border-b border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
              {isGoogleProfileOnboarding ? `${t('authRegisterCompleteProfile')} ` : ''}{t('authRegisterStepLabel')} {displayStep} {t('authRegisterStepOf')} {displayTotalSteps}
            </span>
            {isOrgFlow && (
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {t('authRegisterOrgBadge')}
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
                captchaToken={captchaToken}
                acceptTerms={acceptTerms}
                isSubmitting={isSubmitting}
                errors={{
                  firstName: errStr(errors.firstName),
                  lastName: errStr(errors.lastName),
                  email: errStr(errors.email),
                  password: errStr(errors.password),
                  confirmPassword: errStr(errors.confirmPassword),
                  captchaToken: errStr(errors.captchaToken),
                  acceptTerms: errStr(errors.acceptTerms),
                }}
                onChangeFirstName={(val) => setValue('firstName', val, { shouldValidate: true })}
                onChangeLastName={(val) => setValue('lastName', val, { shouldValidate: true })}
                onChangeEmail={(val) => setValue('email', val, { shouldValidate: true })}
                onChangePassword={(val) => setValue('password', val, { shouldValidate: true })}
                onChangeConfirmPassword={(val) => setValue('confirmPassword', val, { shouldValidate: true })}
                onCaptchaVerify={(token) => setValue('captchaToken', token, { shouldValidate: true })}
                onCaptchaExpire={() => setValue('captchaToken', '', { shouldValidate: true })}
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
                    cityId={cityId}
                    departmentId={departmentId}
                    isSubmitting={isSubmitting}
                    errors={{
                      documentNumber: errStr(errors.documentNumber),
                      city: errStr(errors.city),
                    }}
                    onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                    onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
                    onChangeCountry={(c) => setValue('country', c, { shouldValidate: true })}
                    onChangeCityId={(cId, dId) => {
                      setValue('cityId', cId, { shouldValidate: true });
                      setValue('departmentId', dId || '', { shouldValidate: true });
                    }}
                  />
                )}
              </>
            )}

            {/* Renderizado para Flujo de Organización (5 Pasos) */}
            {isOrgFlow && (
              <>
                {/* Paso 3 Org (3 de 5): Datos de la Organización (Tipo + Nombre + Misión + Red Social) */}
                {currentStep === 3 && (
                  <StepOrgDetails
                    selectedType={organizationType}
                    orgName={orgName}
                    orgDescription={orgDescription}
                    orgWebsiteOrSocial={orgWebsiteOrSocial}
                    errors={{
                      orgName: errStr(errors.orgName),
                    }}
                    onSelectType={(t) => setValue('organizationType', t, { shouldValidate: true })}
                    onChangeOrgName={(val) => {
                      setValue('orgName', val, { shouldValidate: true });
                      setValue('fullName', val, { shouldValidate: true });
                    }}
                    onChangeOrgDescription={(val) => setValue('orgDescription', val, { shouldValidate: true })}
                    onChangeOrgWebsiteOrSocial={(val) => setValue('orgWebsiteOrSocial', val, { shouldValidate: true })}
                  />
                )}

                {/* Paso 4 Org (4 de 5): Identificación Legal y Ubicación Territorio */}
                {currentStep === 4 && (
                  <Step3IdentityLocation
                    documentType={documentType || 'nit'}
                    documentNumber={documentNumber}
                    country={country}
                    cityId={cityId}
                    departmentId={departmentId}
                    isSubmitting={isSubmitting}
                    errors={{
                      documentNumber: errStr(errors.documentNumber),
                      city: errStr(errors.city),
                    }}
                    onChangeDocumentType={(type: DocumentType) => setValue('documentType', type, { shouldValidate: true })}
                    onChangeDocumentNumber={(val) => setValue('documentNumber', val, { shouldValidate: true })}
                    onChangeCountry={(c) => setValue('country', c, { shouldValidate: true })}
                    onChangeCityId={(cId, dId) => {
                      setValue('cityId', cId, { shouldValidate: true });
                      setValue('departmentId', dId || '', { shouldValidate: true });
                    }}
                  />
                )}

                {/* Paso 5 Org (5 de 5): Ubicación en Mapa y Dirección de la Sede */}
                {currentStep === 5 && (
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
                  <span>{t('authRegisterBack')}</span>
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
                  <span>{t('authRegisterNext')}</span>
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
                      <span>{isGoogleProfileOnboarding ? t('authRegisterSavingProfile') : t('authRegisterCreating')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{isGoogleProfileOnboarding ? t('authRegisterSaveProfile') : t('authRegisterCreateAccount')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Pie de Tarjeta: "¿Ya tienes cuenta? Iniciar sesión" */}
            <div className="text-center pt-2 border-t border-slate-200/60">
              <p className="text-xs text-slate-500">
                {t('authRegisterHasAccount')}{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1"
                >
                  {t('authRegisterLoginLink')}
                </button>
              </p>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
