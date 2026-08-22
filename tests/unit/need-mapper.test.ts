import { describe, it, expect } from "vitest";
import {
  mapEventToNeedDraft,
  normalizeMessageType,
  normalizeWorkflowStep,
  workflowStepContribution,
  createProcessedEventTracker,
  type NeedDraft,
} from "../../supabase/functions/_shared/need-mapper.ts";

// ============================================================================
// Unit Tests — S3: Validación y mapeo de eventos (DEV-33)
//
// Cubren los escenarios Gherkin de la historia S3:
//   1. Evento válido → borrador de Need con defaults.
//   2. Normalización de message_type (formato inconsistente).
//   3. Normalización de workflow.step (formato crudo → canónico + armado).
//   4. Campos mínimos faltantes → rechazo con detalle, sin borrador.
//   5. Campos presentes pero con formato inválido → rechazo, sin borrador.
//   6. Reenvío con el mismo event.id → no produce segundo borrador.
//   7. Sin coordenadas → ubicación pendiente de geocoding (address/neighborhood
//      se conservan cuando vienen incluidos).
//   8. type distinto de message.received → pasa validación sin armar incidente.
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

function assertDefaultedDraft(draft: NeedDraft) {
  expect(draft.priority).toBe("MEDIUM");
  expect(draft.status).toBe("NEED_HELP_NOW");
  expect(draft.verificationStatus).toBe("PENDING_VERIFICATION");
  expect(draft.source).toBe("WhatsApp");
}

describe("S3 — Un evento válido se valida y mapea a un borrador de Need con defaults", () => {
  it("mapea un message.received con los campos mínimos a un draft válido", () => {
    const result = mapEventToNeedDraft(buildValidEvent());

    expect(result.status).toBe("mapped");
    expect(result.issues).toHaveLength(0);
    expect(result.draft).toBeDefined();

    const draft = result.draft!;
    expect(draft.eventId).toBe("evt_001");
    expect(draft.type).toBe("message.received");
    expect(draft.conversationId).toBe("conv_001");
    expect(draft.body).toBe("Necesito agua potable en mi barrio");
  });

  it("aplica los defaults del contrato (priority, status, verification_status, source)", () => {
    const draft = mapEventToNeedDraft(buildValidEvent()).draft!;
    assertDefaultedDraft(draft);
  });

  it("toma contact_whatsapp de data.from cuando está presente", () => {
    const draft = mapEventToNeedDraft(buildValidEvent()).draft!;
    expect(draft.contactWhatsapp).toBe("573001234567");
  });

  it("no fija contact_whatsapp cuando data.from está ausente", () => {
    const draft = mapEventToNeedDraft(
      buildValidEvent({ data: { body: "Mensaje sin remitente" } }),
    ).draft!;
    expect(draft.contactWhatsapp).toBeUndefined();
  });

  it("el borrador queda listo para enriquecerse y persistirse (S4/S5)", () => {
    const draft = mapEventToNeedDraft(buildValidEvent()).draft!;
    // Señalización hacia las etapas posteriores.
    expect(draft.buildsIncident).toBe(true);
    expect(draft.incidentReady).toBe(false);
    expect(draft.locationPendingGeocoding).toBe(true);
  });

  it("acepta un body plano (body en lugar de data.body)", () => {
    const result = mapEventToNeedDraft(
      buildValidEvent({ body: "Mensaje plano", data: undefined }),
    );
    expect(result.status).toBe("mapped");
    expect(result.draft!.description).toBe("Mensaje plano");
  });
});

describe("S3 — message_type llega con formato inconsistente y se normaliza", () => {
  it("normaliza variantes a un valor canónico", () => {
    const cases: Array<[unknown, string]> = [
      ["text", "TEXT"],
      ["TEXT", "TEXT"],
      ["Text", "TEXT"],
      ["  text  ", "TEXT"],
      ["image", "IMAGE"],
      ["Photo", "IMAGE"],
      ["voice", "AUDIO"],
      ["video", "VIDEO"],
      ["document", "DOCUMENT"],
      ["location", "LOCATION"],
    ];
    for (const [input, expected] of cases) {
      expect(normalizeMessageType(input), `message_type=${String(input)}`).toBe(expected);
    }
  });

  it("un message_type desconocido se clasifica como genérico y no invalida el evento", () => {
    expect(normalizeMessageType("formato_raro")).toBe("UNKNOWN");
    expect(normalizeMessageType(42)).toBe("UNKNOWN");
    expect(normalizeMessageType(undefined)).toBe("UNKNOWN");

    const result = mapEventToNeedDraft(
      buildValidEvent({ data: { body: "hola", message_type: "formato_raro" } }),
    );
    expect(result.status).toBe("mapped");
    expect(result.draft!.messageType).toBe("UNKNOWN");
  });
});

