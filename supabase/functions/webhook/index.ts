// =============================================================================
// webhook/index.ts — Edge Function receptora de eventos (S2 + S4 + S5)
// Tickets: DEV-32, DEV-34, DEV-35
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
//   - Crea el store de `needs` (S1/S5) y el geocoder Nominatim (S5) para que
//     el evento de completado cree el incidente con los mensajes acumulados.
//   - Se inyectan al handler.
// =============================================================================

import { handleWebhookEvent } from "./handler.ts";
import { createPostgrestIngestResponsesStore } from "../_shared/ingest-persistence.ts";
import { createPostgrestNeedsStore } from "../_shared/needs-store.ts";
import { createNominatimGeocoder } from "../_shared/geocoding.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "webhook: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son obligatorias para persistir el evento crudo (S4) y crear el incidente (S5).",
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

const geocoder = createNominatimGeocoder();

/**
 * S8: tokens Bearer válidos para el webhook. Se aceptan la service role key
 * legacy y las secret keys (`sb_secret_*`) del proyecto receptor, que son las
 * keys privilegiadas (bypass RLS). NO se aceptan publishable keys ni la anon
 * key (públicas, RLS-scoped): cualquiera podría leerlas del frontend.
 */
function resolveExpectedBearerTokens(): string[] {
  const tokens = new Set<string>();
  if (serviceRoleKey) tokens.add(serviceRoleKey);

  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const parsed = JSON.parse(secretKeysRaw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const value of Object.values(parsed as Record<string, unknown>)) {
          if (typeof value === "string" && value.length > 0) {
            tokens.add(value);
          }
        }
      }
    } catch (err) {
      console.warn(
        "[webhook] SUPABASE_SECRET_KEYS no es JSON válido; solo se usará la service role key legacy.",
        err,
      );
    }
  }

  return Array.from(tokens);
}

Deno.serve((req: Request) =>
  handleWebhookEvent(req, {
    ingestStore,
    incidentService: { needsStore },
    geocoder,
    // S8: el handler exige que `Authorization: Bearer <token>` coincida con una
    // key privilegiada del proyecto receptor (service role key legacy o secret
    // key `sb_secret_*`). El gateway (`verify_jwt = true` en config.toml) ya
    // rechaza requests sin JWT válido; esta comparación añade defensa en
    // profundidad si el despliegue ignorara esa configuración.
    expectedBearerTokens: resolveExpectedBearerTokens(),
    // S7: los errores internos (500) se registran server-side para
    // trazabilidad sin exponer los detalles en la respuesta al remitente.
    logError: (code, err) => {
      console.error(`[webhook] ${code}`, err);
    },
  }),
);
