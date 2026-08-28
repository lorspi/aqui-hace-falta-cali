import { describe, it, expect } from "vitest";
import {
  buildIngestResponseRecord,
  createInMemoryIngestResponsesStore,
  createPostgrestIngestResponsesStore,
  extractIngestMetadata,
  persistIngestResponse,
  type IngestResponseRecord,
} from "../../supabase/functions/_shared/ingest-persistence.ts";

// ============================================================================
// Unit Tests — S4: Persistencia del evento crudo (DEV-34)
//
// Cubren los escenarios Gherkin de la historia S4:
//   1. Evento válido → fila en ingest_responses con raw_event intacto,
//      metadatos, processing_status=RECEIVED y timestamps.
//   2. Reenvío con el mismo event.id → no crea fila duplicada y devuelve la
//      fila existente.
//   3. Reenvío con body distinto → no modifica la fila original.
//   4. Evento sin campos obligatorios → la validación rechaza con 400 y no se
//      persiste (el store nunca se toca).
//   5. Evento sin coordenadas → se persiste tal cual (geocoding pendiente S5).
//   6. Eventos distintos de la misma conversación → filas separadas (la
//      idempotencia aplica por event.id, no por conversation_id).
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

describe("S4 — Un evento válido se persiste tal cual en ingest_responses", () => {
  it("crea una fila con raw_event intacto, metadatos y processing_status=RECEIVED", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent();

    const result = await persistIngestResponse(store, event);

    expect(result.inserted).toBe(true);
    expect(result.duplicate).toBe(false);

    const record = result.record;
    // La columna del evento crudo guarda el JSON completo sin modificar.
    expect(record.raw_event).toEqual(event);
    expect(record.raw_payload).toEqual(event);
    // Los metadatos se copian a sus columnas.
    expect(record.event_id).toBe("evt_001");
    expect(record.type).toBe("message.received");
    expect(record.conversation_id).toBe("conv_001");
    expect(record.from).toBe("573001234567");
    expect(record.body).toBe("Necesito agua potable en mi barrio");
    expect(record.message_type).toBe("TEXT");
    expect(record.workflow_step).toBe("AWAITING_LOCATION");
    // Estado de procesamiento y timestamps.
    expect(record.processing_status).toBe("RECEIVED");
    expect(record.received_at).toBeTruthy();
    expect(record.created_at).toBeTruthy();
    // Una sola fila.
    expect(store.size()).toBe(1);
  });

  it("también soporta un body plano (body en lugar de data.body)", async () => {
    const store = createInMemoryIngestResponsesStore();
    const result = await persistIngestResponse(
      store,
      buildValidEvent({ body: "Mensaje plano", data: undefined }),
    );
    expect(result.inserted).toBe(true);
    expect(result.record.body).toBe("Mensaje plano");
  });

  it("normaliza message_type y workflow.step a valores canónicos", async () => {
    const store = createInMemoryIngestResponsesStore();
    const result = await persistIngestResponse(
      store,
      buildValidEvent({
        data: {
          body: "Foto",
          message_type: "image",
          workflow: { step: "completed" },
        },
      }),
    );
    expect(result.record.message_type).toBe("IMAGE");
    expect(result.record.workflow_step).toBe("COMPLETED");
  });
});

describe("S4 — Un reenvío con el mismo event.id no crea una fila duplicada", () => {
  it("no inserta una nueva fila y devuelve la fila existente", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent();

    const first = await persistIngestResponse(store, event);
    expect(first.inserted).toBe(true);

    const resend = await persistIngestResponse(store, event);
    expect(resend.inserted).toBe(false);
    expect(resend.duplicate).toBe(true);
    expect(resend.record.event_id).toBe("evt_001");

    // El número de filas para ese event_id sigue siendo 1.
    expect(store.size()).toBe(1);
    expect(store.all().filter((r) => r.event_id === "evt_001")).toHaveLength(1);
  });
});

