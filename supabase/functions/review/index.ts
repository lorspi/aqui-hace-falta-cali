// =============================================================================
// review/index.ts — Edge Function de transición de revisión (US-4 / DEV-43)
//
// URL del endpoint (contrato US-4):
//   POST {SUPABASE_URL}/functions/v1/review
//
// Local (bootstrap Deno, mismo runtime que Supabase Edge — ver nota DEV-42):
//   POST http://127.0.0.1:8002/functions/v1/review
//
// Bootstrap:
//   - Crea el store de `needs` contra PostgREST usando la
//     `SUPABASE_SERVICE_ROLE_KEY` (inyectada por la plataforma / CLI). El rol
//     service_role tiene BYPASSRLS y puede leer y actualizar `needs`.
//   - Se inyecta al handler.
// =============================================================================

import { handleReviewRequest } from "./handler.ts";
import { createPostgrestNeedsStore } from "../_shared/needs-store.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "review: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para resolver y actualizar el need (US-4).",
  );
}

const needsStore = createPostgrestNeedsStore({
  url: supabaseUrl,
  serviceRoleKey,
});

Deno.serve((req: Request) =>
  handleReviewRequest(req, {
    needsStore,
    // Los errores internos (500) se registran server-side para trazabilidad sin
    // exponer los detalles en la respuesta al operador.
    logError: (code, err) => {
      console.error(`[review] ${code}`, err);
    },
  }),
);
