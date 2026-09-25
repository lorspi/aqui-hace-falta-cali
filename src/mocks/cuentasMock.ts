/**
 * Datos simulados de la experiencia de registro (mockup/registro-v2).
 * Vienen de `Producto/src/registro-v2.html` del prototipo de RaDAR (rama `movil`).
 * Nada de esto se quema en el JSX: la página lo importa de aquí.
 */
import type { ContactoPublico, EstadoRegistro, LaminaCarrusel, OpcionPerfil } from '../types/cuenta';

/** Quién es: Organización, Comunidad y Persona natural. */
export const PERFILES: OpcionPerfil[] = [
  {
    id: 'organizacion',
    nombre: 'Organización',
    descripcion: 'Fundación, ONG, entidad pública, empresa o colectivo.',
    icono: 'organizacion',
    panel: 'Mi organización',
    rolSupabase: 'entidad_profesional',
  },
  {
    id: 'liderazgo',
    nombre: 'Comunidad',
    descripcion: 'Líderes comunitarios, juntas de acción comunal o quienes representan a su sector.',
    icono: 'liderazgo',
    panel: 'Mi comunidad',
    // Sin rol propio en Supabase: lo más cercano es `moderador` («líderes comunitarios»)
    // o `junta_vecinal` como tipo de organización. Pregunta P8 a Frontend.
    rolSupabase: 'moderador',
    organizationType: 'junta_vecinal',
  },
  {
    id: 'individual',
    nombre: 'Persona natural',
    descripcion: 'Voluntario, profesional o ciudadano que quiere colaborar.',
    icono: 'persona',
    panel: 'Mi cuenta',
    rolSupabase: 'voluntario',
  },
];

export const TIPOS_DOC = [
  'Cédula de ciudadanía',
  'Cédula de extranjería',
  'Pasaporte',
  'PPT / PEP',
  'Tarjeta de identidad',
];

export const TIPOS_ORG = [
  'Organización u ONG',
  'Fundación',
  'Empresa',
  'Cuerpo de socorro',
  'Colectivo de voluntariado',
  'Entidad pública',
];

export const TIPOS_COM = [
  'Barrio o comuna',
  'Vereda o corregimiento',
  'Cabildo o resguardo',
  'Asentamiento o sector afectado',
  'Albergue',
];

export const DEPTOS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bogotá D. C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
];

/** A dónde lleva cada salida. Las maquetas de Producto (`*-v2`) se enlazan entre sí; lo
 *  que todavía no tiene maqueta lleva a la ruta real. `mapa` es la Radar de la maqueta:
 *  entrar y «Ir al mapa» caen ahí, no en el mapa real. */
export const RUTAS = {
  inicio: '/',
  mapa: '/radar-v2',
  radar: '/radar-v2',
  pedir: '/pedir-v2',
  ofrecer: '/ofrecer-v2',
  organizaciones: '/mapa-ayudas-necesidades',
  directorio: '/directorio-v2',
  avisos: '/avisos-v2',
  perfil: '/perfil-v2',
  miOrganizacion: '/panel-v2',
  comoFunciona: '/guia',
  terminos: '/terminos',
  privacidad: '/privacidad',
  recuperar: '/',
};

/** La cuenta con sesión de la maqueta (la misma en la Radar, el panel, el Directorio, los
 *  Avisos y el Perfil) y las rutas que el cascarón enlaza. */
export const CUENTA_SESION = { entidad: 'Bomberos Voluntarios Usme', persona: 'Carlos Peña', rol: 'admin', iniciales: 'BU' };
export const RUTAS_SHELL = {
  inicio: RUTAS.inicio,
  panel: RUTAS.miOrganizacion,
  radar: RUTAS.radar,
  directorio: RUTAS.directorio,
  avisos: RUTAS.avisos,
  perfil: RUTAS.perfil,
  salir: '/registro-v2',
};

const CONTACTO_VACIO: ContactoPublico = { tel: '', mismoWa: true, wa: '', correo: '' };

