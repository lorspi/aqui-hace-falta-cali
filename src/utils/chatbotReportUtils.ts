/**
 * chatbotReportUtils.ts — Lógica pura del listado de reportes del chatbot (US-5)
 *
 * Módulo SIN dependencias de React ni de Supabase (lógica pura testeable con
 * vitest, convención NFR-4 del proyecto). `useChatbotReports` lo reutiliza.
 *
 * Cubre los escenarios Gherkin de US-5:
 *   - `filterChatbotReports` devuelve SOLO registros con `source = 'WhatsApp'`
 *     (los reportes de la app quedan fuera).
 *   - Filtra por `verification_status`, `priority` y `place_type`.
 *   - Orden por defecto: PENDING_VERIFICATION primero y, dentro del mismo
 *     estado, cronológico (`created_at`) de más reciente a más antiguo.
 *   - Orden `PRIORITY`: CRITICAL > HIGH > MEDIUM > LOW y, dentro de la misma
 *     prioridad, por fecha descendente.
 *   - Manejo tolerante: campos opcionales ausentes no rompen el listado.
 */
import { Need, PlaceType, Priority } from '../types';

/** Estados de verificación que el listado de reportes del chatbot puede mostrar. */
export type ChatbotVerificationFilter =
  | 'ALL'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REPORTED'
  | 'ARCHIVED';

/** Opciones de orden del listado de reportes del chatbot. */
export type ChatbotSortOption = 'RECENT' | 'PRIORITY';

/** Opciones de filtrado/orden del listado de reportes del chatbot. */
export interface ChatbotReportFilterOptions {
  verificationStatus: ChatbotVerificationFilter;
  priority: Priority | 'ALL';
  placeType: PlaceType | 'ALL';
  sortBy?: ChatbotSortOption;
}

/** Fuente que identifica un reporte generado por el bot de WhatsApp. */
export const CHATBOT_SOURCE = 'whatsapp';

/** `true` cuando el need proviene del chatbot (source = 'WhatsApp'). */
export function isChatbotReport(need: Need): boolean {
  return (need.source || '').toLowerCase() === CHATBOT_SOURCE;
}

const PRIORITY_RANK: Record<Priority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_RANK: Record<string, number> = {
  PENDING_VERIFICATION: 0,
  VERIFIED: 1,
  REPORTED: 2,
  REJECTED: 3,
  ARCHIVED: 4,
};

function byCreatedAtDesc(a: Need, b: Need): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Filtra y ordena los reportes del chatbot.
 *
 * 1. Conserva solo `source = 'WhatsApp'`.
 * 2. Aplica filtros por estado / prioridad / tipo de necesidad.
 * 3. Ordena: pendientes primero + cronológico desc (por defecto), o por
 *    prioridad + cronológico desc (sortBy = 'PRIORITY').
 */
export function filterChatbotReports(
  needs: Need[],
  opts: ChatbotReportFilterOptions,
): Need[] {
  const list = needs.filter(isChatbotReport);

  const byVerification =
    opts.verificationStatus === 'ALL'
      ? list
      : list.filter((n) => n.verificationStatus === opts.verificationStatus);

  const byPriority =
    opts.priority === 'ALL'
      ? byVerification
      : byVerification.filter((n) => n.priority === opts.priority);

  const byType =
    opts.placeType === 'ALL'
      ? byPriority
      : byPriority.filter((n) => n.placeType === opts.placeType);

  return [...byType].sort((a, b) => {
    if (opts.sortBy === 'PRIORITY') {
      const pr = (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
      if (pr !== 0) return pr;
      return byCreatedAtDesc(a, b);
    }
    const st = (STATUS_RANK[a.verificationStatus] ?? 9) - (STATUS_RANK[b.verificationStatus] ?? 9);
    if (st !== 0) return st;
    return byCreatedAtDesc(a, b);
  });
}

/** Cantidad de reportes del chatbot pendientes de verificación. */
export function countPendingChatbotReports(needs: Need[]): number {
  return needs.filter(
    (n) => isChatbotReport(n) && n.verificationStatus === 'PENDING_VERIFICATION',
  ).length;
}