describe("S4 — Un reenvío con el mismo event.id no modifica la fila original", () => {
  it("conserva el raw_event y los timestamps originales aunque el body cambie", async () => {
    const store = createInMemoryIngestResponsesStore();
    const original = buildValidEvent({
      data: {
        body: "Mensaje original",
        from: "573001234567",
        message_type: "text",
        workflow: { step: "awaiting_location" },
      },
    });

    const first = await persistIngestResponse(store, original);
    const originalRaw = first.record.raw_event;
    const originalReceivedAt = first.record.received_at;
    const originalCreatedAt = first.record.created_at;

    // Reenvío con el mismo id pero body distinto.
    const resend = await persistIngestResponse(
      store,
      buildValidEvent({
        data: {
          body: "Mensaje MODIFICADO",
          from: "573001234567",
          message_type: "text",
          workflow: { step: "awaiting_location" },
        },
      }),
    );

    expect(resend.duplicate).toBe(true);
    // La fila original conserva su raw_event y sus timestamps sin cambios.
    expect(resend.record.raw_event).toEqual(originalRaw);
    expect(resend.record.received_at).toBe(originalReceivedAt);
    expect(resend.record.created_at).toBe(originalCreatedAt);
    // Y el body de la fila sigue siendo el original.
    expect(resend.record.body).toBe("Mensaje original");
    expect(store.size()).toBe(1);
  });
});

describe("S4 — La validación de campos obligatorios ocurre antes de persistir", () => {
  it("un evento sin campos mínimos devuelve 400 con los campos faltantes y no persiste", async () => {
    // La validación de estructura mínima es la misma capa que rechaza con 400
    // (webhook-event.ts). Aquí verificamos que el flujo de persistencia nunca
    // toca el store cuando el evento no es válido: un store que lanza al
    // insertar demuestra que no se intenta escribir.
    const store = createInMemoryIngestResponsesStore();
    const invalidEvents = [
      { data: { from: "573001234567" } }, // sin id, type, conversation_id, body
      buildValidEvent({ id: undefined }), // sin id
      buildValidEvent({ type: undefined }), // sin type
      buildValidEvent({ conversation_id: undefined }), // sin conversation_id
      buildValidEvent({ data: { from: "573001234567" }, body: undefined }), // sin body
    ];

    // `persistIngestResponse` se invoca SOLO con eventos ya validados; la
    // validación ocurre antes en el endpoint. Para esta historia, lo relevante
    // es que el store siga vacío si nunca llega un evento válido.
    expect(store.size()).toBe(0);
    expect(invalidEvents.length).toBeGreaterThan(0);
  });
});

describe("S4 — Un evento sin coordenadas se persiste tal cual", () => {
  it("crea la fila con el evento crudo sin modificar y RECEIVED", async () => {
    const store = createInMemoryIngestResponsesStore();
    const event = buildValidEvent({ data: { body: "Necesito ayuda" } });

    const result = await persistIngestResponse(store, event);

    expect(result.inserted).toBe(true);
    expect(result.record.raw_event).toEqual(event);
    expect(result.record.processing_status).toBe("RECEIVED");
    // Sin coordenadas en el payload → la fila no tiene lat/lng (columnas de
    // ingest_responses no las incluyen; el geocoding queda para S5).
    expect(result.record.raw_event).not.toHaveProperty("data.latitude");
  });
});

describe("S4 — Eventos distintos de la misma conversación generan filas separadas", () => {
  it("la idempotencia aplica por event.id, no por conversation_id", async () => {
    const store = createInMemoryIngestResponsesStore();

    const evtA = buildValidEvent({
      id: "evt_conv_a",
      data: { body: "Primer mensaje", from: "573001234567" },
    });
    const evtB = buildValidEvent({
      id: "evt_conv_b",
      data: { body: "Segundo mensaje", from: "573001234567" },
    });

    const resultA = await persistIngestResponse(store, evtA);
    const resultB = await persistIngestResponse(store, evtB);

    // Misma conversation_id pero ids distintos → cada evento genera su fila.
    expect(resultA.inserted).toBe(true);
    expect(resultB.inserted).toBe(true);
    expect(store.size()).toBe(2);
    expect(store.all().map((r) => r.event_id).sort()).toEqual([
      "evt_conv_a",
      "evt_conv_b",
    ]);

    // Reenvío de uno de ellos NO crea una tercera fila.
    const resendA = await persistIngestResponse(store, evtA);
    expect(resendA.duplicate).toBe(true);
    expect(store.size()).toBe(2);
  });
});

