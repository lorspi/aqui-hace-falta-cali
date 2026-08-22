// =============================================================================
// webhook/handler.ts — Lógica HTTP del endpoint receptor de eventos (S2)
// Ticket: DEV-32
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
// =============================================================================

import { validateWebhookEvent } from "../_shared/webhook-event.ts";

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

/** Endpoint receptor de eventos crudos del webhook del equipo de conversación. */
export async function handleWebhookEvent(req: Request): Promise<Response> {
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

  // ACK: evento aceptado. La persistencia (S4), el mapeo (S3/S5) y la
  // idempotencia (S6) se delegan a capas posteriores; aquí no se persiste.
  return jsonResponse(
    {
      ok: true,
      status: "accepted",
      event_id: result.event.id,
      type: result.event.type,
      message: "Evento aceptado.",
    },
    200,
  );
}
