import { describe, it, expect } from "vitest";
import { handleWebhookEvent } from "../../supabase/functions/webhook/handler.ts";

// ============================================================================
// Unit Tests — S8: Autenticación del webhook (Authorization: Bearer)
//
// Cubren la capa de autenticación en-código del handler (defensa en
// profundidad, además del gateway `verify_jwt = true`). El check se activa
// SOLO cuando se inyecta `deps.expectedBearerToken`; en producción `index.ts`
// lo inyecta con la service role key del proyecto receptor.
// ============================================================================

const EXPECTED_TOKEN = "service-role-key-del-proyecto-receptor";

function buildValidEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_auth_001",
    type: "message.received",
    conversation_id: "conv_auth_001",
    data: {
      body: "Necesito agua potable en mi barrio",
      from: "573001234567",
      message_type: "text",
      workflow: { step: "awaiting_location" },
    },
    ...overrides,
  };
}

function makeRequest(
  headers: Record<string, string> = {},
  method = "POST",
): Request {
  return new Request(
    "http://127.0.0.1:54321/functions/v1/webhook/events",
    {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: method === "POST" ? JSON.stringify(buildValidEvent()) : undefined,
    },
  );
}

describe("S8 — Autenticación del webhook (Authorization: Bearer)", () => {
  it("sin cabecera Authorization devuelve 401 missing_authorization cuando se inyecta expectedBearerToken", async () => {
    const res = await handleWebhookEvent(makeRequest(), {
      expectedBearerToken: EXPECTED_TOKEN,
    });

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
    const body = await res.json();
    expect(body.code).toBe("missing_authorization");
  });

  it("con un token distinto al esperado devuelve 401 unauthorized", async () => {
    const res = await handleWebhookEvent(
      makeRequest({ authorization: "Bearer token-incorrecto" }),
      { expectedBearerToken: EXPECTED_TOKEN },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
  });

  it("con un esquema distinto de Bearer devuelve 401 missing_authorization", async () => {
    const res = await handleWebhookEvent(
      makeRequest({ authorization: `Basic ${EXPECTED_TOKEN}` }),
      { expectedBearerToken: EXPECTED_TOKEN },
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("missing_authorization");
  });

  it("con el token esperado acepta el evento y responde 200", async () => {
    const res = await handleWebhookEvent(
      makeRequest({ authorization: `Bearer ${EXPECTED_TOKEN}` }),
      { expectedBearerToken: EXPECTED_TOKEN },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("accepted");
    expect(body.event_id).toBe("evt_auth_001");
  });

  it("preflight OPTIONS no exige token aunque se inyecte expectedBearerToken", async () => {
    const res = await handleWebhookEvent(
      makeRequest(
        {
          origin: "https://example.com",
          "access-control-request-method": "POST",
        },
        "OPTIONS",
      ),
      { expectedBearerToken: EXPECTED_TOKEN },
    );

    expect(res.status).toBe(204);
  });

  it("sin expectedBearerToken inyectado conserva el comportamiento abierto previo (200)", async () => {
    const res = await handleWebhookEvent(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
