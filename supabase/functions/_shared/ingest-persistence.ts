// =============================================================================
// _shared/ingest-persistence.ts — Persistencia del evento crudo (S4)
// Ticket: DEV-34
//
// Módulo PURE y SIN dependencias de npm/Deno (solo Web Standards: fetch es un
// global). Comparte tipos y lógica entre la Edge Function `webhook` (Deno) y
// los tests unitarios (vitest/Node), cumpliendo NFR-4 del plan (lógica pura
// testeable sin dependencias).
//
// S4 persiste cada evento recibido en `ingest_responses` tal cual llegó:
//   - `raw_event`  → JSON completo del evento sin modificar (columna S4).
//   - `raw_payload`→ alias de compatibilidad S1 (mismo valor).
//   - `body`       → contenido del mensaje (data.body o body plano).
//   - Metadatos    → event_id, type, conversation_id, from, message_type
//                    (canónico), workflow_step (canónico).
//   - `processing_status = 'RECEIVED'` al persistir.
//   - `received_at` / `created_at` → timestamps de recepción y creación.
//
// Idempotencia por `event.id`:
//   - La tabla tiene `UNIQUE (event_id)` (S1). El store hace
//     `INSERT ... ON CONFLICT (event_id) DO NOTHING` y, si el insert no
//     afecta filas, devuelve la fila existente (no la modifica).
//   - Un reenvío con el mismo event.id NO crea duplicados ni modifica la fila
//     original (raw_event y timestamps intactos).
//   - La idempotencia aplica por event.id, NO por conversation_id: eventos
//     distintos de la misma conversación generan filas separadas.
// =============================================================================

import {
  type RawWebhookEvent,
} from "./webhook-event.ts";
import {
  normalizeMessageType,
  normalizeWorkflowStep,
} from "./need-mapper.ts";

// -----------------------------------------------------------------------------
// Estado de procesamiento
// -----------------------------------------------------------------------------

export type ProcessingStatus =
  | "RECEIVED"
  | "PENDING"
  | "PROCESSED"
  | "FAILED";

export const PROCESSING_STATUS: Record<ProcessingStatus, ProcessingStatus> = {
  RECEIVED: "RECEIVED",
  PENDING: "PENDING",
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
};

// -----------------------------------------------------------------------------
// Tipos de fila de `ingest_responses`
// -----------------------------------------------------------------------------

/** Fila de `ingest_responses` con los nombres de columna de la tabla. */
export interface IngestResponseRecord {
  id?: string;
  event_id: string;
  type: string | null;
  conversation_id: string | null;
  from: string | null;
  message_type: string | null;
  workflow_step: string | null;
  body: unknown;
  raw_event: unknown;
  raw_payload: unknown;
  processing_status: ProcessingStatus;
  received_at: string;
  processed_at?: string | null;
  created_at: string;
}

export interface PersistResult {
  /** Fila insertada o, en un reenvío, la fila existente. */
  record: IngestResponseRecord;
  /** true cuando esta llamada insertó la fila; false en un reenvío. */
  inserted: boolean;
  /** true cuando el event.id ya existía (reenvío). */
  duplicate: boolean;
}

/** Store mínima que la capa de persistencia necesita sobre ingest_responses. */
export interface IngestResponsesStore {
  /** Inserta la fila si no existe; si ya existe, devuelve la fila original. */
  insertIfAbsent(record: IngestResponseRecord): Promise<PersistResult>;
}

// -----------------------------------------------------------------------------
// Extracción de metadatos desde el evento crudo
// -----------------------------------------------------------------------------

export interface IngestMetadata {
  eventId: string;
  type: string;
  conversationId: string;
  from: string | null;
  body: unknown;
  messageType: string;
  workflowStep: string;
}

/**
 * Extrae los metadatos de trazabilidad desde un evento crudo ya validado.
 *
 * - `body` resuelve igual que la validación: prefiere `body` plano y cae a
 *   `data.body`.
 * - `from` se toma de `data.from` (string no vacío) o null.
 * - `message_type` y `workflow.step` se normalizan a valores canónicos (S3);
 *   los valores crudos siempre quedan preservados en `raw_event`.
 */
