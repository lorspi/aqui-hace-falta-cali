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
  if (forzada === 'organizacion') return 'organizacion';
  return guardado === 'liderazgo' ? 'liderazgo' : 'organizacion';
}

export function entidadActual(): Exclude<PerfilCuenta, 'rapida'> {
  try {
    return entidadGuardada(window.location.search, localStorage.getItem(CLAVE));
  } catch {
    return 'organizacion';
  }
}

/** «Mi organización» o «Mi comunidad», según la entidad. */
export function nombrePanel(perfil: Exclude<PerfilCuenta, 'rapida'> = entidadActual()): string {
  return PERFILES.find((p) => p.id === perfil)?.panel ?? 'Mi organización';
}
