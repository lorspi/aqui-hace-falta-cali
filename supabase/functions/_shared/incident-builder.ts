// =============================================================================
// _shared/incident-builder.ts — Construcción del incidente desde la conversación (S5)
// Ticket: DEV-35
//
// Módulo PURE y SIN dependencias de npm/Deno: comparte la lógica de armado del
// incidente entre la Edge Function `webhook` (Deno) y los tests (vitest/Node).
// Cumple NFR-4 (lógica pura testeable sin dependencias).
//
// S5 crea el registro en `needs` cuando llega el evento de completado de una
// conversación de WhatsApp. Este módulo:
//
//   1. Detecta el evento de completado (`isCompletionEvent`). El schema del
//      evento de completado está pendiente de confirmación por el equipo de
//      conversación (dependencia DEV-35); se soportan los type conocidos
//      (`conversation_completed`, `conversation.completed`) y el paso
//      `workflow.step=COMPLETED` como señal de fin de conversación.
//   2. Construye el incidente (`buildIncidentFromConversation`) a partir de los
//      mensajes acumulados por `conversation_id` (los eventos `message.received`
//      ya persistidos) + el evento de completado:
//        - title/description: se concatenan los mensajes acumulados.
//        - contact_whatsapp / contact_phone: desde `data.from` (del completado
//          o del primer mensaje acumulado que lo traiga).
//        - ubicación: primera lat/lng y address/neighborhood encontradas.
//        - defaults del contrato: priority=MEDIUM, status=NEED_HELP_NOW,
//          verification_status=PENDING_VERIFICATION, source=WhatsApp,
//          emergency_id='terremoto-cali-2026'.
//        - columnas S5: source_event_id (idempotencia), conversation_id
//          (un incidente por conversación), location_enrichment_status
//          (RESOLVED si hay coordenadas, PENDING si no).
// =============================================================================

import {
  type RawWebhookEvent,
  resolveConversationId,
} from "./webhook-event.ts";
import {
  mapEventToNeedDraft,
  normalizeWorkflowStep,
  type NeedDraft,
} from "./need-mapper.ts";
import { type NeedInsert } from "./needs-store.ts";

// -----------------------------------------------------------------------------
// Detección del evento de completado
// -----------------------------------------------------------------------------

/** Defaults del contrato S5 (alineados a requirements.md / DEV-35). */
export const INCIDENT_DEFAULTS = {
  priority: "MEDIUM",
  status: "NEED_HELP_NOW",
  verificationStatus: "PENDING_VERIFICATION",
  source: "WhatsApp",
  emergencyId: "terremoto-cali-2026",
  cityId: "cali",
  contactName: "Ciudadano vía WhatsApp",
} as const;

/**
 * Types de eventos de completado conocidos. El schema está pendiente de
 * confirmación (dependencia DEV-35): se soportan ambos separadores.
 */
export const COMPLETION_EVENT_TYPES: ReadonlySet<string> = new Set([
  "conversation_completed",
  "conversation.completed",
]);

/**
 * Detecta si un evento crudo es el de completado de la conversación.
 *
 * Un evento de completado dispara la creación del incidente (S5). Se detecta
 * por:
 *   - `type` en el set de types de completado conocidos, o
 *   - `workflow.step` normalizado a `COMPLETED` (señal de fin de conversación).
 */
export function isCompletionEvent(event: RawWebhookEvent): boolean {
  if (typeof event.type !== "string") return false;
  if (COMPLETION_EVENT_TYPES.has(event.type)) return true;
  return normalizeWorkflowStep(event.data?.workflow?.step) === "COMPLETED";
}

// -----------------------------------------------------------------------------
// Validación del remitente (`from`)
// -----------------------------------------------------------------------------

/**
 * Valida que `data.from` sea un número de WhatsApp (E.164): `+` opcional
 * seguido de 8 a 15 dígitos (la numeración colombiana es `57` + 10 dígitos).
 */
export function isValidWhatsAppNumber(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return /^\+?[1-9]\d{7,14}$/.test(trimmed);
}

// -----------------------------------------------------------------------------
// Helpers de extracción desde el evento crudo
// -----------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** `data.from` del evento crudo (string no vacío) o undefined. */
export function resolveFrom(event: RawWebhookEvent): string | undefined {
  const from = event.data?.from;
  return isNonEmptyString(from) ? from : undefined;
}

