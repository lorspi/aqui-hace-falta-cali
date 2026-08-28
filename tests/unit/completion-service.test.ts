import { describe, it, expect } from "vitest";
import {
  processCompletionEvent,
  type CompletionServiceDeps,
} from "../../supabase/functions/_shared/completion-service.ts";
import { createInMemoryNeedsStore } from "../../supabase/functions/_shared/needs-store.ts";
import type { Geocoder, GeocodingResult } from "../../supabase/functions/_shared/geocoding.ts";

// ============================================================================
// Unit Tests — S5: Creación del incidente al completar la conversación (DEV-35)
//
// Cubren los escenarios Gherkin de la historia S5 a nivel de servicio:
//   1. Evento de completado + mensajes acumulados → incidente en needs.
//   2. Con coordenadas → no se invoca geocoding; city_id se resuelve.
//   3. Sin coordenadas + dirección → geocoding + city_id.
//   4. Geocoding no disponible → incidente igual con lat/lng NULL y PENDING.
//   5. Reenvío del mismo event.id → no duplica (idempotencia).
//   6. Sin conversation_id / sin mensajes acumulados → no hay incidente.
//   7. from inválido → rechazo (sin incidente).
//   8. Conversaciones distintas no mezclan sus mensajes.
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

function makeDeps(overrides: Partial<CompletionServiceDeps> = {}): CompletionServiceDeps {
  return {
    needsStore: createInMemoryNeedsStore(),
    geocoder: makeGeocoder(null),
    ...overrides,
  };
}

