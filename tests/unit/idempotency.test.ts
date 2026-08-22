import { describe, it, expect } from "vitest";
import { handleWebhookEvent } from "../../supabase/functions/webhook/handler.ts";
import {
  validateWebhookEvent,
  MINIMAL_FIELDS,
} from "../../supabase/functions/_shared/webhook-event.ts";
import {
  createInMemoryIngestResponsesStore,
  createPostgrestIngestResponsesStore,
  type IngestResponseRecord,
} from "../../supabase/functions/_shared/ingest-persistence.ts";
import { createInMemoryNeedsStore } from "../../supabase/functions/_shared/needs-store.ts";

// ============================================================================
// Unit Tests — S6: Idempotencia / deduplicación (DEV-36)
//
// Cubren los escenarios Gherkin de la historia S6:
//   1. El primer evento con un event.id nuevo se persiste una sola vez.
//   2. El reenvío con el mismo event.id no crea duplicados (se ignora o
//      devuelve el existente).
//   3. El reenvío con el mismo event.id pero body diferente no duplica ni
//      sobreescribe (event.id tiene prioridad sobre el contenido).
//   4. Reenvíos concurrentes del mismo event.id generan una sola fila (la
//      unicidad de event_id resuelve la condición de carrera).
//   5. Un evento sin id se rechaza con 400 detallando el campo; no se persiste
//      y no se invoca la deduplicación.
//   6. Eventos distintos (event.id diferente) se persisten por separado; la
//      deduplicación no usa el contenido ni conversation_id como clave.
//   7. Un reenvío tras un intento fallido de validación se procesa como nuevo.
//   8. La deduplicación por event.id protege el pipeline aguas abajo: el
//      reenvío se descarta en la capa de ingestión y no se re-ejecuta el
//      procesamiento (p. ej. no se re-crea el incidente).
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

function buildCompletion(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_comp",
    type: "conversation_completed",
    conversation_id: "conv_001",
    data: {
      body: "Conversación finalizada",
      from: "573001234567",
      message_type: "text",
      workflow: { step: "completed" },
    },
    ...overrides,
  };
}

function postWith(
  ingestStore: ReturnType<typeof createInMemoryIngestResponsesStore>,
  needsStore: ReturnType<typeof createInMemoryNeedsStore>,
  payload: unknown,
) {
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { ingestStore, incidentService: { needsStore } },
  );
}

// ============================================================================
// Escenario 1: El primer evento con un event.id nuevo se persiste una sola vez
// ============================================================================

describe("S6 — El primer evento con un event.id nuevo se persiste una sola vez", () => {
  it("crea una fila en ingest_responses con event_id y queda disponible aguas abajo", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const event = buildValidEvent({ id: "evt_001" });

    const res = await postWith(ingest, needs, event);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Se persiste una sola fila con event_id = 'evt_001'.
    expect(body.persisted).toBe(true);
    expect(body.duplicate).toBe(false);
    expect(body.record.event_id).toBe("evt_001");
    expect(ingest.size()).toBe(1);
    expect(ingest.get("evt_001")).toBeDefined();

    // El evento queda disponible para el procesamiento aguas abajo (S5): el
    // mapeo arma el borrador y el evento acumulado alimenta el incidente.
    expect(body.mapping).toBeDefined();
    expect(body.mapping.builds_incident).toBe(true);
  });
});

// ============================================================================
// Escenario 2: El reenvío con el mismo event.id no crea duplicados
// ============================================================================

describe("S6 — El reenvío con el mismo event.id no crea duplicados", () => {
  it("no crea una segunda fila y responde 409 con la fila existente (S7)", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const event = buildValidEvent({ id: "evt_001" });

    const first = await postWith(ingest, needs, event);
    expect((await first.json()).persisted).toBe(true);

    // S7: el reenvío de un event.id ya procesado con éxito responde 409
    // Conflict (error estructurado) y devuelve la fila existente en details.
    const resend = await postWith(ingest, needs, event);
    expect(resend.status).toBe(409);
    const body = await resend.json();
    expect(body.code).toBe("duplicate_event");
    expect(body.message).toContain("ya fue recibido");
    expect(body.details.record.event_id).toBe("evt_001");

    // Solo una fila.
    expect(ingest.size()).toBe(1);
    expect(ingest.all().filter((r) => r.event_id === "evt_001")).toHaveLength(1);
  });
});

// ============================================================================
// Escenario 3: Mismo event.id pero body diferente → no duplica ni sobreescribe
// ============================================================================