/** Ubicación que trae un evento crudo (desde body/data.body/data). */
export function extractLocationFromEvent(event: RawWebhookEvent): {
  address?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
} {
  const sources: Array<Record<string, unknown> | undefined> = [
    isRecord(event.body) ? event.body : undefined,
    isRecord(event.data?.body) ? event.data!.body : undefined,
    isRecord(event.data) ? event.data : undefined,
  ];

  let address: string | undefined;
  let neighborhood: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;

  for (const source of sources) {
    if (!source) continue;
    address ??= isNonEmptyString(source.address) ? source.address : undefined;
    neighborhood ??= isNonEmptyString(source.neighborhood) ? source.neighborhood : undefined;
    if (latitude === undefined && isFiniteNumber(source.latitude)) latitude = source.latitude;
    if (longitude === undefined && isFiniteNumber(source.longitude)) longitude = source.longitude;
  }

  return {
    ...(address !== undefined ? { address } : {}),
    ...(neighborhood !== undefined ? { neighborhood } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
  };
}

// -----------------------------------------------------------------------------
// Merge de los mensajes acumulados → incidente
// -----------------------------------------------------------------------------

/** Mapea los eventos `message.received` acumulados a borradores de Need. */
export function mapAccumulatedMessages(
  accumulatedEvents: RawWebhookEvent[],
): NeedDraft[] {
  const drafts: NeedDraft[] = [];
  for (const event of accumulatedEvents) {
    const result = mapEventToNeedDraft(event);
    if (result.status === "mapped" && result.draft?.buildsIncident) {
      drafts.push(result.draft);
    }
  }
  return drafts;
}

const DEFAULT_DESCRIPTION = "Solicitud de ayuda vía WhatsApp";

/** Une los mensajes acumulados en una descripción legible del incidente. */
export function mergeDescriptions(drafts: NeedDraft[]): string {
  const parts = drafts
    .map((d) => d.description)
    .filter((desc) => desc && desc !== DEFAULT_DESCRIPTION);
  if (parts.length === 0) return DEFAULT_DESCRIPTION;
  return parts.join(" | ");
}

/** Deriva un título corto a partir de la descripción del primer mensaje. */
export function resolveAccumulatedTitle(drafts: NeedDraft[]): string {
  for (const draft of drafts) {
    const desc = draft.description;
    if (desc && desc !== DEFAULT_DESCRIPTION) {
      return desc.length > 80 ? `${desc.slice(0, 80)}…` : desc;
    }
  }
  return DEFAULT_DESCRIPTION;
}

interface MergedLocation {
  address?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}

/** Ubicación acumulada: primera encontrada entre los mensajes y el completado. */
export function mergeAccumulatedLocation(
  drafts: NeedDraft[],
  completionLocation: { address?: string; neighborhood?: string; latitude?: number; longitude?: number },
): MergedLocation {
  const merged: MergedLocation = {};

  for (const draft of drafts) {
    merged.address ??= draft.address;
    merged.neighborhood ??= draft.neighborhood;
    if (merged.latitude === undefined) merged.latitude = draft.latitude;
    if (merged.longitude === undefined) merged.longitude = draft.longitude;
  }

  // El evento de completado puede aportar ubicación si los mensajes no la traen.
  merged.address ??= completionLocation.address;
  merged.neighborhood ??= completionLocation.neighborhood;
  if (merged.latitude === undefined) merged.latitude = completionLocation.latitude;
  if (merged.longitude === undefined) merged.longitude = completionLocation.longitude;

  return merged;
}

// -----------------------------------------------------------------------------
// Construcción del incidente
// -----------------------------------------------------------------------------

/**
 * Construye el registro de `needs` (NeedInsert) a partir de la conversación
 * acumulada y el evento de completado.
 *
 * @param completionEvent    Evento crudo de completado (ya validado).
 * @param accumulatedEvents  Eventos crudos `message.received` de la conversación.
 */
export function buildIncidentFromConversation(
  completionEvent: RawWebhookEvent,
  accumulatedEvents: RawWebhookEvent[],
): NeedInsert {
  const drafts = mapAccumulatedMessages(accumulatedEvents);
  const completionFrom = resolveFrom(completionEvent);

  // Remitente: el del evento de completado, o el primer mensaje que lo traiga.
  let contactWhatsapp = completionFrom;
  let contactPhone = completionFrom;
  if (!contactWhatsapp) {
    for (const draft of drafts) {
      if (draft.contactWhatsapp) {
        contactWhatsapp = draft.contactWhatsapp;
        contactPhone = draft.contactPhone ?? draft.contactWhatsapp;
        break;
      }
    }
  }

  const description = mergeDescriptions(drafts);
  const title = resolveAccumulatedTitle(drafts);
  const location = mergeAccumulatedLocation(
    drafts,
    extractLocationFromEvent(completionEvent),
  );

  const hasCoords =
    location.latitude !== undefined &&
    location.longitude !== undefined;

  return {
    title,
    description,
    contact_name: INCIDENT_DEFAULTS.contactName,
    ...(contactWhatsapp !== undefined ? { contact_whatsapp: contactWhatsapp } : {}),
    ...(contactPhone !== undefined ? { contact_phone: contactPhone } : {}),
    address: location.address ?? location.neighborhood ?? "Por confirmar",
    neighborhood: location.neighborhood ?? "Por confirmar",
    ...(location.latitude !== undefined ? { latitude: location.latitude } : { latitude: null }),
    ...(location.longitude !== undefined ? { longitude: location.longitude } : { longitude: null }),
    priority: INCIDENT_DEFAULTS.priority,
    status: INCIDENT_DEFAULTS.status,
    verification_status: INCIDENT_DEFAULTS.verificationStatus,
    source: INCIDENT_DEFAULTS.source,
    emergency_id: INCIDENT_DEFAULTS.emergencyId,
    city_id: INCIDENT_DEFAULTS.cityId,
    place_type: "EDIFICIO_AFECTADO",
    categories: [],
    resources: [],
    requester_type: "PERSONA",
    source_event_id: String(completionEvent.id),
    conversation_id: String(resolveConversationId(completionEvent)),
    location_enrichment_status: hasCoords ? "RESOLVED" : "PENDING",
  };
}
