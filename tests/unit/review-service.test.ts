import { describe, it, expect } from "vitest";
import {
  applyReview,
  normalizeDecision,
  REVIEW_DECISIONS,
  type ReviewDecision,
} from "../../supabase/functions/_shared/review-service.ts";
import {
  createInMemoryNeedsStore,
  type NeedRecord,
} from "../../supabase/functions/_shared/needs-store.ts";

// ============================================================================
// Unit Tests — US-4: Transición de estado de revisión (DEV-43)
//
// Cubren la lógica PURE de la decisión de revisión (review-service.ts):
//   1. normalizeDecision acepta aprobar/approve → APPROVE y rechazar/reject →
//      REJECT, y rechaza cualquier otro valor.
//   2. Aprobar un need PENDING_VERIFICATION lo transiciona a VERIFIED y guarda
//      verified_by / verified_at (y verification_notes si se incluye).
//   3. Rechazar un need PENDING_VERIFICATION lo transiciona a REJECTED y
//      guarda quién, cuándo y opcionalmente el motivo.
//   4. Rechazar sin motivo es válido (verification_notes queda null).
//   5. Un need con verification_status distinto de PENDING_VERIFICATION no se
//      modifica y devuelve invalid_state con el estado actual.
//   6. Un need inexistente devuelve not_found.
// ============================================================================

/** UUID estable del need de prueba (needs.id es columna UUID en Supabase). */
const NEED_123_UUID = "00000000-0000-0000-0000-000000000123";

/** Construye un NeedRecord base con verification_status PENDING_VERIFICATION. */
function buildNeed(overrides: Partial<NeedRecord> = {}): NeedRecord {
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

describe("US-4 — normalizeDecision acepta los alias aprobar/rechazar y rechaza otros valores", () => {
  it.each<[unknown, ReviewDecision]>([
    ["aprobar", "APPROVE"],
    ["approve", "APPROVE"],
    ["APROBAR", "APPROVE"],
    ["  aprobar  ", "APPROVE"],
    ["rechazar", "REJECT"],
    ["reject", "REJECT"],
    ["RECHAZAR", "REJECT"],
  ])("con la decisión %j → %s", (raw, expected) => {
    expect(normalizeDecision(raw)).toBe(expected);
  });

  it.each<unknown>([
    "quizás",
    "maybe",
    "verificar",
    "",
    null,
    undefined,
    42,
    {},
    [],
  ])("con la decisión inválida %j → null", (raw) => {
    expect(normalizeDecision(raw)).toBeNull();
  });
});

describe("US-4 — REVIEW_DECISIONS mapea cada decisión a su estado destino", () => {
  it("approve → VERIFIED y reject → REJECTED", () => {
    expect(REVIEW_DECISIONS.APPROVE).toBe("VERIFIED");
    expect(REVIEW_DECISIONS.REJECT).toBe("REJECTED");
  });
});

describe("US-4 — Aprobar un need pendiente lo convierte en necesidad real", () => {
  it("transiciona a VERIFIED y guarda quién aprobó y cuándo", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "APPROVE",
      verifiedBy: "operador@radar.local",
    });

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;

    expect(outcome.record.verification_status).toBe("VERIFIED");
    expect(outcome.record.verified_by).toBe("operador@radar.local");
    expect(outcome.record.verified_at).toBeTruthy();
    expect(outcome.record.verification_notes).toBeNull();
    expect(outcome.record.last_updated_by).toBe("operador@radar.local");

    // A partir de ahí el need cuenta como necesidad real: ya no está pendiente.
    const persisted = store.get(NEED_123_UUID)!;
    expect(persisted.verification_status).toBe("VERIFIED");
    expect(store.all().filter((n) => n.verification_status === "PENDING_VERIFICATION")).toHaveLength(0);
  });

  it("guarda la nota opcional en verification_notes", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "APPROVE",
      verifiedBy: "operador@radar.local",
      notes: "Verificado en terreno por voluntarios de la Cruz Roja",
    });

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.record.verification_status).toBe("VERIFIED");
    expect(outcome.record.verification_notes).toBe(
      "Verificado en terreno por voluntarios de la Cruz Roja",
    );
    expect(outcome.record.verified_by).toBe("operador@radar.local");
    expect(outcome.record.verified_at).toBeTruthy();
  });
});

describe("US-4 — Rechazar un need pendiente lo excluye de las vistas oficiales sin borrarlo", () => {
  it("transiciona a REJECTED, guarda quién/cuándo y el registro permanece", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "REJECT",
      verifiedBy: "operador@radar.local",
      notes: "Información falsa",
    });

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;

    expect(outcome.record.verification_status).toBe("REJECTED");
    expect(outcome.record.verified_by).toBe("operador@radar.local");
    expect(outcome.record.verified_at).toBeTruthy();
    expect(outcome.record.verification_notes).toBe("Información falsa");

    // El registro NO se borra: permanece para trazabilidad.
    expect(store.get(NEED_123_UUID)).toBeDefined();
    expect(store.size()).toBe(1);
  });

  it("rechazar sin motivo es válido y verification_notes queda null", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "REJECT",
      verifiedBy: "operador@radar.local",
    });

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.record.verification_status).toBe("REJECTED");
    expect(outcome.record.verification_notes).toBeNull();
    expect(outcome.record.verified_by).toBe("operador@radar.local");
    expect(outcome.record.verified_at).toBeTruthy();
  });

  it("una nota en blanco/espacios se persiste como null", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "REJECT",
      verifiedBy: "operador@radar.local",
      notes: "   ",
    });

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.record.verification_notes).toBeNull();
  });
});

describe("US-4 — Un need con verification_status distinto de PENDING_VERIFICATION no se modifica", () => {
  it.each<[string, string]>([
    ["VERIFIED", "VERIFIED"],
    ["REJECTED", "REJECTED"],
    ["REPORTED", "REPORTED"],
    ["ARCHIVED", "ARCHIVED"],
  ])(
    "con estado actual %s devuelve invalid_state y NO modifica el registro",
    async (currentStatus, expectedReported) => {
      const store = createInMemoryNeedsStore([
        buildNeed({ verification_status: currentStatus as NeedRecord["verification_status"] }),
      ]);
      const before = store.get(NEED_123_UUID)!;

      const outcome = await applyReview(store, {
        needId: NEED_123_UUID,
        decision: "APPROVE",
        verifiedBy: "operador@radar.local",
      });

      expect(outcome.status).toBe("invalid_state");
      if (outcome.status !== "ok") {
        expect(outcome.status).toBe("invalid_state");
        if (outcome.status === "invalid_state") {
          expect(outcome.currentStatus).toBe(expectedReported);
        }
      }

      // El registro no se modifica (verification_status, verified_by, verified_at).
      const after = store.get(NEED_123_UUID)!;
      expect(after.verification_status).toBe(currentStatus);
      expect(after.verified_by).toBeNull();
      expect(after.verified_at).toBeNull();
      expect(after.verification_notes).toBeNull();
      expect(after.updated_at).toBe(before.updated_at);
    },
  );
});

describe("US-4 — Un need inexistente devuelve not_found", () => {
  it("no modifica nada cuando el id no existe", async () => {
    const store = createInMemoryNeedsStore([]);

    const outcome = await applyReview(store, {
      needId: NEED_123_UUID,
      decision: "APPROVE",
      verifiedBy: "operador@radar.local",
    });

    expect(outcome.status).toBe("not_found");
    expect(store.size()).toBe(0);
  });
});