describe("S3 — workflow.step se normaliza y alimenta el armado del incidente", () => {
  it("normaliza pasos crudos a valores canónicos", () => {
    const cases: Array<[unknown, string]> = [
      ["awaiting_location", "AWAITING_LOCATION"],
      ["awaiting_details", "AWAITING_DETAILS"],
      ["completed", "COMPLETED"],
      ["Completed", "COMPLETED"],
      ["conversation_completed", "COMPLETED"],
      ["paso_desconocido", "UNKNOWN"],
      [undefined, "UNKNOWN"],
    ];
    for (const [input, expected] of cases) {
      expect(normalizeWorkflowStep(input), `workflow.step=${String(input)}`).toBe(expected);
    }
  });

  it("el paso normalizado determina qué información aporta el mensaje", () => {
    expect(workflowStepContribution("AWAITING_LOCATION")).toBe("LOCATION");
    expect(workflowStepContribution("AWAITING_DETAILS")).toBe("DETAILS");
    expect(workflowStepContribution("COMPLETED")).toBe("COMPLETION");
    expect(workflowStepContribution("UNKNOWN")).toBe("UNKNOWN");
  });

  it("mapea el paso canónico al draft", () => {
    const draft = mapEventToNeedDraft(buildValidEvent()).draft!;
    expect(draft.workflowStep).toBe("AWAITING_LOCATION");
    expect(draft.contribution).toBe("LOCATION");
  });

  it("cuando el paso corresponde al completado, señala que el incidente está listo (S5)", () => {
    const draft = mapEventToNeedDraft(
      buildValidEvent({
        data: { body: "Listo", workflow: { step: "completed" } },
      }),
    ).draft!;
    expect(draft.workflowStep).toBe("COMPLETED");
    expect(draft.incidentReady).toBe(true);
  });

  it("un paso desconocido no invalida el evento (se clasifica como genérico)", () => {
    const result = mapEventToNeedDraft(
      buildValidEvent({ data: { body: "hola", workflow: { step: "raro" } } }),
    );
    expect(result.status).toBe("mapped");
    expect(result.draft!.workflowStep).toBe("UNKNOWN");
    expect(result.draft!.incidentReady).toBe(false);
  });
});

