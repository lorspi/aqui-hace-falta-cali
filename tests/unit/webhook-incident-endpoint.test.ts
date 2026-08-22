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
//   2. Con coordenadas → sin geocoding, city_id resuelto.
//   3. Sin coordenadas + dirección → geocoding + ciudad.
//   4. Geocoding no disponible → incidente igual, lat/lng NULL, PENDING.
//   5. Reenvío del mismo event.id → no duplica (idempotencia).
//   6. Sin conversation_id → 400 detallando el campo.
//   7. Sin mensajes acumulados → 409.
//   8. from inválido → 400, con el evento registrado en ingest_responses.
//   9. Conversaciones distintas no mezclan sus mensajes.
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

describe("S5 — Un evento de completado sin conversation_id no crea incidente", () => {
  it("devuelve 400 detallando el campo faltante y no crea ningún registro en needs", async () => {
    const ingest = createInMemoryIngestResponsesStore();
    const needs = createInMemoryNeedsStore();

    const res = await postWith(ingest, needs, buildCompletion({ conversation_id: "" }));
    expect(res.status).toBe(400);
    const body = await res.json();

    // El 400 puede venir de la validación general S2 (validation_failed) o del
    // check específico S5 (missing_conversation_id). Ambos detallan el campo.
    expect(["validation_failed", "missing_conversation_id"]).toContain(body.code);
    const paths = (body.details?.issues ?? []).map((i: { path: string[] }) =>
      i.path.join("."),
    );
    expect(paths).toContain("conversation_id");
    expect(needs.size()).toBe(0);
  });
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
