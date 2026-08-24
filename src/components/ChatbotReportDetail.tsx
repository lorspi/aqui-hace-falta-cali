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
  /** Volver al listado de reportes. */
  onClose: () => void;
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
  onClose,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<DetailState>({ kind: 'loading' });
  const [tab, setTab] = useState<'chat' | 'need'>('chat');

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
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
