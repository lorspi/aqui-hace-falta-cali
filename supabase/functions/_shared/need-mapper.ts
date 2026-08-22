// =============================================================================
// _shared/need-mapper.ts — Validación y mapeo de eventos crudos → Need (S3)
// Ticket: DEV-33
//
// Módulo PURE y SIN dependencias (ni Deno ni npm): comparte la lógica de
// validación + mapeo entre la Edge Function `webhook` (Deno) y los tests
// unitarios (vitest/Node). Cumple NFR-4 del plan (lógica pura testeable sin
// dependencias).
//
// S3 construye sobre la validación de estructura mínima de S2
// (webhook-event.ts) y agrega el mapeo al modelo `Need` (src/types.ts):
//   - Normalización de `data.message_type` a un valor canónico.
//   - Normalización de `data.workflow.step` a un valor canónico.
//   - Defaults del contrato: priority=MEDIUM, status=NEED_HELP_NOW,
//     verification_status=PENDING_VERIFICATION, source=WhatsApp.
//   - `contact_whatsapp` desde `data.from` cuando está presente.
//   - Ubicación pendiente de geocoding cuando el evento no trae coordenadas
//     (lat/lng se enriquecen en S5); address/neighborhood se conservan desde
//     el body cuando vienen incluidos.
//   - Deduplicación por event.id: la capa de mapeo detecta reenvíos cuando se
//     le pasa el conjunto de event_id ya procesados. La confirmación durable
//     de la idempotencia es S4/S6 (constraint UNIQUE en `ingest_responses`).
//   - Los eventos de `type` distinto a `message.received` pasan la validación
//     pero NO arman un incidente (buildsIncident=false): quedan como insumo
//     para el flujo de completado de la conversación (S5).
// =============================================================================

import {
  type RawWebhookEvent,
  type ValidationIssue,
  validateWebhookEvent,
} from "./webhook-event.ts";

// -----------------------------------------------------------------------------
// Valores canónicos
// -----------------------------------------------------------------------------

/** Clasificación canónica del contenido del mensaje (message_type). */
export type CanonicalMessageType =
  | "TEXT"
  | "IMAGE"
  | "AUDIO"
  | "VIDEO"
  | "DOCUMENT"
  | "LOCATION"
  | "UNKNOWN";

/** Paso canónico del flujo de la conversación (workflow.step). */
export type CanonicalWorkflowStep =
  | "AWAITING_LOCATION"
  | "AWAITING_DETAILS"
  | "COMPLETED"
  | "UNKNOWN";

/** Qué información aporta el mensaje al incidente acumulado, según el paso. */
export type StepContribution = "LOCATION" | "DETAILS" | "COMPLETION" | "UNKNOWN";

// -----------------------------------------------------------------------------
// Borrador de Need (mapeo del evento crudo al modelo `Need`)
// -----------------------------------------------------------------------------

export interface NeedDraft {
  // Trazabilidad del evento de origen.
  eventId: string;
  type: string;
  conversationId: string;

  // Contenido del mensaje normalizado.
  messageType: CanonicalMessageType;
  workflowStep: CanonicalWorkflowStep;
  contribution: StepContribution;
  body: unknown;

  // Incidente (Need) mapeado. title/description se derivan del body; los
  // campos opcionales solo se incluyen cuando el evento los aporta.
  title: string;
  description: string;
  contactName: string;
  contactWhatsapp?: string;
  contactPhone?: string;
  address?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  /** true cuando el evento no trae coordenadas resueltas (geocoding es S5). */
  locationPendingGeocoding: boolean;

  // Defaults del contrato S3 (alineados a la migración S1 y al modelo Need).
  priority: "MEDIUM";
  status: "NEED_HELP_NOW";
  verificationStatus: "PENDING_VERIFICATION";
  source: "WhatsApp";

  /** true solo para `type === 'message.received'`: este evento arma incidente. */
  buildsIncident: boolean;
  /** la conversación está completa → S5 crea el incidente acumulado. */
  incidentReady: boolean;
}

export type MappingStatus = "mapped" | "duplicate" | "invalid";

export interface MappingResult {
  status: MappingStatus;
  issues: ValidationIssue[];
  draft?: NeedDraft;
}

