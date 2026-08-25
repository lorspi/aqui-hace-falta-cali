import { describe, it, expect, vi } from "vitest";
import {
  rebuildConversation,
  normalizeMessageRow,
  extractAttachments,
  type ConversationRebuild,
} from "../../supabase/functions/_shared/conversation-rebuilder.ts";
import { createInMemoryIngestResponsesStore } from "../../supabase/functions/_shared/ingest-persistence.ts";
import { createInMemoryNeedsStore, type NeedRecord } from "../../supabase/functions/_shared/needs-store.ts";
import { handleConversationRequest } from "../../supabase/functions/conversation/handler.ts";

// ============================================================================
// Unit Tests — US-3: Endpoint de reconstrucción de conversación (DEV-42)
//
// Cubren los escenarios Gherkin de la historia US-3:
//   1. La conversación de un need se reconstruye con los mensajes en orden
//      cronológico.
//   2. La reconstrucción incluye los datos estructurados del incidente.
//   3. Una conversación sin evento de completado devuelve los mensajes
//      disponibles sin need asociado.
//   4. Un mensaje de texto se normaliza a un mensaje uniforme sin adjuntos.
//   5. Un mensaje con imagen expone su adjunto de imagen extraído del raw_event.
//   6. Un mensaje de ubicación expone su adjunto de coordenadas.
//   7. Un adjunto de ubicación sin coordenadas no rompe la reconstrucción.
//   8. Un evento con message_type desconocido o ausente se normaliza como
//      UNKNOWN.
//   9. Un evento con campos faltantes se normaliza de forma tolerante.
//  10. Un reenvío con el mismo event.id aparece una sola vez.
//  11. El evento de completado no se lista como mensaje del ciudadano.
//  12. Un need.id inexistente responde 404.
//  13. Una conversación sin mensajes devuelve una lista vacía.
// ============================================================================

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function buildMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_msg_1",
    type: "message.received",
    conversation_id: "conv_X",
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
    conversation_id: "conv_X",
    data: {
      body: "Conversación finalizada",
      from: "573001234567",
      workflow: { step: "completed" },
    },
    ...overrides,
  };
}

/** UUID estable del need de prueba (needs.id es columna UUID en Supabase). */
const NEED_123_UUID = "00000000-0000-0000-0000-000000000123";

/** Construye un NeedRecord con los campos mínimos que necesita la reconstrucción. */
function buildNeedRecord(overrides: Partial<NeedRecord> = {}): NeedRecord {
  return {
    id: NEED_123_UUID,
    city_id: "cali",
    emergency_id: "terremoto-cali-2026",
    title: "Necesito agua potable en mi barrio",
    description: "Necesito agua potable en mi barrio",
    place_type: "EDIFICIO_AFECTADO",
    categories: [],
    resources: [],
    address: "Calle 5 #10-20",
    neighborhood: "San Fernando",
    latitude: null,
    longitude: null,
    priority: "MEDIUM",
    status: "NEED_HELP_NOW",
    verification_status: "PENDING_VERIFICATION",
    verified_by: null,
    verification_notes: null,
    verified_at: null,
    source: "WhatsApp",
    source_url: null,
    contact_name: "Ciudadano vía WhatsApp",
    contact_phone: null,
    contact_whatsapp: "573001234567",
    contact_email: null,
    organization_name: null,
    requester_type: "PERSONA",
    operating_hours: null,
    evidence_url: null,
    created_at: "2026-08-24T10:00:00.000Z",
    updated_at: "2026-08-24T10:00:00.000Z",
    last_updated_by: null,
    expires_at: null,
    is_demo_data: false,
    source_event_id: "evt_comp",
    conversation_id: "conv_X",
    location_enrichment_status: "PENDING",
    ...overrides,
  };
}

/** Store de needs sembrado con un need de id UUID estable y conversation_id 'conv_X'. */
function seededNeeds(overrides: Partial<NeedRecord> = {}) {
  return createInMemoryNeedsStore([buildNeedRecord(overrides)]);
}

