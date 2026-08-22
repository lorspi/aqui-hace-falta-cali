// =============================================================================
// _shared/webhook-event.ts — Validación de eventos crudos del webhook (S2)
// Ticket: DEV-32
//
// Módulo PURE y SIN dependencias (ni Deno ni npm): comparte tipos y validación
// entre la Edge Function `webhook` (Deno) y los tests unitarios (vitest/Node).
// Esto cumple NFR-4 del plan (lógica pura testeable sin dependencias).
//
// Contrato de integración (aidlc-docs/inception/requirements/requirements.md):
//   - Transporte: HTTP webhook, POST con JSON hacia la Edge Function `webhook`
//     (`{SUPABASE_URL}/functions/v1/webhook`, alias `/webhook/events`).
//   - Payload: evento crudo con `id`, `type`, `conversation_id` y `body`.
//     En el shape documentado el mensaje viaja en `data.body`; también se
//     acepta un `body` plano para tolerar variantes del remitente.
//   - `type`: NO condiciona la aceptación (cualquier string no vacío).
//   - lat/lng: NO requeridos (el enriquecimiento con geocoding es S5).
//   - Auth: abierta por ahora (deuda de seguridad, ver S8).
// =============================================================================

/** Shape mínimo documentado del evento crudo. `body` puede estar en
 * `data.body` (shape del equipo de conversación) o en `body` (shape plano).
 * `conversation_id` puede estar en `data.conversation_id` (shape documentado)
 * o en `conversation_id` (shape plano), igual que `body`. */
export interface RawWebhookEvent {
  id: unknown;
  type: unknown;
  conversation_id: unknown;
  data?: {
    body?: unknown;
    from?: unknown;
    message_type?: unknown;
    workflow?: { step?: unknown };
    conversation_id?: unknown;
  };
  body?: unknown;
  // Se permiten campos adicionales (el evento crudo trae más metadatos).
  [key: string]: unknown;
}

export interface ValidationIssue {
  /** Ruta del campo con problema (ej. ["id"], ["data", "body"]). */
  path: (string | number)[];
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  /** Evento normalizado cuando `valid === true`. */
  event: {
    id: string;
    type: string;
    conversationId: string;
    body: unknown;
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Devuelve el contenido del mensaje: prefiere `body` plano y cae a `data.body`. */
function resolveBody(event: RawWebhookEvent): unknown {
  return event.body !== undefined ? event.body : event.data?.body;
}

/**
 * Devuelve el `conversation_id` de la conversación: prefiere `conversation_id`
 * plano y cae a `data.conversation_id` (shape documentado del contrato S8).
 * Idéntico al criterio de `body` (plano o `data.body`).
 */
export function resolveConversationId(event: RawWebhookEvent): unknown {
  if (event.conversation_id !== undefined) return event.conversation_id;
  return event.data?.conversation_id;
}

export const MINIMAL_FIELDS = ["id", "type", "conversation_id", "body"] as const;

/**
 * Valida la estructura mínima de un evento crudo del webhook.
 *
 * - `id`, `type`: strings no vacíos.
 * - `conversation_id`: string no vacío, en `conversation_id` (plano) o en
 *   `data.conversation_id` (shape documentado del contrato S8).
 * - `body`: presente (en `body` o `data.body`), no vacío si es string, y con
 *   formato string u objeto.
 * - No enumera `type`: acepta eventos de cualquier tipo (incluido el de
 *   completado) — el type no condiciona la aceptación en el endpoint.
 * - No exige coordenadas.
 */
export function validateWebhookEvent(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      issues: [{ path: [], message: "El body debe ser un objeto JSON (evento crudo)." }],
      event: { id: "", type: "", conversationId: "", body: undefined },
    };
  }

  const event = input as RawWebhookEvent;

  if (!isNonEmptyString(event.id)) {
    issues.push({ path: ["id"], message: "id: campo requerido (string no vacío)." });
  }
  if (!isNonEmptyString(event.type)) {
    issues.push({ path: ["type"], message: "type: campo requerido (string no vacío)." });
  }
  const conversationIdValue = resolveConversationId(event);
  if (!isNonEmptyString(conversationIdValue)) {
    issues.push({
      path: ["conversation_id"],
      message:
        "conversation_id: campo requerido (string no vacío), en data.conversation_id o conversation_id.",
    });
  }

  const bodyValue = resolveBody(event);
  if (bodyValue === undefined) {
    issues.push({
      path: ["body"],
      message: "body: campo requerido (en data.body o body).",
    });
  } else if (typeof bodyValue === "string" && bodyValue.trim().length === 0) {
    issues.push({ path: ["body"], message: "body: no debe estar vacío." });
  } else if (typeof bodyValue !== "string" && typeof bodyValue !== "object") {
    issues.push({
      path: ["body"],
      message: "body: debe ser un string o un objeto.",
    });
  }

  const valid = issues.length === 0;
  return {
    valid,
    issues,
    event: valid
      ? {
          id: event.id as string,
          type: event.type as string,
          conversationId: conversationIdValue as string,
          body: bodyValue,
        }
      : { id: "", type: "", conversationId: "", body: undefined },
  };
}
