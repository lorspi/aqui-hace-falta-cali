import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, CheckCircle2, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { createOffer } from '../lib/supabaseService';
import { HelpCategory } from '../types';
import { CATEGORY_LABELS, getCategoryLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { getCityDisplayName } from '../data/colombiaCities';
import { useTranslation } from '../i18n/LanguageContext';

interface ResourceFormItem {
  type: HelpCategory | '';
  description: string;
  quantity: number | '';
  unit: string;
}

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCityId?: string;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  selectedCityId = 'cali',
}) => {
  const { language, t } = useTranslation();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>([]);
  const [cityId, setCityId] = useState(selectedCityId);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [operatingHours, setOperatingHours] = useState('');

  // Resources state
  const [resources, setResources] = useState<ResourceFormItem[]>([]);

  // UI state
  const [showPickerMap, setShowPickerMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];

  useEffect(() => {
    if (isOpen) {
      setCityId(selectedCityId);
    }
  }, [isOpen, selectedCityId]);

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
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      } else {
        setGeocodeError(language === 'en' ? 'Exact address not found. Please click the map to select.' : 'No pudimos encontrar la dirección exacta. Haz clic en el mapa para ubicar el punto.');
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
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = language === 'en' ? 'Title is required' : 'El título es obligatorio';
    } else if (title.length > 120) {
      newErrors.title = language === 'en' ? 'Title cannot exceed 120 characters' : 'El título no puede superar 120 caracteres';
    }

    if (!description.trim()) {
      newErrors.description = language === 'en' ? 'Description is required' : 'La descripción es obligatoria';
    } else if (description.length > 1000) {
      newErrors.description = language === 'en' ? 'Description cannot exceed 1000 characters' : 'La descripción no puede superar 1000 caracteres';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = language === 'en' ? 'Select at least one category' : 'Selecciona al menos una categoría';
    }

    if (!address.trim()) {
      newErrors.address = language === 'en' ? 'Address is required' : 'La dirección es obligatoria';
    }

    if (!neighborhood.trim()) {
      newErrors.neighborhood = language === 'en' ? 'Neighborhood is required' : 'El barrio es obligatorio';
    }

    if (!contactName.trim()) {
      newErrors.contactName = language === 'en' ? 'Contact name is required' : 'El nombre del contacto es obligatorio';
    }

    if (latitude === null || longitude === null) {
      newErrors.location = language === 'en' ? 'Select a location on the map or enter a valid address' : 'Selecciona una ubicación en el mapa o ingresa una dirección válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      const validResources = resources
        .filter((r) => r.type && r.description.trim())
        .map((r, index) => ({
          id: String(index),
          type: r.type as HelpCategory,
          description: r.description.trim(),
          quantity: r.quantity !== '' ? Number(r.quantity) : undefined,
          unit: r.unit.trim() || undefined,
          status: 'AVAILABLE' as const,
        }));

      await createOffer({
        title: title.trim(),
        description: description.trim(),
        categories: selectedCategories,
        resources: validResources.length > 0 ? validResources : undefined,
        cityId,
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        latitude: latitude!,
        longitude: longitude!,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsapp: contactWhatsapp.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        organizationName: organizationName.trim() || undefined,
        operatingHours: operatingHours.trim() || undefined,
      });

      setIsSubmitting(false);
      setSubmitSuccess(true);

      setTimeout(() => {
        resetForm();
        setSubmitSuccess(false);
        onClose();
      }, 2500);
    } catch (error: any) {
      setIsSubmitting(false);
      const message = error?.message || error?.data || (language === 'en' ? 'Error creating offer.' : 'Error al crear la oferta.');
      setErrors((prev) => ({ ...prev, general: message }));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCategories([]);
    setResources([]);
    setCityId(selectedCityId);
    setAddress('');
    setNeighborhood('');
    setLatitude(null);
    setLongitude(null);
    setContactName('');
    setContactPhone('');
    setContactWhatsapp('');
    setContactEmail('');
    setOrganizationName('');
    setOperatingHours('');
    setErrors({});
    setGeocodeError('');
    setShowPickerMap(false);
  };

  const addResource = () => {
    if (resources.length >= 20) return;
    setResources([...resources, { type: '', description: '', quantity: '', unit: '' }]);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const updateResource = (index: number, field: keyof ResourceFormItem, value: string | number | '') => {
    setResources(
      resources.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handlePositionChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      return next;
    });
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
            <h2 className="text-xl font-black text-slate-900">{t('createOfferTitle')}</h2>
            <p className="text-xs text-slate-500">
              {t('createOfferSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            id="btn-close-create-offer-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800">
          {/* Section 1: Title & Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionWhatYouOffer')}
            </h3>

            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('offerTitleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                }}
                maxLength={120}
                placeholder={t('offerTitlePlaceholder')}
                className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:bg-white text-sm ${errors.title ? 'border-red-400' : 'border-slate-300'}`}
              />
              <div className="flex justify-between mt-0.5">
                {errors.title && <p className="text-red-600 text-[11px]">{errors.title}</p>}
                <p className={`text-[10px] ml-auto ${title.length > 120 ? 'text-red-600' : 'text-slate-400'}`}>
                  {title.length}/120
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('offerDescLabel')}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                }}
                maxLength={1000}
                placeholder={t('offerDescPlaceholder')}
                className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs ${errors.description ? 'border-red-400' : 'border-slate-300'}`}
              />
              <div className="flex justify-between mt-0.5">
                {errors.description && <p className="text-red-600 text-[11px]">{errors.description}</p>}
                <p className={`text-[10px] ml-auto ${description.length > 1000 ? 'text-red-600' : 'text-slate-400'}`}>
                  {description.length}/1000
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Categories */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionCategories')}
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {t('selectOneCategory')}
              </label>
              <div className={`flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border rounded-xl ${errors.categories ? 'border-red-400' : 'border-slate-200'}`}>
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
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item?.icon} {item?.label}
                    </button>
                  );
                })}
              </div>
              {errors.categories && <p className="text-red-600 text-[11px] mt-1">{errors.categories}</p>}
            </div>
          </div>

          {/* Section 3: Resources */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionResources')}
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  {t('resourcesCount')} {resources.length}/20
                </label>
                <button
                  type="button"
                  onClick={addResource}
                  disabled={resources.length >= 20}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('addResource')}
                </button>
              </div>

              {resources.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">
                  {t('optionalAddResources')}
                </p>
              )}

              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      {t('resourceItemNum')}{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {t('resourceType')}
                      </label>
                      <select
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value as HelpCategory)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">{t('selectType')}</option>
                        {categoriesList.map((cat) => {
                          const item = getCategoryLabel(cat, language);
                          return (
                            <option key={cat} value={cat}>
                              {item?.icon} {item?.label}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {t('resourceDesc')}
                      </label>
                      <input
                        type="text"
                        value={resource.description}
                        onChange={(e) => updateResource(index, 'description', e.target.value)}
                        maxLength={200}
                        placeholder={t('resourceDescPlaceholder')}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {t('resourceQty')}
                      </label>
                      <input
                        type="number"
                        value={resource.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateResource(index, 'quantity', val === '' ? '' : Math.min(999999, Math.max(1, Number(val))));
                        }}
                        min={1}
                        max={999999}
                        placeholder="Ej: 100"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {t('resourceUnit')}
                      </label>
                      <input
                        type="text"
                        value={resource.unit}
                        onChange={(e) => updateResource(index, 'unit', e.target.value)}
                        maxLength={30}
                        placeholder={t('resourceUnitPlaceholder')}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionLocation')}
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
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    if (errors.neighborhood) setErrors((prev) => { const n = { ...prev }; delete n.neighborhood; return n; });
                  }}
                  placeholder={t('neighborhoodPlaceholder')}
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.neighborhood ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.neighborhood && <p className="text-red-600 text-[11px] mt-0.5">{errors.neighborhood}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('addressLabel')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => { const n = { ...prev }; delete n.address; return n; });
                  }}
                  placeholder={t('addressPlaceholder')}
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.address ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.address && <p className="text-red-600 text-[11px] mt-0.5">{errors.address}</p>}
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
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{showPickerMap ? t('hideLocationMap') : t('adjustPointOnMap')}</span>
              </button>

              {showPickerMap && (
                <MiniMapPicker
                  latitude={latitude ?? 3.4516}
                  longitude={longitude ?? -76.532}
                  onPositionChange={handlePositionChange}
                  height="200px"
                />
              )}
            </div>
          </div>

          {/* Section 5: Contact */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              {t('sectionContact')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('contactNameLabel')}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (errors.contactName) setErrors((prev) => { const n = { ...prev }; delete n.contactName; return n; });
                  }}
                  placeholder={t('contactNamePlaceholder')}
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.contactName ? 'border-red-400' : 'border-slate-300'}`}
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
                <label className="block font-bold text-slate-700 mb-1">{t('contactEmailLabel')}</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Ej: contacto@organizacion.org"
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

          {/* Verification Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-blue-900">
                {t('verificationNoticeTitle')}
              </strong>
              <span>
                {t('verificationNoticeDesc')}
              </span>
            </div>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800">
              {errors.general}
            </div>
          )}

          {/* Success state */}
          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">{t('publishedSuccessTitle')}</strong>
                <span className="text-xs text-emerald-700">{t('publishedSuccessDesc')}</span>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || submitSuccess}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              id="btn-submit-create-offer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('savingButton')}</span>
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('publishedBtn')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('publishOfferButton')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