/** Siembra el store de ingest_responses con filas construidas desde eventos. */
function seedIngest(
  ingest: ReturnType<typeof createInMemoryIngestResponsesStore>,
  events: Array<Record<string, unknown>>,
  receivedAtOrder?: string[],
) {
  events.forEach((event, index) => {
    const receivedAt =
      receivedAtOrder?.[index] ?? new Date(2026, 7, 24, 10, index).toISOString();
    // Construimos la fila igual que S4 (persistIngestResponse) pero con
    // received_at controlado para probar el orden cronológico.
    ingest.insertIfAbsent({
      event_id: String(event.id),
      type: (event.type as string) ?? null,
      conversation_id: (event.conversation_id as string) ?? null,
      from: ((event.data as Record<string, unknown> | undefined)?.from as string) ?? null,
      message_type: "TEXT",
      workflow_step: "AWAITING_LOCATION",
      body: (event.data as Record<string, unknown> | undefined)?.body ?? null,
      raw_event: event,
      raw_payload: event,
      processing_status: "RECEIVED",
      received_at: receivedAt,
      created_at: receivedAt,
    });
  });
}

function buildGetUrl(pathOrQuery: string): Request {
  const base = "http://127.0.0.1:54321/functions/v1/conversation";
  const url = pathOrQuery.startsWith("?") ? `${base}${pathOrQuery}` : `${base}${pathOrQuery}`;
  return new Request(url, { method: "GET" });
}

async function get(
  ingest: ReturnType<typeof createInMemoryIngestResponsesStore>,
  needs: ReturnType<typeof createInMemoryNeedsStore>,
  url: string,
  extraDeps: Record<string, unknown> = {},
) {
  return handleConversationRequest(buildGetUrl(url), {
    ingestStore: ingest,
    needsStore: needs,
    ...extraDeps,
  } as Parameters<typeof handleConversationRequest>[1]);
}

// ============================================================================
// Escenario 1: La conversación de un need se reconstruye en orden cronológico
// ============================================================================

describe("US-3 — La conversación de un need se reconstruye con los mensajes en orden cronológico", () => {
  it("devuelve todas las filas de ingest_responses del conversation_id ordenadas por received_at ascendente", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds();

    // Recibidas en distinto orden (desordenadas a propósito).
    seedIngest(
      ingest,
      [
        buildMessage({ id: "evt_m2", data: { body: "Segundo mensaje", from: "573001234567" } }),
        buildMessage({ id: "evt_m1", data: { body: "Primer mensaje", from: "573001234567" } }),
        buildMessage({ id: "evt_m3", data: { body: "Tercer mensaje", from: "573001234567" } }),
      ],
      [
        "2026-08-24T10:02:00.000Z",
        "2026-08-24T10:01:00.000Z",
        "2026-08-24T10:03:00.000Z",
      ],
    );

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationRebuild;

    // Todas las filas con conversation_id 'conv_X'.
    expect(body.conversation_id).toBe("conv_X");
    expect(body.messages).toHaveLength(3);
    // Orden cronológico ascendente por received_at.
    const receivedAt = body.messages.map((m) => m.received_at);
    expect(receivedAt).toEqual([
      "2026-08-24T10:01:00.000Z",
      "2026-08-24T10:02:00.000Z",
      "2026-08-24T10:03:00.000Z",
    ]);
    expect(body.messages[0].content).toBe("Primer mensaje");
    expect(body.messages[2].content).toBe("Tercer mensaje");

    // Cada mensaje normalizado al formato uniforme.
    for (const message of body.messages) {
      expect(message).toHaveProperty("sender");
      expect(message).toHaveProperty("content");
      expect(message).toHaveProperty("type");
      expect(message).toHaveProperty("attachments");
      expect(message).toHaveProperty("received_at");
      expect(message).toHaveProperty("event_id");
    }
  });
});

// ============================================================================
// Escenario 2: La reconstrucción incluye los datos estructurados del incidente
// ============================================================================

