// =============================================================================
// _shared/completion-service.ts — Creación del incidente al completar (S5)
// Ticket: DEV-35
//
// Orquesta la creación del incidente en `needs` cuando llega el evento de
// completado de una conversación de WhatsApp. Es un módulo PURE (Web
// Standards + fetch inyectable) que comparten la Edge Function `webhook`
// (Deno) y los tests unitarios (vitest/Node). Cumple NFR-4.
//
// Flujo (escenarios Gherkin S5):
//   1. Valida el remitente (`data.from`) cuando viene presente: un número de
//      WhatsApp inválido → `invalid_from` (HTTP 400; el evento crudo ya quedó
//      registrado en ingest_responses para auditoría).
//   2. Idempotencia por `event.id` del completado: si `source_event_id` ya
//      existe → `duplicate` (se devuelve el incidente existente).
//   3. Un incidente por conversación: si `conversation_id` ya tiene incidente
//      → `duplicate` (no se mezclan conversaciones).
//   4. Sin mensajes acumulados (`message.received`) → `no_messages` (HTTP 409).
//   5. Construye el incidente con los mensajes acumulados + defaults.
//   6. Si faltan coordenadas y hay dirección → invoca el geocoder
//      (inyectable); si resuelve, actualiza lat/lng y city_id. Si no hay
//      geocoding disponible o no resuelve, el incidente se crea igual con
//      lat/lng NULL y `location_enrichment_status=PENDING` (el flujo NO
//      rechaza el evento de completado).
// =============================================================================

import {
  type RawWebhookEvent,
  resolveConversationId,
} from "./webhook-event.ts";
import {
  buildIncidentFromConversation,
  isValidWhatsAppNumber,
  resolveFrom,
} from "./incident-builder.ts";
import {
  type NeedsStore,
  type NeedRecord,
  type NeedInsert,
} from "./needs-store.ts";
import { type Geocoder, resolveCityIdFromCoords } from "./geocoding.ts";

/** Resuelve city_id a partir de coordenadas (inyectable para tests). */
export type CityResolver = (lat: number, lng: number) => string;

export interface CompletionServiceDeps {
  /** Store de `needs` donde se persiste el incidente. */
  needsStore: NeedsStore;
  /** Geocoder opcional (Nominatim en la Edge Function real). */
  geocoder?: Geocoder;
  /** Resuelve city_id desde coordenadas (default: detección por radio). */
  cityResolver?: CityResolver;
}

export type CompletionResult =
  | { status: "created"; incident: NeedRecord }
  | { status: "duplicate"; incident: NeedRecord }
  | { status: "invalid_from"; issue: string }
  | { status: "no_messages"; conversationId: string };

/**
 * Procesa el evento de completado y crea (o recupera) el incidente de la
 * conversación en `needs`.
 *
 * @param deps              Stores/geocoder/resolver inyectados.
 * @param completionEvent   Evento crudo de completado (ya validado por S2).
 * @param accumulatedEvents Eventos crudos `message.received` acumulados de la
 *                          misma `conversation_id`.
 */
export async function processCompletionEvent(
  deps: CompletionServiceDeps,
  completionEvent: RawWebhookEvent,
  accumulatedEvents: RawWebhookEvent[],
): Promise<CompletionResult> {
  const cityResolver = deps.cityResolver ?? resolveCityIdFromCoords;

  // 1. Validación del remitente (solo cuando viene presente).
  const from = resolveFrom(completionEvent);
  if (from !== undefined && !isValidWhatsAppNumber(from)) {
    return {
      status: "invalid_from",
      issue: `data.from '${from}' no es un número de WhatsApp válido (E.164).`,
    };
  }

  const conversationId = String(resolveConversationId(completionEvent));
  const eventId = String(completionEvent.id);

  // 2. Idempotencia por event.id del completado (S5/S6).
  const byEvent = await deps.needsStore.findBySourceEventId(eventId);
  if (byEvent) {
    return { status: "duplicate", incident: byEvent };
  }

  // 3. Un incidente por conversación (no se mezclan conversaciones).
  const byConversation = await deps.needsStore.findByConversationId(conversationId);
  if (byConversation) {
    return { status: "duplicate", incident: byConversation };
  }

  // 4. Sin mensajes acumulados previos → no hay incidente que armar.
  if (accumulatedEvents.length === 0) {
    return { status: "no_messages", conversationId };
  }

  // 5. Construcción del incidente con los mensajes acumulados + defaults.
  const draft = buildIncidentFromConversation(completionEvent, accumulatedEvents);

  // 6. Enriquecimiento de ubicación.
  const record = await enrichLocation(draft, deps.geocoder, cityResolver);

  // 7. Persistencia en `needs`. Un conflicto de unicidad (event.id o
  //    conversación ya existente) devuelve la fila existente.
  const result = await deps.needsStore.insert(record);
  if (result.duplicate) {
    return { status: "duplicate", incident: result.record };
  }
  return { status: "created", incident: result.record };
}

async function enrichLocation(
  record: NeedInsert,
  geocoder: Geocoder | undefined,
  cityResolver: CityResolver,
): Promise<NeedInsert> {
  const hasCoords = record.latitude != null && record.longitude != null;

  if (hasCoords) {
    // Coordenadas presentes (del evento): no se invoca el geocoding.
    record.city_id = cityResolver(record.latitude as number, record.longitude as number);
    record.location_enrichment_status = "RESOLVED";
    return record;
  }

  // Sin coordenadas: intentar enriquecer con geocoding cuando hay dirección.
  const hasAddress = record.address && record.address !== "Por confirmar";
  if (hasAddress && geocoder) {
    const neighborhood =
      record.neighborhood && record.neighborhood !== "Por confirmar"
        ? record.neighborhood
        : undefined;
    const result = await geocoder.geocode(record.address, neighborhood);
    if (result) {
      record.latitude = result.latitude;
      record.longitude = result.longitude;
      record.city_id = cityResolver(result.latitude, result.longitude);
      record.location_enrichment_status = "RESOLVED";
      return record;
    }
  }

  // Geocoding no disponible o no resuelve: el incidente se crea igual con
  // lat/lng NULL y la ubicación pendiente de enriquecimiento.
  record.latitude = null;
  record.longitude = null;
  record.location_enrichment_status = "PENDING";
  return record;
}