export function extractIngestMetadata(event: RawWebhookEvent): IngestMetadata {
  const body = event.body !== undefined ? event.body : event.data?.body;
  const fromRaw = event.data?.from;
  const from =
    typeof fromRaw === "string" && fromRaw.trim().length > 0 ? fromRaw : null;

  return {
    eventId: String(event.id),
    type: String(event.type),
    conversationId: String(event.conversation_id),
    from,
    body,
    messageType: normalizeMessageType(event.data?.message_type),
    workflowStep: normalizeWorkflowStep(event.data?.workflow?.step),
  };
}

// -----------------------------------------------------------------------------
// Construcción de la fila
// -----------------------------------------------------------------------------

export interface IngestResponseInput extends IngestMetadata {
  /** Evento crudo completo (el JSON del webhook, sin modificar). */
  rawEvent: unknown;
  processingStatus?: ProcessingStatus;
  receivedAt?: string;
  createdAt?: string;
}

/**
 * Construye la fila de `ingest_responses` para un evento crudo.
 *
 * - `raw_event` y `raw_payload` guardan el evento completo sin modificar.
 * - `body` guarda el contenido del mensaje (data.body o body plano).
 * - `processing_status` queda en `RECEIVED` (salvo override explícito).
 * - `received_at` / `created_at` se registran explícitamente (auditoría).
 */
export function buildIngestResponseRecord(
  input: IngestResponseInput,
): IngestResponseRecord {
  const receivedAt = input.receivedAt ?? new Date().toISOString();
  const createdAt = input.createdAt ?? receivedAt;
  return {
    event_id: input.eventId,
    type: input.type,
    conversation_id: input.conversationId,
    from: input.from,
    message_type: input.messageType,
    workflow_step: input.workflowStep,
    body: input.body ?? null,
    raw_event: input.rawEvent,
    raw_payload: input.rawEvent,
    processing_status: input.processingStatus ?? "RECEIVED",
    received_at: receivedAt,
    created_at: createdAt,
  };
}

// -----------------------------------------------------------------------------
// Flujo de persistencia (extraer + construir + insertar idempotente)
// -----------------------------------------------------------------------------

export interface PersistOptions {
  processingStatus?: ProcessingStatus;
  receivedAt?: string;
  createdAt?: string;
}

/**
 * Persiste un evento crudo en `ingest_responses` de forma idempotente.
 *
 * @param store  Store de ingest_responses (PostgREST real o in-memory en tests).
 * @param event  Evento crudo ya validado por el endpoint.
 * @param opts   Overrides opcionales (estado, timestamps).
 *
 * Devuelve la fila insertada o, en un reenvío, la fila existente. Un reenvío
 * con el mismo `event.id` NO crea duplicados ni modifica la fila original.
 */
export async function persistIngestResponse(
  store: IngestResponsesStore,
  event: RawWebhookEvent,
  opts: PersistOptions = {},
): Promise<PersistResult> {
  const metadata = extractIngestMetadata(event);
  const record = buildIngestResponseRecord({ ...metadata, rawEvent: event, ...opts });
  return store.insertIfAbsent(record);
}

// -----------------------------------------------------------------------------
// Store in-memory (tests y demo) — simula la UNIQUE(event_id) de la tabla
// -----------------------------------------------------------------------------

export interface InMemoryIngestResponsesStore extends IngestResponsesStore {
  /** Número de filas actuales (por event_id). */
  size(): number;
  /** Todas las filas (para aserciones). */
  all(): IngestResponseRecord[];
  /** Fila por event_id (para aserciones). */
  get(eventId: string): IngestResponseRecord | undefined;
}

/**
 * Store en memoria que replica la idempotencia por `event.id` de la tabla:
 * la segunda inserción del mismo event_id devuelve la fila existente sin
 * modificarla (equivalente al UNIQUE + ON CONFLICT DO NOTHING de Postgres).
 */