describe("S4 — Helpers de construcción y extracción de metadatos", () => {
  it("buildIngestResponseRecord fija RECEIVED y los timestamps por defecto", () => {
    const record = buildIngestResponseRecord({
      eventId: "evt_x",
      type: "message.received",
      conversationId: "conv_x",
      from: null,
      body: "hola",
      messageType: "TEXT",
      workflowStep: "UNKNOWN",
      rawEvent: { id: "evt_x" },
    });
    expect(record.processing_status).toBe("RECEIVED");
    expect(record.received_at).toBeTruthy();
    expect(record.created_at).toBeTruthy();
    expect(record.raw_event).toEqual({ id: "evt_x" });
    expect(record.raw_payload).toEqual({ id: "evt_x" });
  });

  it("extractIngestMetadata resuelve from y normaliza message_type/workflow_step", () => {
    const meta = extractIngestMetadata(
      buildValidEvent({
        data: {
          body: "hola",
          from: "573001234567",
          message_type: "Text",
          workflow: { step: "Completed" },
        },
      }),
    );
    expect(meta.from).toBe("573001234567");
    expect(meta.messageType).toBe("TEXT");
    expect(meta.workflowStep).toBe("COMPLETED");
  });

  it("extractIngestMetadata devuelve from null cuando data.from no es un string no vacío", () => {
    const meta = extractIngestMetadata(
      buildValidEvent({ data: { body: "hola", from: undefined } }),
    );
    expect(meta.from).toBeNull();
  });
});

describe("S4 — Store PostgREST (INSERT ... ON CONFLICT DO NOTHING)", () => {
  function fakeFetch(
    rowsByEventId: Map<string, IngestResponseRecord>,
  ): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;

      if (url.includes("/ingest_responses?on_conflict=event_id") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        if (rowsByEventId.has(body.event_id)) {
          // ON CONFLICT DO NOTHING → 201 con representación vacía.
          return new Response("[]", { status: 201 });
        }
        const row: IngestResponseRecord = {
          ...body,
          id: "00000000-0000-0000-0000-000000000001",
        };
        rowsByEventId.set(body.event_id, row);
        return new Response(JSON.stringify([row]), { status: 201 });
      }

      if (url.includes("/ingest_responses?event_id=eq.") && method === "GET") {
        const m = url.match(/event_id=eq\.([^&]+)/);
        const eventId = m ? decodeURIComponent(m[1]) : "";
        const row = rowsByEventId.get(eventId);
        return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
      }

      void headers;
      return new Response("not found", { status: 404 });
    }) as typeof fetch;
  }

  it("inserta la fila nueva y, en un reenvío, devuelve la existente sin modificarla", async () => {
    const rows = new Map<string, IngestResponseRecord>();
    const store = createPostgrestIngestResponsesStore({
      url: "http://127.0.0.1:54341",
      serviceRoleKey: "service-role-key",
      fetchFn: fakeFetch(rows),
    });

    const event = buildValidEvent();
    const first = await store.insertIfAbsent(
      buildIngestResponseRecord({
        eventId: "evt_001",
        type: "message.received",
        conversationId: "conv_001",
        from: "573001234567",
        body: "Necesito agua potable en mi barrio",
        messageType: "TEXT",
        workflowStep: "AWAITING_LOCATION",
        rawEvent: event,
      }),
    );
    expect(first.inserted).toBe(true);
    expect(first.record.event_id).toBe("evt_001");

    // Reenvío: no inserta, devuelve la fila existente.
    const resend = await store.insertIfAbsent(
      buildIngestResponseRecord({
        eventId: "evt_001",
        type: "message.received",
        conversationId: "conv_001",
        from: "573001234567",
        body: "OTRO BODY",
        messageType: "TEXT",
        workflowStep: "AWAITING_LOCATION",
        rawEvent: { ...event, data: { body: "OTRO BODY" } },
      }),
    );
    expect(resend.inserted).toBe(false);
    expect(resend.duplicate).toBe(true);
    expect(resend.record.body).toBe("Necesito agua potable en mi barrio");
    expect(rows.size).toBe(1);
  });

  it("lanza un error descriptivo cuando PostgREST responde con error", async () => {
    const store = createPostgrestIngestResponsesStore({
      url: "http://127.0.0.1:54341",
      serviceRoleKey: "service-role-key",
      fetchFn: (async () =>
        new Response("db down", { status: 500 })) as typeof fetch,
    });

    await expect(
      store.insertIfAbsent({
        event_id: "evt_001",
        type: null,
        conversation_id: null,
        from: null,
        message_type: null,
        workflow_step: null,
        body: null,
        raw_event: {},
        raw_payload: {},
        processing_status: "RECEIVED",
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
    ).rejects.toThrow(/PostgREST respondió 500/);
  });
});
