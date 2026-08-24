import { describe, it, expect } from "vitest";
import { handleWebhookEvent } from "../../supabase/functions/webhook/handler.ts";
import { createInMemoryIngestResponsesStore } from "../../supabase/functions/_shared/ingest-persistence.ts";
import { createInMemoryNeedsStore } from "../../supabase/functions/_shared/needs-store.ts";
import type { Geocoder, GeocodingResult } from "../../supabase/functions/_shared/geocoding.ts";

// ============================================================================
// Unit Tests — S5: Endpoint crea el incidente al completar la conversación (DEV-35)
//
// Cubren los escenarios Gherkin de la historia S5 a nivel HTTP:
//   1. message.received acumulados + evento de completado → incidente en needs.
//   2. Una conversación con varias necesidades → un solo registro en needs.
//   3. Con coordenadas → sin geocoding, city_id resuelto.
//   4. Sin coordenadas + dirección → geocoding + ciudad.
//   5. Geocoding no disponible → incidente igual, lat/lng NULL, PENDING.
//   6. Reenvío del mismo event.id → no duplica (idempotencia).
//   7. Sin conversation_id → 400 missing_conversation_id.
//   8. Sin mensajes acumulados → 409 no_messages.
//   9. from inválido → 400 invalid_from, con el evento en ingest_responses.
//  10. Conversaciones distintas no mezclan sus mensajes.
// ============================================================================

function buildMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_msg_1",
    type: "message.received",
    conversation_id: "conv_123",
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
    id: "evt_999",
    type: "conversation_completed",
    conversation_id: "conv_123",
    data: {
      body: "Conversación finalizada",
      from: "573001234567",
      message_type: "text",
      workflow: { step: "completed" },
    },
    ...overrides,
  };
}

function makeGeocoder(result: GeocodingResult | null): Geocoder {
  return {
    async geocode(): Promise<GeocodingResult | null> {
      return result;
    },
  };
}

async function postWith(
  ingestStore: ReturnType<typeof createInMemoryIngestResponsesStore>,
  needsStore: ReturnType<typeof createInMemoryNeedsStore>,
  payload: unknown,
  opts: { geocoder?: Geocoder } = {},
) {
  return handleWebhookEvent(
    new Request("http://127.0.0.1:54321/functions/v1/webhook/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    {
      ingestStore,
      incidentService: { needsStore },
      geocoder: opts.geocoder,
    },
  );
}

/** Escenario completo: acumula 2 mensajes y dispara el completado. */
async function seedConversation(
  ingestStore: ReturnType<typeof createInMemoryIngestResponsesStore>,
  needsStore: ReturnType<typeof createInMemoryNeedsStore>,
  messages: Array<Record<string, unknown>>,
  completion: Record<string, unknown>,
  opts: { geocoder?: Geocoder } = {},
) {
  for (const message of messages) {
    const res = await postWith(ingestStore, needsStore, message, opts);
    expect(res.status).toBe(200);
  }
  return postWith(ingestStore, needsStore, completion, opts);
}

describe("S5 — El evento de completado crea el incidente con los datos acumulados", () => {
  it("acumula message.received por conversation_id y crea el incidente al completar", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const messages = [
      buildMessage({ id: "evt_msg_1" }),
      buildMessage({ id: "evt_msg_2", data: { body: "Quedo en San Fernando", from: "573001234567" } }),
    ];
    const completion = buildCompletion();

    const res = await seedConversation(ingest, needs, messages, completion);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident).toBeDefined();
    expect(body.incident.outcome).toBe("created");
    expect(body.incident.source).toBe("WhatsApp");
    expect(body.incident.contact_whatsapp).toBe("573001234567");
    expect(body.incident.verification_status).toBe("PENDING_VERIFICATION");
    expect(body.incident.priority).toBe("MEDIUM");
    expect(body.incident.status).toBe("NEED_HELP_NOW");
    expect(body.incident.conversation_id).toBe("conv_123");
    expect(body.incident.source_event_id).toBe("evt_999");
    expect(body.incident.description).toContain("Necesito agua potable en mi barrio");
    expect(body.incident.description).toContain("Quedo en San Fernando");

    // El incidente quedó persistido en needs.
    expect(needs.size()).toBe(1);
  });
});

describe("S5 — Una conversación completada genera un solo registro de needs aunque acumule varias necesidades", () => {
  it("consolida múltiples necesidades en un único incidente por conversación", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // La conversación acumula mensajes que mencionan necesidades distintas.
    const messages = [
      buildMessage({
        id: "evt_need_1",
        data: { body: "Necesito agua potable", from: "573001234567" },
      }),
      buildMessage({
        id: "evt_need_2",
        data: { body: "También necesito medicinas para mi hijo", from: "573001234567" },
      }),
    ];
    const res = await seedConversation(ingest, needs, messages, buildCompletion());
    expect(res.status).toBe(200);
    const body = await res.json();

    // Un único registro en needs para la conversación.
    expect(needs.size()).toBe(1);
    expect(body.incident.outcome).toBe("created");
    expect(body.incident.conversation_id).toBe("conv_123");

    // title y description consolidan la información acumulada.
    expect(body.incident.description).toContain("Necesito agua potable");
    expect(body.incident.description).toContain("medicinas para mi hijo");
    expect(body.incident.title).toContain("Necesito agua potable");

    // No se genera un registro por cada tipo de necesidad.
    const all = needs.all();
    expect(all).toHaveLength(1);
    expect(all[0].description).toContain("Necesito agua potable");
    expect(all[0].description).toContain("medicinas para mi hijo");
  });
});

