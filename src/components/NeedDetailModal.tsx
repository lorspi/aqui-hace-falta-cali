import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
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
  Edit,
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
  onOpenPublicEdit?: (need: Need) => void;
  isModeratorLoggedIn?: boolean;
  isAdmin?: boolean;
  onAdminEditNeed?: (need: Need) => void;
  onAdminChangePriority?: (need: Need) => void;
  shareUrl?: string;
}

export const NeedDetailModal: React.FC<NeedDetailModalProps> = ({
  need,
  onClose,
  onOpenQuieroAyudar,
  onOpenReportModal,
  onOpenUpdateStatusModal,
  onOpenPublicEdit,
  isModeratorLoggedIn = false,
  isAdmin = false,
  onAdminEditNeed,
  onAdminChangePriority,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  // Fetch update logs for this need
  const needDetail = useQuery(
    api.needs.getById,
    need ? { id: need.id as Id<"needs"> } : "skip"
  );
  const updateLogs = (needDetail as any)?.updates || [];

  // Block body scroll when modal is open
  React.useEffect(() => {
    if (need) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [need]);

  if (!need) return null;

  const isCollectionCenter = need.placeType === 'CENTRO_ACOPIO';
  const priorityInfo = PRIORITY_CONFIG[need.priority] || PRIORITY_CONFIG.MEDIUM;
  const verificationInfo = VERIFICATION_CONFIG[need.verificationStatus] || VERIFICATION_CONFIG.PENDING_VERIFICATION;
  const placeTypeLabel = PLACE_TYPE_LABELS[need.placeType] || 'Lugar de ayuda';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${need.latitude},${need.longitude}`;

  const needShareUrl = shareUrl || window.location.href;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Aquí Hace Falta - ${need.title}`,
        text: `Necesidad de ayuda: ${need.title} (${need.neighborhood})`,
        url: needShareUrl,
      });
    } else {
      navigator.clipboard.writeText(needShareUrl);
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
              {isCollectionCenter ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                  🟣 Centro de Acopio
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${priorityInfo.badgeClass}`}>
                  {priorityInfo.dot} Prioridad {priorityInfo.label}
                </span>
              )}
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
            </div>
          </div>
        </div>
        {/* Change History */}
        {updateLogs.length > 0 && (
          <div className="px-5 pb-4">
            <details className="group">
              <summary className="text-xs font-bold text-slate-600 cursor-pointer hover:text-slate-900 flex items-center gap-1.5 py-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Historial de cambios ({updateLogs.length})</span>
              </summary>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {updateLogs
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((log: any, idx: number) => (
                  <div key={log._id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        {(log.updatedBy as string)?.startsWith('[MOD] ') && (
                          <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                        )}
                        {(log.updatedBy as string)?.replace('[MOD] ', '')}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatTimeAgo(log.createdAt)}</span>
                    </div>
                    <p className="text-slate-600">{log.description}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

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
            {isAdmin && onAdminEditNeed && (
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
            {onOpenPublicEdit && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => { onClose(); onOpenPublicEdit(need); }}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Actualizar info</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 border border-slate-300 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
            </button>

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
    </div>
  );
};
