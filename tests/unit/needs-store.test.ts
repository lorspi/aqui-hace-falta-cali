import { describe, it, expect } from "vitest";
import {
  createInMemoryNeedsStore,
  createPostgrestNeedsStore,
  type NeedInsert,
  type NeedRecord,
} from "../../supabase/functions/_shared/needs-store.ts";

// ============================================================================
// Unit Tests — S5: Persistencia del incidente en `needs` (DEV-35)
//
// Cubren la capa de persistencia del incidente:
//   1. Store in-memory: insert crea, idempotencia por source_event_id y por
//      conversation_id, lookups por event.id y por conversación.
//   2. Store PostgREST (fake fetch): INSERT + resolución de conflicto UNIQUE.
// ============================================================================

function buildInsert(overrides: Partial<NeedInsert> = {}): NeedInsert {
  return {
    title: "Solicitud de ayuda vía WhatsApp",
    description: "Necesito agua potable en mi barrio",
    address: "Por confirmar",
    neighborhood: "Por confirmar",
    latitude: null,
    longitude: null,
    contact_name: "Ciudadano vía WhatsApp",
    contact_whatsapp: "573001234567",
    priority: "MEDIUM",
    status: "NEED_HELP_NOW",
    verification_status: "PENDING_VERIFICATION",
    source: "WhatsApp",
    emergency_id: "terremoto-cali-2026",
    city_id: "cali",
    source_event_id: "evt_completion",
    conversation_id: "conv_001",
    location_enrichment_status: "PENDING",
    ...overrides,
  };
}

describe("S5 — Store in-memory de needs", () => {
  it("inserta una fila con los defaults de la tabla", async () => {
    const store = createInMemoryNeedsStore();
    const result = await store.insert(buildInsert());

    expect(result.inserted).toBe(true);
    expect(result.duplicate).toBe(false);

    const row = result.record;
    expect(row.id).toBeTruthy();
    expect(row.title).toBe("Solicitud de ayuda vía WhatsApp");
    expect(row.source).toBe("WhatsApp");
    expect(row.priority).toBe("MEDIUM");
    expect(row.status).toBe("NEED_HELP_NOW");
    expect(row.verification_status).toBe("PENDING_VERIFICATION");
    expect(row.source_event_id).toBe("evt_completion");
    expect(row.conversation_id).toBe("conv_001");
    expect(row.latitude).toBeNull();
    expect(row.longitude).toBeNull();
    expect(row.location_enrichment_status).toBe("PENDING");
    expect(store.size()).toBe(1);
  });

  it("un reenvío con el mismo source_event_id no crea duplicado (idempotencia por event.id)", async () => {
    const store = createInMemoryNeedsStore();
    const first = await store.insert(buildInsert());
    expect(first.inserted).toBe(true);

    const resend = await store.insert(buildInsert());
    expect(resend.inserted).toBe(false);
    expect(resend.duplicate).toBe(true);
    expect(resend.record.id).toBe(first.record.id);
    expect(store.size()).toBe(1);
  });

  it("dos eventos de completado para la misma conversación no crean dos incidentes", async () => {
    const store = createInMemoryNeedsStore();
    const first = await store.insert(buildInsert({ source_event_id: "evt_c1" }));
    expect(first.inserted).toBe(true);

    // Otro event.id pero misma conversación.
    const second = await store.insert(
      buildInsert({ source_event_id: "evt_c2", conversation_id: "conv_001" }),
    );
    expect(second.inserted).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(store.size()).toBe(1);
  });

  it("conversaciones distintas no mezclan sus incidentes", async () => {
    const store = createInMemoryNeedsStore();
    const a = await store.insert(buildInsert({ source_event_id: "evt_a", conversation_id: "conv_A" }));
    const b = await store.insert(buildInsert({ source_event_id: "evt_b", conversation_id: "conv_B" }));

    expect(a.inserted).toBe(true);
    expect(b.inserted).toBe(true);
    expect(store.size()).toBe(2);
  });

  it("findBySourceEventId y findByConversationId recuperan el incidente", async () => {
    const store = createInMemoryNeedsStore();
    await store.insert(buildInsert());

    const byEvent = await store.findBySourceEventId("evt_completion");
    expect(byEvent?.conversation_id).toBe("conv_001");

    const byConversation = await store.findByConversationId("conv_001");
    expect(byConversation?.source_event_id).toBe("evt_completion");

    expect(await store.findBySourceEventId("no-existe")).toBeNull();
    expect(await store.findByConversationId("no-existe")).toBeNull();
  });
});