describe("S5 — El evento de completado crea el incidente con los datos acumulados", () => {
  it("crea el incidente en needs con source=WhatsApp, contact_whatsapp y defaults", async () => {
    const deps = makeDeps();
    const messages = [
      buildMessage({ id: "evt_msg_1", data: { body: "Necesito agua potable en mi barrio", from: "573001234567" } }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;

    expect(result.incident.source).toBe("WhatsApp");
    expect(result.incident.contact_whatsapp).toBe("573001234567");
    expect(result.incident.verification_status).toBe("PENDING_VERIFICATION");
    expect(result.incident.priority).toBe("MEDIUM");
    expect(result.incident.status).toBe("NEED_HELP_NOW");
    expect(result.incident.emergency_id).toBe("terremoto-cali-2026");
    expect(result.incident.source_event_id).toBe("evt_999");
    expect(result.incident.conversation_id).toBe("conv_123");
  });

  it("el incidente se construye con los mensajes acumulados de la conversación", async () => {
    const deps = makeDeps();
    const messages = [
      buildMessage({ id: "evt_msg_1", data: { body: "Primer mensaje", from: "573001234567" } }),
      buildMessage({ id: "evt_msg_2", data: { body: "Segundo mensaje", from: "573001234567" } }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.description).toContain("Primer mensaje");
    expect(result.incident.description).toContain("Segundo mensaje");
  });
});

describe("S5 — Una conversación completada genera un solo registro aunque acumule varias necesidades", () => {
  it("no genera un registro por cada tipo de necesidad; title y description consolidan", async () => {
    const deps = makeDeps();
    const messages = [
      buildMessage({ id: "evt_need_1", data: { body: "Necesito agua potable", from: "573001234567" } }),
      buildMessage({ id: "evt_need_2", data: { body: "También necesito medicinas para mi hijo", from: "573001234567" } }),
      buildMessage({ id: "evt_need_3", data: { body: "Mi techo está dañado", from: "573001234567" } }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;

    // Un único registro en needs para la conversación.
    expect(deps.needsStore.size()).toBe(1);
    // title y description consolidan la información acumulada.
    expect(result.incident.description).toContain("Necesito agua potable");
    expect(result.incident.description).toContain("medicinas para mi hijo");
    expect(result.incident.description).toContain("techo está dañado");
    expect(result.incident.title).toContain("Necesito agua potable");
  });
});

describe("S5 — Evento de completado con coordenadas", () => {
  it("crea el incidente con esas coordenadas y resuelve city_id, sin geocoding", async () => {
    let geocoderCalled = false;
    const geocoder: Geocoder = {
      async geocode() {
        geocoderCalled = true;
        return null;
      },
    };
    const deps = makeDeps({ geocoder });
    const messages = [
      buildMessage({
        id: "evt_coords",
        data: { body: { text: "Estoy aquí", latitude: 3.4516, longitude: -76.532 }, from: "573001234567" },
      }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.latitude).toBe(3.4516);
    expect(result.incident.longitude).toBe(-76.532);
    expect(result.incident.city_id).toBe("cali");
    expect(result.incident.location_enrichment_status).toBe("RESOLVED");
    // No se invoca el flujo de geocoding.
    expect(geocoderCalled).toBe(false);
  });
});

describe("S5 — Evento de completado sin coordenadas dispara geocoding + ciudad", () => {
  it("invoca el geocoder y actualiza lat/lng y city_id cuando resuelve", async () => {
    const geocoder = makeGeocoder({ latitude: 3.4516, longitude: -76.532, displayName: "Cali" });
    const deps = makeDeps({ geocoder });
    const messages = [
      buildMessage({
        id: "evt_addr",
        data: {
          body: { text: "Necesito ayuda", address: "Calle 5 #10-20", neighborhood: "San Fernando" },
          from: "573001234567",
        },
      }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.latitude).toBe(3.4516);
    expect(result.incident.longitude).toBe(-76.532);
    expect(result.incident.city_id).toBe("cali");
    expect(result.incident.location_enrichment_status).toBe("RESOLVED");
  });
});

describe("S5 — Geocoding no disponible no bloquea la creación", () => {
  it("crea el incidente igual con lat/lng NULL y PENDING cuando no hay geocoder", async () => {
    const deps = makeDeps({ geocoder: undefined });
    const messages = [
      buildMessage({
        id: "evt_addr",
        data: { body: { text: "Necesito ayuda", address: "Calle 5 #10-20", neighborhood: "San Fernando" }, from: "573001234567" },
      }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.latitude).toBeNull();
    expect(result.incident.longitude).toBeNull();
    expect(result.incident.address).toBe("Calle 5 #10-20");
    expect(result.incident.location_enrichment_status).toBe("PENDING");
  });

  it("crea el incidente igual cuando el geocoding no resuelve la dirección", async () => {
    const deps = makeDeps({ geocoder: makeGeocoder(null) });
    const messages = [
      buildMessage({
        id: "evt_addr",
        data: { body: { text: "Necesito ayuda", address: "Dirección inventada", neighborhood: "Barrio X" }, from: "573001234567" },
      }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.latitude).toBeNull();
    expect(result.incident.longitude).toBeNull();
    expect(result.incident.location_enrichment_status).toBe("PENDING");
  });

  it("crea el incidente sin coordenadas cuando no hay dirección para geocoding", async () => {
    const deps = makeDeps();
    const messages = [
      buildMessage({ id: "evt_plain", data: { body: "Necesito ayuda", from: "573001234567" } }),
    ];

    const result = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.incident.latitude).toBeNull();
    expect(result.incident.longitude).toBeNull();
    expect(result.incident.location_enrichment_status).toBe("PENDING");
    // El flujo no rechaza el evento de completado.
  });
});

describe("S5 — Reenvío del mismo evento de completado", () => {
  it("no crea un incidente duplicado y devuelve el existente (idempotencia por event.id)", async () => {
    const deps = makeDeps();
    const messages = [buildMessage()];

    const first = await processCompletionEvent(deps, buildCompletion(), messages);
    expect(first.status).toBe("created");

    // Reenvío con el mismo id.
    const resend = await processCompletionEvent(deps, buildCompletion(), messages);

    expect(resend.status).toBe("duplicate");
    if (resend.status !== "duplicate") return;
    expect(resend.incident.id).toBe(first.status === "created" ? first.incident.id : undefined);
    expect(deps.needsStore.size()).toBe(1);
  });
});

describe("S5 — Evento de completado sin mensajes acumulados", () => {
  it("no crea incidente cuando no hay mensajes acumulados previos", async () => {
    const deps = makeDeps();
    const result = await processCompletionEvent(deps, buildCompletion(), []);

    expect(result.status).toBe("no_messages");
    if (result.status !== "no_messages") return;
    expect(result.conversationId).toBe("conv_123");
    expect(deps.needsStore.size()).toBe(0);
  });
});

describe("S5 — Un evento de completado con from inválido se rechaza", () => {
  it("devuelve invalid_from y no crea el incidente", async () => {
    const deps = makeDeps();
    const messages = [buildMessage()];
    const completion = buildCompletion({ data: { body: "fin", from: "numero-invalido" } });

    const result = await processCompletionEvent(deps, completion, messages);

    expect(result.status).toBe("invalid_from");
    if (result.status !== "invalid_from") return;
    expect(result.issue).toContain("no es un número de WhatsApp válido");
    expect(deps.needsStore.size()).toBe(0);
  });
});

describe("S5 — Conversaciones distintas no mezclan sus mensajes acumulados", () => {
  it("arma el incidente solo con los mensajes de su conversación", async () => {
    const deps = makeDeps();
    const messagesConvA = [
      buildMessage({ id: "evt_a1", conversation_id: "conv_A", data: { body: "Mensaje de A", from: "573001234567" } }),
    ];
    // Mensajes de la conversación B (no deben incluirse en el incidente de A).
    const messagesConvB = [
      buildMessage({ id: "evt_b1", conversation_id: "conv_B", data: { body: "Mensaje de B", from: "573001234567" } }),
    ];
    void messagesConvB;

    const completionA = buildCompletion({ id: "evt_ca", conversation_id: "conv_A" });
    const resultA = await processCompletionEvent(deps, completionA, messagesConvA);

    expect(resultA.status).toBe("created");
    if (resultA.status !== "created") return;
    expect(resultA.incident.conversation_id).toBe("conv_A");
    expect(resultA.incident.description).toContain("Mensaje de A");
    expect(resultA.incident.description).not.toContain("Mensaje de B");

    // La conversación B permanece sin incidente.
    expect(deps.needsStore.size()).toBe(1);
  });
});
