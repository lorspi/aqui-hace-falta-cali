// =============================================================================
// webhook/index.ts — Edge Function receptora de eventos (S2 + S4)
// Tickets: DEV-32, DEV-34
//
// URL del endpoint (contrato del webhook):
//   POST {SUPABASE_URL}/functions/v1/webhook
//   POST {SUPABASE_URL}/functions/v1/webhook/events
//
// Local (supabase functions serve):
//   POST http://127.0.0.1:54341/functions/v1/webhook
//
// Bootstrap:
//   - Crea el store de `ingest_responses` contra PostgREST usando la
//     `SUPABASE_SERVICE_ROLE_KEY` (inyectada por la plataforma / CLI). El rol
//     service_role tiene BYPASSRLS y puede escribir en `ingest_responses`
//     (S1: RLS sin políticas, anon bloqueado).
//   - Se lo inyecta al handler para que S4 persista cada evento crudo.
// =============================================================================

import { handleWebhookEvent } from "./handler.ts";
import { createPostgrestIngestResponsesStore } from "../_shared/ingest-persistence.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "webhook: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para persistir el evento crudo (S4).",
  );
}

const ingestStore = createPostgrestIngestResponsesStore({
  url: supabaseUrl,
  serviceRoleKey,
});

Deno.serve((req: Request) => handleWebhookEvent(req, { ingestStore }));
