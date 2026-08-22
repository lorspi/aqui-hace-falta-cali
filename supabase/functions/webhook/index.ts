// =============================================================================
// webhook/index.ts — Edge Function receptora de eventos (S2)
// Ticket: DEV-32
//
// URL del endpoint (contrato del webhook):
//   POST {SUPABASE_URL}/functions/v1/webhook
//   POST {SUPABASE_URL}/functions/v1/webhook/events
//
// Local (supabase functions serve):
//   POST http://127.0.0.1:54321/functions/v1/webhook
// =============================================================================

import { handleWebhookEvent } from "./handler.ts";

Deno.serve(handleWebhookEvent);
