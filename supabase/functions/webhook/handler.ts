// =============================================================================
// webhook/handler.ts — Lógica HTTP del endpoint receptor de eventos (S2-S7)
// Tickets: DEV-32 (S2), DEV-33 (S3), DEV-34 (S4), DEV-35 (S5), DEV-36 (S6),
//          DEV-37 (S7)
//
// Handler puro sobre Web Standard (Request/Response): sin dependencias de
// Deno, por lo que es testeable con vitest en Node y ejecutable en la Edge
// Runtime de Supabase (index.ts hace el bootstrap con Deno.serve).
//
// Rutas servidas por la Edge Function `webhook`:
//   POST {SUPABASE_URL}/functions/v1/webhook
//   POST {SUPABASE_URL}/functions/v1/webhook/events   (alias del contrato)
//
// Comportamiento (escenarios Gherkin S2):
//   - Acepta POST con JSON y responde 200 por cada evento.
//   - Acepta eventos de cualquier `type` (incluido el de completado).
//   - Body vacío o no parseable como JSON → 400 con detalle.
//   - Campos mínimos faltantes o con formato inválido → 400 con detalle.
//   - Sin autenticación (deuda de seguridad, ver S8).
//   - Sin coordenadas → 200 (el geocoding es S5).
//
// Mapeo (escenarios Gherkin S3):
//   - El ACK 200 incluye `mapping`: resumen del borrador de Need generado
//     (message_type/workflow.step normalizados, defaults priority/status/
//     verification_status/source, contact_whatsapp, location_pending_geocoding).
//   - Los eventos de type distinto a `message.received` se mapean con
//     `builds_incident=false` (no arman incidente; insumo de S5).
//
// Persistencia (escenarios Gherkin S4):
//   - Cuando se inyecta un `ingestStore` (deps), cada evento válido se persiste
//     en `ingest_responses` con `raw_event` intacto, metadatos y
//     `processing_status=RECEIVED`.
//   - Idempotencia por `event.id`: un reenvío no duplica ni modifica la fila
//     original.
//   - Evento sin campos obligatorios → 400 y NO se persiste ninguna fila.
//   - Evento sin coordenadas → se persiste tal cual (geocoding pendiente, S5).
//   - Eventos distintos de la misma conversación → filas separadas.
//   - Un error de persistencia → 500 estructurado y genérico
//     (`persistence_failed`, sin exponer detalles internos).
//
// Deduplicación (escenarios Gherkin S6 + S7):
//   - Clave de idempotencia: `event.id`. La UNIQUE(event_id) de
//     ingest_responses (S1 + migración S6) resuelve los reenvíos y la
//     condición de carrera de POSTs concurrentes con el mismo event.id.
//   - ORDEN US-1: la persistencia se ejecuta ANTES del mapeo. Un reenvío
//     (mismo event.id, incluso con body distinto) NO crea una fila nueva NI
//     sobrescribe la original: el store devuelve la fila existente y el handler
//     responde 409 ANTES de mapear — no se re-ejecuta el mapeo (S3) ni la
//     creación del incidente (S5).
//   - Confirmación al remitente (S7): un reenvío del mismo event.id ya
//     procesado con éxito responde **409 Conflict** (`duplicate_event`) con el
//     error estructurado (code + message) indicando que el evento ya fue
//     recibido, e incluye la fila existente en `details.record`. NO se crea un
//     duplicado en `ingest_responses` ni se re-ejecuta el procesamiento aguas
//     abajo (S3 mapeo / S5 incidente).
//   - Un evento SIN id (o con id vacío) → 400 `validation_failed` detallando
//     el campo faltante; NO se persiste y NO se invoca la deduplicación.
//   - Eventos distintos (event.id distinto, aunque compartan conversation_id o
//     contenido) se persisten por separado: la deduplicación NO usa el
//     contenido ni conversation_id como clave.
//   - Un reenvío tras un intento fallido de validación se procesa como nuevo:
//     el intento fallido no persistió nada, así que el reenvío corregido con el
//     mismo event.id inserta su fila sin conflicto.
//
// Creación del incidente (escenarios Gherkin S5):
//   - Cuando se inyecta un `incidentService` (deps), el evento de completado
//     dispara la creación del incidente en `needs` con los mensajes acumulados
//     de la conversación (source=WhatsApp, contact_whatsapp desde `from`,
//     PENDING_VERIFICATION, defaults del contrato).
//   - `conversation_id` vacío → 400 `missing_conversation_id` (sin incidente).
//   - `data.from` inválido → 400 `invalid_from` (el evento crudo ya quedó en
//     ingest_responses para auditoría; sin incidente).
//   - Sin mensajes acumulados previos → 409 `no_messages` (sin incidente).
//   - Reenvío del mismo event.id de completado → 409 `duplicate_event` en la
//     capa de ingestión (S7): no se re-ejecuta la creación del incidente.
//   - Sin coordenadas → geocoding (inyectable); si no hay geocoding, el
//     incidente se crea igual con lat/lng NULL y PENDING (no se rechaza; el
//     ACK 200 confirma la recepción aunque falten coordenadas, S7).
//
// Confirmación al remitente — ACK (escenarios Gherkin S7):
//   - Respuesta 200 por evento recibido; el ACK devuelve el `event.id` y el
//     `type` del evento.
//   - Errores → códigos y mensajes estructurados (400/409/500):
//       - `code` + `message` en todos los errores (400 validación, 409
//         reenvío, 500 interno).
//       - El 500 es genérico: NO expone detalles internos (el `cause` real se
//         registra vía `deps.logError` si está inyectado).
//   - Evento de completado sin coordenadas → 200 OK: la confirmación no
//     depende del geocoding; el enriquecimiento queda como paso posterior
//     (`location_enrichment_status=PENDING`, S5).
// =============================================================================