// -----------------------------------------------------------------------------
// Helpers internos
// -----------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// -----------------------------------------------------------------------------
// Normalización de message_type
// -----------------------------------------------------------------------------

const MESSAGE_TYPE_ALIASES: Record<string, CanonicalMessageType> = {
  text: "TEXT",
  image: "IMAGE",
  photo: "IMAGE",
  audio: "AUDIO",
  voice: "AUDIO",
  video: "VIDEO",
  document: "DOCUMENT",
  file: "DOCUMENT",
  location: "LOCATION",
  geo: "LOCATION",
  contact: "UNKNOWN",
  contacto: "UNKNOWN",
};

/**
 * Normaliza `data.message_type` a un valor canónico. Un formato desconocido
 * o ausente NO invalida el evento: se clasifica como genérico (UNKNOWN).
 */
export function normalizeMessageType(value: unknown): CanonicalMessageType {
  if (typeof value !== "string") return "UNKNOWN";
  const key = value.trim().toLowerCase();
  return MESSAGE_TYPE_ALIASES[key] ?? "UNKNOWN";
}

// -----------------------------------------------------------------------------
// Normalización de workflow.step
// -----------------------------------------------------------------------------

const WORKFLOW_STEP_ALIASES: Record<string, CanonicalWorkflowStep> = {
  awaiting_location: "AWAITING_LOCATION",
  awaiting_address: "AWAITING_LOCATION",
  location: "AWAITING_LOCATION",
  awaiting_details: "AWAITING_DETAILS",
  awaiting_body: "AWAITING_DETAILS",
  awaiting_description: "AWAITING_DETAILS",
  collecting_details: "AWAITING_DETAILS",
  details: "AWAITING_DETAILS",
  completed: "COMPLETED",
  done: "COMPLETED",
  finished: "COMPLETED",
  close: "COMPLETED",
  conversation_completed: "COMPLETED",
};

/**
 * Normaliza `data.workflow.step` a un valor canónico. Un paso desconocido o
 * ausente NO invalida el evento: se clasifica como UNKNOWN.
 */
export function normalizeWorkflowStep(value: unknown): CanonicalWorkflowStep {
  if (typeof value !== "string") return "UNKNOWN";
  const key = value.trim().toLowerCase();
  return WORKFLOW_STEP_ALIASES[key] ?? "UNKNOWN";
}

/**
 * Qué información aporta el mensaje al incidente acumulado según el paso
 * normalizado. El paso de completado señala que el incidente está listo para
 * crearse (delegado a S5).
 */
export function workflowStepContribution(step: CanonicalWorkflowStep): StepContribution {
  switch (step) {
    case "AWAITING_LOCATION":
      return "LOCATION";
    case "AWAITING_DETAILS":
      return "DETAILS";
    case "COMPLETED":
      return "COMPLETION";
    default:
      return "UNKNOWN";
  }
}

// -----------------------------------------------------------------------------
// Deduplicación por event.id (la capa de mapeo detecta reenvíos)
// -----------------------------------------------------------------------------

export interface ProcessedEventTracker {
  has(eventId: string): boolean;
  add(eventId: string): void;
  readonly size: number;
}

/**
 * Tracker en memoria de event_id ya procesados. La confirmación durable de la
 * idempotencia es responsabilidad de S4/S6 (constraint UNIQUE sobre
 * `ingest_responses.event_id`); este tracker permite que la capa de
 * validación/mapeo no produzca un segundo borrador para un mismo event.id.
 */
export function createProcessedEventTracker(): ProcessedEventTracker {
  const seen = new Set<string>();
  return {
    has: (eventId) => seen.has(eventId),
    add: (eventId) => {
      seen.add(eventId);
    },
    get size() {
      return seen.size;
    },
  };
}

// -----------------------------------------------------------------------------
// Mapeo evento → borrador de Need
// -----------------------------------------------------------------------------