export function estadoInicial(rapida: boolean): EstadoRegistro {
  let modoInicial: ModoRegistro = rapida ? 'registro' : 'login';
  if (typeof window !== 'undefined') {
    const search = window.location.search;
    if (/[?&]modo=registro/.test(search)) {
      modoInicial = 'registro';
    } else if (/[?&]modo=login/.test(search)) {
      modoInicial = 'login';
    }
  }
  return {
    modo: modoInicial,
    perfil: rapida ? 'rapida' : '',
    indice: 0,
    org: { nombre: '', tipo: '', nit: '', web: '', contacto: { ...CONTACTO_VACIO }, documentoAdjunto: false },
    com: { nombre: '', tipo: '', departamento: '', referencia: '', contacto: { ...CONTACTO_VACIO } },
    per: { nombre: '', cargo: '', tipoDocumento: '', cedula: '', tel: '', mismoWa: true, wa: '', correo: '', captchaToken: '', terminos: false },
    ind: {
      nombre: '',
      apellido: '',
      correo: '',
      celular: '',
      tipoDocumento: '',
      numeroDocumento: '',
      captchaToken: '',
      terminos: false,
    },
    login: { correo: '' },
    listo: false,
  };
}

/** El carrusel del panel derecho. Los chips de «La necesidad» son los de Agua potable del
 *  prototipo; «El mapa» y «La confirmación» no llevan cifras porque no salen de un dato. */
export const LAMINAS: LaminaCarrusel[] = [
  {
    nombre: 'El mapa',
    titulo: 'La ayuda que hay y la que falta, en el mismo mapa',
    texto: 'Cada organización publica lo que necesita y lo que tiene. Nosotros lo cruzamos por cercanía.',
    chips: [{ icono: 'pedir', texto: 'Se necesita' }, { icono: 'ofrecer', texto: 'Se ofrece' }],
  },
  {
    nombre: 'La necesidad',
    titulo: 'Cada necesidad dice cuánto falta',
    texto: 'Lo pedido, lo que va en camino y lo que ya llegó, recurso por recurso.',
    chips: [{ icono: 'agua', texto: 'faltan 450 L' }, { icono: 'reloj', texto: '270 L en camino' }],
  },
  {
    nombre: 'La confirmación',
    titulo: 'Se cierra cuando llega',
    texto: 'Quien recibe confirma la entrega. Solo entonces cuenta como resuelta.',
    chips: [{ icono: 'hecho', texto: 'Completado' }],
  },
];

/** La tarjeta de la segunda lámina: la necesidad de Agua potable del prototipo, con lo que
 *  ya llegó (`hecho`) y lo que va en camino (`camino`), en porcentaje. */
export const LAMINA_CARTA = {
  organizacion: 'Fundación Colombia Unida',
  direccion: 'Cra. 80 #57-40 sur, Bosa · a 9,1 km de tu ubicación',
  filas: [
    { recurso: 'Agua potable', falta: 'faltan 450 L', hecho: 20, camino: 30 },
    { recurso: 'Ropa y cobijas', falta: 'faltan 200 unidades', hecho: 0, camino: 0 },
    { recurso: 'Alimentos', falta: '50 de 50 kits', hecho: 100, camino: 0 },
  ],
};

/** El chip de la tercera lámina. */
export const LAMINA_CIERRE = 'Entregado · Albergue Bosa · 180 L · 12 sep, 9:40 a. m.';

/** El mapa decorativo de la primera lámina: centro y seis pines del prototipo (Bogotá).
 *  `tipo` decide el color: necesidad (rojo), oferta (azul), entregado (verde). */
export const LAMINA_MAPA = {
  centro: [4.6, -74.13] as [number, number],
  zoom: 11,
  pines: [
    { lat: 4.616, lng: -74.187, tipo: 'necesidad' },
    { lat: 4.479, lng: -74.126, tipo: 'oferta' },
    { lat: 4.575, lng: -74.1, tipo: 'entregado' },
    { lat: 4.665, lng: -74.098, tipo: 'necesidad' },
    { lat: 4.725, lng: -74.055, tipo: 'oferta' },
    { lat: 4.54, lng: -74.14, tipo: 'necesidad' },
  ] as { lat: number; lng: number; tipo: 'necesidad' | 'oferta' | 'entregado' }[],
};