describe("S5 — El evento de completado con coordenadas crea el incidente sin geocoding", () => {
  it("no invoca geocoding y resuelve city_id a partir de las coordenadas", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    let geocoderCalled = false;
    const geocoder: Geocoder = {
      async geocode() {
        geocoderCalled = true;
        return null;
      },
    };

    const messages = [
      buildMessage({
        id: "evt_coords",
        data: { body: { text: "Estoy aquí", latitude: 3.4516, longitude: -76.532 }, from: "573001234567" },
      }),
    ];
    const res = await seedConversation(ingest, needs, messages, buildCompletion(), { geocoder });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident.latitude).toBe(3.4516);
    expect(body.incident.longitude).toBe(-76.532);
    expect(body.incident.city_id).toBe("cali");
    expect(body.incident.location_enrichment_status).toBe("RESOLVED");
    expect(geocoderCalled).toBe(false);
  });
});

describe("S5 — El evento de completado sin coordenadas dispara geocoding + ciudad", () => {
  it("invoca el geocoder y actualiza lat/lng y city_id cuando resuelve la dirección", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const geocoder = makeGeocoder({ latitude: 3.4516, longitude: -76.532, displayName: "Cali" });

    const messages = [
      buildMessage({
        id: "evt_addr",
        data: { body: { text: "Necesito ayuda", address: "Calle 5 #10-20", neighborhood: "San Fernando" }, from: "573001234567" },
      }),
    ];
    const res = await seedConversation(ingest, needs, messages, buildCompletion(), { geocoder });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident.latitude).toBe(3.4516);
    expect(body.incident.longitude).toBe(-76.532);
    expect(body.incident.city_id).toBe("cali");
    expect(body.incident.location_enrichment_status).toBe("RESOLVED");
  });
});

describe("S5 — Geocoding no disponible no bloquea la creación del incidente", () => {
  it("crea el incidente igual con lat/lng NULL y PENDING cuando no hay geocoding", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const messages = [
      buildMessage({
        id: "evt_addr",
        data: { body: { text: "Necesito ayuda", address: "Calle 5 #10-20", neighborhood: "San Fernando" }, from: "573001234567" },
      }),
    ];
    // Sin geocoder inyectado.
    const res = await seedConversation(ingest, needs, messages, buildCompletion());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident.latitude).toBeNull();
    expect(body.incident.longitude).toBeNull();
    expect(body.incident.address).toBe("Calle 5 #10-20");
    expect(body.incident.location_enrichment_status).toBe("PENDING");
  });
});

describe("S5 — Un reenvío del mismo evento de completado no crea un incidente duplicado", () => {
  it("el reenvío se descarta en la capa de ingestión y NO re-ejecuta la creación del incidente (S6 + S7)", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const messages = [buildMessage()];
    const completion = buildCompletion();

    const first = await seedConversation(ingest, needs, messages, completion);
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.incident.outcome).toBe("created");

    // Reenvío del mismo evento de completado: la unicidad por event.id (S6)
    // lo resuelve como duplicate en la capa de ingestión ANTES de llegar al
    // servicio de incidentes. El ACK del contrato S7 responde 409 Conflict.
    const resend = await postWith(ingest, needs, completion);
    expect(resend.status).toBe(409);
    const resendBody = await resend.json();

    // Error estructurado indicando que el evento ya fue recibido.
    expect(resendBody.code).toBe("duplicate_event");
    expect(resendBody.message).toContain("ya fue recibido");
    expect(resendBody.details.record.event_id).toBe("evt_999");
    // No se re-ejecuta el procesamiento aguas abajo (S6 #8): no hay bloque
    // `incident` y el registro en needs no se duplica.
    expect(resendBody.incident).toBeUndefined();
    expect(needs.size()).toBe(1);
  });
});

describe("S5 — Un evento de completado sin conversation_id responde 400 missing_conversation_id", () => {
  it.each([
    ["vacío", { conversation_id: "" }],
    ["faltante", { conversation_id: undefined }],
  ])(
    "con conversation_id %s → 400 con code=missing_conversation_id y sin crear incidente",
    async (_label, override) => {
      const ingest = createInMemoryIngestResponsesStore();
      const needs = createInMemoryNeedsStore();

      const res = await postWith(ingest, needs, buildCompletion(override));
      expect(res.status).toBe(400);
      const body = await res.json();

      // El evento de completado sin conversation_id devuelve el code específico
      // del flujo S5 (criterio groomed DEV-41), no el validation_failed genérico.
      expect(body.code).toBe("missing_conversation_id");
      const paths = (body.details?.issues ?? []).map((i: { path: string[] }) =>
        i.path.join("."),
      );
      expect(paths).toContain("conversation_id");
      expect(needs.size()).toBe(0);
      // No cumple los campos mínimos del contrato: no se persiste en ingest.
      expect(ingest.size()).toBe(0);
    },
  );
});

