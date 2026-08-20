import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, CheckCircle2, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { HelpCategory } from '../types';
import { CATEGORY_LABELS } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { CityFormCombobox } from './CityFormCombobox';
import { getCityDisplayName } from '../data/colombiaCities';

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

  // Resources state (task 7.2)
  const [resources, setResources] = useState<ResourceFormItem[]>([]);

  // UI state
  const [showPickerMap, setShowPickerMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convex mutation (task 7.3)
  const createOffer = useMutation(api.offers.create);

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];

  // Sync cityId when modal opens with a different initial value
  useEffect(() => {
    if (isOpen) {
      setCityId(selectedCityId);
    }
  }, [isOpen, selectedCityId]);

  // Center map on selected city when cityId changes
  useEffect(() => {
    // No-op: coordinates will be set via geocoding or map picker
  }, [cityId]);

  // Auto-geocode when address changes (debounced 500ms)
  useEffect(() => {
    if (address.length < 5) return;
    setGeocodeError('');
    const cityName = getCityDisplayName(cityId);
    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      const result = await geocodeAddress(address, neighborhood, cityName);
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        setGeocodeError('');
        // Clear location error if it was set
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      } else {
        setGeocodeError('No se encontró la ubicación. Ubícala manualmente en el mapa.');
      }
      setIsGeocoding(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [address, neighborhood, cityId]);

  // Block body scroll when modal is open
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
    // Clear category error on change
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (title.length > 120) {
      newErrors.title = 'El título no puede superar 120 caracteres';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (description.length > 1000) {
      newErrors.description = 'La descripción no puede superar 1000 caracteres';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = 'Selecciona al menos una categoría';
    }

    if (!address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }

    if (!neighborhood.trim()) {
      newErrors.neighborhood = 'El barrio es obligatorio';
    }

    if (!contactName.trim()) {
      newErrors.contactName = 'El nombre del contacto es obligatorio';
    }

    if (latitude === null || longitude === null) {
      newErrors.location = 'Selecciona una ubicación en el mapa o ingresa una dirección válida';
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
      // Filter only non-empty resource items
      const validResources = resources
        .filter((r) => r.type && r.description.trim())
        .map((r) => ({
          type: r.type as string,
          description: r.description.trim(),
          quantity: r.quantity !== '' ? Number(r.quantity) : undefined,
          unit: r.unit.trim() || undefined,
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

      // Success: show confirmation and reset
      setIsSubmitting(false);
      setSubmitSuccess(true);

      setTimeout(() => {
        resetForm();
        setSubmitSuccess(false);
        onClose();
      }, 2500);
    } catch (error: any) {
      setIsSubmitting(false);
      // Parse error and show inline
      const message = error?.message || error?.data || 'Error al crear la oferta. Revisa tu conexión.';
      // Try to map specific field errors
      if (message.includes("'title'")) {
        setErrors((prev) => ({ ...prev, title: message }));
      } else if (message.includes("'description'")) {
        setErrors((prev) => ({ ...prev, description: message }));
      } else if (message.includes("'address'")) {
        setErrors((prev) => ({ ...prev, address: message }));
      } else if (message.includes("'neighborhood'")) {
        setErrors((prev) => ({ ...prev, neighborhood: message }));
      } else if (message.includes("'contactName'") || message.includes("'contact'")) {
        setErrors((prev) => ({ ...prev, contactName: message }));
      } else if (message.includes("categoría") || message.includes("categories")) {
        setErrors((prev) => ({ ...prev, categories: message }));
      } else if (message.includes("recurso") || message.includes("resource")) {
        setErrors((prev) => ({ ...prev, resources: message }));
      } else {
        setErrors((prev) => ({ ...prev, general: message }));
      }
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

  // Resource management (task 7.2)
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
    // Clear location error
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
            <h2 className="text-xl font-black text-slate-900">Registrar oferta de ayuda</h2>
            <p className="text-xs text-slate-500">
              Publica recursos disponibles para ayudar a la comunidad.
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
              1. ¿Qué ofreces?
            </h3>

            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Título de la oferta *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                }}
                maxLength={120}
                placeholder="Ej: Centro de acopio - Alimentos y ropa en buen estado"
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
                Descripción detallada *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                }}
                maxLength={1000}
                placeholder="Describe los recursos disponibles, horarios, condiciones de acceso o cualquier información relevante..."
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
              2. Categorías de ayuda *
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Selecciona al menos una categoría
              </label>
              <div className={`flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border rounded-xl ${errors.categories ? 'border-red-400' : 'border-slate-200'}`}>
                {categoriesList.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
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
                      {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label}
                    </button>
                  );
                })}
              </div>
              {errors.categories && <p className="text-red-600 text-[11px] mt-1">{errors.categories}</p>}
            </div>
          </div>

          {/* Section 3: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              3. Recursos disponibles
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  Recursos: {resources.length}/20
                </label>
                <button
                  type="button"
                  onClick={addResource}
                  disabled={resources.length >= 20}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar recurso
                </button>
              </div>

              {resources.length === 0 && (
                <p className="text-[11px] text-slate-400 italic">
                  Opcional: agrega recursos específicos que ofreces (máximo 20).
                </p>
              )}

              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      Recurso #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Type dropdown */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Tipo *
                      </label>
                      <select
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value as HelpCategory)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">Seleccionar tipo...</option>
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={resource.description}
                        onChange={(e) => updateResource(index, 'description', e.target.value)}
                        maxLength={200}
                        placeholder="Ej: Agua embotellada 500ml"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <p className={`text-[10px] text-right ${resource.description.length > 200 ? 'text-red-600' : 'text-slate-400'}`}>
                        {resource.description.length}/200
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Cantidad
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

                    {/* Unit */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={resource.unit}
                        onChange={(e) => updateResource(index, 'unit', e.target.value)}
                        maxLength={30}
                        placeholder="Ej: botellas, kg, cajas..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {errors.resources && (
                <p className="text-red-600 text-[11px] mt-1">{errors.resources}</p>
              )}
            </div>
          </div>

          {/* Section 4: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              4. ¿Dónde está ubicado?
            </h3>

            {/* City */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ciudad / Municipio *</label>
              <CityFormCombobox
                value={cityId}
                onChange={setCityId}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Neighborhood */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Barrio *</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    if (errors.neighborhood) setErrors((prev) => { const n = { ...prev }; delete n.neighborhood; return n; });
                  }}
                  placeholder="Ej: San Fernando, Siloé, Granada..."
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.neighborhood ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.neighborhood && <p className="text-red-600 text-[11px] mt-0.5">{errors.neighborhood}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección / Referencia *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => { const n = { ...prev }; delete n.address; return n; });
                  }}
                  placeholder="Ej: Calle 5 con Carrera 44"
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.address ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.address && <p className="text-red-600 text-[11px] mt-0.5">{errors.address}</p>}
                {isGeocoding && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando ubicación...
                  </p>
                )}
                {geocodeError && (
                  <p className="text-xs text-amber-600 mt-1">{geocodeError}</p>
                )}
                {!isGeocoding && !geocodeError && address.length >= 5 && latitude !== null && longitude !== null && (
                  <p className="text-xs text-emerald-600 mt-1">
                    📍 Ubicación: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Map Picker */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPickerMap(!showPickerMap)}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{showPickerMap ? 'Ocultar mapa de ubicación' : 'Ajustar punto exacto en el mapa'}</span>
              </button>

              {showPickerMap && (
                <MiniMapPicker
                  latitude={latitude ?? 3.4516}
                  longitude={longitude ?? -76.532}
                  onPositionChange={handlePositionChange}
                  height="200px"
                />
              )}

              {errors.location && (
                <p className="text-red-600 text-[11px] mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Section 5: Contact */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              5. Datos de contacto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Contact Name (required) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del contacto *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (errors.contactName) setErrors((prev) => { const n = { ...prev }; delete n.contactName; return n; });
                  }}
                  placeholder="Ej: María González"
                  className={`w-full p-2 bg-slate-50 border rounded-lg ${errors.contactName ? 'border-red-400' : 'border-slate-300'}`}
                />
                {errors.contactName && <p className="text-red-600 text-[11px] mt-0.5">{errors.contactName}</p>}
              </div>

              {/* Contact Phone (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono (opcional)</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ej: 3124448821"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Contact WhatsApp (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp (opcional)</label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="Ej: 3155550192"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Contact Email (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo electrónico (opcional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Ej: contacto@organizacion.org"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Organization Name (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Organización (opcional)</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej: Cruz Roja / Fundación XYZ"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Operating Hours (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Horario de atención (opcional)</label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="Ej: 8:00 a.m. - 5:00 p.m."
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
                Proceso de verificación:
              </strong>
              <span>
                Tu oferta se guardará como <strong>"Pendiente de verificación"</strong>. Un moderador confirmará la información antes de mostrarla como verificada en el mapa.
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
                <strong className="block font-bold">¡Oferta publicada exitosamente! 🎉</strong>
                <span className="text-xs text-emerald-700">Se mostrará en el mapa tras ser verificada por un moderador.</span>
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
              Cancelar
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
                  <span>Guardando...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Publicada!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Oferta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