describe("US-3 — La reconstrucción incluye los datos estructurados del incidente", () => {
  it("responde con title, description, contact_whatsapp, address, neighborhood, priority, status, verification_status, conversation_id y source_event_id", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds({
      title: "Título del incidente",
      description: "Descripción completa",
      address: "Av 3N #52-20",
      neighborhood: "San Fernando",
      priority: "HIGH",
      status: "NEED_HELP_NOW",
      verification_status: "VERIFIED",
      source_event_id: "evt_comp",
      conversation_id: "conv_X",
    });
    seedIngest(ingest, [buildMessage()]);

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationRebuild;

    expect(body.has_need).toBe(true);
    expect(body.need).toBeDefined();
    expect(body.need!.id).toBe(NEED_123_UUID);
    expect(body.need!.title).toBe("Título del incidente");
    expect(body.need!.description).toBe("Descripción completa");
    expect(body.need!.contact_whatsapp).toBe("573001234567");
    expect(body.need!.address).toBe("Av 3N #52-20");
    expect(body.need!.neighborhood).toBe("San Fernando");
    expect(body.need!.priority).toBe("HIGH");
    expect(body.need!.status).toBe("NEED_HELP_NOW");
    expect(body.need!.verification_status).toBe("VERIFIED");
    expect(body.need!.conversation_id).toBe("conv_X");
    expect(body.need!.source_event_id).toBe("evt_comp");
  });

  it("expone la trazabilidad de la revisión (verified_by, verified_at, verification_notes) para US-7", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds({
      verification_status: "REJECTED",
      verified_by: "operador@radar.local",
      verified_at: "2026-08-24T19:20:48.547Z",
      verification_notes: "Información falsa",
    });
    seedIngest(ingest, [buildMessage()]);

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationRebuild;

    expect(body.need!.verification_status).toBe("REJECTED");
    expect(body.need!.verified_by).toBe("operador@radar.local");
    expect(body.need!.verified_at).toBe("2026-08-24T19:20:48.547Z");
    expect(body.need!.verification_notes).toBe("Información falsa");
  });

  it("tolera la ausencia de verified_by/verified_at (null) sin romper el resumen", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds({ verification_status: "VERIFIED", verified_by: null, verified_at: null });
    seedIngest(ingest, [buildMessage()]);

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    const body = (await res.json()) as ConversationRebuild;
    expect(body.need!.verified_by).toBeNull();
    expect(body.need!.verified_at).toBeNull();
  });
});

// ============================================================================
// Escenario 3: Conversación sin evento de completado → mensajes sin need asociado
// ============================================================================

describe("US-3 — Una conversación sin evento de completado devuelve los mensajes disponibles sin need asociado", () => {
  it("responde has_need=false y los campos del incidente vacíos/nulos", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    seedIngest(ingest, [buildMessage({ id: "evt_ongoing" })]);

    const res = await get(ingest, needs, "?conversation_id=conv_X");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationRebuild;

    expect(body.has_need).toBe(false);
    expect(body.need).toBeNull();
    // Los mensajes disponibles se devuelven normalizados.
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].event_id).toBe("evt_ongoing");
    expect(body.messages[0].content).toBe("Necesito agua potable en mi barrio");
  });
});

// ============================================================================
// Escenario 4: Un mensaje de texto se normaliza a un mensaje uniforme sin adjuntos
// ============================================================================

describe("US-3 — Un mensaje de texto se normaliza a un mensaje uniforme sin adjuntos", () => {
  it("devuelve type=TEXT, content del body, sender de data.from y attachments vacío", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [buildMessage()]);
    const message = normalizeMessageRow(row.all()[0])!;

    expect(message.type).toBe("TEXT");
    expect(message.content).toBe("Necesito agua potable en mi barrio");
    expect(message.sender).toBe("573001234567");
    expect(message.attachments).toEqual([]);
    expect(message.event_id).toBe("evt_msg_1");
    expect(message.received_at).toBeTruthy();
  });
});

// ============================================================================
// Escenario 5: Un mensaje con imagen expone su adjunto de imagen
// ============================================================================