/** Extrae ubicación desde el body (string u objeto) o desde data. */
function extractLocationInfo(event: RawWebhookEvent): {
  address?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  locationPendingGeocoding: boolean;
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

  const hasCoords = latitude !== undefined && longitude !== undefined;

  return {
    ...(address !== undefined ? { address } : {}),
    ...(neighborhood !== undefined ? { neighborhood } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    locationPendingGeocoding: !hasCoords,
  };
}

function resolveDescription(body: unknown): string {
  if (typeof body === "string") {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed : "Solicitud de ayuda vía WhatsApp";
  }
  if (isRecord(body)) {
    if (isNonEmptyString(body.text)) return body.text;
    if (isNonEmptyString(body.description)) return body.description;
    return JSON.stringify(body);
  }
  return "Solicitud de ayuda vía WhatsApp";
}

function resolveTitle(body: unknown, description: string): string {
  if (isRecord(body) && isNonEmptyString(body.title)) return body.title;
  if (description !== "Solicitud de ayuda vía WhatsApp") {
    return description.length > 80 ? `${description.slice(0, 80)}…` : description;
  }
  return "Solicitud de ayuda vía WhatsApp";
}

/**
 * Valida y mapea un evento crudo a un borrador de Need.
 *
 * @param input Evento crudo del webhook (mismo shape que S2).
 * @param isAlreadyProcessed Callback opcional de lookup de event_id ya
 *   procesados (acepta un ReadonlySet<string> o el ProcessedEventTracker); si
 *   el evento ya fue mapeado, devuelve status `duplicate` sin borrador.
 *
 * Resultados:
 *   - `invalid`:   falla la validación de campos mínimos → no hay borrador.
 *   - `duplicate`: event.id ya procesado → no produce un segundo borrador.
 *   - `mapped`:    validación OK → borrador de Need con defaults (para
 *     enriquecer en S4/S5 y persistir).
 */
export function mapEventToNeedDraft(
  input: unknown,
  isAlreadyProcessed?:
    | ReadonlySet<string>
    | ProcessedEventTracker
    | ((eventId: string) => boolean),
): MappingResult {
  const validation = validateWebhookEvent(input);
  if (!validation.valid) {
    return { status: "invalid", issues: validation.issues };
  }

  const event = input as RawWebhookEvent;
  const { id, type, conversationId, body } = validation.event;

  // Deduplicación: la capa de validación/mapeo detecta el event.id ya
  // procesado y no produce un segundo borrador (confirmación durable: S4/S6).
  // Acepta un Set, un ProcessedEventTracker o un callback de lookup.
  const hasAlreadyProcessed =
    typeof isAlreadyProcessed === "function"
      ? isAlreadyProcessed
      : isAlreadyProcessed
        ? (eventId: string) => isAlreadyProcessed.has(eventId)
        : undefined;
  if (hasAlreadyProcessed?.(id)) {
    return { status: "duplicate", issues: [], draft: undefined };
  }

  const messageType = normalizeMessageType(event.data?.message_type);
  const workflowStep = normalizeWorkflowStep(event.data?.workflow?.step);
  const from = isNonEmptyString(event.data?.from) ? (event.data?.from as string) : undefined;
  const location = extractLocationInfo(event);

  // Un evento de `type === 'message.received'` arma un borrador de incidente.
  // Cualquier otro type pasa la validación pero no arma incidente directamente
  // (queda como insumo del flujo de completado de la conversación, S5).
  const buildsIncident = type === "message.received";

  // El incidente acumulado está listo cuando el paso de la conversación es de
  // completado, o cuando el type es el evento de completado (S5).
  const incidentReady = workflowStep === "COMPLETED" || type === "conversation_completed";

  const description = resolveDescription(body);
  const title = resolveTitle(body, description);

  const draft: NeedDraft = {
    eventId: id,
    type,
    conversationId,
    messageType,
    workflowStep,
    contribution: workflowStepContribution(workflowStep),
    body,
    title,
    description,
    contactName: "Ciudadano vía WhatsApp",
    ...(from !== undefined ? { contactWhatsapp: from, contactPhone: from } : {}),
    ...(location.address !== undefined ? { address: location.address } : {}),
    ...(location.neighborhood !== undefined ? { neighborhood: location.neighborhood } : {}),
    ...(location.latitude !== undefined ? { latitude: location.latitude } : {}),
    ...(location.longitude !== undefined ? { longitude: location.longitude } : {}),
    locationPendingGeocoding: location.locationPendingGeocoding,
    priority: "MEDIUM",
    status: "NEED_HELP_NOW",
    verificationStatus: "PENDING_VERIFICATION",
    source: "WhatsApp",
    buildsIncident,
    incidentReady,
  };

  return { status: "mapped", issues: [], draft };
}
