import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, AlertTriangle, ShieldCheck, CheckCircle2, Upload, Search } from 'lucide-react';
import { HelpCategory, Need, PlaceType } from '../types';
import { CATEGORY_LABELS, PLACE_TYPE_LABELS } from '../utils/formatters';
import { MapView } from './MapView';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Need>) => Promise<void>;
  isSubmitting: boolean;
}

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('EDIFICIO_AFECTADO');
  const [selectedCategories, setSelectedCategories] = useState<HelpCategory[]>(['ESCOMBROS']);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('San Fernando');
  const [latitude, setLatitude] = useState(3.4325);
  const [longitude, setLongitude] = useState(-76.5412);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [requesterType, setRequesterType] = useState<Need['requesterType']>('PERSONA');
  const [operatingHours, setOperatingHours] = useState('08:00 a. m. - 05:00 p. m.');
  const [source, setSource] = useState('Reporte ciudadano en línea');

  // Resource items builder
  const [resources, setResources] = useState<
    Array<{ type: HelpCategory; description: string; requestedQuantity: number; unit: string }>
  >([
    { type: 'MANO_OBRA', description: 'Voluntarios de apoyo', requestedQuantity: 10, unit: 'personas' },
  ]);

  // Duplicate warning state
  const [duplicateMatches, setDuplicateMatches] = useState<Need[]>([]);
  const [hasCheckedDuplicates, setHasCheckedDuplicates] = useState(false);
  const [showPickerMap, setShowPickerMap] = useState(false);

  const categoriesList = Object.keys(CATEGORY_LABELS) as HelpCategory[];
  const placeTypesList = Object.keys(PLACE_TYPE_LABELS) as PlaceType[];

  // Check duplicate matches when neighborhood or title changes
  useEffect(() => {
    if (title.length > 5 || neighborhood.length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/needs/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, neighborhood, latitude, longitude }),
          });
          const json = await res.json();
          if (json.hasDuplicates) {
            setDuplicateMatches(json.matches || []);
            setHasCheckedDuplicates(true);
          } else {
            setDuplicateMatches([]);
          }
        } catch (e) {
          // Ignore
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, neighborhood, latitude, longitude]);

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
      { type: selectedCategories[0] || 'VOLUNTARIADO_GENERAL', description: '', requestedQuantity: 5, unit: 'unidades' },
    ]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !address.trim() || !neighborhood.trim()) {
      alert('Por favor completa todos los campos requeridos (*).');
      return;
    }

    await onSubmit({
      title,
      description,
      placeType,
      categories: selectedCategories,
      resources: resources.map((r, i) => ({
        id: `r-new-${i}`,
        type: r.type,
        description: r.description || CATEGORY_LABELS[r.type]?.label || 'Recurso',
        requestedQuantity: Number(r.requestedQuantity) || 0,
        fulfilledQuantity: 0,
        unit: r.unit || 'unidades',
        status: 'PENDING',
      })),
      address,
      neighborhood,
      latitude,
      longitude,
      contactName,
      contactPhone,
      contactWhatsapp,
      contactEmail,
      organizationName,
      requesterType,
      operatingHours,
      source,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">Registrar punto de necesidad</h2>
            <p className="text-xs text-slate-500">
              Registra una oportunidad de ayuda o comunidad afectada en Cali.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            id="btn-close-create-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs text-slate-800">
          {/* Duplicate warning alert */}
          {duplicateMatches.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Posibles duplicados detectados cerca de esta zona:</span>
              </div>
              <ul className="space-y-1 text-amber-950 pl-6 list-disc">
                {duplicateMatches.map((m) => (
                  <li key={m.id}>
                    <strong>{m.title}</strong> — {m.neighborhood} ({m.address})
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-800 italic">
                Revisa si la necesidad ya existe para evitar dispersar la información. Si es un punto distinto, puedes continuar.
              </p>
            </div>
          )}

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
                <label className="block font-bold text-slate-700 mb-1">¿Quién solicita ayuda?</label>
                <select
                  value={requesterType}
                  onChange={(e) => setRequesterType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="PERSONA">Persona individual</option>
                  <option value="COMUNIDAD">Comité comunitario / Vecinos</option>
                  <option value="ORGANIZACION">Organización / ONG</option>
                  <option value="FUNDACION">Fundación</option>
                  <option value="EMPRESA">Empresa</option>
                  <option value="OTRO">Otro</option>
                </select>
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
                  placeholder="Ej: Calle 5 # 34-12 frente al parque"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
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
                <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-300">
                  <MapView
                    needs={[]}
                    isPickerMode={true}
                    pickerPosition={{ lat: latitude, lng: longitude }}
                    onPickPosition={(pos) => {
                      setLatitude(pos.lat);
                      setLongitude(pos.lng);
                    }}
                    onSelectNeed={() => {}}
                  />
                </div>
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
                      updated[idx].description = e.target.value;
                      setResources(updated);
                    }}
                    placeholder="Descripción (ej: Palas metálicas, Cajas de agua...)"
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
                    placeholder="Cantidad"
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
                    placeholder="Unidad (ej: pers, cajas)"
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />

                  {resources.length > 1 && (
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
                Descripción detallada de la necesidad *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica detalladamente la situación, accesos, requerimientos especiales o puntos de referencia..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 4: Contact & Verification */}
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
                <label className="block font-bold text-slate-700 mb-1">Organización / Entidad (opcional)</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej: Junta de Acción Comunal / Defensa Civil"
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
                Proceso de verificación responsable:
              </strong>
              <span>
                Tu reporte se guardará inicialmente como <strong>"Pendiente de verificación"</strong>. Un moderador o fuente oficial confirmará la información antes de marcarla como verificada.
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              id="btn-submit-create-need"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Necesidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
