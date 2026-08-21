import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Need, NeedStatus } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface UpdateStatusModalProps {
  need: Need | null;
  onClose: () => void;
  onSubmitUpdate: (needId: string, newStatus: NeedStatus, note: string, updatedBy: string) => Promise<void>;
  moderatorName?: string;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  need,
  onClose,
  onSubmitUpdate,
  moderatorName,
}) => {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = useState<NeedStatus>(need?.status || 'NEED_HELP_NOW');
  const [note, setNote] = useState('');
  const [updatedBy, setUpdatedBy] = useState(moderatorName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      setNewStatus(need.status || 'NEED_HELP_NOW');
      if (moderatorName) {
        setUpdatedBy(moderatorName);
      }
      return () => document.body.classList.remove("modal-open");
    }
  }, [need, moderatorName]);

  if (!need) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmitUpdate(need.id, newStatus, note, updatedBy);
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
            <div className="p-2 rounded-full bg-slate-100 text-slate-800">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t('updateStatusTitle')}</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{need.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-800">
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('coverageStatusLabel')} *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as NeedStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
            >
              <option value="NEED_HELP_NOW">🔴 {t('statusNeedHelpNow')}</option>
              <option value="RECEIVING_HELP">🔵 {t('statusReceivingHelp')}</option>
              <option value="PARTIALLY_COVERED">🟣 {t('statusPartiallyCovered')}</option>
              <option value="COVERED">🟢 {t('statusCovered')}</option>
              <option value="CLOSED">⚪ {t('statusClosed')}</option>
            </select>
          </div>

          {/* Section 5: Editor info */}
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              5. ¿QUIÉN ACTUALIZA?
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {moderatorName ? 'Moderador' : 'Tu nombre (opcional)'}
                </label>
                <input
                  type="text"
                  value={updatedBy}
                  onChange={(e) => !moderatorName && setUpdatedBy(e.target.value)}
                  placeholder="Para el registro de cambios"
                  readOnly={!!moderatorName}
                  className={`w-full p-2 border border-slate-300 rounded-lg text-xs ${
                    moderatorName
                      ? 'bg-slate-100 text-slate-700 font-semibold cursor-not-allowed'
                      : 'bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Motivo del cambio (opcional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Cambió el horario, ya llegó ayuda..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Mint Green Banner for Staff / Responsible Edits */}
            {moderatorName && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-emerald-900">
                    Edición ciudadana responsable:
                  </strong>
                  <span>
                    Tu edición se aplicará inmediatamente y quedará registrada en el historial del punto. Gracias por mantener la información actualizada.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('saveStatusButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
