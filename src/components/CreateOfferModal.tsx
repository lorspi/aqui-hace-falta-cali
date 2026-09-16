import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, CheckCircle2, ShieldCheck, Plus, Trash2, AlertCircle, ArrowLeft, ArrowRight, Truck, HandHeart, Clock } from 'lucide-react';
import { createOfferWithItems, fetchHelpCategoriesAndResources } from '../lib/supabaseService';
import { HelpCategory, Offer, HelpResourceRecord, OfferItemRecord } from '../types';
import { CATEGORY_LABELS, getCategoryLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { getCityDisplayName, getCityCoordinates, findDepartmentByCityId, detectCityFromCoords, ALL_COLOMBIA_ID } from '../data/colombiaCities';
import { useTranslation } from '../i18n/LanguageContext';
import { trackClarityEvent } from '../utils/analytics';
import { supabase } from '../lib/supabaseClient';
import { showAlert } from './ConfirmDialog';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newOffer: Offer) => void;
  selectedCityId?: string;
  onRequireAuth?: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedCityId = '',
  onRequireAuth,
}) => {
  const { language, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Datos de la Oferta y Modalidad
  const [title, setTitle] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<string>('llevamos');
  const [coverageRadius, setCoverageRadius] = useState<string>('10 km');
  const [shippingCost, setShippingCost] = useState<string>('Gratis');

  // Paso 2: Recursos y Servicios Ofrecidos
  const [selectedItems, setSelectedItems] = useState<OfferItemRecord[]>([]);
  const [availableResources, setAvailableResources] = useState<HelpResourceRecord[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Paso 3: Ubicación
  const [cityId, setCityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [latitude, setLatitude] = useState<number>(3.4516);
  const [longitude, setLongitude] = useState<number>(-76.5320);
  const [isManualPosition, setIsManualPosition] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('IDLE');

  // Paso 4: Descripción y Contacto
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errores de validación inline por campo (patrón estándar: borde rojo + texto rojo debajo)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearFieldError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Cargar catálogo de recursos al abrir
  useEffect(() => {
    if (!isOpen) return;
    const loadCatalog = async () => {
      setLoadingResources(true);
      const data = await fetchHelpCategoriesAndResources();
      setAvailableCategories(data.categories);
      setAvailableResources(data.resources);
      setLoadingResources(false);
    };
    loadCatalog();
  }, [isOpen]);

  // Reset del formulario
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setErrors({});
    setTitle('');
    setDescription('');
    setSelectedItems([]);
    setAddress('');
    setNeighborhood('');
    setContactName('');
    setContactPhone('');
    setContactWhatsapp('');
    setContactEmail('');
    setOrganizationName('');
    setIsManualPosition(false);
    setGeocodeStatus('IDLE');

    if (selectedCityId && selectedCityId !== ALL_COLOMBIA_ID) {
      setCityId(selectedCityId);
      const dept = findDepartmentByCityId(selectedCityId);
      setDepartmentId(dept ? dept.id : '');
      const coords = getCityCoordinates(selectedCityId, dept?.id);
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      return;
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          const detected = detectCityFromCoords(lat, lng);
          if (detected) {
            setCityId(detected.id);
            setDepartmentId(detected.departmentId);
          }
        },
        () => {
          setCityId('');
          setDepartmentId('');
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, [isOpen, selectedCityId]);

  // Manejadores para agregar/remover recursos ofrecidos
  const handleToggleResourceItem = (resource: any) => {
    clearFieldError('selectedItems');
    const exists = selectedItems.find((item) => item.resourceId === resource.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((item) => item.resourceId !== resource.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          resourceId: resource.id,
          categoryId: resource.category_id || resource.categoryId || 'agua_saneamiento',
          resourceName: resource.name,
          unit: resource.unit || 'unidades',
          availableQuantity: 1,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (resourceId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) => (item.resourceId === resourceId ? { ...item, availableQuantity: Math.max(1, quantity) } : item))
    );
  };

  const handleNextStep1 = () => {
    const stepErrors: Record<string, string> = {};
    if (!title.trim()) {
      stepErrors.title = 'El título es obligatorio';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    const stepErrors: Record<string, string> = {};
    if (selectedItems.length === 0) {
      stepErrors.selectedItems = 'Selecciona al menos un recurso o servicio a ofrecer';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    const stepErrors: Record<string, string> = {};
    if (!cityId) {
      stepErrors.cityId = 'Selecciona la ciudad o municipio';
    }
    if (!neighborhood.trim()) {
      stepErrors.neighborhood = 'El barrio o sector es obligatorio';
    }
    if (!address.trim()) {
      stepErrors.address = 'La dirección de acopio o recogida es obligatoria';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stepErrors: Record<string, string> = {};
    if (!description.trim()) {
      stepErrors.description = 'La descripción es obligatoria';
    }
    if (!contactName.trim()) {
      stepErrors.contactName = 'El nombre del contacto es obligatorio';
    }
    if (!contactPhone.trim()) {
      stepErrors.contactPhone = 'El teléfono de contacto es obligatorio';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    // Guard de Autenticación
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      await showAlert('Para publicar una oferta de ayuda debes iniciar sesión o registrarte.');
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadOffer = {
        title,
        description,
        deliveryMode,
        coverageRadius,
        shippingCost,
        cityId,
        departmentId,
        neighborhood,
        address,
        latitude,
        longitude,
        contactName,
        contactPhone,
        contactWhatsapp,
        contactEmail,
        organizationName,
        categories: Array.from(new Set(selectedItems.map((i) => i.categoryId))),
        resources: selectedItems.map((i) => ({
          id: i.resourceId,
          type: i.categoryId,
          description: i.resourceName,
          quantity: i.availableQuantity,
          unit: i.unit,
        })),
      };

      const createdOffer = await createOfferWithItems(payloadOffer, selectedItems);

      trackClarityEvent('create_offer_success', {
        cityId,
        itemsCount: selectedItems.length,
      });

      await showAlert('¡Tu oferta de ayuda ha sido registrada exitosamente en Radar de Ayuda!');
      if (onSuccess) onSuccess(createdOffer);
      onClose();
    } catch (err: any) {
      console.error('Error al registrar la oferta:', err);
      await showAlert('Ocurrió un error al guardar la oferta. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Barra de Progreso de 4 Pasos */}
        <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                OFRECER AYUDA • Paso {currentStep} de 4
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {currentStep === 1 && '1. Título & Modalidad de Entrega'}
                {currentStep === 2 && '2. Recursos a Donar / Ofrecer'}
                {currentStep === 3 && '3. Ubicación & Cobertura'}
                {currentStep === 4 && '4. Contacto & Publicación'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800 flex-1">
          {/* PASO 1: Modalidad y Título */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="form-label font-bold text-slate-900">
                  Título de tu Oferta de Ayuda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearFieldError('title'); }}
                  placeholder="Ej: Donación de kits de alimentos y cobijas en buen estado"
                  className={`input-base ${errors.title ? 'input-error' : ''}`}
                  aria-invalid={errors.title ? true : undefined}
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div>
                <label className="form-label font-bold text-slate-900">Modalidad de Entrega / Logística</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('llevamos')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      deliveryMode === 'llevamos' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs">Nosotros Llevamos / Transportamos</span>
                      <span className="text-[10px] text-slate-500">Tenemos logística para mover la ayuda al sitio afectado.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('recogen')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      deliveryMode === 'recogen' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <HandHeart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs">Recogida en Punto de Acopio</span>
                      <span className="text-[10px] text-slate-500">La ayuda está disponible en nuestra dirección o sede.</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">Radio de Cobertura</label>
                  <input
                    type="text"
                    value={coverageRadius}
                    onChange={(e) => setCoverageRadius(e.target.value)}
                    placeholder="Ej: 10 km, Toda la ciudad"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label font-bold">Costo de Envío / Transporte</label>
                  <input
                    type="text"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="Ej: Gratis, A convenir"
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Selección de Recursos a Donar */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <label className="form-label font-bold text-slate-900">
                Selecciona los Recursos o Servicios que vas a Ofrecer <span className="text-red-500">*</span>
              </label>

              {loadingResources ? (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Cargando catálogo de ayuda...
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableCategories.map((cat) => {
                    const catResources = availableResources.filter((r: any) => r.category_id === cat.id || r.categoryId === cat.id);
                    if (catResources.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block border-b border-slate-200 pb-1">
                          {cat.name}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {catResources.map((res: any) => {
                            const isSel = selectedItems.some((i) => i.resourceId === res.id);
                            return (
                              <button
                                type="button"
                                key={res.id}
                                onClick={() => handleToggleResourceItem(res)}
                                className={`px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {res.name} ({res.unit})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.selectedItems && <p className="form-error">{errors.selectedItems}</p>}

              {selectedItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="font-bold text-slate-900 block">Cantidades Ofrecidas Disponibles:</label>
                  {selectedItems.map((item) => (
                    <div key={item.resourceId} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex-1">
                        <span className="font-bold text-xs text-slate-900 block">{item.resourceName}</span>
                        <span className="text-[10px] text-slate-500">Unidad: {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.availableQuantity}
                          onChange={(e) => handleUpdateItemQuantity(item.resourceId, Number(e.target.value))}
                          className="w-16 p-1 border border-slate-300 rounded-lg text-center font-bold text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleResourceItem({ id: item.resourceId })}
                          className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Ubicación */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="form-label font-bold">{t('cityLabel')} <span className="text-red-500">*</span></label>
                <CityFormCombobox
                  value={cityId}
                  departmentId={departmentId}
                  onChange={(cId, dId) => {
                    setCityId(cId);
                    setDepartmentId(dId || '');
                    clearFieldError('cityId');
                  }}
                />
                {errors.cityId && <p className="form-error">{errors.cityId}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">{t('neighborhoodLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => { setNeighborhood(e.target.value); clearFieldError('neighborhood'); }}
                    placeholder="Ej: San Antonio"
                    className={`input-base ${errors.neighborhood ? 'input-error' : ''}`}
                    aria-invalid={errors.neighborhood ? true : undefined}
                  />
                  {errors.neighborhood && <p className="form-error">{errors.neighborhood}</p>}
                </div>

                <div>
                  <label className="form-label font-bold">{t('addressLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); clearFieldError('address'); }}
                    placeholder="Ej: Calle 5 # 10-20"
                    className={`input-base ${errors.address ? 'input-error' : ''}`}
                    aria-invalid={errors.address ? true : undefined}
                  />
                  {errors.address && <p className="form-error">{errors.address}</p>}
                </div>
              </div>

              {address.trim().length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="form-label text-xs flex items-center gap-1.5 mb-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Ubicación en el mapa</span>
                  </label>
                  <MiniMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    onPositionChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      setIsManualPosition(true);
                      setGeocodeStatus('IDLE');
                    }}
                    height="200px"
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 4: Contacto y Publicación */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="form-label font-bold">
                  Descripción Detallada de la Oferta <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
                  placeholder="Detalla qué incluye tu ayuda, estado de los elementos o condiciones para la entrega."
                  className={`textarea-base ${errors.description ? 'input-error' : ''}`}
                  aria-invalid={errors.description ? true : undefined}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">Nombre del Donante / Contacto <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); clearFieldError('contactName'); }}
                    placeholder="Ej: Carlos Gómez"
                    className={`input-base ${errors.contactName ? 'input-error' : ''}`}
                    aria-invalid={errors.contactName ? true : undefined}
                  />
                  {errors.contactName && <p className="form-error">{errors.contactName}</p>}
                </div>

                <div>
                  <label className="form-label font-bold">Teléfono Celular de Contacto <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={contactPhone}
                    onChange={(e) => { setContactPhone(e.target.value.replace(/[^0-9+]/g, '')); clearFieldError('contactPhone'); }}
                    placeholder="Ej: 3001234567"
                    className={`input-base ${errors.contactPhone ? 'input-error' : ''}`}
                    aria-invalid={errors.contactPhone ? true : undefined}
                  />
                  {errors.contactPhone && <p className="form-error">{errors.contactPhone}</p>}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-emerald-900">Oferta Verificada en Radar de Ayuda</strong>
                  <span>Tu ayuda quedará visible para coordinar de inmediato con receptores o centros de acopio.</span>
                </div>
              </div>
            </div>
          )}

          {/* Navegación del Formulario */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="btn-ghost flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            ) : (
              <button type="button" onClick={onClose} className="btn-ghost text-slate-500 cursor-pointer">
                Cancelar
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={currentStep === 1 ? handleNextStep1 : currentStep === 2 ? handleNextStep2 : handleNextStep3}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary-success btn-lg disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publicar Oferta de Ayuda</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
