import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Phone,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Flag,
  RefreshCcw,
  HeartHandshake,
  Share2,
  Calendar,
  Building,
} from 'lucide-react';
import { Need } from '../types';
import {
  CATEGORY_LABELS,
  PLACE_TYPE_LABELS,
  PRIORITY_CONFIG,
  VERIFICATION_CONFIG,
  buildWhatsappLink,
  formatTimeAgo,
} from '../utils/formatters';

interface NeedDetailModalProps {
  need: Need | null;
  onClose: () => void;
  onOpenQuieroAyudar: (need: Need) => void;
  onOpenReportModal: (need: Need) => void;
  onOpenUpdateStatusModal: (need: Need) => void;
  isModeratorLoggedIn?: boolean;
  onAdminEditNeed?: (need: Need) => void;
  onAdminChangePriority?: (need: Need) => void;
}

export const NeedDetailModal: React.FC<NeedDetailModalProps> = ({
  need,
  onClose,
  onOpenQuieroAyudar,
  onOpenReportModal,
  onOpenUpdateStatusModal,
  isModeratorLoggedIn = false,
  onAdminEditNeed,
  onAdminChangePriority,
}) => {
  const [copied, setCopied] = useState(false);

  // Block body scroll when modal is open
  React.useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [need]);

  if (!need) return null;

  const priorityInfo = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG.MEDIUM;
  const verificationInfo = VERIFICATION_CONFIG[need.verificationStatus] || VERIFICATION_CONFIG.PENDING_VERIFICATION;
  const placeTypeLabel = PLACE_TYPE_LABELS[need.placeType] || 'Lugar de ayuda';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${need.latitude},${need.longitude}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Aquí Hace Falta - ${need.title}`,
        text: `Oportunidad de ayuda en Cali: ${need.title} (${need.neighborhood})`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${priorityInfo.badgeClass}`}>
                {priorityInfo.dot} Prioridad {priorityInfo.label}
              </span>
              <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
                {placeTypeLabel}
              </span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${verificationInfo.badgeClass}`}>
                {verificationInfo.icon} {verificationInfo.label}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-snug pt-1">{need.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all shrink-0"
            id="btn-close-detail-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 text-sm">
          {/* Priority explanation notice */}
          <div className={`p-3 rounded-xl text-xs border flex items-start gap-2.5 ${priorityInfo.bgClass}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Nivel de prioridad {priorityInfo.label}:</strong>
              <span>{priorityInfo.explanation}</span>
            </div>
          </div>

          {/* Situation Description */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-1">
              Descripción de la situación
            </h4>
            <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {need.description}
            </p>
          </div>

          {/* What they need (Itemized checklist & progress) */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              ¿Qué necesitan específicamente?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {need.resources.map((res) => {
                const requested = res.requestedQuantity || 0;
                const fulfilled = res.fulfilledQuantity || 0;
                const percentage = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;

                return (
                  <div key={res.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <span>{CATEGORY_LABELS[res.type]?.icon || '🔹'}</span>
                        <span>{res.description || CATEGORY_LABELS[res.type]?.label}</span>
                      </span>
                    </div>

                    {requested > 0 && fulfilled > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>Cobertura:</span>
                          <strong className="text-slate-900">
                            {fulfilled} de {requested} {res.unit || ''} ({percentage}%)
                          </strong>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percentage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : requested > 0 ? (
                      <span className="text-xs text-slate-600 font-medium">
                        Se necesitan {requested} {res.unit || ''}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        Se requiere apoyo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          {need.categories && need.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {need.categories.map((c) => (
                <span
                  key={c}
                  className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 flex items-center gap-1"
                >
                  <span>{CATEGORY_LABELS[c]?.icon || '🔹'}</span>
                  <span>{CATEGORY_LABELS[c]?.label || c}</span>
                </span>
              ))}
            </div>
          )}

          {/* Location & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-600" /> Ubicación
              </span>
              <p className="font-bold text-slate-900 text-sm">{need.address}</p>
              <p className="text-xs text-slate-600">Barrio: {need.neighborhood}, Cali</p>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-900 font-bold hover:underline pt-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Cómo llegar (Abrir Google Maps)</span>
              </a>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" /> Horario / Contacto
              </span>
              <p className="text-xs text-slate-800 font-medium">
                {need.operatingHours || 'Atención continua según llegada de voluntarios'}
              </p>
              {need.organizationName && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>Organización: {need.organizationName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Verification Trail & Source Attribution */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nivel de Verificación: {verificationInfo.label}</span>
            </div>
            {need.verifiedBy && (
              <p>
                <strong>Verificado por:</strong> {need.verifiedBy}
              </p>
            )}
            {need.source && (
              <p>
                <strong>Fuente original:</strong> {need.source}
              </p>
            )}
            <p className="text-slate-500 text-[11px] pt-0.5">
              Última actualización confirmada: {new Date(need.updatedAt).toLocaleString('es-CO')} ({formatTimeAgo(need.updatedAt)})
            </p>
          </div>

          {/* Contact Direct Buttons */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Contacto directo con el responsable
            </h4>
            <div className="flex flex-wrap gap-2">
              {need.contactWhatsapp && (
                <a
                  href={buildWhatsappLink(need.contactWhatsapp, need.title, need.categories)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                </a>
              )}

              {need.contactPhone && (
                <a
                  href={`tel:${need.contactPhone}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Llamar por teléfono</span>
                </a>
              )}

              <button
                onClick={handleShare}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-300 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isModeratorLoggedIn && onAdminChangePriority && (
              <button
                onClick={() => onAdminChangePriority(need)}
                className="text-amber-700 hover:text-amber-900 font-semibold underline flex items-center gap-1"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Cambiar prioridad</span>
              </button>
            )}
            {isModeratorLoggedIn && onAdminEditNeed && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => onAdminEditNeed(need)}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold underline flex items-center gap-1"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Editar publicación</span>
                </button>
              </>
            )}
            {isModeratorLoggedIn && <span className="text-slate-300">•</span>}
            <button
              onClick={() => onOpenReportModal(need)}
              className="text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Reportar problema</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenQuieroAyudar(need);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
            id="btn-help-modal-primary"
          >
            <HeartHandshake className="w-4 h-4 text-amber-300" />
            <span>Quiero ayudar ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
