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
// Unit Tests — US-1: Recepción, validación, mapeo y persistencia idempotente
// de eventos del webhook (DEV-40)
//
// Suite CONSOLIDADA de aceptación de la user story US-1. Cubre los 13
// escenarios Gherkin de la historia de forma integrada sobre el endpoint HTTP
// (`handleWebhookEvent`), reutilizando la lógica ya implementada en S2-S7.
//
//  1. Evento válido → 200 con event_id, type, mapping y resultado de persistencia.
//  2. El mapping resume la normalización del mensaje en un borrador de necesidad.
//  3. Body no parseable o vacío → 400 invalid_json.
//  4. Campos mínimos faltantes/inválidos → 400 validation_failed (sin persistir).
//  5. Reenvío del mismo event.id → 409 duplicate_event sin re-procesar.
//  6. Evento sin event.id → 400 validation_failed sin evaluar deduplicación.
//  7. Error de persistencia → 500 persistence_failed genérico + logError.
//  8. Autenticación abierta (deuda reconocida → S8).
//  9. Evento sin coordenadas → 200 location_pending_geocoding=true.
// 10. conversation_id plano o data.conversation_id.
// 11. Los adjuntos viajan dentro del raw_event (sin tablas separadas).
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

/** Evento con adjuntos (imágenes) dentro del payload, sin tablas separadas. */
function buildEventWithAttachments(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_att_1",
    type: "message.received",
    conversation_id: "conv_att_1",
    data: {
      body: "Te adjunto la foto del daño",
      from: "573001234567",
      message_type: "image",
      workflow: { step: "awaiting_details" },
      attachments: [
        { type: "image", url: "https://media.example.com/foto.jpg", mime: "image/jpeg" },
        { type: "image", url: "https://media.example.com/foto2.jpg", mime: "image/jpeg" },
      ],
    },
    ...overrides,
  };
}

/** POST básico sin store (acepta eventos pero no persiste). */
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

/** POST con store de ingest_responses (persistencia S4). */
async function postWithStore(
  store: ReturnType<typeof createInMemoryIngestResponsesStore>,
  payload: unknown,
  extraDeps: Parameters<typeof handleWebhookEvent>[1] = {},
): Promise<Response> {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }),
    { ingestStore: store, ...extraDeps },
  );
}

// ============================================================================
// Escenario 1: Un evento válido se recibe, valida, mapea y persiste
// ============================================================================

describe("US-1 — Un evento válido se recibe, valida, mapea y persiste de forma idempotente", () => {
  it("responde 200 con event_id, type, mapping y el resultado de la persistencia", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt_us1_1" });

    const res = await postWithStore(store, event);
    expect(res.status).toBe(200);
    const body = await res.json();

    // El ACK devuelve event_id, type, el resumen del mapeo y el resultado de
    // la persistencia.
    expect(body.ok).toBe(true);
    expect(body.status).toBe("accepted");
    expect(body.event_id).toBe("evt_us1_1");
    expect(body.type).toBe("message.received");
    expect(body.mapping).toBeDefined();
    expect(body.persisted).toBe(true);
    expect(body.duplicate).toBe(false);
    expect(body.record.processing_status).toBe("RECEIVED");
  });

  it("crea una fila en ingest_responses con processing_status=RECEIVED y raw_event intacto", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt_us1_1" });

    await postWithStore(store, event);

    const row = store.get("evt_us1_1")!;
    expect(row.processing_status).toBe("RECEIVED");
    // raw_event guarda el JSON completo del evento SIN modificar.
    expect(row.raw_event).toEqual(event);
    // Metadatos copiados para trazabilidad.
    expect(row.event_id).toBe("evt_us1_1");
    expect(row.type).toBe("message.received");
    expect(row.conversation_id).toBe("conv_001");
    expect(row.from).toBe("573001234567");
    expect(row.body).toBe("Necesito agua potable en mi barrio");
    expect(row.received_at).toBeTruthy();
    expect(row.created_at).toBeTruthy();
  });
});

// ============================================================================
// Escenario 2: El mapping resume la normalización del mensaje
// ============================================================================

