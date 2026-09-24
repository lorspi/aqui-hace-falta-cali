/**
 * La entidad de la cuenta (organización · comunidad), guardada al terminar el registro. Solo
 * pone nombre al panel: «Mi organización» / «Mi comunidad» (decisión de Alejandro, 16 de
 * septiembre de 2026). `?entidad=comunidad` la fuerza para verlo sin registrarse.
 */
import { PERFILES } from '../mocks/cuentasMock';
import type { PerfilCuenta } from '../types/cuenta';

const CLAVE = 'rd-entidad';

export function guardarEntidad(perfil: PerfilCuenta): void {
  if (perfil === 'rapida') return;
  try {
    localStorage.setItem(CLAVE, perfil);
  } catch {
    /* sin almacenamiento */
  }
}

export function entidadGuardada(search = '', guardado: string | null = null): Exclude<PerfilCuenta, 'rapida'> {
  const forzada = new URLSearchParams(search).get('entidad');
  if (forzada === 'comunidad' || forzada === 'liderazgo') return 'liderazgo';
  if (forzada === 'individual' || forzada === 'persona') return 'individual';
  if (forzada === 'organizacion') return 'organizacion';
  if (guardado === 'individual') return 'individual';
  return guardado === 'liderazgo' ? 'liderazgo' : 'organizacion';
}

export function entidadActual(): Exclude<PerfilCuenta, 'rapida'> {
  try {
    const search = typeof window !== 'undefined' && window.location ? window.location.search : '';
    const guardado = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAVE) : null;
    return entidadGuardada(search, guardado);
  } catch {
    return 'organizacion';
  }
}

/** «Mi organización» o «Mi comunidad», según la entidad. */
export function nombrePanel(perfil: Exclude<PerfilCuenta, 'rapida'> = entidadActual()): string {
  return PERFILES.find((p) => p.id === perfil)?.panel ?? 'Mi organización';
}

const CLAVE_VERIFICACION = 'rd-verificacion';

export type EstadoVerificacionCuenta = 'sin' | 'revision' | 'verificada' | 'rechazada';

export function guardarVerificacion(estado: EstadoVerificacionCuenta): void {
  try {
    localStorage.setItem(CLAVE_VERIFICACION, estado);
  } catch {
    /* sin almacenamiento */
  }
}

export function verificacionActual(): EstadoVerificacionCuenta {
  const entidad = entidadActual();
  if (entidad === 'individual') return 'sin';
  try {
    const v = localStorage.getItem(CLAVE_VERIFICACION);
    if (v === 'sin' || v === 'revision' || v === 'verificada' || v === 'rechazada') {
      return v;
    }
  } catch {
    /* fallback */
  }
  // En la sesión demo predeterminada de organización/comunidad arranca verificada
  return 'verificada';
}

/**
 * Regla de oro: una publicación sale verificada por defecto si y solo si la entidad que la publica
 * está verificada manualmente por el equipo de RaDAR.
 * Los perfiles individuales nunca salen verificados por defecto (salen como reportes ciudadanos).
 */
export function publicacionSaleVerificada(): boolean {
  const entidad = entidadActual();
  if (entidad === 'individual') return false;
  return verificacionActual() === 'verificada';
}
