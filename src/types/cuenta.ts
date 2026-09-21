/**
 * Contratos de la experiencia de registro (mockup/registro-v2).
 *
 * El registro no pregunta qué va a hacer la persona: **los módulos del panel se habilitan con
 * el uso**. Al publicar una necesidad se abre el seguimiento a las necesidades (entregas
 * recibidas, distribución); al publicar una oferta, las ofertas (entregas hechas, acopio).
 * La **entidad** (organización o comunidad) es un dato de quién es, no de qué
 * puede hacer; solo pone nombre al panel («Mi organización» / «Mi comunidad»). Decisión de
 * Alejandro, 16 de septiembre de 2026 (segunda: sin la pregunta del objetivo). El mapeo a los
 * enums de Supabase va en `rolSupabase` / `organizationType` de cada entidad.
 */
import type { UserRole, OrganizationType } from '../features/auth/schemas/registerSchema';

/** Los módulos que la cuenta tiene abiertos, según lo que ya hizo. Nacen los dos en falso. */
export interface ModulosCuenta {
  /** Publicó al menos una necesidad: Mis necesidades, entregas recibidas, distribución. */
  pide: boolean;
  /** Publicó al menos una oferta: Mis ofertas, entregas hechas, donaciones y acopio. */
  ofrece: boolean;
}

/** Quién es. `rapida` es la cuenta de un paso que llega desde el directorio con `?rapida=1`:
 *  solo quiere ver un contacto. Voluntariado individual queda fuera por ahora. */
export type PerfilCuenta = 'organizacion' | 'liderazgo' | 'individual' | 'rapida';

export type ModoRegistro = 'login' | 'registro' | 'recuperar' | 'recuperar_enviado' | 'nueva_contrasena';

/** Iconos que la página resuelve a Lucide (un concepto, un icono). */
export type IconoCuenta = 'organizacion' | 'liderazgo' | 'persona';

export interface OpcionPerfil {
  id: Exclude<PerfilCuenta, 'rapida'>;
  nombre: string;
  descripcion: string;
  icono: IconoCuenta;
  /** Cómo se llama el panel de esta entidad. */
  panel: string;
  /** Rol que recibiría en Supabase. La comunidad no tiene rol propio (P8). */
  rolSupabase: UserRole;
  organizationType?: OrganizationType;
}

/** El contacto que ven los demás. Va en la organización o en la comunidad, nunca en la
 *  persona: si se mezclan, publicar el directorio publica el celular de quien creó la cuenta. */
export interface ContactoPublico {
  tel: string;
  mismoWa: boolean;
  wa: string;
  correo: string;
}

export interface DatosOrganizacion {
  nombre: string;
  tipo: string;
  nit: string;
  web: string;
  contacto: ContactoPublico;
  documentoAdjunto: boolean;
}

export interface DatosComunidad {
  nombre: string;
  tipo: string;
  departamento: string;
  referencia: string;
  contacto: ContactoPublico;
}

/** La persona que crea la cuenta. Su celular es por donde RaDAR le escribe. */
export interface DatosPersona {
  nombre: string;
  cargo: string;
  tipoDocumento: string;
  cedula: string;
  tel: string;
  mismoWa: boolean;
  wa: string;
  correo: string;
  captchaToken: string;
  terminos: boolean;
}

/** Persona natural (voluntario / ciudadano independiente). */
export interface DatosIndividual {
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  tipoDocumento: string;
  numeroDocumento: string;
  captchaToken: string;
  terminos: boolean;
}

/** Un paso del camino. `fase` agrupa los pasos en «Quién eres» (1) y «Tu cuenta» (2). */
export type IdPaso = 'perfil' | 'org' | 'com' | 'persona' | 'cuenta' | 'rapida' | 'ind_datos' | 'ind_cuenta';

export interface Paso {
  id: IdPaso;
  fase: 1 | 2;
  nombre: string;
}

/** Estado del formulario. Las contraseñas no viven aquí: quedan en su propio `<input>`
 *  (no controlado) y se leen al validar. */
export interface EstadoRegistro {
  modo: ModoRegistro;
  perfil: PerfilCuenta | '';
  indice: number;
  org: DatosOrganizacion;
  com: DatosComunidad;
  per: DatosPersona;
  ind: DatosIndividual;
  login: { correo: string };
  listo: boolean;
}

/** Lámina del carrusel del panel derecho (segunda pasada del bloque, P10). */
export interface LaminaCarrusel {
  nombre: string;
  titulo: string;
  texto: string;
  chips: { icono: 'pedir' | 'ofrecer' | 'agua' | 'reloj' | 'hecho'; texto: string }[];
}