describe("US-1 — El mapping resume la normalización del mensaje en un borrador de necesidad", () => {
  it("incluye message_type normalizado, workflow.step normalizado, contact_whatsapp y builds_incident", async () => {
    const res = await post(
      buildValidEvent({
        data: {
          body: "Necesito agua potable",
          from: "573001234567",
          message_type: "Text",
          workflow: { step: "AWAITING_LOCATION" },
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mapping.result).toBe("mapped");
    // message_type normalizado a canónico.
    expect(body.mapping.message_type).toBe("TEXT");
    // workflow.step normalizado a canónico.
    expect(body.mapping.workflow_step).toBe("AWAITING_LOCATION");
    expect(body.mapping.contact_whatsapp).toBe("573001234567");
    expect(body.mapping.builds_incident).toBe(true);
    // Defaults del contrato S3.
    expect(body.mapping.priority).toBe("MEDIUM");
    expect(body.mapping.status).toBe("NEED_HELP_NOW");
    expect(body.mapping.verification_status).toBe("PENDING_VERIFICATION");
    expect(body.mapping.source).toBe("WhatsApp");
  });

  it("deja el borrador de necesidad listo para enriquecerse y persistirse en etapas posteriores", async () => {
    // El ACK 200 incluye el borrador mapeado (mapping) y la persistencia ya
    // guardó la fila; el incidente (S5) se crea en etapas posteriores.
    const store = createInMemoryIngestResponsesStore();
    const res = await postWithStore(store, buildValidEvent({ id: "evt_us1_map" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mapping.builds_incident).toBe(true);
    expect(body.mapping.incident_ready).toBe(false);
    expect(body.persisted).toBe(true);
    // El borrador queda disponible (via ingest_responses) para el incidente.
    expect(store.get("evt_us1_map")).toBeDefined();
  });
});

// ============================================================================
// Escenario 3: Body no parseable o vacío → 400 invalid_json
// ============================================================================

describe("US-1 — Un body no parseable o vacío responde 400 invalid_json", () => {
  it("responde 400 con code=invalid_json, detalle y no persiste", async () => {
    const store = createInMemoryIngestResponsesStore();
    for (const raw of ["", "   ", "{not json", "undefined", '{"id":']) {
      const res = await postWithStore(store, raw);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("invalid_json");
      // El detalle explica el problema del body.
      expect(body.message.toLowerCase()).toContain("json");
      expect(body.details.issues).toBeDefined();
      expect(body.details.issues[0].message.length).toBeGreaterThan(0);
      // No se persiste ninguna fila.
      expect(store.size()).toBe(0);
    }
  });
});

// ============================================================================
// Escenario 4: Campos mínimos faltantes/inválidos → 400 validation_failed
// ============================================================================

describe("US-1 — Campos mínimos faltantes o inválidos responden 400 validation_failed", () => {
  it.each([
    ["id", { id: undefined }],
    ["id vacío", { id: "" }],
    ["id inválido (numérico)", { id: 42 }],
    ["type", { type: undefined }],
    ["type vacío", { type: "" }],
    ["conversation_id", { conversation_id: undefined }],
    ["conversation_id vacío", { conversation_id: "" }],
    ["body", { data: { from: "573001234567" }, body: undefined }],
    ["body vacío", { data: { body: "" }, body: undefined }],
  ])(
    "sin el campo %s → 400 con code=validation_failed señalando el campo y sin persistir",
    async (_label, override) => {
      const store = createInMemoryIngestResponsesStore();
      const res = await postWithStore(store, buildValidEvent(override));
      expect(res.status).toBe(400);
      const body = await res.json();

      expect(body.code).toBe("validation_failed");
      expect(body.details.issues).toBeDefined();
      for (const issue of body.details.issues) {
        expect(issue.path).toBeDefined();
        expect(typeof issue.message).toBe("string");
        expect(issue.message.length).toBeGreaterThan(0);
      }
      // No se persiste ninguna fila.
      expect(store.size()).toBe(0);
    },
  );

  it("cuando faltan los 4 campos mínimos, el detalle señala todos", async () => {
    const store = createInMemoryIngestResponsesStore();
    const res = await postWithStore(store, { data: { from: "573001234567" } });
    expect(res.status).toBe(400);
    const body = await res.json();
    const issuePaths = body.details.issues.map((i: { path: string[] }) =>
      i.path.join("."),
    );
    for (const field of MINIMAL_FIELDS) {
      expect(issuePaths).toContain(field);
    }
    expect(store.size()).toBe(0);
  });
});

// ============================================================================
// Escenario 5: Reenvío del mismo event.id → 409 duplicate_event sin re-procesar
// ============================================================================

describe("US-1 — El reenvío del mismo event.id responde 409 duplicate_event sin re-procesar", () => {
  it("responde 409 con details.record (fila existente) y no crea una fila nueva", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt_us1_dup" });

    const first = await postWithStore(store, event);
    expect(first.status).toBe(200);
    expect((await first.json()).persisted).toBe(true);

    // Reenvío del mismo event.id (aunque el body cambie) → 409.
    const resend = await postWithStore(
      store,
      buildValidEvent({ id: "evt_us1_dup", data: { body: "Body MODIFICADO" } }),
    );
    expect(resend.status).toBe(409);
    const body = await resend.json();

    expect(body.code).toBe("duplicate_event");
    expect(body.details.event_id).toBe("evt_us1_dup");
    // details.record incluye la fila existente en ingest_responses.
    expect(body.details.record.event_id).toBe("evt_us1_dup");
    expect(body.details.record.processing_status).toBe("RECEIVED");

    // No se crea una fila nueva.
    expect(store.size()).toBe(1);
    // La fila original conserva su raw_event intacto.
    expect(store.get("evt_us1_dup")!.raw_event).toEqual(event);
  });

  it("no re-ejecuta el mapeo: el 409 NO incluye la sección mapping", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ id: "evt_us1_nomap" });
    await postWithStore(store, event);

    const resend = await postWithStore(store, event);
    expect(resend.status).toBe(409);
    const body = await resend.json();

    // US-1: el reenvío se corta en la capa de ingestión ANTES del mapeo (S3).
    expect(body.code).toBe("duplicate_event");
    expect(body.mapping).toBeUndefined();
  });

  it("no re-ejecuta la creación del incidente en un reenvío del completado", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Acumula un mensaje y completa la conversación → se crea el incidente.
    await postWithStore(
      ingest,
      buildValidEvent({
        id: "evt_us1_msg",
        conversation_id: "conv_us1_inc",
        data: { body: "Necesito ayuda", from: "573001234567" },
      }),
      { incidentService: { needsStore: needs } },
    );

    const completion = {
      id: "evt_us1_comp",
      type: "conversation_completed",
      conversation_id: "conv_us1_inc",
      data: { body: "Conversación finalizada", from: "573001234567" },
    };
    const first = await postWithStore(ingest, completion, {
      incidentService: { needsStore: needs },
    });
    expect(first.status).toBe(200);
    expect((await first.json()).incident.outcome).toBe("created");
    expect(needs.size()).toBe(1);

    // Reenvío del mismo completado → 409; no se re-crea el incidente.
    const resend = await postWithStore(ingest, completion, {
      incidentService: { needsStore: needs },
    });
    expect(resend.status).toBe(409);
    const body = await resend.json();
    expect(body.code).toBe("duplicate_event");
    expect(body.incident).toBeUndefined();
    expect(needs.size()).toBe(1);
  });
});

