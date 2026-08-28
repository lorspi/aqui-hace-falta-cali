/**
 * conversationDetailUtils.ts — Lógica pura de la pantalla de detalle de un
 * reporte del chatbot (US-6)
 *
 * Módulo SIN dependencias de React ni de Supabase (lógica pura testeable con
 * vitest, convención NFR-4 del proyecto). `useConversationDetail` reutiliza
 * estos helpers.
 *
 * La pantalla consume `GET /needs/{id}/conversation` (US-3 / DEV-42) y NO
 * interpreta `raw_event`: recibe mensajes ya normalizados al formato uniforme
 * (`sender`, `content`, `type` canónico, `attachments`, `received_at`,
 * `event_id`) y los datos ya mapeados del incidente (`need`).
 *
 * Escenarios Gherkin US-6 cubiertos por este módulo:
 *   - Orden cronológico de los mensajes (`received_at` ascendente, tiebreak por
 *     `event_id` para un orden determinista).
 *   - Distinción visual entrante/saliente comparando `sender` contra
 *     `contact_whatsapp` del need (ciudadano) vs. el remitente del bot/equipo
 *     de conversación. Un `sender` ausente se muestra como remitente neutro.
 *   - Fotos renderizadas: un adjunto de imagen con URL válida se considera
 *     renderizable; sin URL válida se muestra con placeholder (no rompe la
 *     burbuja).
 *   - Ubicaciones renderizadas: con coordenadas → mapa; sin coordenadas pero
 *     con address → tarjeta con la dirección (sin mapa vacío).
 *   - Deduplicación defensiva por `event_id` (la capa de ingestión ya deduplica
 *     con UNIQUE event_id; aquí se garantiza que cada event.id aparezca una
 *     sola vez en el chat).
 *   - Tolerancia a datos incompletos: `sender` nulo, contenido por defecto y
 *     `message_type` UNKNOWN se muestran de forma genérica sin romper el chat.
 */
import type { TranslationKey } from '../i18n/translations';

// -----------------------------------------------------------------------------
// Tipos del contrato US-3 (GET /needs/{id}/conversation)
// -----------------------------------------------------------------------------

/** message_type canónico (S3): TEXT/IMAGE/AUDIO/VIDEO/DOCUMENT/LOCATION/UNKNOWN. */
export type CanonicalMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'UNKNOWN';

/** Adjunto de un mensaje (imagen y/o ubicación). Viaja dentro del raw_event. */
export interface ConversationAttachment {
  type: 'image' | 'location';
  /** URL del adjunto de imagen (solo image). */
  url?: string;
  /** MIME del adjunto de imagen (solo image). */
  mime?: string;
  /** Latitud del adjunto de ubicación (solo location). */
  latitude?: number;
  /** Longitud del adjunto de ubicación (solo location). */
  longitude?: number;
  /** Dirección del adjunto de ubicación (solo location). */
  address?: string;
}

/** Mensaje normalizado al formato uniforme del contrato US-3. */
export interface ConversationMessage {
  /** event.id del evento crudo (trazabilidad). */
  event_id: string;
  /** data.from del mensaje, o null cuando no está presente. */
  sender: string | null;
  /** Contenido del mensaje (body/data.body) o un contenido por defecto. */
  content: string;
  /** message_type canónico (S3); string por compatibilidad con el contrato US-3. */
  type: string;
  /** Adjuntos extraídos del raw_event (imagen y/o ubicación). */
  attachments: ConversationAttachment[];
  /** received_at de la fila de ingest_responses (orden cronológico). */
  received_at: string;
}

/** Datos estructurados del incidente (need) que la pantalla muestra. */
export interface ConversationNeedSummary {
  id: string;
  title: string;
  description: string;
  contact_whatsapp: string | null;
  address: string;
  neighborhood: string;
  priority: string;
  status: string;
  verification_status: string;
  conversation_id: string | null;
  source_event_id: string | null;
}

/** Respuesta de `GET /needs/{id}/conversation` (US-3). */
export interface ConversationRebuild {
  /** conversation_id de la conversación reconstruida (o null). */
  conversation_id: string | null;
  /** true cuando existe un need asociado a la conversación. */
  has_need: boolean;
  /** Datos del incidente ya mapeados, o null cuando aún no hay need. */
  need: ConversationNeedSummary | null;
  /** Mensajes normalizados en orden cronológico (received_at ascendente). */
  messages: ConversationMessage[];
}

// -----------------------------------------------------------------------------
// Vista de un mensaje en el chat
// -----------------------------------------------------------------------------

/** Dirección visual de una burbuja de chat. */
export type MessageDirection = 'incoming' | 'outgoing' | 'neutral';

/** Vista de un mensaje lista para renderizar en el chat. */
export interface ChatMessageViewModel {
  /** event.id del mensaje (clave React y trazabilidad). */
  eventId: string;
  /** Dirección de la burbuja (entrante del ciudadano / saliente del bot / neutra). */
  direction: MessageDirection;
  sender: string | null;
  content: string;
  type: string;
  attachments: ConversationAttachment[];
  receivedAt: string;
}

/**
 * Clasifica la dirección visual de un mensaje comparando `sender` contra
 * `contact_whatsapp` del need:
 *   - sender ausente/vacío        → 'neutral'  (remitente neutro).
 *   - sender === contact_whatsapp → 'incoming' (entrante del ciudadano).
 *   - sender distinto             → 'outgoing' (saliente del bot/equipo).
 */
