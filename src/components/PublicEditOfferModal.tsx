import React, { useState, useEffect } from 'react';
import { updateOffer } from '../lib/supabaseService';
import { X, MapPin, Plus, Trash2, ShieldCheck, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import { showConfirm, showAlert } from './ConfirmDialog';
import { HelpCategory, Offer } from '../types';
import { CATEGORY_LABELS, getCategoryLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { useTranslation } from '../i18n/LanguageContext';

interface PublicEditOfferModalProps {
  offer: Offer | null;
  onClose: () => void;
  moderatorName?: string;
}

export const PublicEditOfferModal: React.FC<PublicEditOfferModalProps> = ({ offer, onClose, moderatorName }) => {
  const { language, t } = useTranslation();
  const isModerator = !!moderatorName;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>([]);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [latitude, setLatitude] = useState(3.4516);
  const [longitude, setLongitude] = useState(-76.532);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [resources, setResources] = useState<
    Array<{ id: string; type: HelpCategory; description: string; quantity?: number; fulfilledQuantity?: number; unit?: string; status: string }>
  >([]);

  // Edit metadata
  const [editorName, setEditorName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPickerMap, setShowPickerMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];

  const [isArchived, setIsArchived] = useState(false);
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('ahf_admin_token') : null;

  // Pre-fill from offer
  useEffect(() => {
    if (offer) {
      setTitle(offer.title || '');
      setDescription(offer.description || '');
      setSelectedCategories((offer.categories as HelpCategory[]) || []);
      setAddress(offer.address || '');
      setNeighborhood(offer.neighborhood || '');
      setLatitude(offer.latitude || 3.4516);
      setLongitude(offer.longitude || -76.532);
      setContactName(offer.contactName || '');
      setContactPhone(offer.contactPhone || '');
      setContactWhatsapp(offer.contactWhatsapp || '');
      setContactEmail(offer.contactEmail || '');
      setOrganizationName(offer.organizationName || '');
      setOperatingHours(offer.operatingHours || '');
      setResources(
        offer.resources
          ? offer.resources.map((r) => ({
              id: r.id,
              type: r.type as HelpCategory,
              description: r.description,
              quantity: r.quantity,
              fulfilledQuantity: r.fulfilledQuantity || 0,
              unit: r.unit,
              status: r.status || 'AVAILABLE',
            }))
          : []
      );
      setEditorName(moderatorName || '');
      setEditReason('');
      setSubmitted(false);
      setShowPickerMap(false);
      setIsArchived(offer.verificationStatus === 'ARCHIVED');
    }
  }, [offer]);

  useEffect(() => {
    if (offer) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [offer]);

  if (!offer) return null;

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
      {
        id: `res-${Date.now()}`,
        type: selectedCategories[0] || 'VOLUNTARIADO_GENERAL',
        description: '',
        quantity: undefined,
        fulfilledQuantity: 0,
        unit: undefined,
        status: 'AVAILABLE',
      },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleGeocode = async () => {
    if (!address) return;
    setIsGeocoding(true);
    setGeocodeError('');
    const result = await geocodeAddress(address, neighborhood);
    if (result) {
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setGeocodeError('');
    } else {
      setGeocodeError('No se encontró la ubicación. Ubícala manualmente en el mapa.');
    }
    setIsGeocoding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !address.trim() || !neighborhood.trim()) {
      showAlert('Por favor completa todos los campos requeridos (*).', { title: 'Campos incompletos', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!offer) return;
      await updateOffer(offer.id, {
        title,
        description,
        categories: selectedCategories,
        address,
        neighborhood,
        latitude,
        longitude,
        contactName,
        contactPhone: contactPhone || undefined,
        contactWhatsapp: contactWhatsapp || undefined,
        contactEmail: contactEmail || undefined,
        organizationName: organizationName || undefined,
        operatingHours: operatingHours || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      showAlert(err.message || 'Error al enviar la edición.', { title: 'Error', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!authToken || !offer) return;
    if (!(await showConfirm('¿Archivar esta oferta? Se ocultará de la vista pública.', { title: 'Archivar oferta' }))) return;
    try {
      await updateOffer(offer.id, { verificationStatus: 'ARCHIVED' });
      setIsArchived(true);
      showAlert('Oferta archivada correctamente.', { title: 'Archivada', variant: 'success' });
      onClose();
    } catch (e: any) { showAlert(e?.message || 'Error al archivar', { title: 'Error', variant: 'error' }); }
  };

  const handlePublish = async () => {
    if (!authToken || !offer) return;
    if (!(await showConfirm('¿Publicar esta oferta? Volverá a ser visible como pendiente de verificación.', { title: 'Publicar oferta' }))) return;
    try {
      await updateOffer(offer.id, { verificationStatus: 'PENDING_VERIFICATION' });
      setIsArchived(false);
      showAlert('Oferta publicada correctamente.', { title: 'Publicada', variant: 'success' });
    } catch (e: any) { showAlert(e?.message || 'Error al publicar', { title: 'Error', variant: 'error' }); }
  };

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">¡Información actualizada!</h3>
          <p className="text-xs text-slate-600">Gracias por mantener la información de esta oferta al día. El cambio quedó registrado.</p>
          <button onClick={onClose} className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Actualizar oferta
            </h2>
            <p className="text-xs text-slate-500">
              Edita los datos de esta oferta. Todo cambio queda registrado.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800">
          {isArchived && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium">
              📁 Esta oferta está archivada y no es visible públicamente.
            </div>
          )}
          <fieldset disabled={isArchived} className="space-y-5">
          {/* Section 1: Title & Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              1. ¿Qué ofreces?
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Título corto de la oferta *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Donación de agua potable - Fundación XYZ"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Descripción detallada *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica qué ofreces, disponibilidad, condiciones..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              2. ¿Dónde está ubicado?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Barrio *</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ej: San Fernando, Siloé, Granada, El Peñón..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección / Referencia *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={handleGeocode}
                  placeholder="Ej: Calle 5 con Carrera 44, o Calle 5 # 34-12"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
                {isGeocoding && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando ubicación...
                  </p>
                )}
                {geocodeError && (
                  <p className="text-xs text-amber-600 mt-1">{geocodeError}</p>
                )}
                {!isGeocoding && !geocodeError && address.length >= 5 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    📍 Ubicación: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Map Position Selector */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowPickerMap(!showPickerMap)}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>{showPickerMap ? 'Ocultar mapa de ubicación' : 'Ajustar punto exacto en el mapa'}</span>
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
              3. Categorías y recursos
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Categorías de ayuda (selección múltiple)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {categoriesList.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
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
                      {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Itemized Resources builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Recursos disponibles</label>
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir recurso
                </button>
              </div>

              {resources.map((res, idx) => (
                <div key={res.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
                  <select
                    value={res.type}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], type: e.target.value as HelpCategory };
                      setResources(updated);
                    }}
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs w-full sm:w-auto"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]?.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={res.description}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setResources(updated);
                    }}
                    placeholder="Descripción"
                    className="flex-1 p-1.5 bg-white border border-slate-300 rounded text-xs min-w-[100px]"
                  />

                  <input
                    type="number"
                    min="0"
                    value={res.quantity ?? ''}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], quantity: e.target.value ? Number(e.target.value) : undefined };
                      setResources(updated);
                    }}
                    placeholder="Cant."
                    className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  <input
                    type="number"
                    min="0"
                    value={res.fulfilledQuantity ?? ''}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], fulfilledQuantity: e.target.value ? Number(e.target.value) : 0 };
                      setResources(updated);
                    }}
                    placeholder="Cubiertos"
                    className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  <input
                    type="text"
                    value={res.unit ?? ''}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], unit: e.target.value || undefined };
                      setResources(updated);
                    }}
                    placeholder="Unidad"
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveResource(idx)}
                    className="text-rose-600 hover:text-rose-800 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Contact */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              4. Contacto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del responsable / contacto</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej: Carlos Restrepo"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp de contacto</label>
                <input
                  type="text"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="Ej: 3155550192"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono móvil / fijo</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ej: 3124448821"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Ej: contacto@fundacion.org"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organización / Entidad (opcional)</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej: Fundación XYZ / Cruz Roja"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horario de atención (opcional)</label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="Ej: 8:00 a.m. - 5:00 p.m. / 24 horas"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Editor info */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              5. ¿Quién actualiza?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isModerator ? 'Moderador' : 'Tu nombre (opcional)'}
                </label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => !isModerator && setEditorName(e.target.value)}
                  placeholder="Para el registro de cambios"
                  readOnly={isModerator}
                  className={`w-full p-2 border border-slate-300 rounded-lg ${isModerator ? 'bg-slate-100 text-slate-700 font-semibold cursor-not-allowed' : 'bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo del cambio (opcional)</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ej: Se agotaron los recursos, cambió el horario..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Verification Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-emerald-900">
                Edición ciudadana responsable:
              </strong>
              <span>
                Tu edición se aplicará inmediatamente y quedará registrada en el historial de la oferta. Gracias por mantener la información actualizada.
              </span>
            </div>
          </div>
          </fieldset>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>

            {/* Archive / Publish button */}
            {authToken && (
              isArchived ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Publicar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleArchive}
                  className="bg-rose-100 text-rose-800 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Archivar
                </button>
              )
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