export function createInMemoryIngestResponsesStore(
  seed: IngestResponseRecord[] = [],
): InMemoryIngestResponsesStore {
  const rows = new Map<string, IngestResponseRecord>();
  for (const record of seed) {
    rows.set(record.event_id, record);
  }
  return {
    async insertIfAbsent(record: IngestResponseRecord): Promise<PersistResult> {
      const existing = rows.get(record.event_id);
      if (existing) {
        return { record: existing, inserted: false, duplicate: true };
      }
      const withId: IngestResponseRecord = {
        ...record,
        id: record.id ?? crypto.randomUUID(),
      };
      rows.set(record.event_id, withId);
      return { record: withId, inserted: true, duplicate: false };
    },
    size() {
      return rows.size;
    },
    all() {
      return [...rows.values()];
    },
    get(eventId: string) {
      return rows.get(eventId);
    },
  };
}

// -----------------------------------------------------------------------------
// Store PostgREST (Edge Function real) — INSERT ... ON CONFLICT DO NOTHING
// -----------------------------------------------------------------------------

export interface PostgrestIngestResponsesStoreOptions {
  /** SUPABASE_URL (ej. http://127.0.0.1:54341 en local). */
  url: string;
  /** SUPABASE_SERVICE_ROLE_KEY (BYPASSRLS). */
  serviceRoleKey: string;
  /** Para inyectar un fetch falso en tests. */
  fetchFn?: typeof fetch;
}

function parsePostgrestError(status: number, text: string): Error {
  return new Error(`ingest_responses: PostgREST respondió ${status} — ${text.slice(0, 500)}`);
}

/**
 * Store real contra Supabase/PostgREST usando `service_role` (BYPASSRLS).
 *
 * Idempotencia por `event_id`:
 *   1. `POST /rest/v1/ingest_responses?on_conflict=event_id` con
 *      `Prefer: resolution=ignore-duplicates,return=representation`.
 *   2. Si el insert no afecta filas (event_id ya existente), se hace un
 *      `GET` por `event_id` y se devuelve la fila existente SIN modificarla.
 *
 * No depende de `@supabase/supabase-js`: usa `fetch` (Web Standard), por lo
 * que el módulo sigue siendo PURE (NFR-4) y testeable con un fetch falso.
 */
export function createPostgrestIngestResponsesStore(
  opts: PostgrestIngestResponsesStoreOptions,
): IngestResponsesStore {
  const f = opts.fetchFn ?? fetch;
  const base = `${opts.url.replace(/\/+$/, "")}/rest/v1/ingest_responses`;
  const authHeaders = {
    apikey: opts.serviceRoleKey,
    Authorization: `Bearer ${opts.serviceRoleKey}`,
  };

  return {
    async insertIfAbsent(record: IngestResponseRecord): Promise<PersistResult> {
      const insertRes = await f(`${base}?on_conflict=event_id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify(record),
      });
      if (!insertRes.ok) {
        throw parsePostgrestError(insertRes.status, await insertRes.text());
      }
      const insertedRows = await insertRes.json();
      if (Array.isArray(insertedRows) && insertedRows.length > 0) {
        return { record: insertedRows[0], inserted: true, duplicate: false };
      }

      // Reenvío con el mismo event.id: no se insertó nada → devolver la fila
      // existente (sin modificarla).
      const selRes = await f(
        `${base}?event_id=eq.${encodeURIComponent(record.event_id)}&select=*`,
        { method: "GET", headers: authHeaders },
      );
      if (!selRes.ok) {
        throw parsePostgrestError(selRes.status, await selRes.text());
      }
      const rows = (await selRes.json()) as IngestResponseRecord[];
      const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!existing) {
        throw new Error(
          `ingest_responses: no se encontró la fila existente para event_id=${record.event_id}`,
        );
      }
      return { record: existing, inserted: false, duplicate: true };
    },
  };
}
