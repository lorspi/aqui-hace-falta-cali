import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Need, NeedStatus } from '../types';

interface UpdateStatusModalProps {
  need: Need | null;
  onClose: () => void;
  onSubmitUpdate: (needId: string, newStatus: NeedStatus, note: string, updatedBy: string) => Promise<void>;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  need,
  onClose,
  onSubmitUpdate,
}) => {
  const [newStatus, setNewStatus] = useState<NeedStatus>(need?.status || 'NEED_HELP_NOW');
  const [note, setNote] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!need) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmitUpdate(need.id, newStatus, note, updatedBy);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-slate-100 text-slate-800">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Actualizar estado del punto</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{need.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-800">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nuevo estado *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as NeedStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
            >
              <option value="NEED_HELP_NOW">🔴 Necesita ayuda ahora</option>
              <option value="RECEIVING_HELP">🔵 Recibiendo ayuda</option>
              <option value="PARTIALLY_COVERED">🟣 Ayuda parcialmente cubierta</option>
              <option value="COVERED">🟢 Ayuda totalmente cubierta</option>
              <option value="CLOSED">⚪ Punto cerrado / Ya no recibe ayuda</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detalle de la actualización</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Ya llegaron los 10 voluntarios de escombros. Ahora solo faltan 5 garrafones de agua..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tu nombre o rol en el punto</label>
            <input
              type="text"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="Ej: Voluntario en terreno / Coordinador de acopio"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar actualización</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
