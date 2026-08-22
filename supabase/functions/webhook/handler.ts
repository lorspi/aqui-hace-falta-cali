// =============================================================================
// webhook/handler.ts — Lógica HTTP del endpoint receptor de eventos (S2+S3+S4)
// Tickets: DEV-32 (S2), DEV-33 (S3), DEV-34 (S4)
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
//   - Reenvíos con el mismo event_id → 200 (la deduplicación es S4/S6).
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
//     original; el ACK 200 devuelve la fila existente con `duplicate=true`.
//   - Evento sin campos obligatorios → 400 y NO se persiste ninguna fila.
//   - Evento sin coordenadas → se persiste tal cual (geocoding pendiente, S5).
//   - Eventos distintos de la misma conversación → filas separadas.
//   - Un error de persistencia → 500 estructurado (`persistence_failed`).
// =============================================================================

import {
  type RawWebhookEvent,
  validateWebhookEvent,
} from "../_shared/webhook-event.ts";
import { mapEventToNeedDraft } from "../_shared/need-mapper.ts";
import {
  type IngestResponsesStore,
  persistIngestResponse,
} from "../_shared/ingest-persistence.ts";

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

/** Dependencias opcionales del handler (permite mantenerlo PURE en tests S2). */
export interface WebhookDeps {
  /** Store de `ingest_responses` para persistir el evento crudo (S4). */
  ingestStore?: IngestResponsesStore;
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
        error: "method_not_allowed",
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
        error: "invalid_content_type",
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
        error: "invalid_json",
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
        error: "validation_failed",
        message:
          "Estructura mínima inválida. Campos faltantes o con formato inválido.",
        details: { issues: result.issues },
      },
      400,
    );
  }

  // Mapeo del evento a borrador de Need (S3). Se incluye el resumen en el ACK;
  // el borrador completo queda disponible para la creación del incidente (S5).
  const mapping = mapEventToNeedDraft(payload);

  // Persistencia del evento crudo (S4). Solo si se inyectó un store (en la
  // Edge Function real siempre se inyecta). Un error de persistencia es un 500
  // estructurado; la validación ya rechazó antes los eventos sin campos mínimos,
  // por lo que aquí SOLO se persisten eventos válidos.
  let persistence;
  if (deps.ingestStore) {
    try {
      persistence = await persistIngestResponse(
        deps.ingestStore,
        payload as RawWebhookEvent,
      );
    } catch (err) {
      return jsonResponse(
        {
          error: "persistence_failed",
          message: "No se pudo persistir el evento en ingest_responses.",
          details: {
            cause: err instanceof Error ? err.message : String(err),
          },
        },
        500,
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
      ...(mapping.draft
        ? {
            mapping: {
              result: mapping.status,
              message_type: mapping.draft.messageType,
              workflow_step: mapping.draft.workflowStep,
              contribution: mapping.draft.contribution,
              builds_incident: mapping.draft.buildsIncident,
              incident_ready: mapping.draft.incidentReady,
              priority: mapping.draft.priority,
              status: mapping.draft.status,
              verification_status: mapping.draft.verificationStatus,
              source: mapping.draft.source,
              contact_whatsapp: mapping.draft.contactWhatsapp ?? null,
              location_pending_geocoding: mapping.draft.locationPendingGeocoding,
            },
          }
        : {}),
    },
    200,
  );
}