import {
  type RawWebhookEvent,
  validateWebhookEvent,
  resolveConversationId,
} from "../_shared/webhook-event.ts";
import {
  mapEventToNeedDraft,
  type MappingResult,
} from "../_shared/need-mapper.ts";
import {
  type IngestResponsesStore,
  persistIngestResponse,
} from "../_shared/ingest-persistence.ts";
import {
  type CompletionServiceDeps,
  processCompletionEvent,
} from "../_shared/completion-service.ts";
import { type Geocoder } from "../_shared/geocoding.ts";
import { isCompletionEvent } from "../_shared/incident-builder.ts";
import { type NeedRecord } from "../_shared/needs-store.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/** Serializa el resumen del mapeo (S3) para el ACK del endpoint. */
function serializeMapping(mapping: MappingResult) {
  if (!mapping.draft) return undefined;
  const draft = mapping.draft;
  return {
    result: mapping.status,
    message_type: draft.messageType,
    workflow_step: draft.workflowStep,
    contribution: draft.contribution,
    builds_incident: draft.buildsIncident,
    incident_ready: draft.incidentReady,
    priority: draft.priority,
    status: draft.status,
    verification_status: draft.verificationStatus,
    source: draft.source,
    contact_whatsapp: draft.contactWhatsapp ?? null,
    location_pending_geocoding: draft.locationPendingGeocoding,
  };
}

/** Serializa un incidente (S5) para el ACK del endpoint (created/duplicate). */
function serializeIncident(outcome: "created" | "duplicate", record: NeedRecord) {
  return {
    outcome,
    id: record.id,
    conversation_id: record.conversation_id,
    source_event_id: record.source_event_id,
    title: record.title,
    description: record.description,
    source: record.source,
    contact_whatsapp: record.contact_whatsapp,
    address: record.address,
    neighborhood: record.neighborhood,
    priority: record.priority,
    status: record.status,
    verification_status: record.verification_status,
    latitude: record.latitude,
    longitude: record.longitude,
    city_id: record.city_id,
    location_enrichment_status: record.location_enrichment_status,
  };
}

/** Dependencias opcionales del handler (permite mantenerlo PURE en tests S2). */
export interface WebhookDeps {
  /** Store de `ingest_responses` para persistir el evento crudo (S4). */
  ingestStore?: IngestResponsesStore;
  /** Servicio de creación del incidente al completar la conversación (S5). */
  incidentService?: CompletionServiceDeps;
  /** Geocoder para enriquecer la ubicación del incidente (S5). */
  geocoder?: Geocoder;
  /**
   * Logger opcional de errores internos (S7). Se invoca en los fallos
   * internos (500) para permitir trazabilidad SERVER-SIDE sin exponer los
   * detalles en la respuesta al remitente. En la Edge Function real se enlaza
   * a `console.error`; en tests se puede espiar.
   */
  logError?: (code: string, err: unknown) => void;
}

