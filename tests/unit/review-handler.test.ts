import { describe, it, expect, vi } from "vitest";
import { handleReviewRequest } from "../../supabase/functions/review/handler.ts";
import {
  createInMemoryNeedsStore,
  type NeedRecord,
} from "../../supabase/functions/_shared/needs-store.ts";

// ============================================================================
// Unit Tests — US-4: Endpoint de transición de revisión (DEV-43)
//
// Cubren los escenarios Gherkin de la historia US-4 a nivel HTTP:
//   1.  Aprobar un need PENDING_VERIFICATION → 200, VERIFIED, verified_by/at.
//   2.  Aprobar con nota opcional → verification_notes guardada.
//   3.  Rechazar un need PENDING_VERIFICATION → 200, REJECTED, sin borrar.
//   4.  Rechazar sin motivo es válido → verification_notes null.
//   5.  Reintentar aprobar un need ya revisado → 409 + estado actual, sin
//       modificar.
//   6.  Reintentar rechazar un need ya revisado → 409 + estado actual, sin
//       modificar.
//   7.  Need inexistente → 404 estructurado (id no-UUID y UUID inexistente).
//   8.  Decisión inválida → 400 invalid_decision, sin modificar.
//   9.  Decisión sin operador → 400 missing_operator, sin modificar.
//  10.  Comportamiento HTTP (405/415/invalid_json/validation_failed/CORS/500).
// ============================================================================

const NEED_123_UUID = "00000000-0000-0000-0000-000000000123";
const MISSING_UUID = "00000000-0000-0000-0000-000000000999";

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

function postReview(payload: unknown, headers: Record<string, string> = {}) {
  return handleReviewRequest(
    new Request("http://127.0.0.1:8002/functions/v1/review", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(payload),
    }),
    { needsStore: createInMemoryNeedsStore() },
  );
}

function reviewWith(
  store: ReturnType<typeof createInMemoryNeedsStore>,
  payload: unknown,
  extraDeps: Record<string, unknown> = {},
) {
  return handleReviewRequest(
    new Request("http://127.0.0.1:8002/functions/v1/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
    { needsStore: store, ...extraDeps } as Parameters<typeof handleReviewRequest>[1],
  );
}

describe("US-4 — Aprobar un reporte pendiente lo convierte en necesidad real", () => {
  it("responde 200, transiciona a VERIFIED y guarda quién y cuándo", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "aprobar",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("reviewed");
    expect(body.decision).toBe("approve");
    expect(body.need.verification_status).toBe("VERIFIED");
    expect(body.need.verified_by).toBe("operador@radar.local");
    expect(body.need.verified_at).toBeTruthy();
    expect(body.need.verification_notes).toBeNull();

    // El need dejó de aparecer en el listado de pendientes de verificación.
    const pendientes = store.all().filter((n) => n.verification_status === "PENDING_VERIFICATION");
    expect(pendientes).toHaveLength(0);
    expect(store.get(NEED_123_UUID)!.verification_status).toBe("VERIFIED");
  });
});

describe("US-4 — Aprobar un reporte con nota opcional", () => {
  it("guarda la nota en verification_notes y quién/cuándo", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "approve",
      verified_by: "operador@radar.local",
      notes: "Verificado en terreno por la Cruz Roja",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.need.verification_status).toBe("VERIFIED");
    expect(body.need.verification_notes).toBe("Verificado en terreno por la Cruz Roja");
    expect(body.need.verified_by).toBe("operador@radar.local");
    expect(body.need.verified_at).toBeTruthy();
  });
});

describe("US-4 — Rechazar un reporte pendiente lo excluye de las vistas oficiales sin borrarlo", () => {
  it("responde 200, transiciona a REJECTED, guarda quién/cuándo/motivo y no borra", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "rechazar",
      verified_by: "operador@radar.local",
      notes: "Información falsa",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.decision).toBe("reject");
    expect(body.need.verification_status).toBe("REJECTED");
    expect(body.need.verified_by).toBe("operador@radar.local");
    expect(body.need.verified_at).toBeTruthy();
    expect(body.need.verification_notes).toBe("Información falsa");

    // El registro no se borra (trazabilidad).
    expect(store.get(NEED_123_UUID)).toBeDefined();
    expect(store.size()).toBe(1);
    expect(store.get(NEED_123_UUID)!.verification_status).toBe("REJECTED");
  });
});

describe("US-4 — Rechazar un reporte sin motivo es válido", () => {
  it("responde 200 con verification_notes vacío/nulo y la operación se completa", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "reject",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.need.verification_status).toBe("REJECTED");
    expect(body.need.verification_notes).toBeNull();
    expect(body.need.verified_by).toBe("operador@radar.local");
    expect(body.need.verified_at).toBeTruthy();
  });
});

