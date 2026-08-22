import { describe, it, expect } from "vitest";
import { handleWebhookEvent } from "../../supabase/functions/webhook/handler.ts";
import {
  validateWebhookEvent,
  MINIMAL_FIELDS,
} from "../../supabase/functions/_shared/webhook-event.ts";

// ============================================================================
// Unit Tests — S2: Endpoint receptor de eventos (DEV-32)
//
// Cubren los escenarios Gherkin de la historia S2 en dos niveles:
//   1. HTTP (handleWebhookEvent): status codes y contracto de respuesta.
//   2. Validación pura (validateWebhookEvent): estructura mínima del body.
// ============================================================================

/** Construye un evento crudo válido según el contrato documentado. */
function buildValidEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_001",
    type: "message.received",
    conversation_id: "conv_001",
    data: {
      body: "Necesito agua potable en mi barrio",
      from: "573001234567",
      message_type: "text",
      workflow: { step: "awaiting_location" },
    },
    ...overrides,
  };
}

async function post(
  payload: unknown,
  contentType = "application/json",
): Promise<Response> {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    }),
  );
}

// ============================================================================
// Escenarios HTTP del endpoint
// ============================================================================

describe("S2 — Endpoint POST /webhook/events", () => {
  it("acepta un evento crudo válido y responde 200", async () => {
    const res = await post(buildValidEvent());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("accepted");
    expect(body.event_id).toBe("evt_001");
    expect(body.type).toBe("message.received");
  });

  it("acepta eventos de cualquier type, incluido conversation_completed", async () => {
    for (const type of [
      "message.received",
      "conversation_completed",
      "conversation_started",
      "otro.tipo.desconocido",
    ]) {
      const res = await post(buildValidEvent({ type }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe(type);
    }
  });

  it("el type del evento no condiciona su aceptación en el endpoint", async () => {
    // Mismo evento variando solo type → siempre 200.
    const res = await post(buildValidEvent({ type: "conversation_completed" }));
    expect(res.status).toBe(200);
  });

  it("rechaza un body vacío (no parseable como JSON) con 400 y detalle", async () => {
    for (const raw of ["", "   ", "{not json", "undefined"]) {
      const res = await post(raw);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("invalid_json");
      expect(body.message.toLowerCase()).toContain("json");
      expect(body.details.issues).toBeDefined();
    }
  });

  it("rechaza un evento con campos mínimos faltantes con 400 y errores detallados", async () => {
    // Sin id, sin type, sin conversation_id y sin body.
    const res = await post({
      data: { from: "573001234567" },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("validation_failed");

    const issuePaths = body.details.issues.map((i: { path: string[] }) =>
      i.path.join("."),
    );
    for (const field of MINIMAL_FIELDS) {
      expect(issuePaths).toContain(field);
    }
  });

  it("un reenvío con el mismo event_id se acepta en el endpoint (200)", async () => {
    const event = buildValidEvent();
    const first = await post(event);
    const resend = await post(event);

    expect(first.status).toBe(200);
    expect(resend.status).toBe(200);
    // La deduplicación se delega a la capa de idempotencia (S4/S6).
    const body = await resend.json();
    expect(body.event_id).toBe(event.id);
  });

  it("acepta peticiones sin autenticación (200)", async () => {
    const req = new Request(
      "http://127.0.0.1:54321/functions/v1/webhook/events",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidEvent()),
      },
    );
    const res = await handleWebhookEvent(req);
    expect(res.status).toBe(200);
  });

  it("acepta un evento sin coordenadas (200)", async () => {
    // Evento crudo con estructura mínima pero sin latitud/longitud ni ciudad.
    const res = await post(buildValidEvent({ data: { body: "Necesito ayuda" } }));
    expect(res.status).toBe(200);
  });

  it("responde 200 por cada evento de una ráfaga", async () => {
    const events = [1, 2, 3, 4, 5].map((n) =>
      buildValidEvent({ id: `evt_burst_${n}`, data: { body: `Mensaje ${n}` } }),
    );

    for (const event of events) {
      const res = await post(event);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.event_id).toBe(event.id);
    }
  });

  it("el ACK 200 incluye el mapeo a borrador de Need (S3) con defaults", async () => {
    const res = await post(buildValidEvent());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mapping).toBeDefined();
    expect(body.mapping.result).toBe("mapped");
    expect(body.mapping.message_type).toBe("TEXT");
    expect(body.mapping.workflow_step).toBe("AWAITING_LOCATION");
    expect(body.mapping.priority).toBe("MEDIUM");
    expect(body.mapping.status).toBe("NEED_HELP_NOW");
    expect(body.mapping.verification_status).toBe("PENDING_VERIFICATION");
    expect(body.mapping.source).toBe("WhatsApp");
    expect(body.mapping.contact_whatsapp).toBe("573001234567");
    expect(body.mapping.builds_incident).toBe(true);
    expect(body.mapping.location_pending_geocoding).toBe(true);
  });

  it("el ACK de un type distinto a message.received mapea sin armar incidente (S3)", async () => {
    const res = await post(buildValidEvent({ type: "conversation_completed" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mapping).toBeDefined();
    expect(body.mapping.builds_incident).toBe(false);
    expect(body.mapping.incident_ready).toBe(true);
  });

  it("rechaza métodos distintos de POST con 405", async () => {
    const res = await handleWebhookEvent(
      new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
        method: "GET",
      }),
    );
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toBe("method_not_allowed");
  });

  it("rechaza Content-Type distinto de application/json con 415", async () => {
    const res = await post(
      JSON.stringify(buildValidEvent()),
      "text/plain",
    );
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error).toBe("invalid_content_type");
  });

  it("responde OPTIONS (preflight CORS) con 204", async () => {
    const res = await handleWebhookEvent(
      new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
        method: "OPTIONS",
      }),
    );
    expect(res.status).toBe(204);
  });
});

