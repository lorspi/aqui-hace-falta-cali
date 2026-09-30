/**
 * Persistencia de acciones pendientes para usuarios no autenticados.
 * Permite retener la acción (compromiso de ayuda o publicación de flujo)
 * para continuar automáticamente tras completar login o registro.
 */

export type TipoAccionPendiente = 'compromiso' | 'publicar_flujo' | 'generica';

export interface AccionPendiente {
  tipo: TipoAccionPendiente;
  publicacionId?: string;
  tipoPublicacion?: 'necesidad' | 'oferta';
  flujo?: 'pedir' | 'ofrecer';
  rutaRetorno: string;
  autoEjecutar?: boolean;
  mensaje?: string;
  fecha?: string;
  timestamp?: number;
}

const CLAVE_ACCION_PENDIENTE = 'ahf_pending_action';
const MAX_EDAD_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Guarda una acción pendiente antes de forzar el registro / login.
 */
export function guardarAccionPendiente(accion: AccionPendiente): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const completa: AccionPendiente = {
      ...accion,
      timestamp: accion.timestamp ?? Date.now(),
    };
    localStorage.setItem(CLAVE_ACCION_PENDIENTE, JSON.stringify(completa));
  } catch {}
}

/**
 * Obtiene la acción pendiente si existe y no ha expirado.
 */
export function obtenerAccionPendiente(): AccionPendiente | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE_ACCION_PENDIENTE);
    if (!raw) return null;
    const accion: AccionPendiente = JSON.parse(raw);
    if (accion.timestamp && Date.now() - accion.timestamp > MAX_EDAD_MS) {
      limpiarAccionPendiente();
      return null;
    }
    return accion;
  } catch {
    return null;
  }
}

/**
 * Elimina la acción pendiente de localStorage.
 */
export function limpiarAccionPendiente(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CLAVE_ACCION_PENDIENTE);
  } catch {}
}

/**
 * Obtiene y elimina la acción pendiente de forma atómica.
 */
export function obtenerYLimpiarAccionPendiente(): AccionPendiente | null {
  const accion = obtenerAccionPendiente();
  if (accion) {
    limpiarAccionPendiente();
  }
  return accion;
}

/**
 * Indica si hay una acción pendiente válida guardada.
 */
export function hayAccionPendiente(): boolean {
  return obtenerAccionPendiente() !== null;
}
