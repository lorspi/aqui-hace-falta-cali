/**
 * ChatbotReportDetail — Pantalla de detalle de un reporte del chatbot (US-6)
 *
 * Al abrir el detalle de un need, esta pantalla consulta el endpoint de
 * reconstrucción de conversación (`GET /needs/{id}/conversation`, US-3 /
 * DEV-42) y muestra:
 *   - El chat en orden cronológico, diferenciando mensajes entrantes
 *     (ciudadano) de salientes (bot/equipo de conversación).
 *   - Las fotos y ubicaciones renderizadas (imagen / mapa o tarjeta), NO como
 *     texto ni enlace crudo.
 *   - En un panel separado, los campos ya mapeados por el receptor:
 *     `contact_whatsapp`, `address`, `neighborhood`, `title`, `description`,
 *     `priority` y `verification_status`.
 *
 * La pantalla NO interpreta `raw_event`: consume el formato uniforme del
 * endpoint US-3 (`sender`, `content`, `type` canónico, `attachments`,
 * `received_at`, `event_id`). La distinción entrante/saliente se resuelve
 * comparando `sender` contra `contact_whatsapp` del need.
 *
 * Criterios de aceptación cubiertos:
 *   - Estados de carga / error (need inexistente o fallo de red) / sin
 *     incidente asociado (has_need=false) / vacío.
 *   - `location_enrichment_status = PENDING` → el panel indica que la ubicación
 *     aún no fue geolocalizada (no muestra un mapa vacío).
 *   - Mensajes sin `sender`, sin contenido o con `message_type` desconocido se
 *     muestran de forma tolerante (remitente neutro, contenido por defecto,
 *     estilo genérico).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Inbox,
  RefreshCw,
  Phone,
  MapPin,
  MessageSquare,
  Hash,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  Bot,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  fetchConversationByNeedId,
  type ConversationRebuild,
} from '../lib/supabaseService';
import {
  buildChatMessages,
  isValidImageAttachment,
  isLocationWithCoordinates,
  isLocationWithAddress,
  isLocationPending,
  hasResolvedCoordinates,
  senderLabelKey,
  type ChatMessageViewModel,
  type ConversationAttachment,
} from '../utils/conversationDetailUtils';
import {
  reviewNeed,
  ReviewNeedError,
  type ReviewDecisionInput,
} from '../lib/reviewService';
import {
  isReviewable,
  resolveVerifiedBy,
  type ReviewOperator,
} from '../utils/reviewUtils';
import { PRIORITY_CONFIG, VERIFICATION_CONFIG } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

/** Datos de ubicación del need que alimentan el panel (desde el listado US-5). */
export interface NeedLocationInfo {
  locationEnrichmentStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ChatbotReportDetailProps {
  /** id del need a mostrar. */
  needId: string;
  /** Datos de ubicación/enriquecimiento del need (opcional; desde el listado). */
  need?: NeedLocationInfo | null;
  /**
   * Operador autenticado en el panel (rol MODERATOR/ADMIN). Se usa para
   * identificar al revisor (`verified_by`) en las acciones de aprobar/rechazar
   * (US-7). Cuando no se provee, se intenta resolver desde la sesión del panel
   * (`localStorage` `ahf_admin_user`).
   */
  operator?: ReviewOperator | null;
  /** Volver al listado de reportes. */
  onClose: () => void;
}

/** Etiqueta legible del revisor (quién revisó) tolerante a datos ausentes. */
function reviewedByLabel(t: (k: TranslationKey) => string, value?: string | null): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return t('reviewNotAvailable');
}

/** Etiqueta legible de la fecha de revisión (cuándo) tolerante a datos ausentes. */
function reviewedAtLabel(t: (k: TranslationKey) => string, value?: string | null): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // Fallo de formato: se muestra el valor crudo o "no disponible".
    }
    return value;
  }
  return t('reviewNotAvailable');
}

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error'; code?: string; message: string }
  | { kind: 'ready'; rebuild: ConversationRebuild };

