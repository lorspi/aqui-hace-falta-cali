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
  getCategoryLabel,
  getPlaceTypeLabel,
} from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { trackClarityEvent } from '../utils/analytics';

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
  const { language, t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const updateLogs: any[] = [];

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
  const placeTypeLabel = getPlaceTypeLabel(need.placeType, language);

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
                  🟣 {language === 'en' ? 'Collection Center' : 'Centro de Acopio'}
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${priorityInfo.badgeClass}`}>
                  {priorityInfo.dot} {language === 'en' ? 'Priority ' + need.priority : 'Prioridad ' + priorityInfo.label}
                </span>
              )}
              {!isCollectionCenter && (
                <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
                  {placeTypeLabel}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${verificationInfo.badgeClass}`}>
                {verificationInfo.icon} {need.verificationStatus === 'VERIFIED' ? t('cardVerifiedBy') : need.verificationStatus === 'PENDING_VERIFICATION' ? t('cardPendingVerification') : need.verificationStatus === 'REPORTED' ? t('cardReported') : t('cardArchived')}
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
          {/* Situation Description */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-1">
              {t('detailDescription')}
            </h4>
            <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {need.description}
            </p>
          </div>

          {/* What they need */}
          {need.resources && need.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                {t('cardResourcesNeeded')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {need.resources.map((res) => {
                  const requested = res.requestedQuantity || 0;
                  const fulfilled = res.fulfilledQuantity || 0;
                  const percentage = requested > 0 ? Math.min(100, Math.round((fulfilled / requested) * 100)) : 0;
                  const cat = getCategoryLabel(res.type, language);

                  return (
                    <div key={res.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span>{cat?.icon || '🔹'}</span>
                          <span>{res.description || cat?.label}</span>
                        </span>
                      </div>

                      {requested > 0 && fulfilled > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>{language === 'en' ? 'Coverage:' : 'Cobertura:'}</span>
                            <strong className="text-slate-900">
                              {fulfilled} / {requested} {res.unit || ''} ({percentage}%)
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
                          {requested} {res.unit || ''}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          {t('priorityCritical')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {need.categories && need.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {need.categories.map((c) => {
                const item = getCategoryLabel(c, language);
                return (
                  <span
                    key={c}
                    className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 flex items-center gap-1"
                  >
                    <span>{item?.icon || '🔹'}</span>
                    <span>{item?.label || c}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Location & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-600" /> {t('cardLocation')}
              </span>
              <p className="font-bold text-slate-900 text-sm">{need.address}</p>
              <p className="text-xs text-slate-600">{t('detailNeighborhood')} {need.neighborhood}</p>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-900 font-bold hover:underline pt-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Get Directions (Google Maps)' : 'Cómo llegar (Abrir Google Maps)'}</span>
              </a>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" /> {t('detailOperatingHours')}
              </span>
              <p className="text-xs text-slate-800 font-medium">
                {need.operatingHours || (language === 'en' ? 'Continuous service as volunteers arrive' : 'Atención continua según llegada de voluntarios')}
              </p>
              {need.organizationName && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{t('detailOrganization')} {need.organizationName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Verification Trail & Source Attribution */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('cardVerifiedBy')}: {need.verifiedBy || (language === 'en' ? 'Community Report' : 'Reporte Ciudadano')}</span>
            </div>
            {need.source && (
              <p>
                <strong>{t('detailSource')}</strong> {need.source}
              </p>
            )}
            <p className="text-slate-500 text-[11px] pt-0.5">
              {formatTimeAgo(need.updatedAt, language)}
            </p>
          </div>

          {/* Contact Direct Buttons */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              {t('cardContactName')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {need.contactWhatsapp && (
                <a
                  href={buildWhatsappLink(need.contactWhatsapp, need.title, need.categories, language)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackClarityEvent('contact_whatsapp', { needId: need.id })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}

              {need.contactPhone && (
                <a
                  href={`tel:${need.contactPhone}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('cardContactDirect')}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              onClick={() => onOpenReportModal(need)}
              className="text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t('detailReportIssue')}</span>
            </button>
            {onOpenPublicEdit && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => { onClose(); onOpenPublicEdit(need); }}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{t('detailEditPublic')}</span>
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
              <span>{copied ? (language === 'en' ? 'Copied!' : '¡Copiado!') : t('detailShare')}</span>
            </button>

            <button
              onClick={() => {
                trackClarityEvent('click_help', { needId: need.id });
                onClose();
                onOpenQuieroAyudar(need);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
              id="btn-help-modal-primary"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>{t('detailIWantToHelp')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
