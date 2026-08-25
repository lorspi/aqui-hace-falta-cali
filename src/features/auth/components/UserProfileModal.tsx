import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Phone, MapPin, Building2, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Save, CreditCard, Mail, Globe, AlignLeft } from 'lucide-react';
import { fetchUserProfile, upsertUserProfile, fetchUserOrganization, upsertOrganization } from '../../../lib/supabaseService';
import { supabase } from '../../../lib/supabaseClient';
import { CityCombobox } from '../../../components/CityCombobox';
import { ALL_CITIES } from '../../../data/colombiaCities';
import { DocumentType, userRoleEnum } from '../schemas/registerSchema';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess?: (updatedProfile: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId: propUserId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [activeOrg, setActiveOrg] = useState<any>(null);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '+57',
      phoneNumber: '',
      documentType: 'cedula',
      documentNumber: '',
      country: 'Colombia',
      department: 'Quindío',
      city: 'Armenia',
      orgName: '',
      organizationType: 'bomberos_defensa_civil',
      orgDescription: '',
      orgWebsiteOrSocial: '',
      orgAddress: '',
    },
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const phoneCountryCode = watch('phoneCountryCode');
  const phoneNumber = watch('phoneNumber');
  const documentType = watch('documentType');
  const documentNumber = watch('documentNumber');
  const country = watch('country');
  const department = watch('department');
  const city = watch('city');
  const orgName = watch('orgName');
  const organizationType = watch('organizationType');
  const orgDescription = watch('orgDescription');
  const orgWebsiteOrSocial = watch('orgWebsiteOrSocial');
  const orgAddress = watch('orgAddress');

  useEffect(() => {
    if (!isOpen) return;

    const loadProfileData = async () => {
      setLoading(true);
      setServerError(null);
      setSaveSuccess(false);

      try {
        let targetId = propUserId;
        if (!targetId) {
          const { data: { session } } = await supabase.auth.getSession();
          targetId = session?.user?.id;
        }

        if (!targetId) {
          setServerError('No se encontró una sesión activa');
          setLoading(false);
          return;
        }

        const profile = await fetchUserProfile(targetId);
        setActiveProfile(profile);

        let orgData = null;
        if (profile?.role === 'entidad_profesional') {
          orgData = await fetchUserOrganization(targetId);
          setActiveOrg(orgData);
        }

        if (profile) {
          let rawPhone = profile.phone_number || profile.phone || '';
          if (rawPhone.startsWith('+57')) {
            rawPhone = rawPhone.replace(/^\+57/, '').trim();
          } else if (rawPhone === '+57') {
            rawPhone = '';
          }

          reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '',
            phoneCountryCode: profile.phone_country_code || '+57',
            phoneNumber: rawPhone,
            documentType: profile.document_type || 'cedula',
            documentNumber: profile.document_number || '',
            country: profile.country || 'Colombia',
            department: profile.department || 'Quindío',
            city: profile.city || 'Armenia',
            orgName: orgData?.org_name || profile?.full_name || '',
            organizationType: orgData?.organization_type || 'bomberos_defensa_civil',
            orgDescription: orgData?.description || '',
            orgWebsiteOrSocial: orgData?.website_or_social || '',
            orgAddress: orgData?.address || '',
          });
        }
      } catch (err: any) {
        console.error('[UserProfileModal] Error cargando perfil:', err);
        setServerError('No se pudieron cargar los datos del perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isOpen, propUserId]);

  if (!isOpen) return null;

  // Cálculo del Porcentaje de Completitud
  const isOrg = activeProfile?.role === 'entidad_profesional';

  const fieldsToCheck = isOrg
    ? [
        { name: 'Nombres', filled: !!firstName?.trim() },
        { name: 'Apellidos', filled: !!lastName?.trim() },
        { name: 'Ciudad', filled: !!city?.trim() },
        { name: 'Nombre de Entidad', filled: !!orgName?.trim() },
        { name: 'Descripción de Entidad', filled: !!orgDescription?.trim() },
      ]
    : [
        { name: 'Nombres', filled: !!firstName?.trim() },
        { name: 'Apellidos', filled: !!lastName?.trim() },
        { name: 'Teléfono', filled: !!phoneNumber?.trim() },
        { name: 'Documento', filled: !!documentNumber?.trim() },
        { name: 'Ciudad', filled: !!city?.trim() },
      ];

  const filledCount = fieldsToCheck.filter((f) => f.filled).length;
  const completenessPercent = Math.round((filledCount / fieldsToCheck.length) * 100);
  const missingFields = fieldsToCheck.filter((f) => !f.filled).map((f) => f.name);

  // Rol Badge Helper
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'rescatista':
        return { label: 'Rescatista / Operativo', icon: '🚚', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'acopio':
        return { label: 'Centro de Acopio', icon: '📦', color: 'bg-purple-50 text-purple-900 border-purple-200' };
      case 'entidad_profesional':
        return { label: 'Entidad / Organización', icon: '🛡️', color: 'bg-slate-100 text-slate-900 border-slate-300' };
      case 'moderador':
        return { label: 'Moderador', icon: '⚡', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
      case 'ADMIN':
        return { label: 'Administrador', icon: '👑', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      case 'voluntario':
        return { label: 'Voluntario / Donante', icon: '❤️', color: 'bg-rose-50 text-rose-900 border-rose-200' };
      case 'regular':
      default:
        return { label: 'Usuario Regular', icon: '👤', color: 'bg-blue-50 text-blue-900 border-blue-200' };
    }
  };

  const badge = getRoleBadge(activeProfile?.role);

  // Guardar Cambios del Perfil
  const onSubmit = async (data: any) => {
    setSaving(true);
    setServerError(null);
    setSaveSuccess(false);

    try {
      const targetUserId = activeProfile?.id || propUserId;
      if (!targetUserId) throw new Error('ID de usuario no encontrado');

      const fullName = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
      const hasPhone = !!data.phoneNumber?.trim();
      const fullPhone = hasPhone ? `${data.phoneCountryCode || '+57'}${data.phoneNumber.trim()}` : null;

      // 1. Actualizar tabla public.profiles
      const updatedProfile = await upsertUserProfile({
        id: targetUserId,
        email: data.email,
        first_name: data.firstName?.trim(),
        last_name: data.lastName?.trim(),
        full_name: fullName || data.orgName?.trim() || data.email,
        phone_country_code: hasPhone ? (data.phoneCountryCode || '+57') : null,
        phone_number: hasPhone ? data.phoneNumber.trim() : null,
        phone: fullPhone,
        document_type: data.documentType || 'cedula',
        document_number: data.documentNumber?.trim(),
        country: data.country || 'Colombia',
        department: data.department || 'Quindío',
        city: data.city || 'Armenia',
        role: activeProfile?.role || 'regular',
        moderation_status: activeProfile?.moderation_status,
      });

      // 2. Si es entidad, actualizar tabla public.organizations
      if (isOrg) {
        await upsertOrganization({
          user_id: targetUserId,
          org_name: data.orgName?.trim() || 'Organización sin Nombre',
          organization_type: data.organizationType || 'bomberos_defensa_civil',
          description: data.orgDescription?.trim() || '',
          website_or_social: data.orgWebsiteOrSocial?.trim() || '',
          address: data.orgAddress?.trim() || '',
          latitude: activeOrg?.latitude,
          longitude: activeOrg?.longitude,
          document_type: data.documentType || 'nit',
          document_number: data.documentNumber?.trim(),
        });
      }

      setSaveSuccess(true);
      if (onSuccess) onSuccess(updatedProfile);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('[UserProfileModal] Error al guardar:', err);
      setServerError(err?.message || 'Ocurrió un error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-bold text-white border border-white/20 shadow-inner">
              {firstName ? firstName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>Mi Perfil</span>
                {badge && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300">
                {email || 'Verifica y actualiza la información de tu cuenta'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Cargando datos del perfil...</p>
            </div>
          ) : (
            <>
              {/* Barra de Completitud del Perfil */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Completitud del Perfil</span>
                  </span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    completenessPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {completenessPercent}% Completado
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      completenessPercent === 100
                        ? 'bg-emerald-500'
                        : completenessPercent >= 60
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${completenessPercent}%` }}
                  />
                </div>

                {missingFields.length > 0 && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Te recomendamos completar: <strong className="text-slate-900">{missingFields.join(', ')}</strong></span>
                  </p>
                )}
              </div>

              {/* Banner de Estado de Moderación (Si es moderador) */}
              {activeProfile?.role === 'moderador' && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                  activeProfile.moderation_status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : activeProfile.moderation_status === 'PENDING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Estado de Moderador: {
                        activeProfile.moderation_status === 'APPROVED' ? 'Aprobado ✅' :
                        activeProfile.moderation_status === 'PENDING' ? 'Pendiente de Aprobación ⏳' : 'Rechazado ❌'
                      }
                    </span>
                  </div>
                  {activeProfile.moderator_motivation && (
                    <p className="text-xs opacity-80 mt-1">Motivación: "{activeProfile.moderator_motivation}"</p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Sección 1: Datos Personales y Contacto */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Información Personal y Contacto</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombres */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nombres <span className="text-blue-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setValue('firstName', e.target.value)}
                        placeholder="Ej: María Camila"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 transition-all"
                      />
                    </div>

                    {/* Apellidos */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Apellidos <span className="text-blue-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setValue('lastName', e.target.value)}
                        placeholder="Ej: García López"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 transition-all"
                      />
                    </div>

                    {/* Correo Electrónico (Solo Lectura) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Correo Electrónico (Bloqueado)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Teléfono de Contacto */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Teléfono de Contacto
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phoneCountryCode}
                          onChange={(e) => setValue('phoneCountryCode', e.target.value)}
                          className="w-16 px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 text-center"
                        />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setValue('phoneNumber', e.target.value)}
                          placeholder="Ej: 3001234567"
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Tipo de Documento */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tipo de Documento
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setValue('documentType', e.target.value as DocumentType)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 transition-all"
                      >
                        <option value="cedula">Cédula de Ciudadanía (CC)</option>
                        <option value="cedula_extranjeria">Cédula de Extranjería (CE)</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="nit">NIT (Identificación Tributaria)</option>
                        <option value="ppt_pep">PPT / PEP</option>
                        <option value="tarjeta_identidad">Tarjeta de Identidad (TI)</option>
                      </select>
                    </div>

                    {/* Número de Documento */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Número de Documento
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setValue('documentNumber', e.target.value)}
                        placeholder="Ej: 1012345678"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2: Ubicación Territorial */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubicación Territorial</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        País
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setValue('country', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setValue('department', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Ciudad / Municipio
                      </label>
                      <CityCombobox
                        value={city}
                        onChange={(newCity) => {
                          setValue('city', newCity);
                          const cityObj = ALL_CITIES.find((c: any) => c.name === newCity);
                          if (cityObj) {
                            setValue('department', (cityObj as any).department);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3: Datos de Organización (Si aplica) */}
                {isOrg && (
                  <div className="space-y-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                    <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-200/60">
                      <Building2 className="w-3.5 h-3.5 text-purple-700" />
                      <span>Datos de la Organización / Entidad</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nombre Oficial de la Entidad <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setValue('orgName', e.target.value)}
                          placeholder="Ej: Gobernación del Quindío"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-purple-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Descripción o Misión
                        </label>
                        <textarea
                          rows={2}
                          value={orgDescription}
                          onChange={(e) => setValue('orgDescription', e.target.value)}
                          placeholder="Describe brevemente la misión de la organización..."
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-purple-600 transition-all resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Sitio Web o Red Social
                          </label>
                          <input
                            type="text"
                            value={orgWebsiteOrSocial}
                            onChange={(e) => setValue('orgWebsiteOrSocial', e.target.value)}
                            placeholder="Ej: https://gobernacion.gov.co"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-purple-600 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Dirección Física
                          </label>
                          <input
                            type="text"
                            value={orgAddress}
                            onChange={(e) => setValue('orgAddress', e.target.value)}
                            placeholder="Ej: Calle 20 # 13-22"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-purple-600 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alertas de Servidor o Éxito cerca al botón inferior */}
                {serverError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Los cambios de tu perfil se guardaron correctamente!</span>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
