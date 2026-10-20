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
export const esCelular = (v: string | undefined): boolean => {
  const limpio = (v || '').trim().replace(/[\s-]/g, '');
  return /^\d{10}$/.test(limpio);
};

/** Valida el formato del número de documento según el tipo de documento. */
export function esDocumentoValido(tipo: string | undefined, numero: string | undefined): boolean {
  const num = (numero || '').trim();
  if (!num) return false;
  const t = (tipo || 'Cédula de ciudadanía').trim();

  switch (t) {
    case 'Cédula de ciudadanía':
      return /^\d{5,10}$/.test(num);
    case 'Tarjeta de identidad':
      return /^\d{7,11}$/.test(num);
    case 'Cédula de extranjería':
      return /^\d{3,10}$/.test(num);
    case 'Pasaporte':
      return /^[A-Za-z0-9]{5,16}$/.test(num);
    case 'PPT / PEP':
      return /^[A-Za-z0-9]{5,15}$/.test(num);
    default:
      return /^[A-Za-z0-9]{5,20}$/.test(num);
  }
}

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
        esDocumentoValido(e.per.tipoDocumento, e.per.cedula) &&
        (!e.per.tel.trim() || esCelular(e.per.tel))
      );
    case 'cuenta': {
      const email = (e.per.correo || (e.perfil === 'organizacion' ? e.org.contacto.correo : e.perfil === 'liderazgo' ? e.com.contacto.correo : '')).trim();
      const passVal = contrasenaCumple(pass.cp || '', email);
      const matchPass = Boolean(pass.cp && pass.cp === pass.cq);
      return (
        esCorreo(email) &&
        passVal &&
        matchPass &&
        e.per.terminos
      );
    }
    case 'ind_datos':
      return (
        lleno(e.ind.nombre) &&
        lleno(e.ind.apellido) &&
        lleno(e.ind.tipoDocumento) &&
        esDocumentoValido(e.ind.tipoDocumento, e.ind.numeroDocumento) &&
        esCelular(e.ind.celular)
      );
    case 'ind_cuenta': {
      const email = (e.ind.correo || '').trim();
      const passVal = contrasenaCumple(pass.ip || '', email);
      const matchPass = Boolean(pass.ip && pass.ip === pass.iq);
      return (
        esCorreo(email) &&
        passVal &&
        matchPass &&
        e.ind.terminos
      );
    }
    case 'rapida':
      return lleno(e.per.nombre) && esCelular(e.per.tel) && esCorreo(e.per.correo) && contrasenaCumple(pass.rp || '', e.per.correo);
    default:
      return true;
  }
}

export function loginListo(correo: string, pass: Contrasenas): boolean {
  return esCorreo(correo) && lleno(pass.lp);
}

/** Reglas de validación al salir del campo: requerido | correo | celular | documento. */
export type Regla = 'requerido' | 'correo' | 'celular' | 'documento';

export function validar(valor: string, reglas: Regla[], mensajeVacio?: string, tipoDoc?: string): string | null {
  const v = (valor || '').trim();
  if (reglas.includes('requerido') && !v) return mensajeVacio || T.errores.requerido;
  if (v && reglas.includes('correo') && !esCorreo(v)) return T.errores.correoFormato;
  if (v && reglas.includes('celular') && !esCelular(v)) return T.errores.celularFormato;
  if (v && reglas.includes('documento') && !esDocumentoValido(tipoDoc, v)) {
    return tipoDoc === 'Cédula de ciudadanía' ? T.errores.cedulaFormato : T.errores.docFormato;
  }
  return null;
}