describe("S3 — Un evento con campos mínimos faltantes se rechaza con error de validación", () => {
  it("sin body o sin conversation_id → validation falla y detalla los campos", () => {
    const withoutBody = mapEventToNeedDraft(
      buildValidEvent({ data: { from: "573001234567" }, body: undefined }),
    );
    expect(withoutBody.status).toBe("invalid");
    expect(withoutBody.draft).toBeUndefined();
    const bodyPaths = withoutBody.issues.map((i) => i.path.join("."));
    expect(bodyPaths).toContain("body");

    const withoutConversation = mapEventToNeedDraft(
      buildValidEvent({ conversation_id: undefined }),
    );
    expect(withoutConversation.status).toBe("invalid");
    expect(withoutConversation.draft).toBeUndefined();
    const convPaths = withoutConversation.issues.map((i) => i.path.join("."));
    expect(convPaths).toContain("conversation_id");
  });

  it("no se genera ningún borrador de Need", () => {
    const result = mapEventToNeedDraft({ data: { from: "573001234567" } });
    expect(result.status).toBe("invalid");
    expect(result.draft).toBeUndefined();
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe("S3 — Campos presentes pero con formato inválido se rechazan", () => {
  it("id o conversation_id vacíos, o body que no es string/objeto", () => {
    const cases: Array<Record<string, unknown>> = [
      { id: "", data: { body: "hola" } },
      { id: "   ", data: { body: "hola" } },
      { id: 42, data: { body: "hola" } },
      { conversation_id: "", data: { body: "hola" } },
      { conversation_id: 42, data: { body: "hola" } },
      { data: { body: 42 }, body: undefined },
      { data: { body: true }, body: undefined },
    ];
    for (const override of cases) {
      const result = mapEventToNeedDraft(buildValidEvent(override));
      expect(result.status, `evento=${JSON.stringify(override)}`).toBe("invalid");
      expect(result.draft).toBeUndefined();
    }
  });

  it("indica cada campo inválido", () => {
    const result = mapEventToNeedDraft(
      buildValidEvent({ id: "", conversation_id: "", data: { body: 42 }, body: undefined }),
    );
    const paths = result.issues.map((i) => i.path.join("."));
    expect(paths).toContain("id");
    expect(paths).toContain("conversation_id");
    expect(paths).toContain("body");
  });
});

describe("S3 — Un reenvío con el mismo event.id no vuelve a mapear", () => {
  it("detecta el event.id ya procesado y no produce un segundo borrador", () => {
    const event = buildValidEvent();
    const tracker = createProcessedEventTracker();

    // Primera vez: se procesa y se registra el event.id.
    const first = mapEventToNeedDraft(event, tracker);
    expect(first.status).toBe("mapped");
    expect(first.draft).toBeDefined();
    tracker.add(event.id);

    // Reenvío con el mismo event.id → duplicate, sin nuevo borrador.
    const resend = mapEventToNeedDraft(event, tracker);
    expect(resend.status).toBe("duplicate");
    expect(resend.draft).toBeUndefined();
    expect(resend.issues).toHaveLength(0);
  });

  it("funciona igual pasando el conjunto de id ya procesados", () => {
    const event = buildValidEvent({ id: "evt_dup" });
    const processed = new Set<string>(["evt_dup"]);
    const result = mapEventToNeedDraft(event, processed);
    expect(result.status).toBe("duplicate");
    expect(result.draft).toBeUndefined();
  });

  it("el tracker cuenta los event_id registrados", () => {
    const tracker = createProcessedEventTracker();
    tracker.add("evt_a");
    tracker.add("evt_b");
    expect(tracker.size).toBe(2);
    expect(tracker.has("evt_a")).toBe(true);
    expect(tracker.has("evt_c")).toBe(false);
  });
});

describe("S3 — Un evento sin coordenadas produce un borrador con ubicación pendiente", () => {
  it("mapea sin lat/lng y deja la ubicación pendiente de geocoding", () => {
    const draft = mapEventToNeedDraft(buildValidEvent()).draft!;
    expect(draft.latitude).toBeUndefined();
    expect(draft.longitude).toBeUndefined();
    expect(draft.locationPendingGeocoding).toBe(true);
  });

  it("conserva address y neighborhood desde el body cuando vienen incluidos", () => {
    const draft = mapEventToNeedDraft(
      buildValidEvent({
        data: {
          body: {
            text: "Necesito agua",
            address: "Calle 5 #10-20",
            neighborhood: "San Fernando",
          },
          from: "573001234567",
        },
      }),
    ).draft!;
    expect(draft.address).toBe("Calle 5 #10-20");
    expect(draft.neighborhood).toBe("San Fernando");
    expect(draft.locationPendingGeocoding).toBe(true);
  });

  it("cuando el body incluye lat/lng válidos, no queda pendiente de geocoding", () => {
    const draft = mapEventToNeedDraft(
      buildValidEvent({
        data: {
          body: { text: "Estoy aquí", latitude: 3.4516, longitude: -76.532 },
        },
      }),
    ).draft!;
    expect(draft.latitude).toBe(3.4516);
    expect(draft.longitude).toBe(-76.532);
    expect(draft.locationPendingGeocoding).toBe(false);
  });
});

describe("S3 — Un evento de type distinto a message.received pasa validación sin armar incidente", () => {
  it("conversation_completed valida pero no arma incidente (buildsIncident=false)", () => {
    const result = mapEventToNeedDraft(
      buildValidEvent({ type: "conversation_completed" }),
    );
    expect(result.status).toBe("mapped");
    const draft = result.draft!;
    expect(draft.buildsIncident).toBe(false);
    // Sí es el insumo del flujo de completado: señala incidente listo (S5).
    expect(draft.incidentReady).toBe(true);
  });

  it("un type desconocido valida pero no arma incidente ni lo marca listo", () => {
    const result = mapEventToNeedDraft(buildValidEvent({ type: "otro.tipo" }));
    expect(result.status).toBe("mapped");
    const draft = result.draft!;
    expect(draft.buildsIncident).toBe(false);
    expect(draft.incidentReady).toBe(false);
  });
});
