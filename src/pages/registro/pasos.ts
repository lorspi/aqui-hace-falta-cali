/**
 * El camino del registro y cuándo cada paso está listo. Lógica pura, sin React.
 * Viene de `camino()`, `listo()` y la validación al salir del campo de
 * `Producto/src/registro-v2.html`.
 */
import { contrasenaCumple } from '../../features/auth/schemas/registerSchema';
import type { EstadoRegistro, IdPaso, Paso, PerfilCuenta } from '../../types/cuenta';
import { TEXTOS } from './textos';

const T = TEXTOS;

/** Lo que la persona escribe en los campos de contraseña vive fuera del estado. */
export type Contrasenas = Partial<Record<'lp' | 'rp' | 'cp' | 'cq' | 'ip' | 'iq' | 'np' | 'nq', string>>;

/** Quién es, sus datos, la persona de enlace y la cuenta. Nada de qué va a hacer: los módulos
 *  se habilitan con el uso. */
export function camino(perfil: PerfilCuenta | ''): Paso[] {
  if (perfil === 'rapida') return [{ id: 'rapida', fase: 1, nombre: 'Tu cuenta' }];
  const c: Paso[] = [{ id: 'perfil', fase: 1, nombre: 'Quién eres' }];
  if (perfil === 'organizacion') c.push({ id: 'org', fase: 1, nombre: 'Datos de la organización' });
  if (perfil === 'liderazgo') c.push({ id: 'com', fase: 1, nombre: 'Datos de la comunidad' });
  if (perfil === 'individual') {
    c.push({ id: 'ind_datos', fase: 2, nombre: 'Tus datos' });
    c.push({ id: 'ind_cuenta', fase: 2, nombre: 'Tu cuenta' });
    return c;
  }
  c.push({ id: 'persona', fase: 2, nombre: 'Tus datos' });
  c.push({ id: 'cuenta', fase: 2, nombre: 'Tu cuenta' });
  return c;
}

export function pasoActual(estado: EstadoRegistro): Paso {
  const c = camino(estado.perfil);
  return c[Math.min(estado.indice, c.length - 1)];
}

export function indiceDe(perfil: PerfilCuenta | '', id: IdPaso): number {
  return camino(perfil).findIndex((p) => p.id === id);
}

export function primerIndiceDeFase(perfil: PerfilCuenta | '', fase: 1 | 2): number {
  return camino(perfil).findIndex((p) => p.fase === fase);
}

export const lleno = (v: string | undefined): boolean => Boolean((v || '').trim());
export const esCorreo = (v: string | undefined): boolean => /.+@.+\..+/.test(v || '');
export const esCelular = (v: string | undefined): boolean => (v || '').replace(/\D/g, '').length >= 10;

/** ¿Se puede continuar desde este paso? Es lo que habilita el botón principal. */
export function listo(paso: Paso, e: EstadoRegistro, pass: Contrasenas): boolean {
  switch (paso.id) {
    case 'perfil':
      return Boolean(e.perfil);
    case 'org':
      return (
        lleno(e.org.nombre) &&
        lleno(e.org.tipo) &&
        esCelular(e.org.contacto.tel) &&
        esCorreo(e.org.contacto.correo)
      );
    case 'com':
      return (
        lleno(e.com.nombre) &&
        lleno(e.com.tipo) &&
        lleno(e.com.departamento) &&
        esCelular(e.com.contacto.tel) &&
        esCorreo(e.com.contacto.correo)
      );
    case 'persona':
      return (
        lleno(e.per.nombre) &&
        lleno(e.per.tipoDocumento) &&
        lleno(e.per.cedula) &&
        (!e.per.tel.trim() || esCelular(e.per.tel))
      );
    case 'cuenta':
      return (
        esCorreo(e.per.correo) &&
        contrasenaCumple(pass.cp || '', e.per.correo) &&
        pass.cp === pass.cq &&
        e.per.terminos &&
        (Boolean(e.per.captchaToken) || typeof window === 'undefined' || !window.turnstile)
      );
    case 'ind_datos':
      return (
        lleno(e.ind.nombre) &&
        lleno(e.ind.apellido) &&
        lleno(e.ind.tipoDocumento) &&
        lleno(e.ind.numeroDocumento) &&
        esCelular(e.ind.celular)
      );
    case 'ind_cuenta':
      return (
        esCorreo(e.ind.correo) &&
        contrasenaCumple(pass.ip || '', e.ind.correo) &&
        pass.ip === pass.iq &&
        e.ind.terminos &&
        (Boolean(e.ind.captchaToken) || typeof window === 'undefined' || !window.turnstile)
      );
    case 'rapida':
      return lleno(e.per.nombre) && lleno(e.per.tel) && esCorreo(e.per.correo) && contrasenaCumple(pass.rp || '', e.per.correo);
    default:
      return true;
  }
}

export function loginListo(correo: string, pass: Contrasenas): boolean {
  return esCorreo(correo) && lleno(pass.lp);
}

/** Reglas de validación al salir del campo: requerido | correo | celular. */
export type Regla = 'requerido' | 'correo' | 'celular';

export function validar(valor: string, reglas: Regla[], mensajeVacio?: string): string | null {
  const v = (valor || '').trim();
  if (reglas.includes('requerido') && !v) return mensajeVacio || T.errores.requerido;
  if (v && reglas.includes('correo') && !esCorreo(v)) return T.errores.correoFormato;
  if (v && reglas.includes('celular') && !esCelular(v)) return T.errores.celularFormato;
  return null;
}
