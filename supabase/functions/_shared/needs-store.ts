// =============================================================================
// _shared/needs-store.ts — Persistencia del incidente en `needs` (S5)
// Ticket: DEV-35
//
// Módulo PURE y SIN dependencias de npm/Deno (solo Web Standards: fetch es un
// global). Comparte tipos y lógica entre la Edge Function `webhook` (Deno) y
// los tests unitarios (vitest/Node), cumpliendo NFR-4 (lógica pura testeable
// sin dependencias).
//
// S5 crea el registro en `needs` cuando llega el evento de completado:
//   - `insert(record)`       → INSERT de la fila del incidente.
//   - `findBySourceEventId`  → lookup por `source_event_id` (idempotencia por
//                              event.id del completado; S5/S6).
//   - `findByConversationId` → lookup por `conversation_id` (un incidente por
//                              conversación; no se mezclan conversaciones).
//
// La idempotencia durable la garantiza la migración S5:
//   - UNIQUE parcial sobre `needs(source_event_id)`.
//   - UNIQUE parcial sobre `needs(conversation_id)`.
// El store real (PostgREST) maneja el conflicto devolviendo la fila existente.
// =============================================================================

// -----------------------------------------------------------------------------
// Tipos de fila de `needs`
// -----------------------------------------------------------------------------

/** Fila de `needs` con los nombres de columna de la tabla (S1 + S5). */
export interface NeedRecord {
  id: string;
  city_id: string;
  emergency_id: string;
  title: string;
  description: string;
  place_type: string;
  categories: unknown;
  resources: unknown;
  address: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  priority: string;
  status: string;
  verification_status: string;
  verified_by: string | null;
  verification_notes: string | null;
  verified_at: string | null;
  source: string;
  source_url: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  organization_name: string | null;
  requester_type: string;
  operating_hours: string | null;
  evidence_url: string | null;
  created_at: string;
  updated_at: string;
  last_updated_by: string | null;
  expires_at: string | null;
  is_demo_data: boolean | null;
  // Columnas S5 (idempotencia / trazabilidad).
  source_event_id: string | null;
  conversation_id: string | null;
  location_enrichment_status: string;
}

/** Subconjunto de `needs` que el receptor construye y persiste. */
export interface NeedInsert {
  city_id?: string;
  emergency_id?: string;
  title: string;
  description: string;
  place_type?: string;
  categories?: unknown;
  resources?: unknown;
  address: string;
  neighborhood: string;
  latitude?: number | null;
  longitude?: number | null;
  priority?: string;
  status?: string;
  verification_status?: string;
  source?: string;
  source_url?: string | null;
  contact_name: string;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  organization_name?: string | null;
  requester_type?: string;
  operating_hours?: string | null;
  evidence_url?: string | null;
  last_updated_by?: string | null;
  expires_at?: string | null;
  is_demo_data?: boolean | null;
  // Columnas S5 (idempotencia / trazabilidad).
  source_event_id: string;
  conversation_id: string;
  location_enrichment_status?: string;
}

export interface InsertNeedResult {
  /** Fila insertada o, en un conflicto, la fila existente. */
  record: NeedRecord;
  /** true cuando esta llamada insertó la fila; false en un conflicto. */
  inserted: boolean;
  /** true cuando ya existía un incidente para ese event.id / conversación. */
  duplicate: boolean;
}

/** Store mínima que la capa de creación de incidentes necesita sobre `needs`. */
export interface NeedsStore {
  /** Inserta la fila; si ya existe (event.id o conversación), devuelve la existente. */
  insert(record: NeedInsert): Promise<InsertNeedResult>;
  /** Devuelve el incidente originado por un event.id de completado, o null. */
  findBySourceEventId(eventId: string): Promise<NeedRecord | null>;
  /** Devuelve el incidente de una conversación, o null. */
  findByConversationId(conversationId: string): Promise<NeedRecord | null>;
  /** Devuelve el incidente por su id (US-3: reconstrucción de conversación), o null. */
  findById(id: string): Promise<NeedRecord | null>;
}

