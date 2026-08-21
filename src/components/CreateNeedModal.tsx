import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, AlertTriangle, ShieldCheck, CheckCircle2, Upload, Search, Loader2 } from 'lucide-react';
import { HelpCategory, Need, PlaceType, Priority } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { showAlert } from './ConfirmDialog';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { findCityById, getCityDisplayName } from '../data/colombiaCities';
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
  initialCityId = 'cali',
}) => {
  const { language, t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('EDIFICIO_AFECTADO');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>(['ESCOMBROS']);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cityId, setCityId] = useState(initialCityId);

  useEffect(() => {
    if (isOpen) {
      setCityId(initialCityId);
    }
  }, [isOpen, initialCityId]);

  const [latitude, setLatitude] = useState(3.4325);
  const [longitude, setLongitude] = useState(-76.5412);
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

  const [showPickerMap, setShowPickerMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  useEffect(() => {
    if (address.length < 5) return;
    setGeocodeError('');
    const cityName = getCityDisplayName(cityId);
    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      const result = await geocodeAddress(address, neighborhood, cityName);
      setIsGeocoding(false);
      if (result) {
        setLatitude(result.lat);
        setLongitude(result.lng);
      } else {
        setGeocodeError(language === 'en' ? 'Exact address not found. Click map to select.' : 'No pudimos encontrar la dirección exacta. Haz clic en el mapa para ubicar el punto.');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [address, neighborhood, cityId, language]);

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
    if (!title || !description || !address || !neighborhood) {
      await showAlert(language === 'en' ? 'Please fill in all required fields.' : 'Por favor completa todos los campos obligatorios.');
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
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
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            id="btn-close-create-need-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionWhatYouNeed')}
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('needTitleLabel')}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('needTitlePlaceholder')}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-sm"
                id="input-need-title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('placeTypeFormLabel')}</label>
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value as PlaceType)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {placeTypesList.map((pt) => (
                    <option key={pt} value={pt}>
                      {getPlaceTypeLabel(pt, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('requesterTypeLabel')}</label>
                <select
                  value={requesterType}
                  onChange={(e) => setRequesterType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
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
              <label className="block font-bold text-slate-700 mb-1">{t('urgencyLevelLabel')}</label>
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
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionNeedLocation')}
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('cityLabel')}</label>
              <CityFormCombobox
                value={cityId}
                onChange={setCityId}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('neighborhoodLabel')}</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder={t('neighborhoodPlaceholder')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('addressLabel')}</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
                {isGeocoding && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('geocodingSearching')}
                  </p>
                )}
                {geocodeError && (
                  <p className="text-xs text-amber-600 mt-1">{geocodeError}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPickerMap(!showPickerMap)}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>{showPickerMap ? t('hideLocationMap') : t('adjustPointOnMap')}</span>
              </button>

              {showPickerMap && (
                <MiniMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onPositionChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  height="200px"
                />
              )}
            </div>
          </div>

          {/* Section 3: Categories & Resources */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionCategories')}
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        isSel
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs shrink-0"
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
                    className="flex-1 p-1.5 bg-white border border-slate-300 rounded text-xs min-w-[140px]"
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
                    className="w-16 p-1.5 bg-white border border-slate-300 rounded text-xs"
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
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded text-xs"
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
              <label className="block font-bold text-slate-700 mb-1">
                {t('needDescLabel')}
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('needDescPlaceholder')}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 4: Contact & Verification */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionContact')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('contactNameLabel')}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('contactNamePlaceholder')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('contactWhatsappLabel')}</label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="Ej: 3155550192"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('contactPhoneLabel')}</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ej: 3124448821"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('organizationLabel')}</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={t('organizationPlaceholder')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('operatingHoursLabel')}</label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder={t('operatingHoursPlaceholder')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
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
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
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
