// =============================================================================
// conversation/handler.ts — Lógica HTTP de la reconstrucción de conversación (US-3)
// Ticket: DEV-42
//
// Handler puro sobre Web Standard (Request/Response): sin dependencias de
// Deno, por lo que es testeable con vitest en Node y ejecutable en la Edge
// Runtime de Supabase (index.ts hace el bootstrap con Deno.serve).
//
// Rutas servidas por la Edge Function `conversation`:
//   GET {SUPABASE_URL}/functions/v1/conversation/needs/{id}   (por need.id)
//   GET {SUPABASE_URL}/functions/v1/conversation?need_id={id} (variante query)
//   GET {SUPABASE_URL}/functions/v1/conversation?conversation_id={conv}
//
// Comportamiento (escenarios Gherkin US-3):
//   - `GET /needs/{id}/conversation` reconstruye la conversación de un need:
//     devuelve las filas de `ingest_responses` con su `conversation_id`,
//     ordenadas por `received_at` ascendente, con cada `raw_event` normalizado
//     al formato uniforme (sender, content, type, attachments, received_at,
//     event_id).
//   - La respuesta incluye los datos ya mapeados en `needs`: title,
//     description, contact_whatsapp, address, neighborhood, priority, status,
//     verification_status, junto con conversation_id y source_event_id.
//   - La reconstrucción también se puede consultar por `conversation_id` (sin
//     need asociado aún): se devuelven los mensajes disponibles con
//     `has_need=false` y los campos del incidente vacíos/nulos.
//   - `need.id` inexistente → 404 con error estructurado (`need_not_found`).
//   - Una conversación sin mensajes → lista vacía con los metadatos (no rompe
//     el contrato).
//   - Errores internos → 500 estructurado y genérico (sin exponer detalles;
//     la causa real se registra vía `deps.logError`).
// =============================================================================

import {
  rebuildConversation,
  type ConversationRebuild,
} from "../_shared/conversation-rebuilder.ts";
import {
  type IngestResponseRecord,
  type IngestResponsesStore,
} from "../_shared/ingest-persistence.ts";
import { type NeedRecord, type NeedsStore } from "../_shared/needs-store.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/** Dependencias inyectables del handler (permite mantenerlo PURE en tests). */
export interface ConversationDeps {
  /**
   * Store de `ingest_responses`. El listado por conversación
   * (`listByConversationId`) es obligatorio para reconstruir; el handler lo
   * exige en tiempo de ejecución (los stores real e in-memory lo proveen).
   */
  ingestStore: IngestResponsesStore;
  /** Store de `needs` (resolución del need asociado y 404 por id). */
  needsStore: NeedsStore;
  /**
   * Logger opcional de errores internos (500). En la Edge Function real se
   * enlaza a `console.error`; en tests se puede espiar.
   */
  logError?: (code: string, err: unknown) => void;
}

/** Requiere el listado por conversación del store de ingest_responses. */
function requireListByConversationId(
  store: IngestResponsesStore,
): (conversationId: string) => Promise<IngestResponseRecord[]> {
  if (typeof store.listByConversationId !== "function") {
    throw new Error(
      "ingest_responses: listByConversationId es obligatorio para reconstruir la conversación (US-3).",
    );
  }
  return store.listByConversationId.bind(store);
}

/**
 * Endpoint de reconstrucción de conversación para el frontend de validación.
 *
 * Resuelve el parámetro de consulta:
 *   - `need_id` (path `/needs/{id}/conversation` o query `?need_id=`) → busca
 *     el need y reconstruye su conversación; 404 si el need no existe.
 *   - `conversation_id` (query `?conversation_id=`) → reconstruye por
 *     conversación (puede no tener need asociado aún).
 */
