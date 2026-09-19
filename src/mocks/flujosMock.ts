/**
 * Datos simulados de los flujos de publicar (mockup/*): lo que la cuenta ya sabe, la
 * emergencia activa y lo que suele hacer falta en cada evento. Origen: `src/pedir.html` y
 * `src/ofrecer-v2.html` del prototipo. Nada de esto se quema en el JSX.
 */
import type { CuentaFlujo, EstadoOfrecer, EstadoPedir, ModoEntrega } from '../types/flujo';

/* ---------- pedir ---------- */

/** Quien pide: llega con su contacto y su dirección resueltos. */
export const CUENTA_PEDIR: CuentaFlujo = {
  organizacion: 'Fundación Colombia Unida',
  contacto: 'Ana Ruiz',
  telefono: '+57 300 123 4567',
  direccion: 'Cra. 80 #57-40 sur, Bosa',
  lat: 4.6197,
  lng: -74.202,
  ciudad: 'Bogotá',
};

export const EMERGENCIA = { activa: 'Inundación', ciudad: 'Bogotá' };

export type IconoEvento = 'waves' | 'pulse' | 'wind' | 'fire' | 'mountains' | 'virus' | 'warning';

export const ICONO_EVENTO: Record<string, IconoEvento> = {
  Inundación: 'waves',
  Terremoto: 'pulse',
  'Vendaval / Tormenta': 'wind',
  'Incendio forestal / Erupción': 'fire',
  'Derrumbe / Deslizamiento': 'mountains',
  'Epidemia / Emergencia sanitaria': 'virus',
  'Otra emergencia comunitaria': 'warning',
};

/** Qué suele hacer falta en cada evento; sale de la taxonomía. */
export const SUGERIDOS: Record<string, string[]> = {
  Inundación: ['Agua potable', 'Equipos de bombeo', 'Alimentos', 'Cobijas y colchonetas', 'Remoción de escombros y barro'],
  Terremoto: ['Equipo búsqueda y rescate', 'Atención médica', 'Evaluación estructural y técnica', 'Maquinaria pesada y operarios', 'Cobijas y colchonetas'],
  'Vendaval / Tormenta': ['Cubiertas y cerramientos', 'Herramientas de mano', 'Plantas eléctricas / Generadores', 'Cobijas y colchonetas', 'Remoción de escombros y barro'],
  'Incendio forestal / Erupción': ['Protección respiratoria', 'Agua potable', 'Medicamentos / Botiquín', 'Herramientas de mano', 'Cuidado y alimento de animales'],
  'Derrumbe / Deslizamiento': ['Maquinaria pesada y operarios', 'Equipo búsqueda y rescate', 'Remoción de escombros y barro', 'Transporte terrestre', 'Alimentos'],
  'Epidemia / Emergencia sanitaria': ['Medicamentos / Botiquín', 'Protección respiratoria', 'Atención médica', 'Implementos de aseo e higiene', 'Agua potable'],
  'Otra emergencia comunitaria': ['Agua potable', 'Alimentos', 'Atención médica', 'Salud mental y apoyo psicosocial'],
};

export const PREGUNTA_GRUPO: Record<string, string> = {
  personas: '¿A cuántas personas estás atendiendo?',
  inmuebles: '¿Cuántas viviendas están afectadas?',
  animales: '¿Cuántos animales hay que atender?',
};

/** Los tramos del paso se nombran distinto por base: quien navega a ciegas oía «Volver a
 *  Cantidad» dos veces seguidas. */
export const NOMBRE_GRUPO: Record<string, string> = { personas: 'Personas', inmuebles: 'Viviendas', animales: 'Animales' };

export const DIAS_OPCIONES = [1, 3, 7, 15, 30];

export const TIPOS_LUGAR = ['Comunidad afectada', 'Edificio o vivienda afectada', 'Albergue temporal', 'Centro de acopio barrial', 'Salón comunal o refugio', 'Punto aislado o vía bloqueada', 'Hospital o centro médico', 'Otro tipo de lugar'];

export const PARA_QUIEN = ['Comité comunitario o vecinos', 'Líder o lideresa comunitaria', 'Persona o familia', 'Organización u ONG', 'Fundación', 'Empresa', 'Institución (colegio, centro de salud)'];

/** Texto elegido por Alejandro para la caja de cálculo. */
export const AVISO_GUIA = 'Al final puedes cambiar las cantidades y agregar detalles.';

export const TOPE_GRUPO = 100000;
/** 25 MB por archivo. */
export const TOPE_ARCHIVO = 25 * 1024 * 1024;