describe("S6 — El reenvío con el mismo event.id pero body diferente no duplica ni sobreescribe", () => {
  it("event.id tiene prioridad sobre el contenido; el body original se conserva (409 S7)", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const original = buildValidEvent({ id: "evt_002" });
    const first = await postWith(ingest, needs, original);
    const firstBody = await first.json();
    const originalRaw = ingest.get("evt_002")!.raw_event;
    const originalReceivedAt = firstBody.record.received_at;

    // Reenvío con el mismo id pero body distinto → 409 (S7).
    const resend = await postWith(
      ingest,
      needs,
      buildValidEvent({ id: "evt_002", data: { body: "Body MODIFICADO" } }),
    );
    expect(resend.status).toBe(409);
    const resendBody = await resend.json();

    // No se crea una fila nueva y no se sobreescribe el body original.
    expect(resendBody.code).toBe("duplicate_event");
    const row = ingest.get("evt_002")!;
    expect(row.raw_event).toEqual(originalRaw);
    expect(row.body).toBe("Necesito agua potable en mi barrio");
    expect(row.received_at).toBe(originalReceivedAt);
    expect(ingest.size()).toBe(1);
  });
});

// ============================================================================
// Escenario 4: Reenvíos concurrentes del mismo event.id generan una sola fila
// ============================================================================

describe("S6 — Reenvíos concurrentes del mismo event.id generan una sola fila", () => {
  it("la unicidad de event_id (constraint/índice único) resuelve la condición de carrera", async () => {
    // Store en memoria: `insertIfAbsent` es atómico y replica el UNIQUE(event_id)
    // de la tabla (migración S1/S6). Dos POST simultáneos con el mismo id → una
    // sola fila; el segundo se resuelve como duplicate.
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const event = buildValidEvent({ id: "evt_003" });

    const [resA, resB] = await Promise.all([
      postWith(ingest, needs, event),
      postWith(ingest, needs, event),
    ]);

    // Exactamente una insertó (200) y la otra fue un reenvío (409, S7).
    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);

    const bodyA = await resA.json();
    const bodyB = await resB.json();

    const inserted = [bodyA, bodyB].filter((b) => b.persisted === true);
    const duplicates = [bodyA, bodyB].filter((b) => b.code === "duplicate_event");
    expect(inserted).toHaveLength(1);
    expect(duplicates).toHaveLength(1);

    // Solo una fila con event_id = 'evt_003'.
    expect(ingest.size()).toBe(1);
    expect(ingest.all().filter((r) => r.event_id === "evt_003")).toHaveLength(1);
  });

  it("el store PostgREST (INSERT ... ON CONFLICT DO NOTHING) también deja una sola fila", async () => {
    const rows = new Map<string, IngestResponseRecord>();
    const store = createPostgrestIngestResponsesStore({
      url: "http://127.0.0.1:54341",
      serviceRoleKey: "service-role-key",
      fetchFn: fakeFetch(rows),
    });
    const event = buildValidEvent({ id: "evt_003" });

    // Dos inserciones concurrentes del mismo event_id.
    const results = await Promise.all([
      store.insertIfAbsent({
        event_id: "evt_003",
        type: event.type,
        conversation_id: event.conversation_id,
        from: event.data?.from ?? null,
        message_type: "TEXT",
        workflow_step: "AWAITING_LOCATION",
        body: event.data?.body ?? null,
        raw_event: event,
        raw_payload: event,
        processing_status: "RECEIVED",
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
      store.insertIfAbsent({
        event_id: "evt_003",
        type: event.type,
        conversation_id: event.conversation_id,
        from: event.data?.from ?? null,
        message_type: "TEXT",
        workflow_step: "AWAITING_LOCATION",
        body: event.data?.body ?? null,
        raw_event: event,
        raw_payload: event,
        processing_status: "RECEIVED",
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
    ]);

    expect(results.filter((r) => r.inserted)).toHaveLength(1);
    expect(results.filter((r) => r.duplicate)).toHaveLength(1);
    expect(rows.size).toBe(1);
  });
});

// ============================================================================
// Escenario 5: Un evento sin id se rechaza (no hay clave de idempotencia)
// ============================================================================

describe("S6 — Un evento sin id se rechaza (no hay clave de idempotencia)", () => {
  it("devuelve 400 detallando el campo faltante, no persiste y no invoca la deduplicación", async () => {
    // Un store que lanza al consultar/insertar demostraría que se invocó la
    // deduplicación. Como el evento sin id se rechaza en la validación ANTES,
    // el store nunca debe tocarse.
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
      const res = await postWith(
        spyingStore,
        needs,
        buildValidEvent({ id, data: { body: "Sin id" } }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe("validation_failed");
      const issuePaths = body.details.issues.map((i: { path: string[] }) =>
        i.path.join("."),
      );
      expect(issuePaths).toContain("id");
      // No se invoca la deduplicación (el store nunca se toca).
      expect(storeTouched).toBe(false);
    }
  });

  it("la validación pura marca el campo id faltante", () => {
    for (const id of [undefined, "", "   ", 42, null]) {
      const result = validateWebhookEvent(buildValidEvent({ id }));
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.path.join(".") === "id")).toBe(true);
    }
    expect(MINIMAL_FIELDS).toContain("id");
  });
});

// ============================================================================
// Escenario 6: Eventos distintos con event.id diferente se persisten por separado
// ============================================================================

describe("S6 — Eventos distintos con event.id diferente se persisten por separado", () => {
  it("la deduplicación no usa el contenido ni conversation_id como clave", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Dos eventos con event.id distinto, misma conversation_id y contenido
    // idéntico.
    const base = buildValidEvent({
      conversation_id: "conv_shared",
      data: { body: "Contenido idéntico", from: "573001234567" },
    });
    const evtA = { ...base, id: "evt_004" };
    const evtB = { ...base, id: "evt_005" };

    const resA = await postWith(ingest, needs, evtA);
    const resB = await postWith(ingest, needs, evtB);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect((await resA.json()).persisted).toBe(true);
    expect((await resB.json()).persisted).toBe(true);

    // Dos filas, una por cada event.id.
    expect(ingest.size()).toBe(2);
    expect(ingest.all().map((r) => r.event_id).sort()).toEqual([
      "evt_004",
      "evt_005",
    ]);
  });
});

// ============================================================================
// Escenario 7: Un reenvío tras un intento fallido de validación se procesa como nuevo
// ============================================================================

describe("S6 — Un reenvío tras un intento fallido de validación se procesa como nuevo", () => {
  it("el intento fallido no bloquea el reenvío corregido con el mismo event.id", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Primer intento del evento 'evt_006' que falla la validación y no se
    // persiste (sin body → 400).
    const invalid = buildValidEvent({
      id: "evt_006",
      data: { from: "573001234567" },
      body: undefined,
    });
    const failed = await postWith(ingest, needs, invalid);
    expect(failed.status).toBe(400);
    expect((await failed.json()).code).toBe("validation_failed");
    expect(ingest.size()).toBe(0);

    // Reenvío corregido con el mismo id 'evt_006' → se procesa como nuevo.
    const corrected = buildValidEvent({
      id: "evt_006",
      data: { body: "Ahora con contenido", from: "573001234567" },
    });
    const res = await postWith(ingest, needs, corrected);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Se crea la fila con event_id = 'evt_006'; el intento fallido previo no
    // dejó ninguna fila que bloquee el reenvío.
    expect(body.persisted).toBe(true);
    expect(body.duplicate).toBe(false);
    expect(body.record.event_id).toBe("evt_006");
    expect(ingest.size()).toBe(1);
    expect(ingest.get("evt_006")).toBeDefined();
  });
});