// -----------------------------------------------------------------------------
// Store in-memory (tests y demo) — replica las UNIQUE parciales de la migración
// -----------------------------------------------------------------------------

export interface InMemoryNeedsStore extends NeedsStore {
  /** Número de filas actuales. */
  size(): number;
  /** Todas las filas (para aserciones). */
  all(): NeedRecord[];
  /** Fila por id (para aserciones). */
  get(id: string): NeedRecord | undefined;
}

/**
 * Store en memoria que replica la idempotencia de la migración S5:
 *   - un `source_event_id` ya presente devuelve la fila existente;
 *   - una `conversation_id` ya presente devuelve la fila existente.
 */
export function createInMemoryNeedsStore(
  seed: NeedRecord[] = [],
): InMemoryNeedsStore {
  const rows = new Map<string, NeedRecord>();
  for (const record of seed) {
    rows.set(record.id, record);
  }

  const findDuplicate = (record: NeedInsert): NeedRecord | null => {
    for (const row of rows.values()) {
      if (record.source_event_id && row.source_event_id === record.source_event_id) {
        return row;
      }
      if (record.conversation_id && row.conversation_id === record.conversation_id) {
        return row;
      }
    }
    return null;
  };

  return {
    async insert(record: NeedInsert): Promise<InsertNeedResult> {
      const existing = findDuplicate(record);
      if (existing) {
        return { record: existing, inserted: false, duplicate: true };
      }
      const now = new Date().toISOString();
      const withId: NeedRecord = {
        id: crypto.randomUUID(),
        city_id: record.city_id ?? "cali",
        emergency_id: record.emergency_id ?? "general",
        title: record.title,
        description: record.description,
        place_type: record.place_type ?? "EDIFICIO_AFECTADO",
        categories: record.categories ?? [],
        resources: record.resources ?? [],
        address: record.address,
        neighborhood: record.neighborhood,
        latitude: record.latitude ?? null,
        longitude: record.longitude ?? null,
        priority: record.priority ?? "MEDIUM",
        status: record.status ?? "NEED_HELP_NOW",
        verification_status: record.verification_status ?? "PENDING_VERIFICATION",
        verified_by: null,
        verification_notes: null,
        verified_at: null,
        source: record.source ?? "WhatsApp",
        source_url: record.source_url ?? null,
        contact_name: record.contact_name,
        contact_phone: record.contact_phone ?? null,
        contact_whatsapp: record.contact_whatsapp ?? null,
        contact_email: record.contact_email ?? null,
        organization_name: record.organization_name ?? null,
        requester_type: record.requester_type ?? "PERSONA",
        operating_hours: record.operating_hours ?? null,
        evidence_url: record.evidence_url ?? null,
        created_at: now,
        updated_at: now,
        last_updated_by: record.last_updated_by ?? null,
        expires_at: record.expires_at ?? null,
        is_demo_data: record.is_demo_data ?? false,
        source_event_id: record.source_event_id,
        conversation_id: record.conversation_id,
        location_enrichment_status: record.location_enrichment_status ?? "PENDING",
      };
      rows.set(withId.id, withId);
      return { record: withId, inserted: true, duplicate: false };
    },
    async findBySourceEventId(eventId: string): Promise<NeedRecord | null> {
      for (const row of rows.values()) {
        if (row.source_event_id === eventId) return row;
      }
      return null;
    },
    async findByConversationId(conversationId: string): Promise<NeedRecord | null> {
      for (const row of rows.values()) {
        if (row.conversation_id === conversationId) return row;
      }
      return null;
    },
    async findById(id: string): Promise<NeedRecord | null> {
      return rows.get(id) ?? null;
    },
    size() {
      return rows.size;
    },
    all() {
      return [...rows.values()];
    },
    get(id: string) {
      return rows.get(id);
    },
  };
}

// -----------------------------------------------------------------------------
// Store PostgREST (Edge Function real)
// -----------------------------------------------------------------------------