export function estadoInicialPedir(): EstadoPedir {
  return {
    evento: EMERGENCIA.activa,
    sel: [],
    grupo: {},
    dias: 3,
    metas: {},
    det: {},
    dir: CUENTA_PEDIR.direccion,
    lat: CUENTA_PEDIR.lat,
    lng: CUENTA_PEDIR.lng,
    fotos: [],
    contacto: CUENTA_PEDIR.contacto,
    tel: CUENTA_PEDIR.telefono,
    wa: '',
    mismoWa: true,
    telAlt: '',
    tipoLugar: '',
    comoLlegar: '',
    paraQuien: '',
    detalles: '',
    q: '',
    abiertos: {},
    publicado: false,
    i: 0,
    ultimoDeFase: {},
  };
}

/* ---------- ofrecer ---------- */

/** Quien ofrece: una organización registrada ya dijo qué tiene. Eso llega marcado y con su
 *  cantidad; solo confirma o ajusta. */
export const CUENTA_OFRECER: CuentaFlujo = {
  organizacion: 'Bomberos Voluntarios Usme',
  direccion: 'Estación Usme, Cl. 91 sur #3-20',
  lat: 4.479,
  lng: -74.1263,
  contacto: 'Carlos Peña',
  telefono: '+57 310 555 0199',
  inventario: {
    'Agua potable': { cantidad: 450, pres: 'Carrotanque' },
    Alimentos: { cantidad: 20, pres: 'Kits de mercado' },
    'Plantas eléctricas / Generadores': { cantidad: 2, potencia: '5 a 20 kW' },
  },
};

export const REGISTRADO = 'Registrado por tu organización';

export const MODOS_ENTREGA: { id: ModoEntrega; nombre: string; icono: 'truck' | 'pin' | 'monitor' }[] = [
  { id: 'llevamos', nombre: 'Lo llevamos', icono: 'truck' },
  { id: 'sitio', nombre: 'En sitio', icono: 'pin' },
  { id: 'remoto', nombre: 'Remoto', icono: 'monitor' },
];
export const RADIOS = ['5 km', '10 km', '25 km', '50 km', 'Todo el país'];
export const ENVIOS = ['Gratis', 'Contraentrega', 'A convenir'];
export const CANALES = ['WhatsApp', 'Llamada', 'Videollamada', 'Correo'];
export const TIPOS_ORG_OFERTA = ['Organización u ONG', 'Fundación', 'Empresa', 'Cuerpo de socorro', 'Comité comunitario', 'Persona o voluntariado independiente'];
export const DISPONIBLE = ['Hasta agotar', 'Hasta una fecha'];

export function estadoInicialOfrecer(): EstadoOfrecer {
  return {
    sel: [],
    cant: {},
    det: {},
    entrega: 'llevamos',
    radio: '10 km',
    envio: 'Gratis',
    canales: [],
    horario: '',
    dir: CUENTA_OFRECER.direccion,
    lat: CUENTA_OFRECER.lat,
    lng: CUENTA_OFRECER.lng,
    contacto: CUENTA_OFRECER.contacto,
    tel: CUENTA_OFRECER.telefono,
    wa: '',
    mismoWa: true,
    telAlt: '',
    tipoOrg: '',
    condiciones: '',
    mostrarNombre: true,
    fotos: [],
    q: '',
    abiertos: {},
    publicado: false,
    i: 0,
    ultimoDeFase: {},
  };
}

/** Los textos de la pantalla de éxito, por flujo. */
export const EXITO = {
  pedir: {
    titulo: 'Listo, tu necesidad ya está en el mapa',
    sub: 'Te avisamos apenas una organización se comprometa a ayudar.',
    pasos: [
      { titulo: 'Publicada', texto: 'Las organizaciones cercanas ya la ven en el mapa.', hecho: true },
      { titulo: 'Alguien se compromete', texto: 'Puede ser con una parte; la necesidad muestra cuánto falta todavía.', hecho: false },
      { titulo: 'Llega y tú confirmas', texto: 'Con tu confirmación queda resuelta.', hecho: false },
    ],
    otra: 'Publicar otra necesidad',
  },
  ofrecer: {
    titulo: 'Listo, tu oferta ya está en el mapa',
    sub: 'Te avisamos apenas una organización la solicite.',
    pasos: [
      { titulo: 'Publicada', texto: 'Quien necesite alguno de estos recursos la ve en el mapa.', hecho: true },
      { titulo: 'Te la solicitan', texto: 'Tú decides qué aceptas y a quién asignas cada entrega.', hecho: false },
      { titulo: 'Entregas y te confirman', texto: 'Cuando quien recibe confirma, la entrega cuenta como resuelta.', hecho: false },
    ],
    otra: 'Publicar otra oferta',
  },
  canales: 'Te avisamos en RaDAR, por WhatsApp y por correo.',
};