/** Endpoint receptor de eventos crudos del webhook del equipo de conversación. */
export async function handleWebhookEvent(
  req: Request,
  deps: WebhookDeps = {},
): Promise<Response> {
  // Preflight CORS (aunque el consumo es server-to-server, se habilita por
  // comodidad en desarrollo y pruebas desde el navegador).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Solo se aceptan POST.
  if (req.method !== "POST") {
    return jsonResponse(
      {
        code: "method_not_allowed",
        message: "Método no permitido. Usa POST /webhook/events.",
      },
      405,
      { Allow: "POST" },
    );
  }

  // El body debe llegar como JSON.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        code: "invalid_content_type",
        message: "Content-Type debe ser application/json.",
      },
      415,
    );
  }

  // Parseo del body: vacío o no parseable → 400.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(
      {
        code: "invalid_json",
        message: "El body debe ser un JSON válido.",
        details: {
          issues: [
            { path: [], message: "No se pudo parsear el body como JSON." },
          ],
        },
      },
      400,
    );
  }

  // Validación de estructura mínima → 400 con errores detallados.
  const result = validateWebhookEvent(payload);
  if (!result.valid) {
    return jsonResponse(
      {
        code: "validation_failed",
        message:
          "Estructura mínima inválida. Campos faltantes o con formato inválido.",
        details: { issues: result.issues },
      },
      400,
    );
  }

  // Persistencia del evento crudo (S4). Solo si se inyectó un store (en la
  // Edge Function real siempre se inyecta). Un error de persistencia es un 500
  // estructurado; la validación ya rechazó antes los eventos sin campos mínimos,
  // por lo que aquí SOLO se persisten eventos válidos.
  //
  // ORDEN (US-1 / DEV-40): la persistencia corre ANTES del mapeo (S3). Así, un
  // reenvío con el mismo event.id se corta en la capa de ingestión (409) SIN
  // re-ejecutar el mapeo ni el procesamiento aguas abajo (S5), cumpliendo el
  // criterio de aceptación de US-1 "no re-ejecuta el mapeo ni la creación del
  // incidente". El mapeo solo se calcula para eventos NUEVOS (ACK 200).
  let persistence;
  if (deps.ingestStore) {
    try {
      persistence = await persistIngestResponse(
        deps.ingestStore,
        payload as RawWebhookEvent,
      );
    } catch (err) {
      // S7: el 500 es estructurado y GENÉRICO (no expone detalles internos).
      // La causa real se registra server-side vía `deps.logError` cuando está
      // inyectado (bootstrap → console.error).
      deps.logError?.("persistence_failed", err);
      return jsonResponse(
        {
          code: "persistence_failed",
          message: "Error interno al persistir el evento. Inténtalo de nuevo.",
        },
        500,
      );
    }
  }

  // ===========================================================================
  // Confirmación al remitente de un reenvío (S6 + S7).
  // La unicidad durable de event_id (UNIQUE en ingest_responses, S1/S6) ya
  // resolvió el reenvío como `duplicate` SIN insertar una fila nueva. El ACK
  // del contrato S7 exige que un reenvío del mismo event.id (ya procesado con
  // éxito) responda **409 Conflict** con error estructurado (`code` +
  // `message`) indicando que el evento ya fue recibido, e incluye la fila
  // existente en `details.record`. Este retorno ocurre ANTES del mapeo (S3) y
  // del procesamiento aguas abajo (S5 no re-crea el incidente): no se
  // re-ejecuta el mapeo ni la creación del incidente (US-1), y no se crea un
  // duplicado en `ingest_responses`.
  if (persistence?.duplicate) {
    return jsonResponse(
      {
        code: "duplicate_event",
        message: `El evento con event.id '${result.event.id}' ya fue recibido. No se creó un duplicado.`,
        details: {
          event_id: result.event.id,
          type: result.event.type,
          record: {
            id: persistence.record.id ?? null,
            event_id: persistence.record.event_id,
            processing_status: persistence.record.processing_status,
            received_at: persistence.record.received_at,
            created_at: persistence.record.created_at,
          },
        },
      },
      409,
    );
  }

  // Mapeo del evento a borrador de Need (S3). Solo se alcanza para eventos
  // NUEVOS (no duplicados). El resumen se incluye en el ACK 200; el borrador
  // completo queda disponible para la creación del incidente (S5).
  const mapping = mapEventToNeedDraft(payload);

  // Creación del incidente (S5). Si el evento es de completado y se inyectó el
  // servicio de incidentes, se crea el registro en `needs` con los mensajes
  // acumulados de la conversación (source=WhatsApp, PENDING_VERIFICATION).
  let incident;
  if (deps.incidentService && isCompletionEvent(payload as RawWebhookEvent)) {
    // El conversation_id puede viajar en `conversation_id` (plano) o en
    // `data.conversation_id` (shape documentado del contrato S8).
    const conversationId = resolveConversationId(payload as RawWebhookEvent);

    // Un evento de completado sin conversation_id no puede agrupar la
    // conversación: la validación devuelve 400 detallando el campo faltante.
    if (
      typeof conversationId !== "string" ||
      conversationId.trim().length === 0
    ) {
      return jsonResponse(
        {
          code: "missing_conversation_id",
          message:
            "El evento de completado requiere data.conversation_id (o conversation_id) no vacío para crear el incidente.",
          details: {
            issues: [
              {
                path: ["conversation_id"],
                message:
                  "conversation_id: campo requerido (string no vacío) en el evento de completado.",
              },
            ],
          },
        },
        400,
      );
    }

    // Mensajes acumulados de la conversación: los eventos `message.received`
    // ya persistidos en ingest_responses (mismo conversation_id, distinto
    // event.id que el completado).
    let accumulated: RawWebhookEvent[] = [];
    if (deps.ingestStore?.listByConversationId) {
      const rows = await deps.ingestStore.listByConversationId(conversationId);
      accumulated = rows
        .map((r) => r.raw_event as RawWebhookEvent)
        .filter((e) => String(e?.id) !== String((payload as RawWebhookEvent).id));
    }

    try {
      incident = await processCompletionEvent(
        {
          needsStore: deps.incidentService.needsStore,
          geocoder: deps.geocoder ?? deps.incidentService.geocoder,
          cityResolver: deps.incidentService.cityResolver,
        },
        payload as RawWebhookEvent,
        accumulated,
      );
    } catch (err) {
      // S7: el 500 es estructurado y GENÉRICO (sin detalles internos). La
      // causa real se registra server-side vía `deps.logError`.
      deps.logError?.("incident_creation_failed", err);
      return jsonResponse(
        {
          code: "incident_creation_failed",
          message: "Error interno al crear el incidente. Inténtalo de nuevo.",
        },
        500,
      );
    }

    // Respuestas de negocio del flujo de completado (S5).
    if (incident.status === "invalid_from") {
      return jsonResponse(
        {
          code: "invalid_from",
          message:
            "El evento de completado quedó registrado en ingest_responses para auditoría, pero no se creó el incidente.",
          details: { issue: incident.issue },
        },
        400,
      );
    }
    if (incident.status === "no_messages") {
      return jsonResponse(
        {
          code: "no_messages",
          message:
            "No hay mensajes acumulados previos para la conversación; no se crea el incidente.",
          details: { conversation_id: incident.conversationId },
        },
        409,
      );
    }
  }

  return jsonResponse(
    {
      ok: true,
      status: "accepted",
      event_id: result.event.id,
      type: result.event.type,
      message: "Evento aceptado.",
      // Resultado de la persistencia (S4). `duplicate=true` indica un reenvío:
      // se devuelve la fila existente y no se creó ni modificó nada.
      ...(persistence
        ? {
            persisted: persistence.inserted,
            duplicate: persistence.duplicate,
            record: {
              id: persistence.record.id ?? null,
              event_id: persistence.record.event_id,
              processing_status: persistence.record.processing_status,
              received_at: persistence.record.received_at,
              created_at: persistence.record.created_at,
            },
          }
        : {}),
      // Resumen del borrador de Need generado por el mapeo (S3).
      ...(mapping.draft ? { mapping: serializeMapping(mapping) } : {}),
      // Resultado de la creación del incidente (S5). Presente solo cuando el
      // evento es de completado y se inyectó el servicio de incidentes.
      // `outcome` indica si se creó o si ya existía (idempotencia por event.id).
      ...(incident &&
      (incident.status === "created" || incident.status === "duplicate")
        ? { incident: serializeIncident(incident.status, incident.incident) }
        : {}),
    },
    200,
  );
}
