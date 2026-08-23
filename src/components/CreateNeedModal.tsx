import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, AlertTriangle, AlertCircle, ShieldCheck, CheckCircle2, Upload, Search, Loader2 } from 'lucide-react';
import { HelpCategory, Need, PlaceType, Priority } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { showAlert } from './ConfirmDialog';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { findCityById, findDepartmentByCityId, getCityDisplayName, getCityCoordinates, detectCityFromCoords, ALL_COLOMBIA_ID } from '../data/colombiaCities';
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('EDIFICIO_AFECTADO');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>(['ESCOMBROS']);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cityId, setCityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [latitude, setLatitude] = useState(3.4516);
  const [longitude, setLongitude] = useState(-76.5320);
  const [isManualPosition, setIsManualPosition] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('IDLE');

  useEffect(() => {
    if (!isOpen) return;

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
          // Default if GPS denied or unavailable
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

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [requesterType, setRequesterType] = useState<Need['requesterType']>('PERSONA');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [operatingHours, setOperatingHours] = useState('');
  const [source, setSource] = useState('Reporte ciudadano en línea');

  const [resources, setResources] = useState<
    Array<{ type: HelpCategory; description: string; requestedQuantity: number; unit: string }>
  >([]);

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

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
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAddResource = () => {
    setResources([
      ...resources,
      { type: selectedCategories[0] || 'ESCOMBROS', description: '', requestedQuantity: 1, unit: '' },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address || !neighborhood || !contactPhone.trim() || !cityId) {
      await showAlert(language === 'en' ? 'Please fill in all required fields (including department/municipality and contact phone).' : 'Por favor completa todos los campos obligatorios (incluyendo seleccionar un departamento/municipio y teléfono de contacto).');
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
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">{t('createNeedTitle')}</h2>
            <p className="text-xs text-slate-500">
              {t('createNeedSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            id="btn-close-create-need-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="form-section-title">
              {t('sectionWhatYouNeed')}
            </h3>

            <div>
              <label className="form-label">
                {t('needTitleLabel')}
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

            {/* Priority selector */}
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
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
          </div>

          {/* Section 2: Location */}
          <div className="space-y-3">
            <h3 className="form-section-title">
              {t('sectionNeedLocation')}
            </h3>

            <div>
              <label className="form-label">{t('cityLabel')}</label>
              <CityFormCombobox
                value={cityId}
                departmentId={departmentId}
                onChange={(cId, dId) => {
                  setCityId(cId);
                  setDepartmentId(dId || '');
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">{t('neighborhoodLabel')}</label>
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
                <label className="form-label">{t('addressLabel')}</label>
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

            {/* MiniMapPicker — only appears after writing an address */}
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
                  height="220px"
                />
              </div>
            )}
          </div>

          {/* Section 3: Categories & Resources */}
          <div className="space-y-3">
            <h3 className="form-section-title">
              {t('sectionCategories')}
            </h3>

            <div>
              <label className="form-label">
                {t('selectOneCategory')}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {categoriesList.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
                  const item = getCategoryLabel(cat, language);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`toggle-chip ${
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

            {/* Itemized Resources builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">{t('sectionNeedResources')}</label>
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
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
                      className="text-rose-600 hover:text-rose-800 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="form-label">
                {t('needDescLabel')}
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
          </div>

          {/* Section 4: Contact & Verification */}
          <div className="space-y-3">
            <h3 className="form-section-title">
              {t('sectionContact')}
            </h3>

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
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="Ej: 3155550192"
                  className="input-base"
                />
              </div>

              <div>
                <label className="form-label">{t('contactPhoneLabel')}</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
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

              <div>
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
          </div>

          {/* Verification Warning Box */}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-success btn-lg disabled:opacity-60"
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
          </div>
        </form>
      </div>
    </div>
  );
};