describe("US-4 — Reintentar aprobar un reporte ya revisado es rechazado", () => {
  it("responde 409 invalid_verification_status informando el estado actual y NO modifica el registro", async () => {
    const store = createInMemoryNeedsStore([buildNeed({ verification_status: "VERIFIED" })]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "aprobar",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("invalid_verification_status");
    expect(body.message).toContain("VERIFIED");
    expect(body.details.current_status).toBe("VERIFIED");

    const after = store.get(NEED_123_UUID)!;
    expect(after.verification_status).toBe("VERIFIED");
    expect(after.verified_by).toBeNull();
    expect(after.verified_at).toBeNull();
  });
});

describe("US-4 — Reintentar rechazar un reporte ya revisado es rechazado", () => {
  it("responde 409 invalid_verification_status informando REJECTED y NO modifica el registro", async () => {
    const store = createInMemoryNeedsStore([buildNeed({ verification_status: "REJECTED" })]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "rechazar",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("invalid_verification_status");
    expect(body.details.current_status).toBe("REJECTED");

    const after = store.get(NEED_123_UUID)!;
    expect(after.verification_status).toBe("REJECTED");
    expect(after.verified_by).toBeNull();
    expect(after.verified_at).toBeNull();
  });
});

describe("US-4 — Un need inexistente devuelve error estructurado 404", () => {
  it("responde 404 need_not_found para un id no-UUID (no puede existir)", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: "need_999",
      decision: "aprobar",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("need_not_found");
    expect(body.message).toContain("need_999");
    expect(body.details.need_id).toBe("need_999");
  });

  it("responde 404 need_not_found para un UUID bien formado que no existe y no modifica nada", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: MISSING_UUID,
      decision: "rechazar",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("need_not_found");
    expect(body.details.need_id).toBe(MISSING_UUID);

    // Solo el need sembrado permanece intacto.
    expect(store.size()).toBe(1);
    expect(store.get(NEED_123_UUID)!.verification_status).toBe("PENDING_VERIFICATION");
  });
});

describe("US-4 — Una decisión inválida devuelve error de validación 400", () => {
  it("responde 400 invalid_decision y NO modifica el registro", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "quizás",
      verified_by: "operador@radar.local",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_decision");
    expect(body.details.issues[0].path).toContain("decision");

    const after = store.get(NEED_123_UUID)!;
    expect(after.verification_status).toBe("PENDING_VERIFICATION");
    expect(after.verified_by).toBeNull();
  });
});

describe("US-4 — Una decisión sin operador identificado devuelve error de validación 400", () => {
  it("responde 400 missing_operator y NO modifica el registro", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "aprobar",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("missing_operator");
    expect(body.details.issues[0].path).toContain("verified_by");

    const after = store.get(NEED_123_UUID)!;
    expect(after.verification_status).toBe("PENDING_VERIFICATION");
    expect(after.verified_by).toBeNull();
    expect(after.verified_at).toBeNull();
  });

  it("responde 400 missing_operator cuando verified_by viene vacío o en blanco", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      need_id: NEED_123_UUID,
      decision: "aprobar",
      verified_by: "   ",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("missing_operator");
    expect(store.get(NEED_123_UUID)!.verification_status).toBe("PENDING_VERIFICATION");
  });
});

describe("US-4 — Comportamiento HTTP del handler", () => {
  it("acepta el alias needId y verifiedBy (camelCase)", async () => {
    const store = createInMemoryNeedsStore([buildNeed()]);
    const res = await reviewWith(store, {
      needId: NEED_123_UUID,
      decision: "aprobar",
      verifiedBy: "operador@radar.local",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.need.verification_status).toBe("VERIFIED");
  });

  it("responde 400 validation_failed cuando falta need_id", async () => {
    const res = await postReview({ decision: "aprobar", verified_by: "op@radar.local" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_failed");
  });

  it("responde 400 invalid_json para un body no parseable", async () => {
    const res = await handleReviewRequest(
      new Request("http://127.0.0.1:8002/functions/v1/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "no-json",
      }),
      { needsStore: createInMemoryNeedsStore() },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_json");
  });

  it("responde 415 para Content-Type distinto de JSON", async () => {
    const res = await handleReviewRequest(
      new Request("http://127.0.0.1:8002/functions/v1/review", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      }),
      { needsStore: createInMemoryNeedsStore() },
    );
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.code).toBe("invalid_content_type");
  });

  it("responde 405 para métodos distintos de POST", async () => {
    const res = await handleReviewRequest(
      new Request("http://127.0.0.1:8002/functions/v1/review", { method: "GET" }),
      { needsStore: createInMemoryNeedsStore() },
    );
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.code).toBe("method_not_allowed");
  });

  it("responde preflight CORS con 204", async () => {
    const res = await handleReviewRequest(
      new Request("http://127.0.0.1:8002/functions/v1/review", { method: "OPTIONS" }),
      { needsStore: createInMemoryNeedsStore() },
    );
    expect(res.status).toBe(204);
  });

  it("responde 500 genérico y registra la causa vía logError cuando un store falla", async () => {
    const failingStore = {
      ...createInMemoryNeedsStore([buildNeed()]),
      async findById() {
        throw new Error("connection to postgres failed");
      },
    };
    const logError = vi.fn();

    const res = await reviewWith(
      failingStore,
      { need_id: NEED_123_UUID, decision: "aprobar", verified_by: "op@radar.local" },
      { logError },
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("review_failed");
    expect(body.message).not.toContain("postgres");
    expect(logError).toHaveBeenCalledWith("review_failed", expect.any(Error));
  });
});
