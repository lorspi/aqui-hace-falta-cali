import React, { useState, useEffect, useCallback } from 'react';
import { updateNeed } from '../lib/supabaseService';
import { X, MapPin, Plus, Trash2, ShieldCheck, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import { showConfirm, showAlert } from './ConfirmDialog';
import { HelpCategory, Need, PlaceType, Priority } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS, PRIORITY_CONFIG, getCategoryLabel, getPlaceTypeLabel } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { Turnstile } from './Turnstile';
import { useTranslation } from '../i18n/LanguageContext';

interface PublicEditModalProps {
  need: Need | null;
  onClose: () => void;
  /** If provided, indicates a moderator is editing (skip Turnstile, lock name) */
  moderatorName?: string;
}

export const PublicEditModal: React.FC<PublicEditModalProps> = ({ need, onClose, moderatorName }) => {
  const { language, t } = useTranslation();
  const isModerator = !!moderatorName;
  // Form state — mirrors CreateNeedModal
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('OTRO');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>([]);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [latitude, setLatitude] = useState(3.4516);
  const [longitude, setLongitude] = useState(-76.532);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [resources, setResources] = useState<
    Array<{ id: string; type: HelpCategory; description: string; requestedQuantity: number; fulfilledQuantity: number; unit: string; status: string }>
  >([]);

  // Edit metadata
  const [editorName, setEditorName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPickerMap, setShowPickerMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  const [isArchived, setIsArchived] = useState(false);
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('ahf_admin_token') : null;

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  // Pre-fill from need
  useEffect(() => {
    if (need) {
      setTitle(need.title || '');
      setDescription(need.description || '');
      setPlaceType((need.placeType as PlaceType) || 'OTRO');
      setSelectedCategories((need.categories as HelpCategory[]) || []);
      setAddress(need.address || '');
      setNeighborhood(need.neighborhood || '');
      setLatitude(need.latitude || 3.4516);
      setLongitude(need.longitude || -76.532);
      setContactName(need.contactName || '');
      setContactPhone(need.contactPhone || '');
      setContactWhatsapp(need.contactWhatsapp || '');
      setOrganizationName(need.organizationName || '');
      setOperatingHours(need.operatingHours || '');
      setPriority((need.priority as Priority) || 'MEDIUM');
      setResources(
        need.resources
          ? need.resources.map((r) => ({
              id: r.id,
              type: r.type as HelpCategory,
              description: r.description,
              requestedQuantity: r.requestedQuantity || 0,
              fulfilledQuantity: r.fulfilledQuantity || 0,
              unit: r.unit || 'unidades',
              status: r.status || 'PENDING',
            }))
          : []
      );
      setEditorName(moderatorName || '');
      setEditReason('');
      setTurnstileToken(isModerator ? 'moderator-bypass' : null);
      setSubmitted(false);
      setShowPickerMap(false);
      setIsArchived(need.verificationStatus === 'ARCHIVED');
    }
  }, [need]);

  useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [need]);

  if (!need) return null;

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
        requestedQuantity: 5,
        fulfilledQuantity: 0,
        unit: 'unidades',
        status: 'PENDING',
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
    try {
      const fullAddr = neighborhood ? `${address}, ${neighborhood}, Cali` : `${address}, Cali`;
      const res = await geocodeAddress(fullAddr);
      if (res) {
        setLatitude(res.latitude);
        setLongitude(res.longitude);
      }
    } catch {
      // Ignore geocoding failure silently
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModerator && !isTurnstileValid) {
      showAlert('Por favor completa la verificación de seguridad (reCAPTCHA/Turnstile).', { title: 'Verificación requerida', variant: 'error' });
      return;
    }
    if (!title.trim() || !description.trim() || !address.trim() || !neighborhood.trim() || !contactPhone.trim()) {
      showAlert('Por favor completa todos los campos requeridos (*), incluyendo el teléfono de contacto.', { title: 'Campos incompletos', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!need) return;

      const changedFields: string[] = [];
      if (title !== need.title) changedFields.push('título');
      if (description !== need.description) changedFields.push('descripción');
      if (placeType !== need.placeType) changedFields.push('tipo de lugar');
      if (address !== need.address) changedFields.push('dirección');
      if (neighborhood !== need.neighborhood) changedFields.push('barrio');
      if (priority !== need.priority) changedFields.push('prioridad');
      if (contactName !== need.contactName) changedFields.push('contacto');
      if (contactWhatsapp !== need.contactWhatsapp) changedFields.push('WhatsApp');
      if (contactPhone !== need.contactPhone) changedFields.push('teléfono');
      if (organizationName !== need.organizationName) changedFields.push('organización');
      if (operatingHours !== need.operatingHours) changedFields.push('horario');
      if (JSON.stringify(selectedCategories) !== JSON.stringify(need.categories)) changedFields.push('categorías');

      const changesSummary = changedFields.length > 0
        ? `Cambios: ${changedFields.join(', ')}`
        : 'Edición de información';

      const logReason = editReason.trim()
        ? `${editReason.trim()}. ${changesSummary}`
        : changesSummary;

      const finalUpdatedBy = isModerator
        ? (editorName.startsWith('[MOD] ') ? editorName : `[MOD] ${editorName || 'Moderador'}`)
        : (editorName.trim() || 'Ciudadano anónimo');

      await updateNeed(need.id, {
        title,
        description,
        placeType,
        categories: selectedCategories,
        address,
        neighborhood,
        latitude,
        longitude,
        contactName,
        contactPhone: contactPhone || undefined,
        contactWhatsapp: contactWhatsapp || undefined,
        organizationName: organizationName || undefined,
        operatingHours: operatingHours || undefined,
        priority,
        lastUpdatedBy: finalUpdatedBy,
      });

      await addNeedUpdateNote({
        needId: need.id,
        previousStatus: need.status,
        newStatus: need.status,
        description: logReason,
        updatedBy: finalUpdatedBy,
      });

      setSubmitted(true);
    } catch (err: any) {
      showAlert(err.message || 'Error al enviar la edición.', { title: 'Error', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!authToken || !need) return;
    if (!(await showConfirm('¿Archivar esta publicación? Se ocultará de la vista pública.', { title: 'Archivar publicación' }))) return;
    try {
      await updateNeed(need.id, { verificationStatus: 'ARCHIVED' });
      setIsArchived(true);
      showAlert('Publicación archivada correctamente.', { title: 'Archivada', variant: 'success' });
      onClose();
    } catch (err: any) {
      showAlert(err.message || 'Error al archivar.', { title: 'Error', variant: 'error' });
    }
  };
  const handlePublish = async () => {
    if (!authToken || !need) return;
    if (!(await showConfirm('¿Publicar esta publicación? Volverá a ser visible como pendiente de verificación.', { title: 'Publicar' }))) return;
    try {
      await updateNeed(need.id, { verificationStatus: 'PENDING_VERIFICATION' });
      setIsArchived(false);
      showAlert('Publicación puesta en pendiente de verificación.', { title: 'Publicada', variant: 'success' });
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
          <p className="text-xs text-slate-600">Gracias por mantener la información al día. El cambio quedó registrado.</p>
          <button onClick={onClose} className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs">Cerrar</button>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Actualizar información
            </h2>
            <p className="text-xs text-slate-500">
              Edita los datos que conoces. Todo cambio queda registrado.
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
              📁 Esta publicación está archivada y no es visible públicamente.
            </div>
          )}
          <fieldset disabled={isArchived} className="space-y-5">
          {/* Section 1: Title & Place Type */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              1. ¿Qué está pasando?
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Título corto de la necesidad *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Edificio residencial - Remoción de escombros en San Fernando"
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
                placeholder="Explica detalladamente la situación, accesos, requerimientos especiales..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de lugar *</label>
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value as PlaceType)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {placeTypesList.map((pt) => (
                    <option key={pt} value={pt}>
                      {PLACE_TYPE_LABELS[pt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                {placeType === 'CENTRO_ACOPIO' ? (
                  <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 font-semibold">
                    🟣 Los centros de acopio no requieren nivel de prioridad.
                  </p>
                ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                    const config = PRIORITY_CONFIG[p];
                    const isSelected = priority === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                          isSelected
                            ? `${config.badgeClass} ring-2 ring-offset-1 ring-slate-400`
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{config.dot}</span>
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              2. ¿Dónde está ubicado? (Cali)
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
                <span>{showPickerMap ? 'Ocultar mapa de ubicación' : 'Ajustar punto exacto en el mapa de Cali'}</span>
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

          {/* Section 3: Categories & Itemized Resources */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              3. ¿Qué necesitan?
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
                <label className="font-bold text-slate-700">Recursos o insumos requeridos</label>
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir insumo
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
                    value={res.requestedQuantity}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], requestedQuantity: Number(e.target.value) || 0 };
                      setResources(updated);
                    }}
                    placeholder="Necesarios"
                    className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  <input
                    type="number"
                    min="0"
                    value={res.fulfilledQuantity}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], fulfilledQuantity: Number(e.target.value) || 0 };
                      setResources(updated);
                    }}
                    placeholder="Cubiertos"
                    className="w-14 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  <input
                    type="text"
                    value={res.unit}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], unit: e.target.value };
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
              4. Contacto del responsable
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
                <label className="block font-bold text-slate-700 mb-1">Teléfono de contacto *</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ej: 3124448821"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organización / Entidad (opcional)</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej: Junta de Acción Comunal / Defensa Civil"
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

          {/* Section 5: Editor info + Turnstile */}
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
                  placeholder="Ej: Cambió el horario, ya llegó ayuda..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {!isModerator && (
              <div className="pt-2">
                <Turnstile onVerify={handleTurnstileVerify} onError={handleTurnstileError} />
              </div>
            )}
          </div>

          {/* Verification Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-emerald-900">
                Edición ciudadana responsable:
              </strong>
              <span>
                Tu edición se aplicará inmediatamente y quedará registrada en el historial del punto. Gracias por mantener la información actualizada.
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
              disabled={isSubmitting || (!isModerator && !turnstileToken)}
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
