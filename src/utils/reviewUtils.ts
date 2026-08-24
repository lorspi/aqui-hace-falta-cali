/**
 * reviewUtils.ts — Lógica pura de las acciones de aprobar / rechazar (US-7)
 *
 * Módulo SIN dependencias de React ni de Supabase (lógica pura testeable con
 * vitest, convención NFR-4 del proyecto). Las acciones consumen el endpoint de
 * revisión de US-4 (`POST /functions/v1/review`), que exige identificar al
 * operador (`verified_by`) y transiciona `verification_status` a
 * `VERIFIED`/`REJECTED`.
 *
 * Cubre los escenarios Gherkin de US-7:
 *   - `isReviewable(status)` → solo un need con `verification_status =
 *     PENDING_VERIFICATION` tiene habilitadas las acciones "Aprobar"/"Rechazar".
 *   - `resolveVerifiedBy(operator)` → la identidad del operador autenticado
 *     (rol MODERATOR/ADMIN) se obtiene de la sesión del panel
 *     (`localStorage` `ahf_admin_user`); se prefiere el email y se cae al
 *     nombre. Si no hay identidad disponible, se devuelve `''` y la operación
 *     se rechaza (400 `missing_operator` en US-4) sin modificar el estado.
 *   - `buildReviewPayload(needId, decision, verifiedBy, notes?)` → arma el body
 *     del endpoint de US-4 con los alias en español (`aprobar`/`rechazar`) que
 *     usan los escenarios Gherkin.
 */
import type { ReviewDecisionInput } from '../lib/reviewService';

/** Operador autenticado en el panel de moderación (rol MODERATOR/ADMIN). */
export interface ReviewOperator {
  email?: string | null;
  name?: string | null;
}

/**
 * `true` cuando un need está pendiente de revisión y, por tanto, sus acciones
 * "Aprobar"/"Rechazar" están habilitadas.
 *
 * Cualquier estado distinto de `PENDING_VERIFICATION` (p. ej. `VERIFIED`,
 * `REJECTED`, `REPORTED`, `ARCHIVED`) o un estado ausente deshabilita las
 * acciones (reporte ya revisado).
 */
export function isReviewable(status: string | null | undefined): boolean {
  return status === 'PENDING_VERIFICATION';
}

/**
 * Resuelve la identidad del operador que toma la decisión (`verified_by`).
 *
 * La sesión del panel guarda el usuario autenticado en `localStorage`
 * (`ahf_admin_user`) con `email`, `name` y `role` (`MODERATOR`/`ADMIN`). Se
 * prefiere el email (trazabilidad de quién revisó) y se cae al nombre. Cuando
 * no hay operador o no tiene email ni nombre, devuelve `''` para que el
 * frontend muestre el error correspondiente sin llamar al endpoint.
 */
export function resolveVerifiedBy(
  operator: ReviewOperator | null | undefined,
): string {
  const email =
    operator?.email && operator.email.trim().length > 0
      ? operator.email.trim()
      : '';
  if (email) return email;
  const name =
    operator?.name && operator.name.trim().length > 0 ? operator.name.trim() : '';
  return name;
}

/**
 * Arma el body de la decisión de revisión para el endpoint de US-4.
 *
 * El contrato US-4 acepta `decision` en español (`aprobar` / `rechazar`) o en
 * inglés (`approve` / `reject`). El frontend usa los literales en español de
 * los escenarios Gherkin. `notes` es opcional: se incluye solo cuando es un
 * string no vacío (rechazar sin motivo es válido → `verification_notes` null).
 */
export function buildReviewPayload(
  needId: string,
  decision: ReviewDecisionInput,
  verifiedBy: string,
  notes?: string | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    need_id: needId,
    decision,
    verified_by: verifiedBy,
  };
  if (typeof notes === 'string' && notes.trim().length > 0) {
    payload.notes = notes.trim();
  }
  return payload;
}

/** Mapa de la decisión en español al texto de confirmación de la respuesta. */
export function reviewDecisionLabel(
  decision: ReviewDecisionInput,
): 'approve' | 'reject' {
  return decision === 'aprobar' ? 'approve' : 'reject';
}
