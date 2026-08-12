import React, { useState, useEffect, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { X, Plus, Trash2, Loader2, MapPin, Edit3 } from 'lucide-react';
import { HelpCategory, Need, PlaceType } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS } from '../utils/formatters';
import { geocodeAddress } from '../utils/geocoding';
import { MiniMapPicker } from './MiniMapPicker';
import { Turnstile } from './Turnstile';

interface PublicEditModalProps {
  need: Need | null;
  onClose: () => void;
}

export const PublicEditModal: React.FC<PublicEditModalProps> = ({ need, onClose }) => {
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
  const [resources, setResources] = useState<
    Array<{ id: string; type: string; description: string; requestedQuantity: number; fulfilledQuantity: number; unit: string; status: string }>
  >([]);

  // Edit metadata
  const [editorName, setEditorName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const submitEdit = useAction(api.publicEditAction.submitEdit);
  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

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
      setPlaceType(need.placeType as PlaceType || 'OTRO');
      setSelectedCategories(need.categories as HelpCategory[] || []);
      setAddress(need.address || '');
      setNeighborhood(need.neighborhood || '');
      setLatitude(need.latitude || 3.4516);
      setLongitude(need.longitude || -76.532);
      setContactName(need.contactName || '');
      setContactPhone(need.contactPhone || '');
      setContactWhatsapp(need.contactWhatsapp || '');
      setOrganizationName(need.organizationName || '');
      setOperatingHours(need.operatingHours || '');
      setResources(need.resources ? need.resources.map(r => ({ ...r })) : []);
      setEditorName('');
      setEditReason('');
      setTurnstileToken(null);
      setSubmitted(false);
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

  const handleGeocode = async () => {
    if (!address) return;
    setIsGeocoding(true);
    setGeocodeError('');
    const result = await geocodeAddress(address, neighborhood);
    if (result) {
      setLatitude(result.latitude);
      setLongitude(result.longitude);
    } else {
      setGeocodeError('No se encontró. Ubícala en el mapa.');
    }
    setIsGeocoding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      alert('Completa la verificación anti-bot.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert('Título y descripción son requeridos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEdit({
        turnstileToken,
        needId: need.id as Id<"needs">,
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
        resources: resources,
        editorName: editorName || undefined,
        editReason: editReason || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Error al enviar la edición.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="font-bold text-slate-900">¡Información actualizada!</h3>
          <p className="text-xs text-slate-600">Gracias por mantener la información al día. El cambio quedó registrado.</p>
          <button onClick={onClose} className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" /> Actualizar información
            </h2>
            <p className="text-xs text-slate-500">Edita los datos que conoces. Todo cambio queda registrado.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* SECTION 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1">1. Información básica</h3>
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Título *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Descripción *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Tipo de lugar</label>
              <select value={placeType} onChange={(e) => setPlaceType(e.target.value as PlaceType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm">
                {placeTypesList.map((pt) => (
                  <option key={pt} value={pt}>{PLACE_TYPE_LABELS[pt]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 2: Categories */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1">2. Categorías de ayuda</h3>
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const item = CATEGORY_LABELS[cat];
                return (
                  <button key={cat} type="button" onClick={() => handleCategoryToggle(cat)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Resources */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1">3. ¿Qué necesitan?</h3>
            {resources.map((res, idx) => (
              <div key={res.id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <select value={res.type} onChange={(e) => {
                    const u = [...resources]; u[idx] = { ...u[idx], type: e.target.value }; setResources(u);
                  }} className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold flex-1">
                    {categoriesList.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c].icon} {CATEGORY_LABELS[c].label}</option>)}
                  </select>
                  <button type="button" onClick={() => setResources(resources.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-500 hover:text-rose-700 ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <input type="text" value={res.description} placeholder="Descripción del recurso"
                  onChange={(e) => { const u = [...resources]; u[idx] = { ...u[idx], description: e.target.value }; setResources(u); }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs" />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500">Necesarios:</label>
                    <input type="number" min="0" value={res.requestedQuantity || 0}
                      onChange={(e) => { const u = [...resources]; u[idx] = { ...u[idx], requestedQuantity: Number(e.target.value) || 0 }; setResources(u); }}
                      className="w-16 p-1.5 border border-slate-300 rounded text-xs" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500">Cubiertos:</label>
                    <input type="number" min="0" value={res.fulfilledQuantity || 0}
                      onChange={(e) => { const u = [...resources]; u[idx] = { ...u[idx], fulfilledQuantity: Number(e.target.value) || 0 }; setResources(u); }}
                      className="w-16 p-1.5 border border-slate-300 rounded text-xs" />
                  </div>
                  <input type="text" value={res.unit || ''} placeholder="unidad"
                    onChange={(e) => { const u = [...resources]; u[idx] = { ...u[idx], unit: e.target.value }; setResources(u); }}
                    className="w-20 p-1.5 border border-slate-300 rounded text-xs" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setResources([...resources, { id: `r-${Date.now()}`, type: 'VOLUNTARIADO_GENERAL', description: '', requestedQuantity: 5, fulfilledQuantity: 0, unit: 'unidades', status: 'PENDING' }])}
              className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar recurso
            </button>
          </div>

          {/* SECTION 4: Location */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1">4. Ubicación</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Dirección *</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Barrio *</label>
                <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={handleGeocode} disabled={isGeocoding || !address}
                className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 hover:bg-indigo-200">
                {isGeocoding ? <><Loader2 className="w-3 h-3 animate-spin" /> Buscando...</> : <><MapPin className="w-3 h-3" /> Geocodificar</>}
              </button>
              <span className="text-[10px] text-slate-500">📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              {geocodeError && <span className="text-[10px] text-rose-600">{geocodeError}</span>}
            </div>
            <MiniMapPicker latitude={latitude} longitude={longitude}
              onPositionChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} height="150px" />
          </div>

          {/* SECTION 5: Contact */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-1">5. Contacto</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Nombre contacto</label>
                <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Teléfono</label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">WhatsApp</label>
                <input type="text" value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Organización</label>
                <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Horario de atención</label>
              <input type="text" value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Ej: 8:00 a.m. - 5:00 p.m. / 24 horas"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
            </div>
          </div>

          {/* SECTION 6: Editor info + Turnstile */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="font-bold text-slate-800 text-sm">¿Quién actualiza?</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Tu nombre (opcional)</label>
                <input type="text" value={editorName} onChange={(e) => setEditorName(e.target.value)}
                  placeholder="Para el registro" className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Motivo del cambio (opcional)</label>
                <input type="text" value={editReason} onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ej: Cambió el horario" className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-500 text-center mb-2">Verificación anti-bot:</p>
              <Turnstile onVerify={handleTurnstileVerify} onError={handleTurnstileError} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-600 font-semibold">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !turnstileToken}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs disabled:opacity-50 flex items-center gap-1.5">
              {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</> : <><Edit3 className="w-3.5 h-3.5" /> Guardar cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
