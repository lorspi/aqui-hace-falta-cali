import { describe, it, expect, vi } from "vitest";
import { handleWebhookEvent } from "../../supabase/functions/webhook/handler.ts";
import {
  validateWebhookEvent,
  MINIMAL_FIELDS,
} from "../../supabase/functions/_shared/webhook-event.ts";
import {
  createInMemoryIngestResponsesStore,
  type IngestResponsesStore,
} from "../../supabase/functions/_shared/ingest-persistence.ts";
import { createInMemoryNeedsStore } from "../../supabase/functions/_shared/needs-store.ts";

// ============================================================================
// Unit Tests — S7: Confirmación al remitente (ACK) (DEV-37)
//
// Cubren los escenarios Gherkin de la historia S7:
//   1. Evento válido se confirma con 200 → el ACK devuelve el `event.id`.
//   2. Body que no es JSON válido devuelve 400 → error estructurado (code+message).
//   3. Evento con un campo requerido faltante devuelve 400 → el error
//      estructurado indica el campo faltante (event.id / type /
//      data.conversation_id / data.body).
//   4. Evento con tipo de dato inválido devuelve 400 → el error estructurado
//      detalla la causa de validación.
//   5. Reenvío del mismo event.id devuelve 409 → error estructurado indicando
//      que el evento ya fue recibido y NO se crea un duplicado en
//      ingest_responses.
//   6. Fallo interno de persistencia devuelve 500 → error estructurado
//      GENÉRICO (sin exponer detalles internos).
//   7. Evento de completado sin coordenadas se confirma con 200 → el ACK
//      confirma la recepción aunque falten coordenadas; el enriquecimiento por
//      geocoding queda como paso posterior (no bloquea el ACK).
// ============================================================================

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

function buildCompletion(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_s7_comp",
    type: "conversation_completed",
    conversation_id: "conv_s7_no_coords",
    data: {
      body: "Conversación finalizada",
      from: "573001234567",
      workflow: { step: "completed" },
    },
    ...overrides,
  };
}

async function post(payload: unknown): Promise<Response> {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
  );
}

async function postWith(
  ingestStore: ReturnType<typeof createInMemoryIngestResponsesStore>,
  payload: unknown,
): Promise<Response> {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
    { ingestStore },
  );
}

// ============================================================================
// Escenario 1: Evento válido se confirma con 200
// ============================================================================

describe("S7 — Un evento válido se confirma con 200", () => {
  it("responde 200 OK y el ACK confirma la recepción devolviendo el event.id", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt_ack_1" });

    const res = await postWith(store, event);
    expect(res.status).toBe(200);
    const body = await res.json();

    // El ACK confirma la recepción.
    expect(body.ok).toBe(true);
    expect(body.status).toBe("accepted");
    // Y devuelve el event.id del evento.
    expect(body.event_id).toBe("evt_ack_1");
    expect(body.type).toBe("message.received");
    expect(body.persisted).toBe(true);
  });

  it("responde 200 por cada evento de una ráfaga y el ACK devuelve cada event.id", async () => {
    const store = createInMemoryIngestResponsesStore();
    for (const n of [1, 2, 3]) {
      const res = await postWith(store, buildValidEvent({ id: `evt_ack_${n}` }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.event_id).toBe(`evt_ack_${n}`);
    }
    expect(store.size()).toBe(3);
  });
});

// ============================================================================
// Escenario 2: Body que no es JSON válido devuelve 400
// ============================================================================

describe("S7 — Un body que no es JSON válido devuelve 400", () => {
  it("responde 400 y el error es estructurado con code y message", async () => {
    for (const raw of ["", "   ", "{not json", "undefined", '{"id":'] ) {
      const res = await post(raw);
      expect(res.status).toBe(400);
      const body = await res.json();

      // Error estructurado con code y message.
      expect(body.code).toBe("invalid_json");
      expect(typeof body.message).toBe("string");
      expect(body.message.length).toBeGreaterThan(0);
      expect(body.details.issues).toBeDefined();
    }
  });
});

// ============================================================================
// Escenario 3: Evento con un campo requerido faltante devuelve 400
// ============================================================================

describe("S7 — Un evento con un campo requerido faltante devuelve 400", () => {
  it.each([
    ["event.id", { id: undefined }, "id"],
    ["event.id vacío", { id: "" }, "id"],
    ["type", { type: undefined }, "type"],
    ["type vacío", { type: "" }, "type"],
    ["data.conversation_id", { conversation_id: undefined }, "conversation_id"],
    ["data.conversation_id vacío", { conversation_id: "" }, "conversation_id"],
    ["data.body", { data: { from: "573001234567" }, body: undefined }, "body"],
  ])(
    "sin el campo %s → 400 con error estructurado indicando el campo faltante",
    async (_label, override, expectedPath) => {
      const store = createInMemoryIngestResponsesStore();
      const res = await postWith(store, buildValidEvent(override));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe("validation_failed");
      expect(body.message).toBeTruthy();

      // El error estructurado indica el campo faltante (<campo>).
      const issuePaths = body.details.issues.map((i: { path: (string | number)[] }) =>
        i.path.join("."),
      );
      expect(issuePaths).toContain(expectedPath);

      // No se persiste nada.
      expect(store.size()).toBe(0);
    },
  );

  it("la validación pura señala los 4 campos mínimos cuando faltan", () => {
    const result = validateWebhookEvent({ data: { from: "573001234567" } });
    expect(result.valid).toBe(false);
    const paths = result.issues.map((i) => i.path.join("."));
    for (const field of MINIMAL_FIELDS) {
      expect(paths).toContain(field);
    }
  });
});