export async function handleConversationRequest(
  req: Request,
  deps: ConversationDeps,
): Promise<Response> {
  // Preflight CORS (consumo desde el navegador del frontend de validación).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Solo se aceptan GET.
  if (req.method !== "GET") {
    return jsonResponse(
      {
        code: "method_not_allowed",
        message: "Método no permitido. Usa GET /needs/{id}/conversation.",
      },
      405,
      { Allow: "GET" },
    );
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const search = url.searchParams;

  // Ruta canónica del contrato: /needs/{id}/conversation (dentro del prefijo
  // /functions/v1/conversation que inyecta Supabase).
  let needId: string | undefined;
  const needsMatch = path.match(/\/needs\/([^/]+)\/conversation\/?$/);
  if (needsMatch) {
    needId = decodeURIComponent(needsMatch[1]);
  }

  // Variantes query para uso directo del frontend.
  if (needId === undefined) {
    const needParam = search.get("need_id") ?? search.get("needId");
    if (needParam) needId = needParam;
  }
  const conversationId =
    search.get("conversation_id") ?? search.get("conversationId") ?? undefined;

  if (needId === undefined && conversationId === undefined) {
    return jsonResponse(
      {
        code: "missing_parameter",
        message:
          "Se requiere need_id (GET /needs/{id}/conversation) o conversation_id para reconstruir la conversación.",
        details: {
          expected: [
            "GET /needs/{id}/conversation",
            "GET ?need_id={id}",
            "GET ?conversation_id={conv}",
          ],
        },
      },
      400,
    );
  }

  try {
    if (needId !== undefined) {
      return await rebuildByNeedId(needId, deps);
    }
    return await rebuildByConversationId(conversationId as string, deps);
  } catch (err) {
    // 500 estructurado y GENÉRICO (sin detalles internos). La causa real se
    // registra server-side vía `deps.logError` cuando está inyectado.
    deps.logError?.("conversation_rebuild_failed", err);
    return jsonResponse(
      {
        code: "conversation_rebuild_failed",
        message: "Error interno al reconstruir la conversación. Inténtalo de nuevo.",
      },
      500,
    );
  }
}

/** Regex de UUID (la columna `needs.id` es UUID; un id no-UUID no existe nunca). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rebuildByNeedId(
  needId: string,
  deps: ConversationDeps,
): Promise<Response> {
  // `needs.id` es una columna UUID: un id que no es UUID no puede existir en la
  // tabla. Se responde 404 ANTES de consultar PostgREST (que rechazaría el
  // valor con 400 "invalid input syntax for type uuid").
  if (!UUID_RE.test(needId)) {
    return jsonResponse(
      {
        code: "need_not_found",
        message: `No existe un need con id '${needId}'.`,
        details: { need_id: needId },
      },
      404,
    );
  }

  const need = await deps.needsStore.findById(needId);
  if (!need) {
    return jsonResponse(
      {
        code: "need_not_found",
        message: `No existe un need con id '${needId}'.`,
        details: { need_id: needId },
      },
      404,
    );
  }

  const conversationId = need.conversation_id;
  // Un need sin conversación asociada devuelve sus metadatos con lista vacía
  // (el contrato no se rompe).
  if (!conversationId) {
    return jsonResponse(rebuildConversation([], need), 200);
  }

  const listByConversationId = requireListByConversationId(deps.ingestStore);
  const rows = await listByConversationId(conversationId);
  const rebuilt: ConversationRebuild = rebuildConversation(rows, need, conversationId);
  return jsonResponse(rebuilt, 200);
}

async function rebuildByConversationId(
  conversationId: string,
  deps: ConversationDeps,
): Promise<Response> {
  // Puede existir un need asociado (conversación ya completada) o no (en
  // curso). En ambos casos se devuelven los mensajes disponibles.
  const need = await deps.needsStore.findByConversationId(conversationId);
  const listByConversationId = requireListByConversationId(deps.ingestStore);
  const rows = await listByConversationId(conversationId);
  const rebuilt: ConversationRebuild = rebuildConversation(
    rows,
    need,
    conversationId,
  );
  return jsonResponse(rebuilt, 200);
}