describe("US-3 — Un mensaje con imagen expone su adjunto de imagen extraído del raw_event", () => {
  it("devuelve type=IMAGE con un adjunto de tipo image y la URL", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [
      buildMessage({
        id: "evt_img",
        data: {
          body: "Te adjunto la foto del daño",
          from: "573001234567",
          message_type: "image",
          attachments: [
            { type: "image", url: "https://media.example.com/foto.jpg", mime: "image/jpeg" },
          ],
        },
      }),
    ]);
    const message = normalizeMessageRow(row.all()[0])!;

    expect(message.type).toBe("IMAGE");
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0].type).toBe("image");
    expect(message.attachments[0].url).toBe("https://media.example.com/foto.jpg");
    expect(message.attachments[0].mime).toBe("image/jpeg");
  });

  it("también extrae la URL de imagen cuando el body es una URL (sin data.attachments)", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [
      buildMessage({
        id: "evt_img_url",
        data: {
          body: "https://media.example.com/directa.jpg",
          from: "573001234567",
          message_type: "image",
        },
      }),
    ]);
    const message = normalizeMessageRow(row.all()[0])!;

    expect(message.type).toBe("IMAGE");
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0].type).toBe("image");
    expect(message.attachments[0].url).toBe("https://media.example.com/directa.jpg");
  });
});

// ============================================================================
// Escenario 6: Un mensaje de ubicación expone su adjunto de coordenadas
// ============================================================================

describe("US-3 — Un mensaje de ubicación expone su adjunto de coordenadas", () => {
  it("devuelve type=LOCATION con un adjunto location de latitude, longitude y address", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [
      buildMessage({
        id: "evt_loc",
        data: {
          body: {
            text: "Estoy aquí",
            latitude: 3.4516,
            longitude: -76.532,
            address: "Calle 5 #10-20",
          },
          from: "573001234567",
          message_type: "location",
        },
      }),
    ]);
    const message = normalizeMessageRow(row.all()[0])!;

    expect(message.type).toBe("LOCATION");
    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0].type).toBe("location");
    expect(message.attachments[0].latitude).toBe(3.4516);
    expect(message.attachments[0].longitude).toBe(-76.532);
    expect(message.attachments[0].address).toBe("Calle 5 #10-20");
  });
});

// ============================================================================
// Escenario 7: Un adjunto de ubicación sin coordenadas no rompe la reconstrucción
// ============================================================================

describe("US-3 — Un adjunto de ubicación sin coordenadas no rompe la reconstrucción", () => {
  it("devuelve un adjunto location sin coordenadas (o con address solamente) y sigue con el resto", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [
      buildMessage({
        id: "evt_loc_nocoords",
        data: {
          body: { text: "Estoy en San Fernando", address: "San Fernando" },
          from: "573001234567",
          message_type: "location",
        },
      }),
      buildMessage({
        id: "evt_msg_after",
        data: { body: "Otro mensaje normal", from: "573001234567" },
      }),
    ]);
    const messages = row
      .all()
      .map((r) => normalizeMessageRow(r)!)
      .filter(Boolean);

    const locMessage = messages.find((m) => m.event_id === "evt_loc_nocoords")!;
    expect(locMessage.type).toBe("LOCATION");
    expect(locMessage.attachments).toHaveLength(1);
    expect(locMessage.attachments[0].type).toBe("location");
    expect(locMessage.attachments[0].latitude).toBeUndefined();
    expect(locMessage.attachments[0].longitude).toBeUndefined();
    expect(locMessage.attachments[0].address).toBe("San Fernando");

    // El resto de los mensajes se siguen devolviendo.
    expect(messages).toHaveLength(2);
    expect(messages.find((m) => m.event_id === "evt_msg_after")).toBeDefined();
  });
});

// ============================================================================
// Escenario 8: Un evento con message_type desconocido o ausente → UNKNOWN
// ============================================================================

