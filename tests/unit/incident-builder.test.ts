import { describe, it, expect } from "vitest";
import {
  isCompletionEvent,
  isValidWhatsAppNumber,
  buildIncidentFromConversation,
  resolveFrom,
  mergeDescriptions,
  resolveAccumulatedTitle,
  mergeAccumulatedLocation,
  INCIDENT_DEFAULTS,
} from "../../supabase/functions/_shared/incident-builder.ts";

// ============================================================================
// Unit Tests — S5: Construcción del incidente desde la conversación (DEV-35)
//
// Cubren la lógica pura de armado del incidente en `needs`:
//   1. Detección del evento de completado (type conocido o workflow.step).
//   2. Validación del remitente (data.from E.164).
//   3. Merge de los mensajes acumulados → incidente con defaults del contrato.
//   4. Ubicación: coordenadas presentes / address+neighborhood / defaults.
// ============================================================================

/** Construye un evento crudo válido según el contrato documentado. */
function buildEvent(overrides: Record<string, unknown> = {}) {
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

function buildAccumulated(overrides: Record<string, unknown> = {}) {
  return buildEvent({ id: "evt_msg_1", ...overrides });
}

function buildCompletion(overrides: Record<string, unknown> = {}) {
  return buildEvent({
    id: "evt_completion",
    type: "conversation_completed",
    data: { body: "Conversación finalizada", from: "573001234567" },
    ...overrides,
  });
}

describe("S5 — Detección del evento de completado", () => {
  it("reconoce type conversation_completed", () => {
    expect(isCompletionEvent(buildCompletion())).toBe(true);
  });

  it("reconoce type conversation.completed (schema alterno)", () => {
    expect(isCompletionEvent(buildCompletion({ type: "conversation.completed" }))).toBe(true);
  });

  it("reconoce workflow.step=COMPLETED como señal de fin de conversación", () => {
    expect(
      isCompletionEvent(
        buildEvent({
          type: "message.received",
          data: { body: "Listo", workflow: { step: "completed" } },
        }),
      ),
    ).toBe(true);
  });

  it("NO reconoce un message.received en medio de la conversación", () => {
    expect(isCompletionEvent(buildEvent())).toBe(false);
  });

  it("NO reconoce un type desconocido sin paso de completado", () => {
    expect(isCompletionEvent(buildEvent({ type: "otro.tipo" }))).toBe(false);
  });
});

describe("S5 — Validación del remitente (data.from E.164)", () => {
  it("acepta números de WhatsApp colombianos con prefijo 57", () => {
    expect(isValidWhatsAppNumber("573001234567")).toBe(true);
    expect(isValidWhatsAppNumber("+573001234567")).toBe(true);
  });

  it("rechaza números con letras, símbolos o longitud inválida", () => {
    expect(isValidWhatsAppNumber("abc")).toBe(false);
    expect(isValidWhatsAppNumber("123")).toBe(false);
    expect(isValidWhatsAppNumber("5730012345678901234567890")).toBe(false);
    expect(isValidWhatsAppNumber("57300 123 4567")).toBe(false);
    expect(isValidWhatsAppNumber("")).toBe(false);
    expect(isValidWhatsAppNumber(573001234567)).toBe(false);
    expect(isValidWhatsAppNumber(undefined)).toBe(false);
  });
});

describe("S5 — El evento de completado crea el incidente con los datos acumulados", () => {
  it("construye el incidente con los mensajes acumulados y los defaults del contrato", () => {
    const accumulated = [
      buildAccumulated({ id: "evt_msg_1", data: { body: "Necesito agua potable en mi barrio", from: "573001234567", message_type: "text", workflow: { step: "awaiting_location" } } }),
      buildAccumulated({ id: "evt_msg_2", data: { body: "Quedo en San Fernando", from: "573001234567", message_type: "text", workflow: { step: "awaiting_details" } } }),
    ];
    const completion = buildCompletion();

    const incident = buildIncidentFromConversation(completion, accumulated);

    // Defaults del contrato.
    expect(incident.source).toBe("WhatsApp");
    expect(incident.priority).toBe("MEDIUM");
    expect(incident.status).toBe("NEED_HELP_NOW");
    expect(incident.verification_status).toBe("PENDING_VERIFICATION");
    expect(incident.emergency_id).toBe("terremoto-cali-2026");
    expect(incident.city_id).toBe("cali");

    // Contacto desde data.from del completado (o del primer mensaje).
    expect(incident.contact_whatsapp).toBe("573001234567");
    expect(incident.contact_phone).toBe("573001234567");
    expect(incident.contact_name).toBe(INCIDENT_DEFAULTS.contactName);

    // Trazabilidad / idempotencia.
    expect(incident.source_event_id).toBe("evt_completion");
    expect(incident.conversation_id).toBe("conv_001");

    // La descripción acumula los mensajes.
    expect(incident.description).toContain("Necesito agua potable en mi barrio");
    expect(incident.description).toContain("Quedo en San Fernando");
  });

  it("arma el incidente sin mensajes acumulados (solo el completado)", () => {
    const incident = buildIncidentFromConversation(buildCompletion(), []);

    expect(incident.source).toBe("WhatsApp");
    expect(incident.contact_whatsapp).toBe("573001234567");
    expect(incident.description).toBe("Solicitud de ayuda vía WhatsApp");
    // Sin coordenadas ni dirección → defaults "Por confirmar" y PENDING.
    expect(incident.address).toBe("Por confirmar");
    expect(incident.neighborhood).toBe("Por confirmar");
    expect(incident.latitude).toBeNull();
    expect(incident.longitude).toBeNull();
    expect(incident.location_enrichment_status).toBe("PENDING");
  });
});

describe("S5 — Ubicación del incidente", () => {
  it("toma las coordenadas del primer mensaje acumulado que las trae", () => {
    const accumulated = [
      buildAccumulated({
        id: "evt_loc",
        data: {
          body: { text: "Estoy aquí", latitude: 3.4516, longitude: -76.532 },
          from: "573001234567",
        },
      }),
    ];
    const incident = buildIncidentFromConversation(buildCompletion(), accumulated);

    expect(incident.latitude).toBe(3.4516);
    expect(incident.longitude).toBe(-76.532);
    expect(incident.location_enrichment_status).toBe("RESOLVED");
  });

  it("conserva address/neighborhood de los mensajes acumulados", () => {
    const accumulated = [
      buildAccumulated({
        id: "evt_addr",
        data: {
          body: { text: "Necesito ayuda", address: "Calle 5 #10-20", neighborhood: "San Fernando" },
          from: "573001234567",
        },
      }),
    ];
    const incident = buildIncidentFromConversation(buildCompletion(), accumulated);

    expect(incident.address).toBe("Calle 5 #10-20");
    expect(incident.neighborhood).toBe("San Fernando");
    // Sin coordenadas → pendiente de geocoding.
    expect(incident.latitude).toBeNull();
    expect(incident.longitude).toBeNull();
    expect(incident.location_enrichment_status).toBe("PENDING");
  });

  it("el completado puede aportar dirección cuando los mensajes no la traen", () => {
    const accumulated = [buildAccumulated({ id: "evt_plain", data: { body: "Hola", from: "573001234567" } })];
    const completion = buildCompletion({
      data: { body: "Terminamos", from: "573001234567", address: "Av 3N # 10-05" },
    });
    const incident = buildIncidentFromConversation(completion, accumulated);

    expect(incident.address).toBe("Av 3N # 10-05");
    expect(incident.neighborhood).toBe("Por confirmar");
  });
});

describe("S5 — Helpers de merge", () => {
  it("mergeDescriptions une las descripciones no vacías", () => {
    const drafts = [
      { description: "Primer mensaje" },
      { description: "Solicitud de ayuda vía WhatsApp" },
      { description: "Segundo mensaje" },
    ] as Array<{ description: string }>;

    expect(mergeDescriptions(drafts)).toBe("Primer mensaje | Segundo mensaje");
    expect(mergeDescriptions([])).toBe("Solicitud de ayuda vía WhatsApp");
  });

  it("resolveAccumulatedTitle usa la primera descripción real como título", () => {
    const drafts = [
      { description: "Solicitud de ayuda vía WhatsApp" },
      { description: "Título real" },
    ] as Array<{ description: string }>;

    expect(resolveAccumulatedTitle(drafts)).toBe("Título real");
    expect(resolveAccumulatedTitle([])).toBe("Solicitud de ayuda vía WhatsApp");
  });

  it("mergeAccumulatedLocation toma la primera ubicación encontrada", () => {
    const merged = mergeAccumulatedLocation(
      [
        { address: "Calle 1", neighborhood: "Barrio A", latitude: 1, longitude: 2 },
        { address: "Calle 2", neighborhood: "Barrio B" },
      ] as Array<{ address?: string; neighborhood?: string; latitude?: number; longitude?: number }>,
      {},
    );
    expect(merged.address).toBe("Calle 1");
    expect(merged.neighborhood).toBe("Barrio A");
    expect(merged.latitude).toBe(1);
    expect(merged.longitude).toBe(2);
  });
});

describe("S5 — resolveFrom extrae data.from", () => {
  it("devuelve el número cuando data.from es string no vacío", () => {
    expect(resolveFrom(buildCompletion())).toBe("573001234567");
  });

  it("devuelve undefined cuando data.from falta o no es string", () => {
    expect(resolveFrom(buildCompletion({ data: { body: "sin remitente" } }))).toBeUndefined();
    expect(resolveFrom(buildCompletion({ data: { from: 42 } }))).toBeUndefined();
  });
});
