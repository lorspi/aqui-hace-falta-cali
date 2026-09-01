import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, AlertCircle, ShieldCheck, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { HelpCategory, Need, PlaceType, Priority } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { showAlert } from './ConfirmDialog';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { findDepartmentByCityId, getCityDisplayName, getCityCoordinates, detectCityFromCoords, ALL_COLOMBIA_ID } from '../data/colombiaCities';
import { useTranslation } from '../i18n/LanguageContext';
import { trackClarityEvent } from '../utils/analytics';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Need>) => Promise<void>;
  isSubmitting: boolean;
  initialCityId?: string;
}

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialCityId = '',
}) => {
  const { language, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Paso 1 Fields
  const [title, setTitle] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('EDIFICIO_AFECTADO');
  const [requesterType, setRequesterType] = useState<Need['requesterType']>('PERSONA');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>([]);

  // Paso 2 Fields
  const [cityId, setCityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(3.4516);
  const [longitude, setLongitude] = useState(-76.5320);
  const [isManualPosition, setIsManualPosition] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('IDLE');
  const [resources, setResources] = useState<
    Array<{ type: HelpCategory; description: string; requestedQuantity: number; unit: string }>
  >([]);

  // Paso 3 Fields
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [source] = useState('Reporte ciudadano en línea');

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setSelectedCategories([]);
    setAddress('');
    setNeighborhood('');
    setContactName('');
    setContactPhone('');
    setContactWhatsapp('');
    setContactEmail('');
    setOrganizationName('');
    setOperatingHours('');
    setResources([]);
    setIsManualPosition(false);
    setGeocodeStatus('IDLE');

    // 1. If a specific city is selected (e.g. Armenia)
    if (initialCityId && initialCityId !== ALL_COLOMBIA_ID) {
      setCityId(initialCityId);
      const dept = findDepartmentByCityId(initialCityId);
      setDepartmentId(dept ? dept.id : '');
      const coords = getCityCoordinates(initialCityId, dept?.id);
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      return;
    }

    // 2. Otherwise, check device GPS location
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
    } else {
      setCityId('');
      setDepartmentId('');
    }
  }, [isOpen, initialCityId]);

  // Update coordinates when cityId changes manually in form
  useEffect(() => {
    if (cityId && !isManualPosition) {
      const coords = getCityCoordinates(cityId, departmentId);
      setLatitude(coords.lat);
      setLongitude(coords.lng);
    }
  }, [cityId, departmentId, isManualPosition]);

  // Geocoding effect for address
  useEffect(() => {
    if (address.trim().length < 4) {
      setGeocodeStatus('IDLE');
      return;
    }
    const cityName = getCityDisplayName(cityId, departmentId);
    const timer = setTimeout(async () => {
      setGeocodeStatus('SEARCHING');
      const result = await geocodeAddress(address, neighborhood, cityName);
      if (
        result &&
        typeof result.lat === 'number' &&
        typeof result.lng === 'number' &&
        !isNaN(result.lat) &&
        !isNaN(result.lng)
      ) {
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

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCategoryToggle = (cat: HelpCategory) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAddResource = () => {
    setResources([
      ...resources,
      { type: selectedCategories[0] || 'ALIMENTOS_AGUA', description: '', requestedQuantity: 1, unit: '' },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const handleNextStep1 = async () => {
    if (!title.trim()) {
      await showAlert(
        language === 'en'
          ? 'Please enter a title for your request.'
          : 'Por favor ingresa un título para la solicitud de necesidad.'
      );
      return;
    }
    if (selectedCategories.length === 0) {
      await showAlert(
        language === 'en'
          ? 'Please select at least one category.'
          : 'Por favor selecciona al menos una categoría de necesidad.'
      );
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleNextStep2 = async () => {
    if (!cityId) {
      await showAlert(
        language === 'en'
          ? 'Please select a department and municipality.'
          : 'Por favor selecciona el departamento y municipio.'
      );
      return;
    }
    if (!neighborhood.trim()) {
      await showAlert(
        language === 'en'
          ? 'Please enter the neighborhood / sector.'
          : 'Por favor ingresa el barrio o sector.'
      );
      return;
    }
    if (!address.trim()) {
      await showAlert(
        language === 'en'
          ? 'Please enter the address.'
          : 'Por favor ingresa la dirección exacta.'
      );
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      await showAlert(
        language === 'en'
          ? 'Please provide a detailed description.'
          : 'Por favor ingresa una descripción detallada de la solicitud.'
      );
      return;
    }

    if (!contactPhone.trim()) {
      await showAlert(
        language === 'en'
          ? 'Please enter a valid contact phone number.'
          : 'Por favor ingresa un número de teléfono de contacto obligatorio.'
      );
      return;
    }

    const formattedResources = resources.map((r, i) => ({
      id: String(i),
      type: r.type,
      description: r.description,
      requestedQuantity: r.requestedQuantity,
      fulfilledQuantity: 0,
      unit: r.unit,
      status: 'PENDING' as const,
    }));

    await onSubmit({
      title,
      description,
      placeType,
      categories: selectedCategories,
      resources: formattedResources.length > 0 ? formattedResources : undefined,
      cityId,
      departmentId: departmentId || undefined,
      address,
      neighborhood,
      latitude,
      longitude,
      contactName,
      contactPhone: contactPhone || undefined,
      contactWhatsapp: contactWhatsapp || undefined,
      contactEmail: contactEmail || undefined,
      organizationName: organizationName || undefined,
      requesterType,
      priority: placeType === 'CENTRO_ACOPIO' ? 'MEDIUM' : priority,
      operatingHours: operatingHours || undefined,
      source,
    });

    trackClarityEvent('create_need', {
      placeType,
      cityId,
      priority,
      categoriesCount: selectedCategories.length,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header con Barra de Progreso Multi-paso */}
        <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {t('createNeedTitle')} • Paso {currentStep} de 3
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {currentStep === 1 && '1. Detalle de la Solicitud'}
                {currentStep === 2 && '2. Ubicación & Recursos'}
                {currentStep === 3 && '3. Descripción & Contacto'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              id="btn-close-create-need-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de progreso de 3 segmentos */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800 flex-1">
          
          {/* ================= PASO 1: Detalle y Categorías ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="form-section-title">
                {t('sectionWhatYouNeed')}
              </h3>

              {/* Título de la Solicitud */}
              <div>
                <label className="form-label">
                  {t('needTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('needTitlePlaceholder')}
                  className="input-base"
                  id="input-need-title"
                />
              </div>

              {/* Tipo de Lugar y Tipo de Solicitante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{t('placeTypeFormLabel')}</label>
                  <select
                    value={placeType}
                    onChange={(e) => setPlaceType(e.target.value as PlaceType)}
                    className="select-base"
                  >
                    {placeTypesList.map((pt) => (
                      <option key={pt} value={pt}>
                        {getPlaceTypeLabel(pt, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">{t('requesterTypeLabel')}</label>
                  <select
                    value={requesterType}
                    onChange={(e) => setRequesterType(e.target.value as any)}
                    className="select-base"
                  >
                    <option value="PERSONA">{language === 'en' ? 'Individual person' : 'Persona individual'}</option>
                    <option value="COMUNIDAD">{language === 'en' ? 'Community board / Neighbors' : 'Comité comunitario / Vecinos'}</option>
                    <option value="ORGANIZACION">{language === 'en' ? 'Organization / NGO' : 'Organización / ONG'}</option>
                    <option value="FUNDACION">{language === 'en' ? 'Foundation' : 'Fundación'}</option>
                    <option value="EMPRESA">{language === 'en' ? 'Company' : 'Empresa'}</option>
                    <option value="OTRO">{language === 'en' ? 'Other' : 'Otro'}</option>
                  </select>
                </div>
              </div>

              {/* Selector de Nivel de Prioridad */}
              <div>
                <label className="form-label">{t('urgencyLevelLabel')}</label>
                {placeType === 'CENTRO_ACOPIO' ? (
                  <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 font-semibold">
                    🟣 {language === 'en' ? 'Collection centers do not require a priority level.' : 'Los centros de acopio no requieren nivel de prioridad.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      const isSelected = priority === p;
                      const pLabel = language === 'en' ? (p === 'CRITICAL' ? t('priorityCritical') : p === 'HIGH' ? t('priorityHigh') : p === 'MEDIUM' ? t('priorityMedium') : t('priorityLow')) : config.label;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? `${config.badgeClass} ring-2 ring-offset-1 ring-slate-400`
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{config.dot}</span>
                          <span>{pLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selección Múltiple de Categorías */}
              <div>
                <label className="form-label">
                  {t('selectOneCategory')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {categoriesList.map((cat) => {
                    const isSel = selectedCategories.includes(cat);
                    const item = getCategoryLabel(cat, language);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`toggle-chip cursor-pointer ${
                          isSel
                            ? 'toggle-chip-active'
                            : 'toggle-chip-inactive'
                        }`}
                      >
                        {item?.icon} {item?.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= PASO 2: Ubicación & Recursos ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="form-section-title">
                {t('sectionNeedLocation')}
              </h3>

              {/* Departamento y Municipio */}
              <div>
                <label className="form-label">{t('cityLabel')} <span className="text-red-500">*</span></label>
                <CityFormCombobox
                  value={cityId}
                  departmentId={departmentId}
                  onChange={(cId, dId) => {
                    setCityId(cId);
                    setDepartmentId(dId || '');
                  }}
                />
              </div>

              {/* Barrio y Dirección */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{t('neighborhoodLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder={t('neighborhoodPlaceholder')}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label">{t('addressLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    className="input-base"
                  />
                </div>
              </div>

              {/* Mapa Interactivo */}
              {address.trim().length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="form-label text-xs flex items-center gap-1.5 mb-0">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Ubicación en el mapa</span>
                    </label>
                    {isManualPosition && typeof latitude === 'number' && typeof longitude === 'number' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Punto personalizado ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                      </span>
                    )}
                  </div>

                  {geocodeStatus === 'SEARCHING' && (
                    <p className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando ubicación exacta de la dirección...
                    </p>
                  )}

                  {geocodeStatus === 'FOUND' && typeof latitude === 'number' && typeof longitude === 'number' && !isManualPosition && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-start gap-1.5 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Ubicación encontrada en el mapa ({latitude.toFixed(4)}, {longitude.toFixed(4)}). Haz clic o arrastra el marcador si deseas reajustar.
                      </span>
                    </p>
                  )}

                  {geocodeStatus === 'NOT_FOUND' && !isManualPosition && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-semibold flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        No pudimos encontrar la dirección exacta. Por favor haz clic o arrastra el marcador en el mapa para ubicar tu punto.
                      </span>
                    </p>
                  )}

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

              {/* Desglose de Recursos Requeridos */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">{t('sectionNeedResources')}</label>
                  <button
                    type="button"
                    onClick={handleAddResource}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('addResource')}
                  </button>
                </div>

                {resources.map((res, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <select
                      value={res.type}
                      onChange={(e) => {
                        const updated = [...resources];
                        updated[idx].type = e.target.value as HelpCategory;
                        setResources(updated);
                      }}
                      className="select-inline shrink-0"
                    >
                      {categoriesList.map((c) => {
                        const item = getCategoryLabel(c, language);
                        return (
                          <option key={c} value={c}>
                            {item?.label}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="text"
                      value={res.description}
                      onChange={(e) => {
                        const updated = [...resources];
                        updated[idx].description = e.target.value;
                        setResources(updated);
                      }}
                      placeholder={t('resourceDescPlaceholder')}
                      className="input-inline flex-1 min-w-[140px]"
                    />

                    <input
                      type="number"
                      min="1"
                      value={res.requestedQuantity}
                      onChange={(e) => {
                        const updated = [...resources];
                        updated[idx].requestedQuantity = Number(e.target.value);
                        setResources(updated);
                      }}
                      placeholder={t('resourceQty')}
                      className="input-inline w-16"
                    />

                    <input
                      type="text"
                      value={res.unit}
                      onChange={(e) => {
                        const updated = [...resources];
                        updated[idx].unit = e.target.value;
                        setResources(updated);
                      }}
                      placeholder={t('resourceUnitPlaceholder')}
                      className="input-inline w-20"
                    />

                    {resources.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= PASO 3: Descripción, Contacto & Envío ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="form-section-title">
                {t('sectionContact')}
              </h3>

              {/* Descripción Detallada */}
              <div>
                <label className="form-label">
                  {t('needDescLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('needDescPlaceholder')}
                  className="textarea-base"
                />
              </div>

              {/* Datos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{t('contactNameLabel')}</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t('contactNamePlaceholder')}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label">{t('contactWhatsappLabel')}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Ej: 3155550192"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label">{t('contactPhoneLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Ej: 3124448821"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="form-label">{t('organizationLabel')}</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={t('organizationPlaceholder')}
                    className="input-base"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">{t('operatingHoursLabel')}</label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder={t('operatingHoursPlaceholder')}
                    className="input-base"
                  />
                </div>
              </div>

              {/* Nota de Verificación */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-emerald-900">
                    {t('verificationNoticeTitle')}
                  </strong>
                  <span>
                    {t('verificationNoticeDesc')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Navigation Controls */}
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
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-slate-500 cursor-pointer"
              >
                {t('cancelButton')}
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={currentStep === 1 ? handleNextStep1 : handleNextStep2}
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