// ============================================================================
// Escenarios de validación pura (estructura mínima)
// ============================================================================

describe("S2 — Validación de estructura mínima (validateWebhookEvent)", () => {
  it("valida un evento crudo con los 4 campos mínimos (data.body)", () => {
    const result = validateWebhookEvent(buildValidEvent());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.event).toEqual({
      id: "evt_001",
      type: "message.received",
      conversationId: "conv_001",
      body: "Necesito agua potable en mi barrio",
    });
  });

  it("acepta un body plano (body en lugar de data.body)", () => {
    const result = validateWebhookEvent(
      buildValidEvent({
        body: "Mensaje plano",
        data: undefined,
      }),
    );
    expect(result.valid).toBe(true);
    expect(result.event.body).toBe("Mensaje plano");
  });

  it("rechaza un body que no es un objeto JSON", () => {
    for (const bad of [null, "texto", 42, true, [1, 2, 3]]) {
      const result = validateWebhookEvent(bad);
      expect(result.valid).toBe(false);
    }
  });

  it("rechaza id faltante o con formato inválido", () => {
    for (const id of [undefined, "", "   ", 42, null]) {
      const result = validateWebhookEvent(buildValidEvent({ id }));
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path.join(".") === "id")).toBe(true);
    }
  });

  it("rechaza type faltante o con formato inválido", () => {
    for (const type of [undefined, "", "   ", 42, null]) {
      const result = validateWebhookEvent(buildValidEvent({ type }));
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path.join(".") === "type")).toBe(true);
    }
  });

  it("rechaza conversation_id faltante o con formato inválido", () => {
    for (const conversation_id of [undefined, "", "   ", 42, null]) {
      const result = validateWebhookEvent(buildValidEvent({ conversation_id }));
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((i) => i.path.join(".") === "conversation_id"),
      ).toBe(true);
    }
  });

  it("rechaza body faltante (ni data.body ni body)", () => {
    const result = validateWebhookEvent(
      buildValidEvent({ data: { from: "573001234567" }, body: undefined }),
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.path.join(".") === "body")).toBe(true);
  });

  it("rechaza body vacío o con formato inválido", () => {
    for (const body of ["", "   ", 42, true]) {
      const result = validateWebhookEvent(
        buildValidEvent({ data: { body }, body: undefined }),
      );
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path.join(".") === "body")).toBe(true);
    }
  });

  it("acepta un evento sin coordenadas (lat/lng no requeridos)", () => {
    const result = validateWebhookEvent(
      buildValidEvent({ data: { body: "Sin coordenadas" } }),
    );
    expect(result.valid).toBe(true);
  });
});