// ============================================================================
// Escenario 8: La deduplicación por event.id protege el pipeline aguas abajo
// ============================================================================

describe("S6 — La deduplicación por event.id protege el pipeline aguas abajo", () => {
  it("el reenvío se descarta en la capa de ingestión y no se re-crea el incidente", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Acumula un mensaje y completa la conversación → se crea el incidente.
    const msg = buildValidEvent({
      id: "evt_msg",
      conversation_id: "conv_007",
      data: { body: "Necesito ayuda", from: "573001234567" },
    });
    const msgRes = await postWith(ingest, needs, msg);
    expect(msgRes.status).toBe(200);

    const completion = buildCompletion({
      id: "evt_007",
      conversation_id: "conv_007",
    });
    const first = await postWith(ingest, needs, completion);
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.incident).toBeDefined();
    expect(firstBody.incident.outcome).toBe("created");
    expect(needs.size()).toBe(1);

    // Reenvío del mismo evento 'evt_007' → se descarta en ingestión (S6) y el
    // ACK del contrato S7 responde 409 Conflict con error estructurado.
    const resend = await postWith(ingest, needs, completion);
    expect(resend.status).toBe(409);
    const resendBody = await resend.json();

    // Error estructurado indicando que el evento ya fue recibido.
    expect(resendBody.code).toBe("duplicate_event");
    expect(resendBody.message).toContain("ya fue recibido");

    // No se vuelve a ejecutar el procesamiento aguas abajo: no se re-crea el
    // incidente (sin bloque `incident` y needs sigue con una sola fila).
    expect(resendBody.incident).toBeUndefined();
    expect(needs.size()).toBe(1);
  });
});

// ============================================================================
// Helper: fetch falso que replica PostgREST con UNIQUE(event_id)
// ============================================================================

function fakeFetch(rowsByEventId: Map<string, IngestResponseRecord>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

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

    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}
