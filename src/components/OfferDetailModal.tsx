import React, { useState, useMemo } from 'react';
import { submitOfferReport, updateOffer } from '../lib/supabaseService';
import {
  X,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  ShieldCheck,
  Building,
  Package,
  Flag,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Save,
  Share2,
  Edit,
  Calendar,
} from 'lucide-react';
import { Offer, OfferStatus } from '../types';
import {
  CATEGORY_LABELS,
  VERIFICATION_CONFIG,
  formatTimeAgo,
  getCategoryLabel,
} from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { computeOfferStatusFromResources } from '../utils/offerStatusLogic';

interface OfferDetailModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
  isModeratorLoggedIn?: boolean;
  isAdmin?: boolean;
  onOpenReportModal?: (offer: Offer) => void;
  onAdminEditOffer?: (offer: Offer) => void;
  onOpenPublicEdit?: (offer: Offer) => void;
}

const OFFER_STATUS_CONFIG: Record<OfferStatus, { label: string; badgeClass: string }> = {
  AVAILABLE: {
    label: 'Disponible',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
  },
  PARTIALLY_AVAILABLE: {
    label: 'Parcialmente disponible',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EXHAUSTED: {
    label: 'Agotado',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  CLOSED: {
    label: 'Cerrado',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
  },
};

const REPORT_REASONS = [
  { value: 'NOT_NEEDED_ANYMORE', label: 'Ya no ofrecen este recurso' },
  { value: 'WRONG_LOCATION', label: 'La ubicación o dirección es incorrecta' },
  { value: 'FALSE_INFORMATION', label: 'La información es falsa o engañosa' },
  { value: 'BAD_CONTACT', label: 'El teléfono o WhatsApp no funciona' },
  { value: 'OUTDATED', label: 'La información está desactualizada' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const OFFER_STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'PARTIALLY_AVAILABLE', label: 'Parcialmente disponible' },
  { value: 'EXHAUSTED', label: 'Agotado' },
  { value: 'CLOSED', label: 'Cerrado' },
];

type ResourceItemStatus = 'PENDING' | 'PARTIAL' | 'FULFILLED';

const RESOURCE_STATUS_OPTIONS: { value: ResourceItemStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'FULFILLED', label: 'Entregado' },
];

const AUTO_STATUS_LABELS: Record<string, string> = {
  EXHAUSTED: 'Agotado',
  PARTIALLY_AVAILABLE: 'Parcialmente disponible',
  AVAILABLE: 'Disponible',
};

export const OfferDetailModal: React.FC<OfferDetailModalProps> = ({
  offer,
  isOpen,
  onClose,
  shareUrl,
  isModeratorLoggedIn = false,
  isAdmin = false,
  onOpenReportModal,
  onAdminEditOffer,
  onOpenPublicEdit,
}) => {
  const { language, t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('NOT_NEEDED_ANYMORE');
  const [reportDescription, setReportDescription] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Status update state
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OfferStatus | null>(null);
  const [resourceStatuses, setResourceStatuses] = useState<Record<string, ResourceItemStatus>>({});
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const updateLogs: any[] = [];

  // Block body scroll when modal is open
  React.useEffect(() => {
    if (isOpen && offer) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [isOpen, offer]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowReportForm(false);
      setReportReason('NOT_NEEDED_ANYMORE');
      setReportDescription('');
      setReporterContact('');
      setReportSuccess(false);
      setReportError(null);
      setSelectedStatus(null);
      setResourceStatuses({});
      setStatusSuccess(false);
      setStatusError(null);
      setShowStatusUpdate(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Initialize resource statuses when offer changes
  React.useEffect(() => {
    if (offer && offer.resources && offer.resources.length > 0) {
      const initial: Record<string, ResourceItemStatus> = {};
      for (const res of offer.resources) {
        let mappedStatus: ResourceItemStatus = 'PENDING';
        if (res.status === 'EXHAUSTED') mappedStatus = 'FULFILLED';
        initial[res.id] = mappedStatus;
      }
      setResourceStatuses(initial);
    }
  }, [offer]);

  // Auto-compute status from resource selections
  const autoComputedStatus = useMemo(() => {
    if (!offer || !offer.resources || offer.resources.length === 0) return null;
    const resourceStates = Object.values(resourceStatuses).map((status) => ({ status }));
    if (resourceStates.length === 0) return null;
    return computeOfferStatusFromResources(resourceStates);
  }, [resourceStatuses, offer]);

  if (!isOpen || !offer) return null;

  const isClosed = offer.offerStatus === 'CLOSED';
  const verificationInfo = VERIFICATION_CONFIG[offer.verificationStatus] || VERIFICATION_CONFIG.PENDING_VERIFICATION;
  const statusInfo = OFFER_STATUS_CONFIG[offer.offerStatus] || OFFER_STATUS_CONFIG.AVAILABLE;
  const isInactive = offer.offerStatus === 'EXHAUSTED' || offer.offerStatus === 'CLOSED';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${offer.latitude},${offer.longitude}`;
  const offerShareUrl = shareUrl || window.location.href;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Aquí Hace Falta - ${offer.title}`,
        text: `Oferta de ayuda: ${offer.title} (${offer.neighborhood})`,
        url: offerShareUrl,
      });
    } else {
      navigator.clipboard.writeText(offerShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitStatusUpdate = async () => {
    if (!offer || isClosed) return;
    setIsSubmittingStatus(true);
    setStatusError(null);
    setStatusSuccess(false);
    try {
      const hasResources = offer.resources && offer.resources.length > 0;
      const updatedResources = hasResources
        ? offer.resources.map((res) => ({
            id: res.id,
            type: res.type,
            description: res.description,
            quantity: res.quantity,
            unit: res.unit,
            status: resourceStatuses[res.id] || 'PENDING',
          }))
        : undefined;
      await updateOffer(offer.id, {
        offerStatus: (!hasResources && selectedStatus ? selectedStatus : offer.offerStatus) as OfferStatus,
        resources: updatedResources as any,
      });
      setStatusSuccess(true);
    } catch (err: any) {
      setStatusError(err?.message || 'Error al actualizar el estado.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setIsSubmittingReport(true);
    setReportError(null);
    try {
      await submitOfferReport({
        offerId: offer.id,
        reason: reportReason,
        description: reportDescription,
        reporterContact: reporterContact || undefined,
      });
      setReportSuccess(true);
      setShowReportForm(false);
      setReportDescription('');
      setReporterContact('');
    } catch (err: any) {
      setReportError(err?.message || 'Error al enviar el reporte.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto modal-scroll shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-150">
        {/* Header — matches NeedDetailModal */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
              <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                Oferta de ayuda
              </span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${verificationInfo.badgeClass}`}>
                {verificationInfo.icon} {verificationInfo.label}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-snug pt-1">{offer.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className={`p-5 space-y-5 text-sm ${isInactive ? 'opacity-50' : ''}`}>
          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
              Descripción de la oferta
            </h4>
            <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {offer.description}
            </p>
          </div>

          {/* Resources */}
          {offer.resources && offer.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                ¿Qué ofrecen?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {offer.resources.map((res) => {
                  const total = res.quantity || 0;
                  const fulfilled = res.fulfilledQuantity || 0;
                  const percentage = total > 0 ? Math.min(100, Math.round((fulfilled / total) * 100)) : 0;

                  return (
                    <div key={res.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span>{CATEGORY_LABELS[res.type]?.icon || '🔹'}</span>
                          <span>{res.description || CATEGORY_LABELS[res.type]?.label || res.type}</span>
                        </span>
                      </div>

                      {total > 0 && fulfilled > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>Cobertura:</span>
                            <strong className="text-slate-900">
                              {fulfilled} de {total} {res.unit || ''} ({percentage}%)
                            </strong>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      ) : total > 0 ? (
                        <span className="text-xs text-slate-600 font-medium">
                          Disponibles: {total} {res.unit || 'unidades'}
                        </span>
                      ) : (
                        <span className="text-xs text-blue-800 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                          Recurso disponible
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {offer.categories && offer.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {offer.categories.map((c) => (
                <span key={c} className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 flex items-center gap-1">
                  <span>{CATEGORY_LABELS[c]?.icon || '🔹'}</span>
                  <span>{CATEGORY_LABELS[c]?.label || c}</span>
                </span>
              ))}
            </div>
          )}

          {/* Location & Hours — same layout as NeedDetailModal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Ubicación
              </span>
              <p className="font-bold text-slate-900 text-sm">{offer.address}</p>
              <p className="text-xs text-slate-600">Barrio: {offer.neighborhood}</p>
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
                {offer.operatingHours || 'Consultar disponibilidad con el contacto'}
              </p>
              {offer.organizationName && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>Organización: {offer.organizationName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Verification info */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nivel de Verificación: {verificationInfo.label}</span>
            </div>
            {offer.verifiedBy && (
              <p><strong>Verificado por:</strong> {offer.verifiedBy}</p>
            )}
            <p className="text-slate-500 text-[11px] pt-0.5">
              Última actualización: {new Date(offer.updatedAt).toLocaleString('es-CO')} ({formatTimeAgo(offer.updatedAt)})
            </p>
          </div>

          {/* Contact Direct Buttons */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Contacto directo con el responsable
            </h4>
            <p className="text-sm font-semibold text-slate-900">{offer.contactName}</p>
            <div className="flex flex-wrap gap-2">
              {offer.contactWhatsapp && (
                <a
                  href={`https://wa.me/${offer.contactWhatsapp.replace(/[^0-9]/g, '').replace(/^(3\d{9})$/, '57$1')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                </a>
              )}
              {offer.contactPhone && (
                <a
                  href={`tel:${offer.contactPhone}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Llamar por teléfono</span>
                </a>
              )}
              {offer.contactEmail && (
                <a
                  href={`mailto:${offer.contactEmail}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar correo</span>
                </a>
              )}
            </div>
          </div>

          {/* Inline Status Update (shown via "Actualizar info" action) */}
          {showStatusUpdate && !isClosed && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                Actualizar estado de la oferta
              </h4>
              <div className="space-y-4">
                {(!offer.resources || offer.resources.length === 0) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                    <select
                      value={selectedStatus || offer.offerStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as OfferStatus)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs"
                    >
                      {OFFER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {offer.resources && offer.resources.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Recursos</label>
                    <div className="space-y-2">
                      {offer.resources.map((res) => (
                        <div key={res.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 min-w-0">
                            <span>{CATEGORY_LABELS[res.type]?.icon || '🔹'}</span>
                            <span className="truncate">{res.description || CATEGORY_LABELS[res.type]?.label || res.type}</span>
                          </div>
                          <select
                            value={resourceStatuses[res.id] || 'PENDING'}
                            onChange={(e) => setResourceStatuses((prev) => ({ ...prev, [res.id]: e.target.value as ResourceItemStatus }))}
                            className="p-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium shrink-0"
                          >
                            {RESOURCE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    {autoComputedStatus && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>El estado se ajustará automáticamente a: <strong>{AUTO_STATUS_LABELS[autoComputedStatus] || autoComputedStatus}</strong></span>
                      </div>
                    )}
                  </div>
                )}
                {statusSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-2.5 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Estado actualizado correctamente.</span>
                  </div>
                )}
                {statusError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{statusError}</span>
                  </div>
                )}
                <button
                  onClick={handleSubmitStatusUpdate}
                  disabled={isSubmittingStatus}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingStatus ? 'Guardando...' : 'Guardar cambios'}</span>
                </button>
              </div>
            </div>
          )}

          {isClosed && showStatusUpdate && (
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-sm text-slate-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>Esta oferta está cerrada y no se puede reactivar.</span>
            </div>
          )}

          {/* Inline Report Form */}
          {showReportForm && (
            <div className="border-t border-slate-200 pt-5">
              <form onSubmit={handleSubmitReport} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Flag className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-slate-900 text-sm">Reportar esta oferta</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">¿Cuál es el problema?</label>
                  <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs">
                    {REPORT_REASONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detalle del reporte *</label>
                  <textarea required rows={3} value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="Ej: Fuimos al lugar y nos indicaron que ya no están ofreciendo este recurso..." className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tu contacto (opcional)</label>
                  <input type="text" value={reporterContact} onChange={(e) => setReporterContact(e.target.value)} placeholder="Teléfono o correo" className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowReportForm(false)} className="px-3 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg text-xs">Cancelar</button>
                  <button type="submit" disabled={isSubmittingReport || !reportDescription.trim()} className="bg-rose-700 hover:bg-rose-800 disabled:bg-slate-300 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all">
                    <Send className="w-3.5 h-3.5" /><span>Enviar reporte</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {reportSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Reporte enviado a moderación. Gracias por ayudar a mantener limpia la información.</span>
            </div>
          )}
          {reportError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{reportError}</span>
            </div>
          )}
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

        {/* Footer Actions — matches NeedDetailModal pattern */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isAdmin && onAdminEditOffer && (
              <>
                <button
                  onClick={() => { onClose(); onAdminEditOffer(offer); }}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold underline flex items-center gap-1"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Editar publicación</span>
                </button>
                <span className="text-slate-300">•</span>
              </>
            )}
            <button
              onClick={() => { setShowReportForm(true); setShowStatusUpdate(false); }}
              className="text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Reportar problema</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                if (onOpenPublicEdit) {
                  onClose();
                  onOpenPublicEdit(offer);
                } else {
                  setShowStatusUpdate(true);
                  setShowReportForm(false);
                }
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Actualizar info</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 border border-slate-300 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