describe("US-3 — Un evento con message_type desconocido o ausente se normaliza como UNKNOWN", () => {
  it.each([
    ["ausente", { message_type: undefined }],
    ["desconocido", { message_type: "holograma" }],
    ["vacío", { message_type: "" }],
  ])(
    "con message_type %s → type=UNKNOWN y no invalida la reconstrucción",
    (_label, dataOverride) => {
      const row = createInMemoryIngestResponsesStore();
      seedIngest(row, [
        buildMessage({
          id: "evt_unknown",
          data: { body: "Mensaje raro", from: "573001234567", ...dataOverride },
        }),
      ]);
      const message = normalizeMessageRow(row.all()[0])!;

      expect(message.type).toBe("UNKNOWN");
      expect(message.content).toBe("Mensaje raro");
      expect(message.event_id).toBe("evt_unknown");
    },
  );
});

// ============================================================================
// Escenario 9: Un evento con campos faltantes se normaliza de forma tolerante
// ============================================================================

describe("US-3 — Un evento con campos faltantes en el raw_event se normaliza de forma tolerante", () => {
  it("devuelve content por defecto y sender null, sin perder la fila (auditoría)", () => {
    const row = createInMemoryIngestResponsesStore();
    seedIngest(row, [
      // Sin data.from y sin data.body (body inválido según S2).
      {
        id: "evt_faltante",
        type: "message.received",
        conversation_id: "conv_X",
        data: { workflow: { step: "awaiting_location" } },
      },
    ]);
    const message = normalizeMessageRow(row.all()[0])!;

    expect(message.sender).toBeNull();
    expect(typeof message.content).toBe("string");
    expect(message.content.length).toBeGreaterThan(0);
    expect(message.type).toBe("UNKNOWN");
    // La fila no se pierde de la reconstrucción.
    expect(message.event_id).toBe("evt_faltante");
  });
});

// ============================================================================
// Escenario 10: Un reenvío con el mismo event.id aparece una sola vez
// ============================================================================

describe("US-3 — Un reenvío con el mismo event.id aparece una sola vez en la reconstrucción", () => {
  it("lee las filas de ingest_responses sin requerir una tabla messages normalizada", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds();

    // La capa de ingestión ya deduplicó (UNIQUE event_id): el reenvío devolvió
    // la fila existente y el store solo tiene una fila para ese event.id.
    const event = buildMessage({ id: "evt_dup" });
    seedIngest(ingest, [event]);
    // Un reenvío del mismo event.id no inserta una fila nueva (S4/S6).
    const resend = await ingest.insertIfAbsent({
      event_id: "evt_dup",
      type: "message.received",
      conversation_id: "conv_X",
      from: "573001234567",
      message_type: "TEXT",
      workflow_step: "AWAITING_LOCATION",
      body: "Necesito agua potable en mi barrio",
      raw_event: event,
      raw_payload: event,
      processing_status: "RECEIVED",
      received_at: "2026-08-24T10:01:00.000Z",
      created_at: "2026-08-24T10:01:00.000Z",
    });
    expect(resend.duplicate).toBe(true);
    expect(ingest.all().filter((r) => r.event_id === "evt_dup")).toHaveLength(1);

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    const body = (await res.json()) as ConversationRebuild;
    const ids = body.messages.map((m) => m.event_id);
    expect(ids.filter((id) => id === "evt_dup")).toHaveLength(1);
  });
});

// ============================================================================
// Escenario 11: El evento de completado no se lista como mensaje del ciudadano
// ============================================================================

describe("US-3 — El evento de completado no se lista como un mensaje del ciudadano", () => {
  it("lista solo los message.received; el completado queda en source_event_id", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = seededNeeds({ source_event_id: "evt_comp" });

    seedIngest(ingest, [
      buildMessage({ id: "evt_msg_1" }),
      buildMessage({ id: "evt_msg_2" }),
      buildCompletion({ id: "evt_comp" }),
    ]);

    const res = await get(ingest, needs, "/needs/00000000-0000-0000-0000-000000000123/conversation");
    const body = (await res.json()) as ConversationRebuild;

    expect(body.messages).toHaveLength(2);
    for (const message of body.messages) {
      expect(message.event_id).not.toBe("evt_comp");
    }
    // El event.id del completado queda disponible en source_event_id del need.
    expect(body.need!.source_event_id).toBe("evt_comp");
  });
});

