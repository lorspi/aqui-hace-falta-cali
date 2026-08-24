/**
 * reviewService.ts — Cliente HTTP del endpoint de revisión (US-4 / DEV-43)
 *
 * Consume `POST {SUPABASE_URL}/functions/v1/review` desde el panel de
 * moderación (US-7): aprueba o rechaza un need con
 * `verification_status = PENDING_VERIFICATION`.
 *
 *   - El body incluye `need_id`, `decision` ("aprobar"/"rechazar"),
 *     `verified_by` (identidad del operador) y, opcionalmente, `notes`.
 *   - "Aprobar" transiciona a `VERIFIED`; "Rechazar" a `REJECTED`. En ambos
 *     casos US-4 guarda `verified_by` y `verified_at`.
 *   - Las Edge Functions de Supabase (verify_jwt=true) requieren la anon key en
 *     `apikey`/`Authorization` (misma convención que `fetchConversationByNeedId`).
 *   - Errores tipados con `code` (`missing_operator`, `invalid_decision`,
 *     `need_not_found`, `invalid_verification_status`, `review_failed`, red).
 *
 * La función acepta dependencias inyectables (`baseUrl`, `anonKey`, `fetchFn`)
 * para ser testeable con vitest sin red (NFR-4).
 */
import {
  buildReviewPayload,
  type ReviewOperator,
} from '../utils/reviewUtils';

/** Decisiones de revisión que envía el frontend (literales en español de US-4). */
export type ReviewDecisionInput = 'aprobar' | 'rechazar';

export interface ReviewNeedInput {
  /** id del need a revisar (UUID). */
  needId: string;
  /** Decisión: "aprobar" (→ VERIFIED) o "rechazar" (→ REJECTED). */
  decision: ReviewDecisionInput;
  /** Identidad del operador que toma la decisión (trazabilidad). */
  verifiedBy: string;
  /** Motivo / nota opcional de la decisión. */
  notes?: string | null;
}

/** Need revisado tal como lo devuelve el endpoint de US-4 (200). */
export interface ReviewedNeed {
  id: string;
  title: string;
  description: string;
  source: string | null;
  contact_whatsapp: string | null;
  conversation_id: string | null;
  source_event_id: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  last_updated_by: string | null;
  updated_at: string | null;
}

/** Respuesta 200 del endpoint de revisión. */
export interface ReviewNeedResponse {
  ok: true;
  status: 'reviewed';
  decision: 'approve' | 'reject';
  need: ReviewedNeed;
}

/** Cuerpo de error estructurado que devuelve la Edge Function `review`. */
export interface ReviewErrorBody {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/** Error tipado de la revisión (con `code` y `status` cuando aplican). */
export class ReviewNeedError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    opts: { code?: string; status?: number; details?: Record<string, unknown> } = {},
  ) {
    super(message);
    this.name = 'ReviewNeedError';
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }
}

export interface ReviewNeedOptions {
  /** URL base de Supabase (override para tests; por defecto VITE_SUPABASE_URL). */
  baseUrl?: string;
  /** Anon key (override para tests; por defecto VITE_SUPABASE_ANON_KEY). */
  anonKey?: string;
  /** Función fetch inyectable (tests). Por defecto `globalThis.fetch`. */
  fetchFn?: typeof fetch;
}

/** Lee una variable de entorno de Vite de forma segura. */
function envValue(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  try {
    const value = import.meta.env?.[name] as string | undefined;
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

/**
 * Llama al endpoint de revisión de US-4 con la decisión del operador.
 *
 * Devuelve la respuesta 200 tipada o lanza `ReviewNeedError` con `code` y
 * `status`. El error de red se traduce a `code = 'network_error'` para que la
 * pantalla muestre un estado de error claro y conservar el estado pendiente.
 */
export async function reviewNeed(
  input: ReviewNeedInput,
  opts: ReviewNeedOptions = {},
): Promise<ReviewNeedResponse> {
  const base = (opts.baseUrl ?? envValue('VITE_SUPABASE_URL')).replace(/\/$/, '');
  const anonKey = opts.anonKey ?? envValue('VITE_SUPABASE_ANON_KEY');
  const f = opts.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  if (!base) {
    throw new ReviewNeedError(
      'No está configurada la URL de Supabase (VITE_SUPABASE_URL). No se puede consumir el endpoint de revisión (US-4).',
      { code: 'config_missing' },
    );
  }

  const url = `${base}/functions/v1/review`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (anonKey) {
    headers['apikey'] = anonKey;
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  const payload = buildReviewPayload(
    input.needId,
    input.decision,
    input.verifiedBy,
    input.notes,
  );

  let res: Response;
  try {
    res = await f(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ReviewNeedError(
      `No se pudo contactar el endpoint de revisión (US-4): ${(err as Error)?.message || String(err)}`,
      { code: 'network_error' },
    );
  }

  const body = (await res.json().catch(() => ({}))) as ReviewNeedResponse &
    ReviewErrorBody;

  if (!res.ok) {
    const code = (body as ReviewErrorBody).code || `http_${res.status}`;
    throw new ReviewNeedError(
      (body as ReviewErrorBody).message || `Error ${res.status}`,
      {
        code,
        status: res.status,
        details: (body as ReviewErrorBody).details,
      },
    );
  }

  return body as ReviewNeedResponse;
}
