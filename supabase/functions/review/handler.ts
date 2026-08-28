// =============================================================================
// review/handler.ts — Lógica HTTP de la transición de revisión (US-4 / DEV-43)
//
// Handler puro sobre Web Standard (Request/Response): sin dependencias de
// Deno, por lo que es testeable con vitest en Node y ejecutable en la Edge
// Runtime de Supabase (index.ts hace el bootstrap con Deno.serve).
//
// Ruta servida por la Edge Function `review`:
//   POST {SUPABASE_URL}/functions/v1/review
//
// Comportamiento (escenarios Gherkin US-4):
//   - El body identifica el need, la decisión ("aprobar"/"rechazar"), al
//     operador que la toma (`verified_by`) y, opcionalmente, el motivo
//     (`notes`).
//   - "Aprobar" transiciona `verification_status` a `VERIFIED` y guarda
//     `verified_by` / `verified_at` (y `verification_notes` si se incluye).
//   - "Rechazar" lo transiciona a `REJECTED` (permanece en `needs` para
//     trazabilidad; las vistas "oficiales" lo excluyen) y guarda quién
//     rechazó, cuándo y opcionalmente el motivo. Rechazar sin motivo es válido.
//   - Un need con `verification_status` distinto de `PENDING_VERIFICATION` →
//     409 `invalid_verification_status` informando el estado actual; el
//     registro NO se modifica.
//   - Un need inexistente o con id inválido → 404 `need_not_found`.
//   - Una decisión que no es "aprobar"/"rechazar" → 400 `invalid_decision`.
//   - Una decisión sin operador identificado (`verified_by`) → 400
//     `missing_operator` (trazabilidad de quién revisó).
//   - Errores internos → 500 estructurado y genérico (la causa real se
//     registra vía `deps.logError`).
// =============================================================================

import {
  applyReview,
  normalizeDecision,
  type ReviewDecision,
} from "../_shared/review-service.ts";
import { type NeedRecord, type NeedsStore } from "../_shared/needs-store.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
export interface ReviewDeps {
  /** Store de `needs` (resolución del need por id, validación y transición). */
  needsStore: NeedsStore;
  /**
   * Logger opcional de errores internos (500). En la Edge Function real se
   * enlaza a `console.error`; en tests se puede espiar.
   */
  logError?: (code: string, err: unknown) => void;
}

/** Regex de UUID (la columna `needs.id` es UUID; un id no-UUID no existe nunca). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resultado del parseo del body de la revisión. */
type ParsedReviewBody =
  | { valid: true; needId: string; decision: ReviewDecision; verifiedBy: string; notes?: string | null }
  | { valid: false; code: "validation_failed" | "invalid_decision" | "missing_operator"; issues: Array<{ path: string[]; message: string }> };

/**
 * Parsea y valida el body de la decisión de revisión.
 *
 * Requeridos:
 *   - `need_id`: string no vacío (id del need a revisar).
 *   - `decision`: "approve" | "aprobar" | "reject" | "rechazar".
 *   - `verified_by`: string no vacío que identifica al operador.
 * Opcional:
 *   - `notes`: motivo / nota de la decisión (string; vacío/ausente → null).
 */
function parseReviewBody(payload: unknown): ParsedReviewBody {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      valid: false,
      code: "validation_failed",
      issues: [{ path: ["body"], message: "body: objeto JSON requerido." }],
    };
  }
  const body = payload as Record<string, unknown>;

  const needIdRaw = body.need_id ?? body.needId;
  const needId = typeof needIdRaw === "string" ? needIdRaw.trim() : "";
  if (needId.length === 0) {
    return {
      valid: false,
      code: "validation_failed",
      issues: [
        {
          path: ["need_id"],
          message: "need_id: campo requerido (string no vacío) con el id del need a revisar.",
        },
      ],
    };
  }

  const verifiedByRaw = body.verified_by ?? body.verifiedBy;
  const verifiedBy = typeof verifiedByRaw === "string" ? verifiedByRaw.trim() : "";
  if (verifiedBy.length === 0) {
    return {
      valid: false,
      code: "missing_operator",
      issues: [
        {
          path: ["verified_by"],
          message:
            "verified_by: campo requerido (string no vacío) que identifica al operador que toma la decisión (trazabilidad).",
        },
      ],
    };
  }

  const decision = normalizeDecision(body.decision);
  if (!decision) {
    return {
      valid: false,
      code: "invalid_decision",
      issues: [
        {
          path: ["decision"],
          message:
            "decision: debe ser 'aprobar'/'approve' o 'rechazar'/'reject'.",
        },
      ],
    };
  }

  const notesRaw = body.notes ?? body.note;
  const notes =
    typeof notesRaw === "string" && notesRaw.trim().length > 0
      ? notesRaw.trim()
      : null;

  return { valid: true, needId, decision, verifiedBy, notes };
}