// ============================================================================
// Escenario 6: Evento sin event.id → 400 sin evaluar deduplicación
// ============================================================================

describe("US-1 — Un evento sin event.id se rechaza sin evaluar deduplicación", () => {
  it("responde 400 validation_failed señalando el campo, no persiste y no evalúa deduplicación", async () => {
    // Un store espía que fallaría si se le consulta/inserta demuestra que la
    // deduplicación nunca se evalúa (el evento sin id se rechaza ANTES).
    const needs = createInMemoryNeedsStore();
    let storeTouched = false;
    const spyingStore: ReturnType<typeof createInMemoryIngestResponsesStore> = {
      size() {
        storeTouched = true;
        return 0;
      },
      all() {
        storeTouched = true;
        return [];
      },
      get() {
        storeTouched = true;
        return undefined;
      },
      async insertIfAbsent() {
        storeTouched = true;
        throw new Error("no debería invocarse la deduplicación");
      },
      async listByConversationId() {
        storeTouched = true;
        return [];
      },
    };

    for (const id of [undefined, "", "   ", null]) {
      storeTouched = false;
      const res = await postWithStore(
        spyingStore,
        buildValidEvent({ id, data: { body: "Sin id" } }),
        { incidentService: { needsStore: needs } },
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("validation_failed");
      const issuePaths = body.details.issues.map((i: { path: string[] }) =>
        i.path.join("."),
      );
      expect(issuePaths).toContain("id");
      // No se persiste y no se evalúa la deduplicación.
      expect(storeTouched).toBe(false);
      expect(needs.size()).toBe(0);
    }
  });
});

// ============================================================================
// Escenario 7: Error de persistencia → 500 persistence_failed genérico
// ============================================================================

describe("US-1 — Un error de persistencia responde 500 persistence_failed con mensaje genérico", () => {
  it("responde 500 genérico (sin detalles internos) y registra el error real vía logError", async () => {
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
    expect(body.code).toBe("persistence_failed");
    // Mensaje genérico: no expone detalles internos.
    expect(body.details?.cause).toBeUndefined();
    expect(body.message).not.toContain("password authentication failed");
    expect(body.message).not.toContain("postgres");
    // El error real se registra server-side vía logError.
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError.mock.calls[0][0]).toBe("persistence_failed");
  });
});