export interface PostgrestNeedsStoreOptions {
  /** SUPABASE_URL (ej. http://127.0.0.1:54341 en local). */
  url: string;
  /** SUPABASE_SERVICE_ROLE_KEY (BYPASSRLS). */
  serviceRoleKey: string;
  /** Para inyectar un fetch falso en tests. */
  fetchFn?: typeof fetch;
}

function parsePostgrestError(status: number, text: string): Error {
  return new Error(`needs: PostgREST respondió ${status} — ${text.slice(0, 500)}`);
}

function toRecord(row: Record<string, unknown>): NeedRecord {
  return row as unknown as NeedRecord;
}

/**
 * Store real contra Supabase/PostgREST usando `service_role` (BYPASSRLS).
 *
 * Idempotencia por `source_event_id` y `conversation_id`:
 *   1. `POST /rest/v1/needs` con `Prefer: resolution=ignore-duplicates,
 *      return=representation`. Si la fila se inserta, se devuelve.
 *   2. Si PostgREST responde conflicto o representación vacía (el UNIQUE
 *      parcial de la migración S5 bloqueó la inserción), se hace lookup por
 *      `source_event_id` y, si no aparece, por `conversation_id`, devolviendo
 *      la fila existente SIN modificarla.
 *
 * No depende de `@supabase/supabase-js`: usa `fetch` (Web Standard), por lo
 * que el módulo sigue siendo PURE (NFR-4) y testeable con un fetch falso.
 */
export function createPostgrestNeedsStore(
  opts: PostgrestNeedsStoreOptions,
): NeedsStore {
  const f = opts.fetchFn ?? fetch;
  const base = `${opts.url.replace(/\/+$/, "")}/rest/v1/needs`;
  const authHeaders = {
    apikey: opts.serviceRoleKey,
    Authorization: `Bearer ${opts.serviceRoleKey}`,
  };

  const selectBy = async (
    filter: string,
    value: string,
  ): Promise<NeedRecord | null> => {
    const selRes = await f(
      `${base}?${filter}=eq.${encodeURIComponent(value)}&select=*`,
      { method: "GET", headers: authHeaders },
    );
    if (!selRes.ok) {
      throw parsePostgrestError(selRes.status, await selRes.text());
    }
    const rows = (await selRes.json()) as Array<Record<string, unknown>>;
    return Array.isArray(rows) && rows.length > 0 ? toRecord(rows[0]) : null;
  };

  return {
    async insert(record: NeedInsert): Promise<InsertNeedResult> {
      const insertRes = await f(base, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify(record),
      });
      if (!insertRes.ok) {
        // 409 (conflict) por UNIQUE (source_event_id / conversation_id).
        if (insertRes.status === 409) {
          const existing =
            (await selectBy("source_event_id", record.source_event_id)) ??
            (await selectBy("conversation_id", record.conversation_id));
          if (existing) {
            return { record: existing, inserted: false, duplicate: true };
          }
        }
        throw parsePostgrestError(insertRes.status, await insertRes.text());
      }
      const insertedRows = (await insertRes.json()) as Array<Record<string, unknown>>;
      if (Array.isArray(insertedRows) && insertedRows.length > 0) {
        return { record: toRecord(insertedRows[0]), inserted: true, duplicate: false };
      }

      // Representación vacía → la fila ya existía (UNIQUE). Devolver la
      // existente sin modificar.
      const existing =
        (await selectBy("source_event_id", record.source_event_id)) ??
        (await selectBy("conversation_id", record.conversation_id));
      if (existing) {
        return { record: existing, inserted: false, duplicate: true };
      }
      throw new Error(
        `needs: no se encontró la fila existente para source_event_id=${record.source_event_id}`,
      );
    },

    async findBySourceEventId(eventId: string): Promise<NeedRecord | null> {
      return selectBy("source_event_id", eventId);
    },

    async findByConversationId(conversationId: string): Promise<NeedRecord | null> {
      return selectBy("conversation_id", conversationId);
    },

    async findById(id: string): Promise<NeedRecord | null> {
      return selectBy("id", id);
    },
  };
}