// ============================================================================
// Escenario 12: Un need.id inexistente responde 404
// ============================================================================

describe("US-3 — Un need.id inexistente responde 404 con error estructurado", () => {
  it("responde 404 con code=need_not_found para un id no-UUID (no puede existir)", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const res = await get(ingest, needs, "/needs/need_999/conversation");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("need_not_found");
    expect(body.message).toContain("need_999");
    expect(body.details.need_id).toBe("need_999");
  });

  it("responde 404 con code=need_not_found para un UUID bien formado que no existe", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const missingUuid = "00000000-0000-0000-0000-000000000999";

    const res = await get(ingest, needs, `/needs/${missingUuid}/conversation`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("need_not_found");
    expect(body.details.need_id).toBe(missingUuid);
  });
});

// ============================================================================
// Escenario 13: Una conversación sin mensajes devuelve una lista vacía
// ============================================================================

describe("US-3 — Una conversación sin mensajes devuelve una lista vacía sin romper el contrato", () => {
  it("responde con messages vacío y los metadatos de la conversación", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const res = await get(ingest, needs, "?conversation_id=conv_vacia");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ConversationRebuild;

    expect(body.messages).toEqual([]);
    expect(body.conversation_id).toBe("conv_vacia");
    expect(body.has_need).toBe(false);
    expect(body.need).toBeNull();
  });
});

// ============================================================================
// Escenarios adicionales del handler (contrato HTTP)
// ============================================================================

describe("US-3 — Comportamiento HTTP del handler", () => {
  it("responde 405 para métodos distintos de GET", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const res = await handleConversationRequest(
      new Request("http://127.0.0.1:54321/functions/v1/conversation/needs/00000000-0000-0000-0000-000000000123/conversation", {
        method: "POST",
      }),
      { ingestStore: ingest, needsStore: needs },
    );
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.code).toBe("method_not_allowed");
  });

  it("responde 400 missing_parameter cuando faltan need_id y conversation_id", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const res = await get(ingest, needs, "");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("missing_parameter");
  });

  it("responde 500 genérico y registra la causa vía logError cuando un store falla", async () => {
    const failingIngest = {
      ...createInMemoryIngestResponsesStore(),
      async listByConversationId() {
        throw new Error("connection to postgres failed");
      },
    };
    const needs = seededNeeds();
    const logError = vi.fn();

    const res = await get(
      failingIngest,
      needs,
      "/needs/00000000-0000-0000-0000-000000000123/conversation",
      { logError },
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("conversation_rebuild_failed");
    expect(body.message).not.toContain("postgres");
    expect(logError).toHaveBeenCalledWith("conversation_rebuild_failed", expect.any(Error));
  });

  it("responde preflight CORS con 204", async () => {
    const res = await handleConversationRequest(
      new Request("http://127.0.0.1:54321/functions/v1/conversation/needs/00000000-0000-0000-0000-000000000123/conversation", {
        method: "OPTIONS",
      }),
      { ingestStore: createInMemoryIngestResponsesStore(), needsStore: createInMemoryNeedsStore() },
    );
    expect(res.status).toBe(204);
  });
});

// ============================================================================
// Escenario de la función pura extractAttachments
// ============================================================================

describe("US-3 — extractAttachments extrae adjuntos de imagen y ubicación del raw_event", () => {
  it("devuelve attachments vacío para un mensaje de texto", () => {
    expect(extractAttachments(buildMessage(), "TEXT", {})).toEqual([]);
  });

  it("extrae múltiples imágenes de data.attachments", () => {
    const raw = buildMessage({
      data: {
        body: "Adjunto dos fotos",
        message_type: "image",
        attachments: [
          { type: "image", url: "https://a.com/1.jpg", mime: "image/jpeg" },
          { type: "image", url: "https://a.com/2.jpg", mime: "image/png" },
        ],
      },
    });
    const attachments = extractAttachments(raw, "IMAGE", {});
    expect(attachments).toHaveLength(2);
    expect(attachments[1].url).toBe("https://a.com/2.jpg");
  });
});