/** Serializa el need revisado para la respuesta 200. */
function serializeReviewedNeed(record: NeedRecord) {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    source: record.source,
    contact_whatsapp: record.contact_whatsapp,
    conversation_id: record.conversation_id,
    source_event_id: record.source_event_id,
    verification_status: record.verification_status,
    verified_by: record.verified_by,
    verified_at: record.verified_at,
    verification_notes: record.verification_notes,
    last_updated_by: record.last_updated_by,
    updated_at: record.updated_at,
  };
}

/** Endpoint de revisión: aprueba o rechaza un need pendiente de verificación. */
export async function handleReviewRequest(
  req: Request,
  deps: ReviewDeps,
): Promise<Response> {
  // Preflight CORS (consumo desde el frontend de moderación).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Solo se aceptan POST.
  if (req.method !== "POST") {
    return jsonResponse(
      {
        code: "method_not_allowed",
        message: "Método no permitido. Usa POST /review.",
      },
      405,
      { Allow: "POST" },
    );
  }

  // El body debe llegar como JSON.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        code: "invalid_content_type",
        message: "Content-Type debe ser application/json.",
      },
      415,
    );
  }

  // Parseo del body: vacío o no parseable → 400.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(
      {
        code: "invalid_json",
        message: "El body debe ser un JSON válido.",
        details: {
          issues: [
            { path: [], message: "No se pudo parsear el body como JSON." },
          ],
        },
      },
      400,
    );
  }

  // Validación del body (campos, decisión, operador).
  const parsed = parseReviewBody(payload);
  if (!parsed.valid) {
    const messages: Record<string, string> = {
      validation_failed:
        "Estructura inválida. Campos faltantes o con formato inválido.",
      invalid_decision:
        "Decisión inválida. Debe ser 'aprobar'/'approve' o 'rechazar'/'reject'.",
      missing_operator:
        "Falta identificar al operador (verified_by). La decisión de revisión exige trazabilidad de quién aprueba o rechaza.",
    };
    return jsonResponse(
      {
        code: parsed.code,
        message: messages[parsed.code],
        details: { issues: parsed.issues },
      },
      400,
    );
  }

  // `needs.id` es una columna UUID: un id que no es UUID no puede existir en la
  // tabla. Se responde 404 ANTES de consultar PostgREST (que rechazaría el
  // valor con 400 "invalid input syntax for type uuid").
  if (!UUID_RE.test(parsed.needId)) {
    return jsonResponse(
      {
        code: "need_not_found",
        message: `No existe un need con id '${parsed.needId}'.`,
        details: { need_id: parsed.needId },
      },
      404,
    );
  }

  try {
    const outcome = await applyReview(deps.needsStore, {
      needId: parsed.needId,
      decision: parsed.decision,
      verifiedBy: parsed.verifiedBy,
      notes: parsed.notes,
    });

    if (outcome.status === "not_found") {
      return jsonResponse(
        {
          code: "need_not_found",
          message: `No existe un need con id '${parsed.needId}'.`,
          details: { need_id: parsed.needId },
        },
        404,
      );
    }

    if (outcome.status === "invalid_state") {
      return jsonResponse(
        {
          code: "invalid_verification_status",
          message: `El need con id '${parsed.needId}' ya fue revisado. Estado actual: ${outcome.currentStatus}. Solo se pueden aprobar/rechazar needs con verification_status = PENDING_VERIFICATION.`,
          details: {
            need_id: parsed.needId,
            current_status: outcome.currentStatus,
          },
        },
        409,
      );
    }

    return jsonResponse(
      {
        ok: true,
        status: "reviewed",
        decision: parsed.decision === "APPROVE" ? "approve" : "reject",
        need: serializeReviewedNeed(outcome.record),
      },
      200,
    );
  } catch (err) {
    // 500 estructurado y GENÉRICO (sin detalles internos). La causa real se
    // registra server-side vía `deps.logError` cuando está inyectado.
    deps.logError?.("review_failed", err);
    return jsonResponse(
      {
        code: "review_failed",
        message: "Error interno al aplicar la revisión. Inténtalo de nuevo.",
      },
      500,
    );
  }
}