export function classifyMessageDirection(
  sender: string | null,
  contactWhatsapp: string | null,
): MessageDirection {
  if (!sender || sender.trim().length === 0) return 'neutral';
  if (contactWhatsapp && contactWhatsapp.trim().length > 0 && sender.trim() === contactWhatsapp.trim()) {
    return 'incoming';
  }
  return 'outgoing';
}

/** Compara dos timestamps (Date.parse tolerante). */
function compareTimestamps(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isFinite(ta) && Number.isFinite(tb)) {
    if (ta !== tb) return ta - tb;
    return 0;
  }
  return a.localeCompare(b);
}

/**
 * Ordena los mensajes en orden cronológico (`received_at` ascendente, tiebreak
 * por `event_id`). No muta el array de entrada.
 */
export function sortConversationMessages(
  messages: ConversationMessage[],
): ConversationMessage[] {
  return [...messages].sort((a, b) => {
    const t = compareTimestamps(a.received_at, b.received_at);
    if (t !== 0) return t;
    return a.event_id.localeCompare(b.event_id);
  });
}

/**
 * Deduplicación defensiva por `event_id`: cada event.id aparece una sola vez en
 * el chat (la capa de ingestión ya deduplicó con UNIQUE event_id; esta garantía
 * evita burbujas duplicadas si el contrato llegara a repetir filas).
 */
export function dedupeConversationMessages(
  messages: ConversationMessage[],
): ConversationMessage[] {
  const seen = new Set<string>();
  const result: ConversationMessage[] = [];
  for (const m of messages) {
    if (seen.has(m.event_id)) continue;
    seen.add(m.event_id);
    result.push(m);
  }
  return result;
}

/**
 * Arma las vistas de chat listas para renderizar: orden cronológico +
 * deduplicación por event.id + dirección visual.
 */
export function buildChatMessages(
  rebuild: ConversationRebuild,
): ChatMessageViewModel[] {
  const contact = rebuild.need?.contact_whatsapp ?? null;
  const ordered = sortConversationMessages(rebuild.messages ?? []);
  const deduped = dedupeConversationMessages(ordered);
  return deduped.map((m) => ({
    eventId: m.event_id,
    direction: classifyMessageDirection(m.sender, contact),
    sender: m.sender,
    content: m.content,
    type: m.type,
    attachments: m.attachments ?? [],
    receivedAt: m.received_at,
  }));
}

// -----------------------------------------------------------------------------
// Adjuntos (fotos y ubicaciones)
// -----------------------------------------------------------------------------

/** `true` cuando un adjunto de imagen tiene una URL renderizable. */
export function isValidImageAttachment(
  attachment: ConversationAttachment,
): boolean {
  if (attachment.type !== 'image') return false;
  if (!attachment.url || attachment.url.trim().length === 0) return false;
  return /^https?:\/\/.+$/i.test(attachment.url.trim());
}

/** `true` cuando un adjunto de ubicación tiene coordenadas válidas. */
export function isLocationWithCoordinates(
  attachment: ConversationAttachment,
): boolean {
  if (attachment.type !== 'location') return false;
  return (
    typeof attachment.latitude === 'number' &&
    Number.isFinite(attachment.latitude) &&
    typeof attachment.longitude === 'number' &&
    Number.isFinite(attachment.longitude)
  );
}

/** `true` cuando un adjunto de ubicación tiene al menos una dirección legible. */
export function isLocationWithAddress(
  attachment: ConversationAttachment,
): boolean {
  return (
    attachment.type === 'location' &&
    !!attachment.address &&
    attachment.address.trim().length > 0
  );
}

// -----------------------------------------------------------------------------
// Panel de validación
// -----------------------------------------------------------------------------

/** Datos de ubicación/enriquecimiento del need que alimentan el panel. */
export interface NeedLocationInfo {
  /** Estado de enriquecimiento de ubicación (US-5/DEV-44). */
  locationEnrichmentStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * `true` cuando el need aún no fue geolocalizado
 * (`location_enrichment_status = PENDING`). En ese caso el panel NO muestra un
 * mapa vacío: indica que la ubicación aún no fue geolocalizada.
 */
export function isLocationPending(info: NeedLocationInfo | null | undefined): boolean {
  if (!info) return false;
  return (info.locationEnrichmentStatus || '').toUpperCase() === 'PENDING';
}

/**
 * `true` cuando el need tiene la ubicación resuelta (`location_enrichment_status
 * = RESOLVED`) y coordenadas válidas (mapa renderizable en el panel).
 */
export function hasResolvedCoordinates(info: NeedLocationInfo | null | undefined): boolean {
  if (!info) return false;
  if ((info.locationEnrichmentStatus || '').toUpperCase() !== 'RESOLVED') return false;
  return (
    typeof info.latitude === 'number' &&
    Number.isFinite(info.latitude) &&
    typeof info.longitude === 'number' &&
    Number.isFinite(info.longitude)
  );
}

/** Etiqueta de remitente legible para una burbuja (clave de traducción). */
export function senderLabelKey(
  direction: MessageDirection,
): TranslationKey {
  switch (direction) {
    case 'incoming':
      return 'conversationSenderCitizen';
    case 'outgoing':
      return 'conversationSenderBot';
    case 'neutral':
    default:
      return 'conversationSenderNeutral';
  }
}