describe("S5 — Store PostgREST de needs", () => {
  function fakeFetch(
    rowsByKey: Map<string, NeedRecord>,
  ): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/rest/v1/needs?") === false && method === "POST") {
        // POST a la base de needs (insert).
        const body = JSON.parse(String(init?.body)) as NeedInsert;
        const key = `event:${body.source_event_id}|conv:${body.conversation_id}`;
        const existing = [...rowsByKey.values()].find(
          (r) =>
            r.source_event_id === body.source_event_id ||
            r.conversation_id === body.conversation_id,
        );
        if (existing) {
          // UNIQUE conflict → PostgREST responde 409 (o 201 con representación vacía).
          return new Response(JSON.stringify({ code: "23505", message: "duplicate key" }), {
            status: 409,
          });
        }
        const row: NeedRecord = {
          id: "00000000-0000-0000-0000-0000000000aa",
          city_id: body.city_id ?? "cali",
          emergency_id: body.emergency_id ?? "general",
          title: body.title,
          description: body.description,
          place_type: body.place_type ?? "EDIFICIO_AFECTADO",
          categories: body.categories ?? [],
          resources: body.resources ?? [],
          address: body.address,
          neighborhood: body.neighborhood,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          priority: body.priority ?? "MEDIUM",
          status: body.status ?? "NEED_HELP_NOW",
          verification_status: body.verification_status ?? "PENDING_VERIFICATION",
          verified_by: null,
          verification_notes: null,
          verified_at: null,
          source: body.source ?? "WhatsApp",
          source_url: body.source_url ?? null,
          contact_name: body.contact_name,
          contact_phone: body.contact_phone ?? null,
          contact_whatsapp: body.contact_whatsapp ?? null,
          contact_email: body.contact_email ?? null,
          organization_name: body.organization_name ?? null,
          requester_type: body.requester_type ?? "PERSONA",
          operating_hours: body.operating_hours ?? null,
          evidence_url: body.evidence_url ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_updated_by: body.last_updated_by ?? null,
          expires_at: body.expires_at ?? null,
          is_demo_data: body.is_demo_data ?? false,
          source_event_id: body.source_event_id,
          conversation_id: body.conversation_id,
          location_enrichment_status: body.location_enrichment_status ?? "PENDING",
        };
        rowsByKey.set(key, row);
        return new Response(JSON.stringify([row]), { status: 201 });
      }

      // GET por filtro (source_event_id=eq. o conversation_id=eq.).
      const sourceMatch = url.match(/source_event_id=eq\.([^&]+)/);
      if (sourceMatch) {
        const eventId = decodeURIComponent(sourceMatch[1]);
        const row = [...rowsByKey.values()].find((r) => r.source_event_id === eventId);
        return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
      }
      const convMatch = url.match(/conversation_id=eq\.([^&]+)/);
      if (convMatch) {
        const convId = decodeURIComponent(convMatch[1]);
        const row = [...rowsByKey.values()].find((r) => r.conversation_id === convId);
        return new Response(JSON.stringify(row ? [row] : []), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }) as typeof fetch;
  }

  it("inserta el incidente y, en un conflicto UNIQUE, devuelve la fila existente", async () => {
    const rows = new Map<string, NeedRecord>();
    const store = createPostgrestNeedsStore({
      url: "http://127.0.0.1:54341",
      serviceRoleKey: "service-role-key",
      fetchFn: fakeFetch(rows),
    });

    const first = await store.insert(buildInsert());
    expect(first.inserted).toBe(true);
    expect(first.record.source_event_id).toBe("evt_completion");

    // Reenvío con el mismo event.id.
    const resend = await store.insert(buildInsert());
    expect(resend.inserted).toBe(false);
    expect(resend.duplicate).toBe(true);
    expect(resend.record.id).toBe(first.record.id);
    expect(rows.size).toBe(1);
  });

  it("findBySourceEventId y findByConversationId funcionan con PostgREST", async () => {
    const rows = new Map<string, NeedRecord>();
    const store = createPostgrestNeedsStore({
      url: "http://127.0.0.1:54341",
      serviceRoleKey: "service-role-key",
      fetchFn: fakeFetch(rows),
    });
    await store.insert(buildInsert());

    const byEvent = await store.findBySourceEventId("evt_completion");
    expect(byEvent?.conversation_id).toBe("conv_001");

    const byConversation = await store.findByConversationId("conv_001");
    expect(byConversation?.source_event_id).toBe("evt_completion");
  });
});
