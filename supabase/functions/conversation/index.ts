// =============================================================================
// conversation/index.ts — Edge Function de reconstrucción de conversación (US-3)
// Ticket: DEV-42
//
// URL del endpoint (contrato US-3):
//   GET {SUPABASE_URL}/functions/v1/conversation/needs/{id}
//   GET {SUPABASE_URL}/functions/v1/conversation?need_id={id}
//   GET {SUPABASE_URL}/functions/v1/conversation?conversation_id={conv}
//
// Local (supabase functions serve):
//   GET http://127.0.0.1:54341/functions/v1/conversation/needs/{id}
//
// Bootstrap:
//   - Crea el store de `ingest_responses` contra PostgREST usando la
//     `SUPABASE_SERVICE_ROLE_KEY` (inyectada por la plataforma / CLI). El rol
//     service_role tiene BYPASSRLS y puede leer `ingest_responses`
//     (S1: RLS sin políticas, anon bloqueado).
//   - Crea el store de `needs` para resolver el need asociado a la conversación
//     y validar `need.id` (404 si no existe).
//   - Se inyectan al handler.
// =============================================================================

import { handleConversationRequest } from "./handler.ts";
import { createPostgrestIngestResponsesStore } from "../_shared/ingest-persistence.ts";
import { createPostgrestNeedsStore } from "../_shared/needs-store.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "conversation: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para reconstruir la conversación (US-3).",
  );
}

const ingestStore = createPostgrestIngestResponsesStore({
  url: supabaseUrl,
  serviceRoleKey,
});

const needsStore = createPostgrestNeedsStore({
  url: supabaseUrl,
  serviceRoleKey,
});

Deno.serve((req: Request) =>
  handleConversationRequest(req, {
    ingestStore,
    needsStore,
    // Los errores internos (500) se registran server-side para trazabilidad sin
    // exponer los detalles en la respuesta al frontend.
    logError: (code, err) => {
      console.error(`[conversation] ${code}`, err);
    },
  }),
);
