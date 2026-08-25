// =============================================================================
// _shared/conversation-rebuilder.ts — Reconstrucción de conversación (US-3)
// Ticket: DEV-42
//
// Módulo PURE y SIN dependencias de npm/Deno: comparte la lógica de
// reconstrucción entre la Edge Function `conversation` (Deno) y los tests
// unitarios (vitest/Node). Cumple NFR-4 (lógica pura testeable sin
// dependencias).
//
// US-3 reconstruye la conversación de un need (o de un `conversation_id` aún
// sin need asociado) para que el frontend la muestre formateada SIN interpretar
// `raw_event`:
//
//   - `normalizeMessageRow(row)` → normaliza una fila de `ingest_responses` al
//     formato uniforme de mensaje: `event_id`, `sender`, `content`, `type`
//     (message_type canónico de S3), `attachments` y `received_at`.
//   - `rebuildConversation(rows, need)` → arma la respuesta con los mensajes
//     en orden cronológico (`received_at` ascendente) + los datos ya mapeados
//     del incidente (`need`).
//
// Normalización (reutiliza la lógica de `mapEventToNeedDraft` de S3):
//   - `type` se clasifica con la MISMA normalización canónica de `message_type`
//     (`normalizeMessageType` de need-mapper): TEXT/IMAGE/AUDIO/VIDEO/DOCUMENT/
//     LOCATION/UNKNOWN. Un tipo desconocido o ausente NO invalida la fila
//     (genérico UNKNOWN).
//   - `content` y la ubicación se extraen desde el `raw_event` (body o
//     data.body), igual que S3.
//   - `sender` se toma de `data.from` cuando está presente (string no vacío).
//   - Los adjuntos viajan DENTRO del `raw_event` (no existen tablas
//     `messages`/`attachments` separadas):
//       * IMAGE  → se extrae la URL desde `data.attachments` o desde el body.
//       * LOCATION → adjunto de tipo `location` con latitude/longitude/address
//         (sin coordenadas válidas no rompe la reconstrucción).
//
// Filtrado:
//   - SOLO los eventos `message.received` se listan como mensajes del
//     ciudadano. El evento de completado NO aparece como mensaje con contenido
//     (su event.id queda en `needs.source_event_id`).
//   - Una fila con campos faltantes (sin body / sin data.from) NO se pierde:
//     se normaliza de forma tolerante (content por defecto, sender null).
//   - La deduplicación por `event.id` ya la garantiza la capa de ingestión
//     (UNIQUE event_id en `ingest_responses`, S1/S6); aquí se leen las filas
//     tal cual, sin requerir una tabla `messages` normalizada.
// =============================================================================

import {
  mapEventToNeedDraft,
  normalizeMessageType,
  type CanonicalMessageType,
} from "./need-mapper.ts";
import { type IngestResponseRecord } from "./ingest-persistence.ts";
import { type NeedRecord } from "./needs-store.ts";

// -----------------------------------------------------------------------------
// Formato uniforme de mensaje
// -----------------------------------------------------------------------------

export type MessageAttachmentType = "image" | "location";

