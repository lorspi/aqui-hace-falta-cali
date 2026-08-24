// =============================================================================
// _shared/review-service.ts — Transición de estado de revisión (US-4 / DEV-43)
//
// Módulo PURE y SIN dependencias de npm/Deno (solo Web Standards). Comparte
// tipos y lógica entre la Edge Function `review` (Deno) y los tests unitarios
// (vitest/Node), cumpliendo NFR-4 (lógica pura testeable sin dependencias).
//
// La historia US-4 permite al operador aprobar o rechazar un reporte ya
// revisado (un need con `verification_status = PENDING_VERIFICATION`):
//
//   - "Aprobar"  → `verification_status = VERIFIED`  (necesidad real).
//   - "Rechazar" → `verification_status = REJECTED`  (queda en la tabla para
//                  trazabilidad pero se excluye de las vistas "oficiales").
//
// En ambos casos se guarda quién revisó (`verified_by`), cuándo (`verified_at`)
// y, opcionalmente, el motivo (`verification_notes`).
//
// Decisiones de dominio:
//   - `normalizeDecision` acepta los valores canónicos en inglés (`approve` /
//     `reject`) y sus alias en español (`aprobar` / `rechazar`), tal como los
//     nombran los escenarios Gherkin de US-4.
//   - Un need con `verification_status` distinto de `PENDING_VERIFICATION` NO
//     se modifica: se devuelve `invalid_state` con el estado actual para que el
//     endpoint informe al operador.
//   - El motivo (`notes`) es opcional: una nota vacía/nula se persiste como
//     NULL (el rechazo sin motivo es válido).
// =============================================================================

import { type NeedsStore, type NeedRecord } from "./needs-store.ts";

// -----------------------------------------------------------------------------
// Decisiones de revisión
// -----------------------------------------------------------------------------

/** Decisiones de revisión normalizadas (claves internas del dominio). */
export type ReviewDecision = "APPROVE" | "REJECT";

/** Mapa decisión → estado destino en `needs.verification_status`. */
export const REVIEW_DECISIONS: Record<ReviewDecision, "VERIFIED" | "REJECTED"> = {
  APPROVE: "VERIFIED",
  REJECT: "REJECTED",
};

/** Alias de entrada aceptados para cada decisión (inglés canónico + español). */
const DECISION_ALIASES: Record<string, ReviewDecision> = {
  approve: "APPROVE",
  aprobar: "APPROVE",
  reject: "REJECT",
  rechazar: "REJECT",
};

/**
 * Normaliza la decisión enviada por el operador.
 *
 * Acepta los valores canónicos `approve` / `reject` y sus alias en español
 * `aprobar` / `rechazar` (los escenarios Gherkin de US-4 usan los literales en
 * español). Devuelve `null` para cualquier otra cadena (decisión inválida).
 */
export function normalizeDecision(raw: unknown): ReviewDecision | null {
  const value = String(raw ?? "").trim().toLowerCase();
  return DECISION_ALIASES[value] ?? null;
}

// -----------------------------------------------------------------------------
// Entrada y resultado de la operación
// -----------------------------------------------------------------------------

export interface ReviewInput {
  needId: string;
  /** Decisión normalizada (APPROVE | REJECT). */
  decision: ReviewDecision;
  /** Identificación del operador que toma la decisión (trazabilidad). */
  verifiedBy: string;
  /** Motivo / nota opcional de la decisión. */
  notes?: string | null;
}

export type ReviewOutcome =
  | { status: "ok"; record: NeedRecord }
  | { status: "not_found"; needId: string }
  | { status: "invalid_state"; currentStatus: string };

/**
 * Aplica la transición de revisión sobre un need.
 *
 * Flujo:
 *   1. Busca el need por id → `not_found` si no existe.
 *   2. Exige `verification_status = PENDING_VERIFICATION` → `invalid_state`
 *      (con el estado actual) si no lo está. El registro NO se modifica.
 *   3. Persiste la transición con `updateVerification`: estado destino
 *      (VERIFIED/REJECTED), `verified_by`, `verified_at` (ahora) y
 *      `verification_notes` (nota opcional normalizada a NULL si viene vacía).
 *
 * Devuelve `ok` con la fila actualizada cuando la operación se completa.
 */
export async function applyReview(
  needsStore: NeedsStore,
  input: ReviewInput,
): Promise<ReviewOutcome> {
  const need = await needsStore.findById(input.needId);
  if (!need) {
    return { status: "not_found", needId: input.needId };
  }

  if (need.verification_status !== "PENDING_VERIFICATION") {
    return { status: "invalid_state", currentStatus: need.verification_status };
  }

  const notes =
    typeof input.notes === "string" && input.notes.trim().length > 0
      ? input.notes.trim()
      : null;

  const record = await needsStore.updateVerification(input.needId, {
    verification_status: REVIEW_DECISIONS[input.decision],
    verified_by: input.verifiedBy,
    verified_at: new Date().toISOString(),
    verification_notes: notes,
    last_updated_by: input.verifiedBy,
  });

  if (!record) {
    return { status: "not_found", needId: input.needId };
  }

  return { status: "ok", record };
}
