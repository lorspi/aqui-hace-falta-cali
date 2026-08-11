import React, { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, Send } from 'lucide-react';
import { Need } from '../types';

interface ReportModalProps {
  need: Need | null;
  onClose: () => void;
  onSubmitReport: (needId: string, reason: string, description: string, contact: string) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({ need, onClose, onSubmitReport }) => {
  const [reason, setReason] = useState<string>('NOT_NEEDED_ANYMORE');
  const [description, setDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [need]);

  if (!need) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmitReport(need.id, reason, description, reporterContact);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 modal-scroll max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-rose-100 text-rose-700">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reportar información incorrecta</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{need.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-800">
          <div>
            <label className="block font-bold text-slate-700 mb-1">¿Cuál es el problema?</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="NOT_NEEDED_ANYMORE">Ya no necesitan ayuda / La ayuda fue cubierta</option>
              <option value="WRONG_LOCATION">La ubicación o dirección es incorrecta</option>
              <option value="FALSE_INFORMATION">La información es falsa o engañosa</option>
              <option value="BAD_CONTACT">El teléfono o WhatsApp no funciona</option>
              <option value="OUTDATED">La información está desactualizada</option>
              <option value="OTHER">Otro motivo</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detalle del reporte *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Fuimos al lugar hoy a las 9 am y nos indicaron que ya recibieron las palas y ropa necesarias..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tu contacto (opcional para verificar)</label>
            <input
              type="text"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              placeholder="Teléfono o correo"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>Los reportes ayudan a mantener la información limpia durante la emergencia. El equipo moderará este punto.</span>
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
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar reporte</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