export interface MessageAttachment {
  type: MessageAttachmentType;
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
export interface ReconstructedMessage {
  /** event.id del evento crudo (trazabilidad). */
  event_id: string;
  /** data.from del mensaje, o null cuando no está presente. */
  sender: string | null;
  /** Contenido del mensaje (body/data.body) o un contenido por defecto. */
  content: string;
  /** message_type canónico (S3): TEXT/IMAGE/AUDIO/VIDEO/DOCUMENT/LOCATION/UNKNOWN. */
  type: CanonicalMessageType;
  /** Adjuntos extraídos del raw_event (imagen y/o ubicación). */
  attachments: MessageAttachment[];
  /** received_at de la fila de ingest_responses (orden cronológico). */
  received_at: string;
}

// -----------------------------------------------------------------------------
// Resumen del incidente (datos ya mapeados en `needs`)
// -----------------------------------------------------------------------------

/** Datos estructurados del incidente que el frontend muestra sin interpretar raw_event. */
export interface NeedSummary {
  id: string;
  title: string;
  description: string;
  contact_whatsapp: string | null;
  address: string;
  neighborhood: string;
  priority: string;
  status: string;
  verification_status: string;
  // Trazabilidad de la revisión (US-4 / DEV-43): quién y cuándo aprobó o
  // rechazó. El frontend (US-7) los muestra en el detalle cuando el reporte ya
  // fue revisado; tolera su ausencia con un valor por defecto.
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  conversation_id: string | null;
  source_event_id: string | null;
}

export interface ConversationRebuild {
  /** conversation_id de la conversación reconstruida (o null). */
  conversation_id: string | null;
  /** true cuando existe un need asociado a la conversación. */
  has_need: boolean;
  /** Datos del incidente ya mapeados, o null cuando aún no hay need. */
  need: NeedSummary | null;
  /** Mensajes normalizados en orden cronológico (received_at ascendente). */
  messages: ReconstructedMessage[];
}

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

const DEFAULT_CONTENT = "Solicitud de ayuda vía WhatsApp";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** `data.from` del evento crudo (string no vacío) o null. */
function resolveSender(rawEvent: unknown): string | null {
  if (!isRecord(rawEvent)) return null;
  const data = isRecord(rawEvent.data) ? rawEvent.data : undefined;
  return isNonEmptyString(data?.from) ? (data!.from as string) : null;
}

/** Contenido tolerante desde el raw_event (misma estrategia que S3). */
function resolveContentTolerant(rawEvent: unknown): string {
  if (!isRecord(rawEvent)) return DEFAULT_CONTENT;
  const data = isRecord(rawEvent.data) ? rawEvent.data : undefined;
  const body = rawEvent.body !== undefined ? rawEvent.body : data?.body;

  if (typeof body === "string") {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_CONTENT;
  }
  if (isRecord(body)) {
    if (isNonEmptyString(body.text)) return body.text;
    if (isNonEmptyString(body.description)) return body.description;
    const json = JSON.stringify(body);
    return json && json !== "{}" ? json : DEFAULT_CONTENT;
  }
  return DEFAULT_CONTENT;
}

/** Ubicación tolerante desde el raw_event (misma estrategia que S3). */
function extractLocationTolerant(rawEvent: unknown): {
  address?: string;
  latitude?: number;
  longitude?: number;
} {
  if (!isRecord(rawEvent)) return {};
  const data = isRecord(rawEvent.data) ? (rawEvent.data as Record<string, unknown>) : undefined;
  const body = isRecord(rawEvent.body) ? (rawEvent.body as Record<string, unknown>) : undefined;
  const dataBody = data !== undefined && isRecord(data.body)
    ? (data.body as Record<string, unknown>)
    : undefined;
  const sources: Array<Record<string, unknown> | undefined> = [
    body,
    dataBody,
    data,
  ];

  let address: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;

  for (const source of sources) {
    if (!source) continue;
    address ??= isNonEmptyString(source.address) ? source.address : undefined;
    if (latitude === undefined && isFiniteNumber(source.latitude)) latitude = source.latitude;
    if (longitude === undefined && isFiniteNumber(source.longitude)) longitude = source.longitude;
  }

  return {
    ...(address !== undefined ? { address } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
  };
}

/** Detecta si un string parece una URL de media (para adjuntos de imagen). */
function looksLikeMediaUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

// -----------------------------------------------------------------------------
// Extracción de adjuntos desde el raw_event
// -----------------------------------------------------------------------------

/**
 * Extrae los adjuntos del evento crudo según el `message_type` canónico:
 *   - IMAGE: URLs desde `data.attachments` (type image) o desde el body
 *     (string URL u objeto con `url`).
 *   - LOCATION: un adjunto de tipo `location` con las coordenadas y la
 *     dirección extraídas (las coordenadas pueden faltar; no rompe nada).
 */
export function extractAttachments(
  rawEvent: unknown,
  type: CanonicalMessageType,
  location: { address?: string; latitude?: number; longitude?: number },
): MessageAttachment[] {
  const attachments: MessageAttachment[] = [];
  if (!isRecord(rawEvent)) return attachments;

  if (type === "IMAGE") {
    const data = isRecord(rawEvent.data) ? rawEvent.data : undefined;
    const listed = data?.attachments;
    if (Array.isArray(listed)) {
      for (const item of listed) {
        if (
          isRecord(item) &&
          item.type === "image" &&
          isNonEmptyString(item.url)
        ) {
          attachments.push({
            type: "image",
            url: item.url as string,
            ...(isNonEmptyString(item.mime) ? { mime: item.mime as string } : {}),
          });
        }
      }
    }
    // Fallback: URL en el body (string que parece URL u objeto con `url`).
    if (attachments.length === 0) {
      const data = isRecord(rawEvent.data) ? (rawEvent.data as Record<string, unknown>) : undefined;
      const body =
        rawEvent.body !== undefined
          ? rawEvent.body
          : data !== undefined
            ? data.body
            : undefined;
      if (typeof body === "string" && looksLikeMediaUrl(body)) {
        attachments.push({ type: "image", url: body.trim() });
      } else if (isRecord(body) && isNonEmptyString(body.url)) {
        attachments.push({
          type: "image",
          url: body.url as string,
          ...(isNonEmptyString(body.mime) ? { mime: body.mime as string } : {}),
        });
      }
    }
  }

  if (type === "LOCATION") {
    attachments.push({
      type: "location",
      ...(location.latitude !== undefined ? { latitude: location.latitude } : {}),
      ...(location.longitude !== undefined ? { longitude: location.longitude } : {}),
      ...(location.address !== undefined ? { address: location.address } : {}),
    });
  }

  return attachments;
}

// -----------------------------------------------------------------------------
// Normalización de una fila de ingest_responses
// -----------------------------------------------------------------------------

/**
 * Normaliza una fila de `ingest_responses` al formato uniforme de mensaje.
 *
 * Reutiliza `mapEventToNeedDraft` (S3): la clasificación canónica de
 * `message_type`, la extracción de contenido y la ubicación son las mismas que
 * el mapeo del webhook. Cuando la fila no cumple la validación mínima (p. ej.
 * sin body), se normaliza de forma TOLERANTE sin perder la fila (auditoría).
 *
 * Devuelve `null` para eventos que no son `message.received` (el completado no
 * se lista como mensaje del ciudadano) o cuando el `raw_event` no es un objeto.
 */
export function normalizeMessageRow(
  row: IngestResponseRecord,
): ReconstructedMessage | null {
  const raw = row.raw_event;
  if (!isRecord(raw) || raw.type !== "message.received") return null;

  const mapped = mapEventToNeedDraft(raw);

  // S3: para eventos válidos se reutiliza el borrador (misma clasificación de
  // message_type y extracción de contenido/ubicación).
  if (mapped.status === "mapped" && mapped.draft) {
    const draft = mapped.draft;
    const location = {
      address: draft.address,
      latitude: draft.latitude,
      longitude: draft.longitude,
    };
    return {
      event_id: String(row.event_id),
      sender: draft.contactWhatsapp ?? null,
      content: draft.description,
      type: draft.messageType,
      attachments: extractAttachments(raw, draft.messageType, location),
      received_at: row.received_at,
    };
  }

  // Tolerante: la fila no cumple la validación mínima (p. ej. sin body) pero NO
  // se pierde de la reconstrucción. Se conserva la clasificación canónica de S3.
  const type = normalizeMessageType(
    isRecord(raw.data) ? raw.data.message_type : undefined,
  );
  const location = extractLocationTolerant(raw);
  return {
    event_id: String(row.event_id),
    sender: resolveSender(raw),
    content: resolveContentTolerant(raw),
    type,
    attachments: extractAttachments(raw, type, location),
    received_at: row.received_at,
  };
}

// -----------------------------------------------------------------------------
// Resumen del incidente
// -----------------------------------------------------------------------------

/** Devuelve el resumen del need para la respuesta (o null si no hay need). */
export function summarizeNeed(need: NeedRecord | null): NeedSummary | null {
  if (!need) return null;
  return {
    id: need.id,
    title: need.title,
    description: need.description,
    contact_whatsapp: need.contact_whatsapp,
    address: need.address,
    neighborhood: need.neighborhood,
    priority: need.priority,
    status: need.status,
    verification_status: need.verification_status,
    verified_by: need.verified_by,
    verified_at: need.verified_at,
    verification_notes: need.verification_notes,
    conversation_id: need.conversation_id,
    source_event_id: need.source_event_id,
  };
}

// -----------------------------------------------------------------------------
// Reconstrucción de la conversación
// -----------------------------------------------------------------------------

/**
 * Reconstruye la conversación a partir de las filas de `ingest_responses`.
 *
 * - Solo se listan los eventos `message.received` (el completado NO aparece
 *   como mensaje del ciudadano).
 * - Los mensajes se ordenan por `received_at` ascendente (tiebreak por
 *   `event_id` para un orden determinista).
 * - El `conversation_id` se toma del need cuando existe, o de las filas.
 * - Si no hay need asociado (`need === null`), la respuesta indica
 *   `has_need=false` y los campos del incidente vienen vacíos/nulos.
 */
export function rebuildConversation(
  rows: IngestResponseRecord[],
  need: NeedRecord | null,
  fallbackConversationId?: string | null,
): ConversationRebuild {
  const messages: ReconstructedMessage[] = [];
  for (const row of rows) {
    const message = normalizeMessageRow(row);
    if (message) messages.push(message);
  }

  messages.sort((a, b) => {
    const t = compareTimestamps(a.received_at, b.received_at);
    if (t !== 0) return t;
    return a.event_id.localeCompare(b.event_id);
  });

  // El conversation_id se toma del need cuando existe; si no, de las filas; si
  // no hay filas (conversación vacía), del parámetro de consulta (metadatos).
  const conversationId =
    need?.conversation_id ??
    (rows.length > 0 ? rows[0].conversation_id : null) ??
    fallbackConversationId ??
    null;

  return {
    conversation_id: conversationId,
    has_need: need !== null,
    need: summarizeNeed(need),
    messages,
  };
}

function compareTimestamps(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isFinite(ta) && Number.isFinite(tb)) {
    if (ta !== tb) return ta - tb;
    return 0;
  }
  return a.localeCompare(b);
}