// ============================================================================
// Escenario 4: Evento con tipo de dato inválido devuelve 400
// ============================================================================

describe("S7 — Un evento con tipo de dato inválido devuelve 400", () => {
  it.each([
    ["id numérico", { id: 42 }],
    ["type numérico", { type: 42 }],
    ["conversation_id numérico", { conversation_id: 42 }],
    ["body numérico", { data: { body: 42 }, body: undefined }],
    ["body booleano", { data: { body: true }, body: undefined }],
  ])("con %s → 400 con error estructurado que detalla la causa de validación", async (_label, override) => {
    const res = await post(buildValidEvent(override));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.code).toBe("validation_failed");

    // El error estructurado detalla la causa de validación (issues con path y message).
    expect(Array.isArray(body.details.issues)).toBe(true);
    for (const issue of body.details.issues) {
      expect(typeof issue.path).toBe("object");
      expect(typeof issue.message).toBe("string");
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Escenario 5: Reenvío del mismo event.id devuelve 409
// ============================================================================

describe("S7 — El reenvío del mismo event.id devuelve 409", () => {
  it("responde 409 Conflict, el error indica que el evento ya fue recibido y NO crea un duplicado en ingest_responses", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt-123" });

    // Primer envío → 200 y se persiste.
    const first = await postWith(store, event);
    expect(first.status).toBe(200);
    expect((await first.json()).persisted).toBe(true);
    expect(store.size()).toBe(1);

    // Reenvío del mismo event.id → 409 Conflict.
    const resend = await postWith(store, event);
    expect(resend.status).toBe(409);
    const body = await resend.json();

    // El error estructurado indica que el evento ya fue recibido.
    expect(body.code).toBe("duplicate_event");
    expect(body.message).toContain("ya fue recibido");
    expect(body.message).toContain("evt-123");
    // La fila existente viaja en details para trazabilidad del remitente.
    expect(body.details.event_id).toBe("evt-123");
    expect(body.details.record.event_id).toBe("evt-123");

    // NO se crea un duplicado en ingest_responses.
    expect(store.size()).toBe(1);
    expect(store.all().filter((r) => r.event_id === "evt-123")).toHaveLength(1);
  });

  it("el reenvío con el mismo event.id pero body distinto tampoco duplica", async () => {
    const store = createInMemoryIngestResponsesStore();
    const original = buildValidEvent({ id: "evt-123", data: { body: "Original" } });

    const first = await postWith(store, original);
    expect(first.status).toBe(200);

    const resend = await postWith(
      store,
      buildValidEvent({ id: "evt-123", data: { body: "Modificado" } }),
    );
    expect(resend.status).toBe(409);
    const body = await resend.json();
    expect(body.code).toBe("duplicate_event");

    // La fila original se conserva intacta.
    expect(store.get("evt-123")!.raw_event).toEqual(original);
    expect(store.size()).toBe(1);
  });
});

// ============================================================================
// Escenario 6: Fallo interno de persistencia devuelve 500
// ============================================================================

describe("S7 — Un fallo interno de persistencia devuelve 500", () => {
  it("responde 500 con error estructurado GENÉRICO (sin exponer detalles internos)", async () => {
    const failingStore: IngestResponsesStore = {
      async insertIfAbsent() {
        throw new Error("connection to postgres failed: password authentication failed");
      },
    };
    const logError = vi.fn();

    const res = await handleWebhookEvent(
      new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidEvent()),
      }),
      { ingestStore: failingStore, logError },
    );

    expect(res.status).toBe(500);
    const body = await res.json();

    // Error estructurado con code y message.
    expect(body.code).toBe("persistence_failed");
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);

    // GENÉRICO: no expone la causa interna (ni detalles.cause, ni el mensaje
    // del error de conexión).
    expect(body.details?.cause).toBeUndefined();
    expect(body.message).not.toContain("password authentication failed");
    expect(body.message).not.toContain("postgres");

    // La causa real queda registrada server-side vía logError (trazabilidad).
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0][0]).toBe("persistence_failed");
  });
});

// ============================================================================
// Escenario 7: Evento de completado sin coordenadas se confirma con 200
// ============================================================================

describe("S7 — Un evento de completado sin coordenadas se confirma con 200", () => {
  it("el ACK confirma la recepción aunque falten coordenadas y el geocoding queda como paso posterior", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Acumula un mensaje previo para que el completado tenga datos.
    const msgRes = await postWith(
      ingest,
      buildValidEvent({
        id: "evt_s7_msg",
        conversation_id: "conv_s7_no_coords",
        data: { body: "Necesito ayuda, sin datos de ubicación", from: "573001234567" },
      }),
    );
    expect(msgRes.status).toBe(200);

    // Completado SIN coordenadas.
    const res = await handleWebhookEvent(
      new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildCompletion()),
      }),
      { ingestStore: ingest, incidentService: { needsStore: needs } },
    );

    // El ACK confirma la recepción del completado aunque falten coordenadas.
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("accepted");
    expect(body.event_id).toBe("evt_s7_comp");

    // El incidente se crea igual; el enriquecimiento por geocoding queda como
    // paso posterior (lat/lng NULL y PENDING): no bloquea el ACK.
    expect(body.incident).toBeDefined();
    expect(body.incident.outcome).toBe("created");
    expect(body.incident.latitude).toBeNull();
    expect(body.incident.longitude).toBeNull();
    expect(body.incident.location_enrichment_status).toBe("PENDING");
  });
});
