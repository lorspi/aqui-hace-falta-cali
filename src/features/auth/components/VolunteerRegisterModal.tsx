import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, HeartHandshake, Mail, Phone, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { upsertUserProfile } from '../../../lib/supabaseService';
import { Turnstile } from '../../../components/Turnstile';
import { findCityById, findDepartmentByCityId } from '../../../data/colombiaCities';
import { CityFormCombobox } from '../../../components/CityFormCombobox';

interface VolunteerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type VolunteerConnectionType = 'VOLUNTEER' | 'OFFER_HELP' | 'COLLABORATE' | 'COMMUNITY';
export type PreferredContactMethod = 'EMAIL' | 'PHONE_CALL' | 'WHATSAPP';

export const VolunteerRegisterModal: React.FC<VolunteerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Form Fields - Step 1: Personal Data & Auth
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+57');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [documentType, setDocumentType] = useState('cedula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [cityId, setCityId] = useState('cali-valle-del-cauca');
  const [captchaToken, setCaptchaToken] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Form Fields - Step 2: Volunteer Preferences
  const [connectionType, setConnectionType] = useState<VolunteerConnectionType>('VOLUNTEER');
  const [volunteerNotes, setVolunteerNotes] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContactMethod>('WHATSAPP');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre es obligatorio (mínimo 2 caracteres)';
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido es obligatorio (mínimo 2 caracteres)';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!documentNumber.trim()) {
      newErrors.documentNumber = 'El número de documento es obligatorio';
    }
    if (!captchaToken) {
      newErrors.captchaToken = 'Por favor confirma que no eres un robot';
    }
    if (!acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y la política de privacidad';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(2);
      setServerError(null);
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const selectedCityObj = findCityById(cityId);
      const selectedDeptObj = findDepartmentByCityId(cityId);
      const resolvedCity = selectedCityObj ? selectedCityObj.name : 'Cali';
      const resolvedDept = selectedDeptObj ? selectedDeptObj.name : 'Valle del Cauca';

      const hasPhone = !!phoneNumber.trim();
      const fullPhone = hasPhone ? `${phoneCountryCode}${phoneNumber.trim()}` : null;

      const userMetadata = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber.trim(),
        phone: fullPhone,
        document_type: documentType,
        document_number: documentNumber.trim(),
        country: 'Colombia',
        department: resolvedDept,
        city: resolvedCity,
        role: 'voluntario',
        moderation_status: 'PENDING',
        is_verified: false,
        accept_terms: true,
        terms_accepted_at: new Date().toISOString(),
        volunteer_connection_type: connectionType,
        volunteer_notes: volunteerNotes.trim(),
        preferred_contact_method: preferredContactMethod,
      };

      // 1. Crear cuenta en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: userMetadata,
        },
      });

      if (authError) throw authError;

      const targetUserId = authData.user?.id;
      if (!targetUserId) throw new Error('No se pudo generar el ID de usuario.');

      // 2. Guardar perfil en public.profiles con rol voluntario y estado PENDING
      await upsertUserProfile({
        id: targetUserId,
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber.trim(),
        phone: fullPhone,
        document_type: documentType,
        document_number: documentNumber.trim(),
        country: 'Colombia',
        department: resolvedDept,
        city: resolvedCity,
        role: 'voluntario',
        moderation_status: 'PENDING',
        accept_terms: true,
        terms_accepted_at: new Date().toISOString(),
        volunteer_connection_type: connectionType,
        volunteer_notes: volunteerNotes.trim(),
        preferred_contact_method: preferredContactMethod,
      });

      setIsCompleted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[VolunteerRegisterModal] Error al registrar voluntario:', err);
      setServerError(err?.message || 'Ocurrió un error al registrar tu postulación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b1329]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Cabecera del Modal */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">
                Registro de Voluntarios RaDAR
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {isCompleted ? '¡Postulación Recibida!' : `Paso ${currentStep} de 2: ${currentStep === 1 ? 'Datos Personales' : 'Preferencias de Voluntariado'}`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de Error */}
        {serverError && (
          <div className="mx-6 sm:mx-8 mt-4 bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{serverError}</span>
          </div>
        )}

        {/* Pantalla de Éxito al Completar */}
        {isCompleted ? (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                ¡Gracias por sumarte a RaDAR!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Tu solicitud de voluntariado quedó registrada en estado <strong className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">PENDIENTE DE REVISIÓN</strong>. Un coordinador de RaDAR revisará tu perfil y te contactará por tu método preferido.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-1">
              <p><strong className="text-slate-800">Nombre:</strong> {firstName} {lastName}</p>
              <p><strong className="text-slate-800">Correo:</strong> {email}</p>
              <p><strong className="text-slate-800">Contacto Preferido:</strong> {preferredContactMethod === 'WHATSAPP' ? 'WhatsApp' : preferredContactMethod === 'PHONE_CALL' ? 'Llamada Telefónica' : 'Correo Electrónico'}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md cursor-pointer"
            >
              Cerrar y Volver
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFinal} className="p-6 sm:p-8 space-y-6">
            
            {/* Paso 1: Datos de Autenticación y Ubicación */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Juan Manuel"
                      className={`w-full p-3 bg-slate-50 border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                    />
                    {errors.firstName && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Pérez Gómez"
                      className={`w-full p-3 bg-slate-50 border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                    />
                    {errors.lastName && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className={`w-full p-3 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                  />
                  {errors.email && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full p-3 bg-slate-50 border pr-10 ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full p-3 bg-slate-50 border pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Documento</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="cedula">Cédula de Ciudadanía</option>
                      <option value="nit">NIT</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="extrangeria">Cédula de Extranjería</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento *</label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Ej. 1144123456"
                      className={`w-full p-3 bg-slate-50 border ${errors.documentNumber ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500`}
                    />
                    {errors.documentNumber && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.documentNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneCountryCode}
                      onChange={(e) => setPhoneCountryCode(e.target.value)}
                      className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-center"
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="300 123 4567"
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad y Departamento</label>
                  <CityFormCombobox
                    value={cityId}
                    onChange={(selectedCityId: string) => setCityId(selectedCityId)}
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="pt-2">
                  <Turnstile
                    onVerify={(token) => {
                      setCaptchaToken(token);
                      setErrors((prev) => ({ ...prev, captchaToken: '' }));
                    }}
                    onError={() => setCaptchaToken('')}
                    onExpire={() => setCaptchaToken('')}
                    appearance="always"
                    size="flexible"
                    theme="light"
                    language="es"
                  />
                  {errors.captchaToken && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.captchaToken}</p>}
                </div>

                {/* Checkbox Términos */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms-vol-check"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms-vol-check" className="text-xs text-slate-600 leading-snug cursor-pointer">
                    Acepto los <a href="/terminos" target="_blank" className="text-blue-600 font-bold hover:underline">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-blue-600 font-bold hover:underline">Política de Privacidad</a>.
                  </label>
                </div>
                {errors.acceptTerms && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.acceptTerms}</p>}

                {/* Botón Siguiente */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Siguiente: Preguntas de Voluntariado</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Preguntas de Voluntariado y Alianza (Basado en Capturas) */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Pregunta 1: ¿Cómo te gustaría conectarte? */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    ¿Cómo te gustaría conectarte con RaDAR de Ayuda? *
                  </label>
                  
                  <div className="space-y-2.5">
                    <label
                      onClick={() => setConnectionType('VOLUNTEER')}
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        connectionType === 'VOLUNTEER'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="connectionType"
                        checked={connectionType === 'VOLUNTEER'}
                        onChange={() => setConnectionType('VOLUNTEER')}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900">🧑‍🌾 Ser voluntario/a</span>
                        <p className="text-slate-600 mt-0.5">Quiero aportar mi tiempo, experiencia o conocimiento.</p>
                      </div>
                    </label>

                    <label
                      onClick={() => setConnectionType('OFFER_HELP')}
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        connectionType === 'OFFER_HELP'
                          ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="connectionType"
                        checked={connectionType === 'OFFER_HELP'}
                        onChange={() => setConnectionType('OFFER_HELP')}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900">💛 Ofrecer ayuda</span>
                        <p className="text-slate-600 mt-0.5">Tengo recursos, productos, servicios u otro tipo de ayuda que podría aportar.</p>
                      </div>
                    </label>

                    <label
                      onClick={() => setConnectionType('COLLABORATE')}
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        connectionType === 'COLLABORATE'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="connectionType"
                        checked={connectionType === 'COLLABORATE'}
                        onChange={() => setConnectionType('COLLABORATE')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900">🤝 Colaborar</span>
                        <p className="text-slate-600 mt-0.5">Quiero explorar una alianza, proyecto o colaboración con RaDAR.</p>
                      </div>
                    </label>

                    <label
                      onClick={() => setConnectionType('COMMUNITY')}
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                        connectionType === 'COMMUNITY'
                          ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="connectionType"
                        checked={connectionType === 'COMMUNITY'}
                        onChange={() => setConnectionType('COMMUNITY')}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900">📡 Ser parte de la comunidad</span>
                        <p className="text-slate-600 mt-0.5">Quiero mantenerme informado y recibir novedades de RaDAR.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Pregunta 2: Cuéntanos un poco más */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cuéntanos un poco más
                  </label>
                  <p className="text-xs text-slate-500">
                    ¿Cómo te gustaría aportar, colaborar o hacer parte de RaDAR? Si tienes alguna idea, recurso, experiencia o propuesta específica, cuéntanos aquí.
                  </p>
                  <textarea
                    rows={3}
                    value={volunteerNotes}
                    onChange={(e) => setVolunteerNotes(e.target.value)}
                    placeholder="Escribe tus ideas, experiencia o propuesta..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Pregunta 3: Método de contacto preferido */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Método de contacto preferido *
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      onClick={() => setPreferredContactMethod('WHATSAPP')}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                        preferredContactMethod === 'WHATSAPP'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Mensaje Whatsapp</span>
                    </label>

                    <label
                      onClick={() => setPreferredContactMethod('EMAIL')}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                        preferredContactMethod === 'EMAIL'
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Correo electrónico</span>
                    </label>

                    <label
                      onClick={() => setPreferredContactMethod('PHONE_CALL')}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-bold transition-all ${
                        preferredContactMethod === 'PHONE_CALL'
                          ? 'border-purple-600 bg-purple-50 text-purple-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>Llamada telefónica</span>
                    </label>
                  </div>
                </div>

                {/* Acciones del Paso 2 */}
                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registrando postulación...</span>
                      </>
                    ) : (
                      <>
                        <HeartHandshake className="w-4 h-4" />
                        <span>Enviar Postulación de Voluntario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
