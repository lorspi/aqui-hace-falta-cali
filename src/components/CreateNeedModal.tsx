import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, AlertCircle, ShieldCheck, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Zap, Flame, CloudRain, Waves, Wind, Activity, Stethoscope, HelpCircle } from 'lucide-react';
import { HelpCategory, Need, PlaceType, Priority, HelpResourceRecord, NeedItemRecord } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { showAlert } from './ConfirmDialog';
import { CustomSelect } from './CustomSelect';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { findDepartmentByCityId, getCityDisplayName, getCityCoordinates, detectCityFromCoords, ALL_COLOMBIA_ID } from '../data/colombiaCities';
import { useTranslation } from '../i18n/LanguageContext';
import { trackClarityEvent } from '../utils/analytics';
import { supabase } from '../lib/supabaseClient';
import { fetchSuggestedResourcesByEmergency, fetchHelpCategoriesAndResources, createNeedWithItems } from '../lib/supabaseService';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Need>) => Promise<void>;
  isSubmitting: boolean;
  initialCityId?: string;
  onRequireAuth?: () => void;
}

// Eventos de emergencia base con íconos representativos
const DEFAULT_EMERGENCY_EVENTS = [
  { id: 'inundacion', name: 'Inundación', icon: Waves, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'terremoto', name: 'Terremoto / Sismo', icon: Activity, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'vendaval', name: 'Vendaval / Tormenta', icon: Wind, color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { id: 'incendio', name: 'Incendio Forestal / Estructural', icon: Flame, color: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'derrumbe', name: 'Derrumbe / Deslizamiento', icon: CloudRain, color: 'bg-stone-50 border-stone-200 text-stone-800' },
  { id: 'epidemia', name: 'Epidemia / Sanitarios', icon: Stethoscope, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'otra', name: 'Otra Emergencia', icon: HelpCircle, color: 'bg-slate-50 border-slate-200 text-slate-700' },
];

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialCityId = '',
  onRequireAuth,
}) => {
  const { language, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1 Fields: Emergencia y Tipo de Solicitud
  const [emergencyId, setEmergencyId] = useState<string>('inundacion');
  const [title, setTitle] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('EDIFICIO_AFECTADO');
  const [requesterType, setRequesterType] = useState<Need['requesterType']>('PERSONA');
  // Nivel de urgencia removido del formulario; se envía un valor por defecto.
  const priority: Priority = 'MEDIUM';

  // Paso 2 Fields: Recursos Necesarios e Ítems Desglosados
  const [selectedItems, setSelectedItems] = useState<NeedItemRecord[]>([]);
  const [suggestedResourceIds, setSuggestedResourceIds] = useState<string[]>([]);
  const [availableResources, setAvailableResources] = useState<HelpResourceRecord[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Paso 3 Fields: Ubicación Geográfica
  const [cityId, setCityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(3.4516);
  const [longitude, setLongitude] = useState(-76.5320);
  const [isManualPosition, setIsManualPosition] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('IDLE');

  // Paso 4 Fields: Contacto y Afectados
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [affectedPeople, setAffectedPeople] = useState<number>(0);
  const [affectedAnimals, setAffectedAnimals] = useState<number>(0);
  const [operatingHours, setOperatingHours] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [source] = useState('Reporte ciudadano en línea');

  // Errores de validación inline por campo (patrón estándar: borde rojo + texto rojo debajo)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearFieldError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  // Cargar categorías y recursos desde Supabase al abrir el modal
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

  // Cargar recursos sugeridos cuando cambia el evento de emergencia
  useEffect(() => {
    if (!isOpen || !emergencyId) return;
    const loadSuggested = async () => {
      const suggestedIds = await fetchSuggestedResourcesByEmergency(emergencyId);
      setSuggestedResourceIds(suggestedIds);
    };
    loadSuggested();
  }, [isOpen, emergencyId]);

  // Reset del formulario al abrir
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
    setAccessInstructions('');
    setAffectedPeople(0);
    setAffectedAnimals(0);
    setOperatingHours('');
    setSourceUrl('');
    setIsManualPosition(false);
    setGeocodeStatus('IDLE');

    if (initialCityId && initialCityId !== ALL_COLOMBIA_ID) {
      setCityId(initialCityId);
      const dept = findDepartmentByCityId(initialCityId);
      setDepartmentId(dept ? dept.id : '');
      const coords = getCityCoordinates(initialCityId, dept?.id);
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
  }, [isOpen, initialCityId]);

  // Actualizar coordenadas cuando cambia la ciudad
  useEffect(() => {
    if (cityId && !isManualPosition) {
      const coords = getCityCoordinates(cityId, departmentId);
      setLatitude(coords.lat);
      setLongitude(coords.lng);
    }
  }, [cityId, departmentId, isManualPosition]);

  // Geocodificación automática de la dirección
  useEffect(() => {
    if (address.trim().length < 4) {
      setGeocodeStatus('IDLE');
      return;
    }
    const cityName = getCityDisplayName(cityId, departmentId);
    const timer = setTimeout(async () => {
      setGeocodeStatus('SEARCHING');
      const result = await geocodeAddress(address, neighborhood, cityName);
      if (result && typeof result.lat === 'number' && typeof result.lng === 'number' && !isNaN(result.lat)) {
        setLatitude(result.lat);
        setLongitude(result.lng);
        setIsManualPosition(false);
        setGeocodeStatus('FOUND');
      } else {
        setGeocodeStatus('NOT_FOUND');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [address, neighborhood, cityId, departmentId]);

  if (!isOpen) return null;

  // Manejadores para agregar/remover recursos seleccionados
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
          targetQuantity: 1,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (resourceId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) => (item.resourceId === resourceId ? { ...item, targetQuantity: Math.max(1, quantity) } : item))
    );
  };

  // Validaciones paso a paso (errores inline: borde rojo + texto rojo debajo del campo)
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
      stepErrors.selectedItems = 'Selecciona al menos un recurso requerido';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    const stepErrors: Record<string, string> = {};
    if (!cityId) {
      stepErrors.cityId = 'Selecciona el municipio o ciudad';
    }
    if (!neighborhood.trim()) {
      stepErrors.neighborhood = 'El barrio o sector es obligatorio';
    }
    if (!address.trim()) {
      stepErrors.address = 'La dirección exacta es obligatoria';
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setCurrentStep(4);
  };

  // Enviar formulario (Paso 4) con guardia de autenticación
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

    // Guard de Autenticación en Supabase
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      await showAlert('Para guardar y publicar tu necesidad debes iniciar sesión o registrarte.');
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    try {
      const payloadNeed = {
        title,
        description,
        emergencyId,
        emergencyEvent: emergencyId,
        placeType,
        requesterType,
        priority: placeType === 'CENTRO_ACOPIO' ? 'MEDIUM' : priority,
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
        accessInstructions,
        affectedPeople,
        affectedAnimals,
        operatingHours: operatingHours || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        source,
        categories: Array.from(new Set(selectedItems.map((i) => i.categoryId))),
        resources: selectedItems.map((i) => ({
          id: i.resourceId,
          type: i.categoryId,
          description: i.resourceName,
          requestedQuantity: i.targetQuantity,
          unit: i.unit,
        })),
      };

      await createNeedWithItems(payloadNeed, selectedItems);

      trackClarityEvent('create_need_success', {
        emergencyId,
        placeType,
        cityId,
        itemsCount: selectedItems.length,
      });

      await showAlert('¡Tu necesidad ha sido registrada exitosamente en Radar de Ayuda!');
      onClose();
    } catch (err: any) {
      console.error('Error al registrar la necesidad:', err);
      await showAlert('Ocurrió un error al guardar. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Barra de Progreso de 4 Segmentos */}
        <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                REGISTRAR NECESIDAD • Paso {currentStep} de 4
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {currentStep === 1 && '1. Evento de Emergencia & Título'}
                {currentStep === 2 && '2. Recursos & Necesidades Inmediatas'}
                {currentStep === 3 && '3. Ubicación en el Mapa'}
                {currentStep === 4 && '4. Contacto & Publicación'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="btn-icon" id="btn-close-create-need-modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de progreso de 4 segmentos */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800 flex-1">
          {/* ================= PASO 1: Emergencia & Datos Generales ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="form-label font-bold text-slate-900 mb-2">
                  Selecciona el Evento de Emergencia <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_EMERGENCY_EVENTS.map((ev) => {
                    const IconComp = ev.icon;
                    const isSelected = emergencyId === ev.id;
                    return (
                      <button
                        type="button"
                        key={ev.id}
                        onClick={() => setEmergencyId(ev.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500 bg-blue-50/70 shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconComp className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <span className="font-bold text-xs leading-tight">{ev.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label font-bold">
                  Título Corto del Requerimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearFieldError('title'); }}
                  placeholder="Ej: Familias afectadas por inundación requieren cobijas y agua potable"
                  className={`input-base ${errors.title ? 'input-error' : ''}`}
                  aria-invalid={errors.title ? true : undefined}
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">{t('placeTypeFormLabel')}</label>
                  <CustomSelect
                    className="w-full"
                    value={placeType}
                    onChange={(val) => setPlaceType(val as PlaceType)}
                    options={placeTypesList.map((pt) => ({ value: pt, label: getPlaceTypeLabel(pt, language) }))}
                  />
                </div>

                <div>
                  <label className="form-label font-bold">{t('requesterTypeLabel')}</label>
                  <CustomSelect
                    className="w-full"
                    value={requesterType}
                    onChange={(val) => setRequesterType(val as any)}
                    options={[
                      { value: 'PERSONA', label: 'Persona individual' },
                      { value: 'COMUNIDAD', label: 'Comité comunitario / Vecinos' },
                      { value: 'ORGANIZACION', label: 'Organización / ONG' },
                      { value: 'FUNDACION', label: 'Fundación' },
                      { value: 'EMPRESA', label: 'Empresa' },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= PASO 2: Recursos Sugeridos e Ítems ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Sección de Recursos Sugeridos por Emergencia */}
              {suggestedResourceIds.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span>Necesidades Inmediatas Sugeridas para esta Emergencia</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Basados en el evento seleccionado, estos son los recursos de primera respuesta habitualmente requeridos:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {availableResources
                      .filter((r) => suggestedResourceIds.includes(r.id))
                      .map((res) => {
                        const selected = selectedItems.some((i) => i.resourceId === res.id);
                        return (
                          <button
                            type="button"
                            key={res.id}
                            onClick={() => handleToggleResourceItem(res)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              selected
                                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            <span>{selected ? '✓' : '+'}</span>
                            <span>{res.name}</span>
                            <span className="text-[10px] opacity-80">({res.unit})</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Selector Completo de Recursos por Categoría */}
              <div className="space-y-3">
                <label className="form-label font-bold">
                  Selecciona los Recursos Necesarios <span className="text-red-500">*</span>
                </label>

                {loadingResources ? (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Cargando catálogo de recursos...
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
                                      ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-xs'
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
              </div>

              {/* Lista de Recursos Seleccionados con Cantidades */}
              {selectedItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="font-bold text-slate-900 block">Recursos Seleccionados y Cantidades Requeridas:</label>
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
                          value={item.targetQuantity}
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

          {/* ================= PASO 3: Ubicación Geográfica ================= */}
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
                    placeholder={t('neighborhoodPlaceholder')}
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
                    placeholder={t('addressPlaceholder')}
                    className={`input-base ${errors.address ? 'input-error' : ''}`}
                    aria-invalid={errors.address ? true : undefined}
                  />
                  {errors.address && <p className="form-error">{errors.address}</p>}
                </div>
              </div>

              {address.trim().length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="form-label text-xs flex items-center gap-1.5 mb-0">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Ubicación exacta en el mapa</span>
                    </label>
                  </div>

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

          {/* ================= PASO 4: Contacto, Afectados & Publicación ================= */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="form-label font-bold">
                  Descripción Detallada de la Situación <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
                  placeholder="Describe la situación actual, familias o viviendas afectadas y cualquier detalle relevante."
                  className={`textarea-base ${errors.description ? 'input-error' : ''}`}
                  aria-invalid={errors.description ? true : undefined}
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">Nombre del Contacto Responsable <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); clearFieldError('contactName'); }}
                    placeholder="Ej: María López"
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
                    placeholder="Ej: 3155550192"
                    className={`input-base ${errors.contactPhone ? 'input-error' : ''}`}
                    aria-invalid={errors.contactPhone ? true : undefined}
                  />
                  {errors.contactPhone && <p className="form-error">{errors.contactPhone}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Enlace de campaña / Vaki / Fuente oficial (opcional)</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Ej: https://vaki.co/vaki/aulas-que-se-levantan"
                    className="input-base"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Si tu necesidad cuenta con una campaña en Vaki o enlace externo de recaudación, agrégalo aquí para que los usuarios puedan ingresar directamente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold">Personas Afectadas</label>
                  <input
                    type="number"
                    min="0"
                    value={affectedPeople}
                    onChange={(e) => setAffectedPeople(Number(e.target.value))}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label font-bold">Mascotas/Animales Afectados</label>
                  <input
                    type="number"
                    min="0"
                    value={affectedAnimals}
                    onChange={(e) => setAffectedAnimals(Number(e.target.value))}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-emerald-900">Registro Directo y Verificación Comunitaria</strong>
                  <span>Tu reporte quedará publicado en Radar de Ayuda para vincular ayudas en tiempo real.</span>
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
                {t('cancelButton')}
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={currentStep === 1 ? handleNextStep1 : currentStep === 2 ? handleNextStep2 : handleNextStep3}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary-success btn-lg disabled:opacity-60 cursor-pointer"
                id="btn-submit-create-need"
              >
                {isSubmitting ? (
                  <span>{t('savingButton')}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('publishNeedButton')}</span>
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