describe("S5 — Un evento de completado sin mensajes acumulados previos no crea incidente", () => {
  it("devuelve 409 señalando que no hay mensajes acumulados", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Solo llega el completado, sin message.received previos.
    const res = await postWith(ingest, needs, buildCompletion());
    expect(res.status).toBe(409);
    const body = await res.json();

    expect(body.code).toBe("no_messages");
    expect(body.details.conversation_id).toBe("conv_123");
    expect(needs.size()).toBe(0);
  });
});

describe("S5 — Un evento de completado con from inválido se rechaza", () => {
  it("devuelve 400, no crea el incidente y el evento queda registrado para auditoría", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();
    const messages = [buildMessage()];

    const completion = buildCompletion({ data: { body: "fin", from: "no-es-un-numero" } });
    const res = await seedConversation(ingest, needs, messages, completion);
    expect(res.status).toBe(400);
    const body = await res.json();

    expect(body.code).toBe("invalid_from");
    expect(needs.size()).toBe(0);

    // El evento de completado quedó persistido en ingest_responses (auditoría).
    const row = ingest.get("evt_999");
    expect(row).toBeDefined();
    expect(row?.raw_event).toEqual(completion);
    expect(row?.processing_status).toBe("RECEIVED");
  });
});

describe("S5 — El completado acepta data.conversation_id (shape documentado del contrato S8)", () => {
  it("acumula por data.conversation_id y crea el incidente con el conversation_id resuelto", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Mensajes con conversation_id en data (shape documentado).
    const messages = [
      buildMessage({
        id: "evt_s8_m1",
        conversation_id: undefined,
        data: { conversation_id: "conv_s8", body: "Necesito agua", from: "573001234567" },
      }),
      buildMessage({
        id: "evt_s8_m2",
        conversation_id: undefined,
        data: { conversation_id: "conv_s8", body: "Quedo en San Fernando", from: "573001234567" },
      }),
    ];

    // Completado con conversation_id en data (shape documentado).
    const completion = buildCompletion({
      id: "evt_s8_c1",
      conversation_id: undefined,
      data: { conversation_id: "conv_s8", body: "Conversación finalizada", from: "573001234567", workflow: { step: "completed" } },
    });

    const res = await seedConversation(ingest, needs, messages, completion);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident).toBeDefined();
    expect(body.incident.outcome).toBe("created");
    expect(body.incident.conversation_id).toBe("conv_s8");
    expect(body.incident.source_event_id).toBe("evt_s8_c1");
    expect(body.incident.description).toContain("Necesito agua");
    expect(body.incident.description).toContain("Quedo en San Fernando");
    expect(needs.size()).toBe(1);

    // La agrupación en ingest_responses también usó data.conversation_id.
    const rows = ingest.all().filter((r) => r.conversation_id === "conv_s8");
    expect(rows).toHaveLength(3); // 2 mensajes + 1 completado
  });

  it("prefiere conversation_id plano sobre data.conversation_id en el completado", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Los mensajes acumulados viven bajo la conversación plana conv_flat.
    const messages = [buildMessage({ id: "evt_s8b_m1", conversation_id: "conv_flat", data: { body: "Ayuda", from: "573001234567" } })];
    const completion = buildCompletion({
      id: "evt_s8b_c1",
      conversation_id: "conv_flat",
      data: { conversation_id: "conv_data", body: "fin", from: "573001234567", workflow: { step: "completed" } },
    });

    const res = await seedConversation(ingest, needs, messages, completion);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.incident.conversation_id).toBe("conv_flat");
  });
});

describe("S5 — Conversaciones distintas no mezclan sus mensajes acumulados", () => {
  it("arma el incidente solo con los mensajes de su conversación y deja la otra sin incidente", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    // Acumula mensajes de conv_A y conv_B.
    await postWith(ingest, needs, buildMessage({ id: "evt_a1", conversation_id: "conv_A", data: { body: "Mensaje de A", from: "573001234567" } }));
    await postWith(ingest, needs, buildMessage({ id: "evt_b1", conversation_id: "conv_B", data: { body: "Mensaje de B", from: "573001234567" } }));

    // Completado solo para conv_A.
    const completionA = buildCompletion({ id: "evt_ca", conversation_id: "conv_A" });
    const res = await postWith(ingest, needs, completionA);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.incident.conversation_id).toBe("conv_A");
    expect(body.incident.description).toContain("Mensaje de A");
    expect(body.incident.description).not.toContain("Mensaje de B");

    // La conversación B permanece sin incidente.
    expect(needs.size()).toBe(1);
  });
});
