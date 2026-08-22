import React, { useEffect } from 'react';
import { X, HeartHandshake, MapPin, MessageSquare, Phone, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { Need } from '../types';
import { CATEGORY_LABELS, buildWhatsappLink, getCategoryLabel } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

interface QuieroAyudarModalProps {
  need: Need | null;
  onClose: () => void;
}

export const QuieroAyudarModal: React.FC<QuieroAyudarModalProps> = ({ need, onClose }) => {
  const { language, t } = useTranslation();

  useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [need]);

  if (!need) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${need.latitude},${need.longitude}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 modal-scroll max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{t('quieroAyudarTitle')}</h3>
              <p className="text-xs text-slate-500">{t('quieroAyudarSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
          <h4 className="font-bold text-slate-900 text-base leading-snug">{need.title}</h4>

          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{need.address} ({need.neighborhood})</span>
            </div>
            {need.operatingHours && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t('detailOperatingHours')} {need.operatingHours}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t('priorityNeeds')}
            </span>
            <div className="space-y-1 text-xs text-slate-800">
              {need.resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span>• {r.description || getCategoryLabel(r.type, language)?.label}</span>
                  {r.requestedQuantity && (
                    <span className="font-semibold text-slate-900">
                      {t('remainingNeed')} {r.requestedQuantity - (r.fulfilledQuantity || 0)} {r.unit || ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact actions */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-600 font-medium">{t('chooseChannel')}</p>

          <div className="grid grid-cols-1 gap-2">
            {need.contactWhatsapp && (
              <a
                href={buildWhatsappLink(need.contactWhatsapp, need.title, need.categories, language)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary-success btn-lg w-full"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('writeWhatsapp')}</span>
              </a>
            )}

            {need.contactPhone && (
              <a
                href={`tel:${need.contactPhone}`}
                className="btn-primary btn-lg w-full"
              >
                <Phone className="w-4 h-4" />
                <span>{t('callPhone')} ({need.contactPhone})</span>
              </a>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-lg w-full"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t('openGoogleMaps')}</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            {t('confirmDisclaimer')}
          </span>
        </div>
      </div>
    </div>
  );
};