/** URL de un mapa estático embebido (OpenStreetMap) centrado en las coordenadas. */
function osmEmbedUrl(lat: number, lng: number): string {
  const d = 0.004;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

/** Etiqueta legible del message_type canónico (S3). */
function messageTypeLabelKey(type: string): TranslationKey {
  switch (type) {
    case 'TEXT':
      return 'conversationMessageTypeTEXT';
    case 'IMAGE':
      return 'conversationMessageTypeIMAGE';
    case 'AUDIO':
      return 'conversationMessageTypeAUDIO';
    case 'VIDEO':
      return 'conversationMessageTypeVIDEO';
    case 'DOCUMENT':
      return 'conversationMessageTypeDOCUMENT';
    case 'LOCATION':
      return 'conversationMessageTypeLOCATION';
    default:
      return 'conversationMessageTypeUNKNOWN';
  }
}

/** Burbuja de imagen renderizada (con placeholder si la URL no es válida). */
function ImageAttachmentView({ attachment }: { attachment: ConversationAttachment }) {
  const { t } = useTranslation();
  if (isValidImageAttachment(attachment)) {
    return (
      <div className="mt-2">
        <img
          src={attachment.url}
          alt={t('conversationAttachmentImage')}
          loading="lazy"
          className="rounded-lg max-h-64 w-full object-cover border border-slate-200"
        />
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 bg-slate-100/70 border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500">
      <ImageIcon className="w-4 h-4 shrink-0" />
      <span>{t('conversationAttachmentImagePlaceholder')}</span>
    </div>
  );
}

/** Tarjeta/mapa de ubicación de un mensaje. */
function LocationAttachmentView({ attachment }: { attachment: ConversationAttachment }) {
  const { t } = useTranslation();
  const hasCoords = isLocationWithCoordinates(attachment);
  const hasAddress = isLocationWithAddress(attachment);

  if (hasCoords) {
    const lat = attachment.latitude as number;
    const lng = attachment.longitude as number;
    return (
      <div className="mt-2 space-y-1.5">
        <div className="rounded-lg overflow-hidden border border-slate-200 h-36">
          <iframe
            title={t('conversationAttachmentLocation')}
            src={osmEmbedUrl(lat, lng)}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        {hasAddress && (
          <p className="text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="font-medium">{attachment.address}</span>
          </p>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          {t('conversationAttachmentMapLink')}
        </a>
      </div>
    );
  }

  if (hasAddress) {
    return (
      <div className="mt-2 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
        <MapPin className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="font-bold">{t('conversationAttachmentLocation')}</p>
          <p className="text-slate-600">{attachment.address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
      <MapPin className="w-4 h-4 shrink-0" />
      <span>{t('conversationAttachmentLocationNoCoords')}</span>
    </div>
  );
}

/** Burbuja de un mensaje del chat. */
function MessageBubble({ view }: { view: ChatMessageViewModel }) {
  const { t } = useTranslation();
  const isIncoming = view.direction === 'incoming';
  const isOutgoing = view.direction === 'outgoing';
  const isNeutral = view.direction === 'neutral';

  const bubbleClass = isOutgoing
    ? 'bg-emerald-600 text-white'
    : isIncoming
      ? 'bg-white text-slate-900 border border-slate-200'
      : 'bg-slate-200 text-slate-700';

  const containerClass = isOutgoing ? 'justify-end' : 'justify-start';

  const senderLabel = view.sender || t('conversationSenderUnknown');
  const directionLabel = t(senderLabelKey(view.direction));

  return (
    <div className={`flex ${containerClass}`}>
      <div className={`max-w-[85%] sm:max-w-[75%]`}>
        {/* Remitente + tipo */}
        <div
          className={`flex items-center gap-1.5 text-[10px] mb-1 font-semibold uppercase tracking-wider ${
            isOutgoing ? 'text-emerald-700/80 justify-end' : 'text-slate-400'
          }`}
        >
          {isIncoming && <User className="w-3 h-3" />}
          {isOutgoing && <Bot className="w-3 h-3" />}
          <span title={senderLabel}>{directionLabel}</span>
          {view.type !== 'TEXT' && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                isOutgoing ? 'bg-emerald-700/30 text-emerald-50' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {t(messageTypeLabelKey(view.type))}
            </span>
          )}
        </div>

        {/* Burbuja */}
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${bubbleClass}`}>
          {view.type === 'IMAGE' ? (
            <div>
              {view.content && view.content.trim().length > 0 && (
                <p className={isOutgoing ? 'text-emerald-50' : 'text-slate-800'}>{view.content}</p>
              )}
              {view.attachments
                .filter((a) => a.type === 'image')
                .map((a, i) => (
                  <ImageAttachmentView key={`${view.eventId}-img-${i}`} attachment={a} />
                ))}
              {view.attachments.every((a) => a.type !== 'image') && (
                <p className="italic opacity-80">{t('conversationAttachmentImage')}</p>
              )}
            </div>
          ) : view.type === 'LOCATION' ? (
            <div>
              {view.content && view.content.trim().length > 0 && (
                <p className={isOutgoing ? 'text-emerald-50' : 'text-slate-800'}>{view.content}</p>
              )}
              {view.attachments
                .filter((a) => a.type === 'location')
                .map((a, i) => (
                  <LocationAttachmentView key={`${view.eventId}-loc-${i}`} attachment={a} />
                ))}
            </div>
          ) : view.type === 'UNKNOWN' ? (
            <div>
              <p className={isOutgoing ? 'text-emerald-50' : 'text-slate-800'}>
                {view.content || t('conversationMessageGeneric')}
              </p>
            </div>
          ) : (
            <p className={isOutgoing ? 'text-emerald-50' : 'text-slate-800'}>
              {view.content || t('conversationMessageGeneric')}
            </p>
          )}
        </div>

        {/* Hora */}
        <div
          className={`text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 ${
            isOutgoing ? 'justify-end' : ''
          }`}
        >
          <Clock className="w-2.5 h-2.5" />
          <span>{formatTime(view.receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/** Formatea un timestamp ISO de forma local y legible. */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Pantalla de detalle del reporte del chatbot. Se monta dentro del panel de
 * moderación (tab "chatbot") reemplazando al listado mientras está abierta.
 */
export const ChatbotReportDetail: React.FC<ChatbotReportDetailProps> = ({
  needId,
  need,
  operator,
  onClose,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<DetailState>({ kind: 'loading' });
  const [tab, setTab] = useState<'chat' | 'need'>('chat');
  // Estado de la decisión de revisión (US-7): decisión en curso (evita doble
  // clic), error y éxito. `reviewed` guarda el need actualizado que devuelve el
  // endpoint de US-4 para reflejar el nuevo estado sin recargar la pantalla.
  const [reviewState, setReviewState] = useState<{
    busy: boolean;
    error: string | null;
    reviewed: { verification_status: string; verified_by?: string | null; verified_at?: string | null; verification_notes?: string | null } | null;
  }>({ busy: false, error: null, reviewed: null });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    setReviewState({ busy: false, error: null, reviewed: null });
    try {
      const rebuild = await fetchConversationByNeedId(needId);
      setState({ kind: 'ready', rebuild });
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      setState({
        kind: 'error',
        code,
        message: (err as Error).message || 'Error al cargar la conversación.',
      });
    }
  }, [needId]);

  useEffect(() => {
    load();
  }, [load]);

  const chatViews = useMemo(() => {
    if (state.kind !== 'ready') return [];
    return buildChatMessages(state.rebuild);
  }, [state]);

  const isNeedNotFound = state.kind === 'error' && state.code === 'need_not_found';

  // ---------------------------------------------------------------------------
  // Acciones de aprobar / rechazar (US-7)
  // ---------------------------------------------------------------------------

  /** Muestra un mensaje de error claro según el code del endpoint de US-4. */
  const reviewErrorMessage = useCallback((err: unknown): string => {
    if (err instanceof ReviewNeedError) {
      switch (err.code) {
        case 'missing_operator':
          return t('reviewMissingOperator');
        case 'invalid_verification_status':
          return t('reviewInvalidStatus');
        case 'need_not_found':
          return t('conversationDetailNeedNotFound');
        case 'network_error':
        case 'config_missing':
        case 'review_failed':
        default:
          return `${t('reviewUnknownError')} ${err.message || ''}`.trim();
      }
    }
    return t('reviewUnknownError');
  }, [t]);

  // Rebuild disponible cuando la pantalla está en estado ready (acceso seguro
  // al need del contrato US-3 sin romper el narrowing de la unión `DetailState`).
  const readyRebuild = state.kind === 'ready' ? state.rebuild : null;

  /** Ejecuta la decisión "aprobar" o "rechazar" llamando al endpoint US-4. */
  const handleReview = useCallback(
    async (decision: ReviewDecisionInput) => {
      // El estado del need: el del rebuild (US-3) o el del resultado de una
      // revisión reciente (US-4).
      const currentStatus =
        reviewState.reviewed?.verification_status ??
        readyRebuild?.need?.verification_status ??
        null;
      // El reporte ya fue revisado (por otro operador o por un reintento
      // posterior): no se permite una segunda decisión.
      if (!isReviewable(currentStatus)) return;
      // Evita duplicar la llamada si ya hay una petición en curso.
      if (reviewState.busy) return;

      const verifiedBy = resolveVerifiedBy(operator);
      if (!verifiedBy) {
        setReviewState((s) => ({ ...s, error: t('reviewMissingOperator') }));
        return;
      }

      setReviewState((s) => ({ ...s, busy: true, error: null }));
      try {
        const result = await reviewNeed({
          needId,
          decision,
          verifiedBy,
        });
        setReviewState((s) => ({
          busy: false,
          error: null,
          reviewed: {
            verification_status: result.need.verification_status,
            verified_by: result.need.verified_by,
            verified_at: result.need.verified_at,
            verification_notes: result.need.verification_notes,
          },
        }));
      } catch (err) {
        // El need conserva verification_status = PENDING_VERIFICATION; el
        // operador puede reintentar la decisión.
        setReviewState((s) => ({
          ...s,
          busy: false,
          error: reviewErrorMessage(err),
        }));
      }
    },
    [readyRebuild, reviewState.busy, reviewState.reviewed, operator, needId, t, reviewErrorMessage],
  );

  const handleApprove = useCallback(() => {
    void handleReview('aprobar');
  }, [handleReview]);

  const handleReject = useCallback(() => {
    void handleReview('rechazar');
  }, [handleReview]);

  // Estado efectivo del need: si el operador acaba de aprobar/rechazar, la
  // respuesta del endpoint (US-4) manda; si no, el estado del listado/rebuild.
  const effectiveNeed = useMemo(() => {
    if (readyRebuild?.need == null) return null;
    if (reviewState.reviewed) {
      return {
        ...readyRebuild.need,
        verification_status: reviewState.reviewed.verification_status,
        verified_by: reviewState.reviewed.verified_by ?? readyRebuild.need.verified_by ?? null,
        verified_at: reviewState.reviewed.verified_at ?? readyRebuild.need.verified_at ?? null,
        verification_notes:
          reviewState.reviewed.verification_notes ?? readyRebuild.need.verification_notes ?? null,
      };
    }
    return readyRebuild.need;
  }, [readyRebuild, reviewState.reviewed]);

  const canReview = effectiveNeed !== null && isReviewable(effectiveNeed.verification_status);
  const isProcessing = reviewState.busy;

  // ---------------------------------------------------------------
  // Cabecera común (vuelve al listado)
  // ---------------------------------------------------------------
  const header = (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <button
        onClick={onClose}
        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label={t('conversationDetailBack')}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
        <MessageSquare className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
          {t('conversationDetailTitle')}
          {state.kind === 'ready' && state.rebuild.need && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {state.rebuild.need.priority}
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-500 truncate">{t('conversationDetailTagline')}</p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------
  // Estados de carga / error
  // ---------------------------------------------------------------
  if (state.kind === 'loading') {
    return (
      <div className="space-y-4">
        {header}
        <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>{t('conversationDetailLoading')}</span>
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-4">
        {header}
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">
            {isNeedNotFound ? t('conversationDetailNeedNotFound') : t('conversationDetailError')}
          </h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {isNeedNotFound ? t('conversationDetailNeedNotFoundHint') : t('conversationDetailErrorHint')}
          </p>
          {!isNeedNotFound && state.message && (
            <p className="text-[10px] text-slate-400 font-mono max-w-sm mx-auto truncate" data-testid="detail-error-message">
              {state.message}
            </p>
          )}
          {!isNeedNotFound && (
            <button
              onClick={load}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('conversationDetailRetry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const { rebuild } = state;
  const hasNoIncident = !rebuild.has_need || !rebuild.need;

  // ---------------------------------------------------------------
  // Cuerpo listo
  // ---------------------------------------------------------------
  return (
    <div className="space-y-4">
      {header}

      {/* Aviso de conversación sin incidente asociado */}
      {hasNoIncident && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold">{t('conversationDetailNoIncident')}</p>
            <p className="text-amber-800/90">{t('conversationDetailNoIncidentHint')}</p>
          </div>
        </div>
      )}

      {/* Panel de revisión (US-7): acciones aprobar/rechazar + trazabilidad */}
      {effectiveNeed && (
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3"
          data-testid="review-actions-panel"
        >
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {t('reviewActionsTitle')}
          </h4>

          {canReview ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('reviewActionsPendingHint')}
              </p>

              {reviewState.error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2"
                  data-testid="review-error"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{reviewState.error}</p>
                    <p className="text-red-600/80">{t('reviewRetryHint')}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  data-testid="review-approve"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {isProcessing ? t('reviewActionsProcessing') : t('reviewApproveAction')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  data-testid="review-reject"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {isProcessing ? t('reviewActionsProcessing') : t('reviewRejectAction')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 font-semibold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t('reviewAlreadyReviewed')}
              </p>

              {/* Trazabilidad: quién y cuándo revisó (tolerante a datos ausentes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {t('reviewVerifiedBy')}
                  </p>
                  <p className="font-bold text-slate-900 text-sm" data-testid="review-verified-by">
                    {reviewedByLabel(t, effectiveNeed.verified_by)}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('reviewVerifiedAt')}
                  </p>
                  <p className="font-bold text-slate-900 text-sm" data-testid="review-verified-at">
                    {reviewedAtLabel(t, effectiveNeed.verified_at)}
                  </p>
                </div>
              </div>

              {effectiveNeed.verification_notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {t('reviewNotesLabel')}
                  </p>
                  <p className="text-sm text-slate-700" data-testid="review-notes">
                    {effectiveNeed.verification_notes}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setTab('chat')}
          className={`px-3 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
            tab === 'chat'
              ? 'bg-white text-emerald-600 border-t-2 border-emerald-600'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {t('conversationDetailChatTab')}
          {chatViews.length > 0 && (
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-1.5 rounded-full">
              {chatViews.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('need')}
          className={`px-3 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
            tab === 'need'
              ? 'bg-white text-emerald-600 border-t-2 border-emerald-600'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {t('conversationDetailNeedTab')}
        </button>
      </div>

      {tab === 'chat' ? (
        /* ------------------------------------------------ CHAT --- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t('conversationDetailRawNotShown')}
            </p>
          </div>

          {chatViews.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500 font-medium">{t('conversationDetailEmpty')}</p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-4 max-h-[560px] overflow-y-auto bg-slate-100/60">
              {chatViews.map((view) => (
                <MessageBubble key={view.eventId} view={view} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------- PANEL NEED --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Campos clave del incidente */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider text-slate-500">
              {t('conversationDetailNeedTab')}
            </h4>

            {rebuild.need ? (
              <>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {t('conversationNeedTitle')}
                  </p>
                  <p className="font-bold text-slate-900">{rebuild.need.title || '—'}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {t('conversationNeedDescription')}
                  </p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                    {rebuild.need.description || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {t('conversationNeedContact')}
                    </p>
                    <p className="font-bold text-slate-900 font-mono text-sm">
                      {rebuild.need.contact_whatsapp || (
                        <span className="text-slate-400 italic font-normal">{t('conversationNoContact')}</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t('conversationNeedAddress')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{rebuild.need.address || '—'}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('conversationNeedNeighborhood')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{rebuild.need.neighborhood || '—'}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('conversationNeedPriority')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      {PRIORITY_CONFIG[rebuild.need.priority as keyof typeof PRIORITY_CONFIG]?.dot || '•'}{' '}
                      {PRIORITY_CONFIG[rebuild.need.priority as keyof typeof PRIORITY_CONFIG]?.label || rebuild.need.priority}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('conversationNeedVerification')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">
                      {VERIFICATION_CONFIG[rebuild.need.verification_status as keyof typeof VERIFICATION_CONFIG]?.icon || '•'}{' '}
                      {VERIFICATION_CONFIG[rebuild.need.verification_status as keyof typeof VERIFICATION_CONFIG]?.label || rebuild.need.verification_status}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {t('conversationNeedStatus')}
                    </p>
                    <p className="font-bold text-slate-900 text-sm">{rebuild.need.status || '—'}</p>
                  </div>
                </div>

                {/* Trazabilidad */}
                {(rebuild.need.conversation_id || rebuild.need.source_event_id) && (
                  <div className="border-t border-slate-100 pt-3 space-y-1 text-[11px] text-slate-400 font-mono">
                    {rebuild.need.conversation_id && (
                      <p className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3" />
                        {t('conversationNeedConversation')}: {rebuild.need.conversation_id}
                      </p>
                    )}
                    {rebuild.need.source_event_id && (
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" />
                        {t('conversationNeedSourceEvent')}: {rebuild.need.source_event_id}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-500 text-sm">{t('conversationDetailNoIncident')}</div>
            )}
          </div>

          {/* Ubicación del incidente */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 h-fit">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {t('conversationNeedAddress')}
            </h4>

            {(() => {
              const info: NeedLocationInfo = {
                locationEnrichmentStatus: need?.locationEnrichmentStatus ?? null,
                latitude: need?.latitude ?? null,
                longitude: need?.longitude ?? null,
              };
              const pending = isLocationPending(info);
              const resolved = hasResolvedCoordinates(info);

              if (pending) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {t('conversationLocationPending')}
                    </p>
                    <p className="text-amber-800/90">{t('conversationLocationPendingHint')}</p>
                  </div>
                );
              }

              if (resolved && typeof need?.latitude === 'number' && typeof need?.longitude === 'number') {
                return (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-40">
                      <iframe
                        title={t('conversationLocationResolved')}
                        src={osmEmbedUrl(need.latitude, need.longitude)}
                        className="w-full h-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-emerald-600">✓</span>
                        {t('conversationLocationResolved')}
                      </p>
                      {rebuild.need?.address && (
                        <p className="text-slate-600">{rebuild.need.address}</p>
                      )}
                      {rebuild.need?.neighborhood && (
                        <p className="text-slate-500">{rebuild.need.neighborhood}</p>
                      )}
                    </div>
                  </div>
                );
              }

              // Sin estado de enriquecimiento: mostramos dirección/barrio como
              // texto (nunca un mapa vacío).
              return (
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">{rebuild.need?.address || '—'}</p>
                  {rebuild.need?.neighborhood && (
                    <p className="text-slate-500 text-xs">{rebuild.need.neighborhood}</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotReportDetail;