// ============================================================================
// Escenario 8: Autenticación abierta (deuda reconocida → S8)
// ============================================================================

describe("US-1 — El endpoint acepta peticiones sin autenticación (deuda reconocida)", () => {
  it("procesa normalmente un POST válido sin token ni credenciales", async () => {
    const store = createInMemoryIngestResponsesStore();
    const req = new Request(
      "http://127.0.0.1:54321/functions/v1/webhook/events",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildValidEvent({ id: "evt_us1_noauth" })),
      },
    );
    const res = await handleWebhookEvent(req, { ingestStore: store });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.event_id).toBe("evt_us1_noauth");
    expect(body.persisted).toBe(true);
    // Sin autenticación; la deuda se resuelve como historia de seguridad (S8).
  });
});

// ============================================================================
// Escenario 9: Evento sin coordenadas → 200 location_pending_geocoding=true
// ============================================================================

describe("US-1 — Un evento sin coordenadas se acepta y deja el geocoding pendiente", () => {
  it("responde 200 con mapping.location_pending_geocoding=true", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({
      id: "evt_us1_nocoords",
      data: { body: "Necesito ayuda pero no tengo la dirección", from: "573001234567" },
    });

    const res = await postWithStore(store, event);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mapping.location_pending_geocoding).toBe(true);
    // El borrador de necesidad queda con la ubicación pendiente de
    // enriquecimiento (geocoding + ciudad, S5).
    expect(body.persisted).toBe(true);
  });

  it("la validación pura no exige lat/lng ni dirección", () => {
    const result = validateWebhookEvent(
      buildValidEvent({ data: { body: "Sin coordenadas" } }),
    );
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// Escenario 10: conversation_id plano o data.conversation_id
// ============================================================================

describe("US-1 — La agrupación por conversación soporta conversation_id plano o data.conversation_id", () => {
  it("persiste la fila con conversation_id plano", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({
      id: "evt_us1_flat",
      conversation_id: "conv_flat_1",
    });
    await postWithStore(store, event);
    expect(store.get("evt_us1_flat")!.conversation_id).toBe("conv_flat_1");
  });

  it("persiste la fila con conversation_id en data.conversation_id (shape documentado)", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({
      id: "evt_us1_data",
      conversation_id: undefined,
      data: {
        conversation_id: "conv_data_1",
        body: "Necesito ayuda",
        from: "573001234567",
      },
    });
    const res = await postWithStore(store, event);
    expect(res.status).toBe(200);
    expect(store.get("evt_us1_data")!.conversation_id).toBe("conv_data_1");
  });

  it("prefiere conversation_id plano cuando vienen ambos", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({
      id: "evt_us1_both",
      conversation_id: "conv_flat_2",
      data: { conversation_id: "conv_data_2", body: "Necesito ayuda", from: "573001234567" },
    });
    await postWithStore(store, event);
    expect(store.get("evt_us1_both")!.conversation_id).toBe("conv_flat_2");
  });
});

// ============================================================================
// Escenario 11: Los adjuntos viajan dentro del raw_event (sin tablas separadas)
// ============================================================================

describe("US-1 — Los adjuntos viajan dentro del raw_event sin tablas separadas", () => {
  it("persiste raw_event completo con los adjuntos dentro y sin tablas messages/attachments", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildEventWithAttachments();

    const res = await postWithStore(store, event);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.persisted).toBe(true);

    const row = store.get("evt_att_1")!;
    // raw_event guarda el JSON completo del evento, adjuntos incluidos.
    expect(row.raw_event).toEqual(event);
    const attachments = (row.raw_event as Record<string, any>).data.attachments;
    expect(attachments).toHaveLength(2);
    expect(attachments[0].url).toBe("https://media.example.com/foto.jpg");
    // message_type normalizado (image → IMAGE).
    expect(row.message_type).toBe("IMAGE");
  });

  it("un evento con adjuntos se mapea sin invalidarse", async () => {
    const res = await post(buildEventWithAttachments());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mapping).toBeDefined();
    expect(body.mapping.message_type).toBe("IMAGE");
    expect(body.mapping.builds_incident).toBe(true);
  });
});
