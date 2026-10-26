/**
 * Datos simulados de los flujos de publicar (mockup/*): lo que la cuenta ya sabe, la
 * emergencia activa y lo que suele hacer falta en cada evento. Origen: `src/pedir.html` y
 * `src/ofrecer-v2.html` del prototipo. Nada de esto se quema en el JSX.
 */
import type { CuentaFlujo, EstadoOfrecer, EstadoPedir, ModoEntrega } from '../types/flujo';
import type { Language } from '../i18n/translations';

/* ---------- pedir ---------- */

/** Quien pide: llega con su contacto y su dirección resueltos. */
export const CUENTA_PEDIR: CuentaFlujo = {
  organizacion: '',
  contacto: '',
  telefono: '',
  direccion: '',
  lat: 3.4516,
  lng: -76.5320,
  ciudad: 'Cali',
};

export const EMERGENCIA = { activa: 'Inundación', ciudad: 'Cali' };

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

export const MAPA_TIPOS_LUGAR: Record<Language, Record<string, string>> = {
  es: {
    'Comunidad afectada': 'Comunidad afectada',
    'Edificio o vivienda afectada': 'Edificio o vivienda afectada',
    'Albergue temporal': 'Albergue temporal',
    'Centro de acopio barrial': 'Centro de acopio barrial',
    'Salón comunal o refugio': 'Salón comunal o refugio',
    'Punto aislado o vía bloqueada': 'Punto aislado o vía bloqueada',
    'Hospital o centro médico': 'Hospital o centro médico',
    'Otro tipo de lugar': 'Otro tipo de lugar',
  },
  en: {
    'Comunidad afectada': 'Affected community',
    'Edificio o vivienda afectada': 'Affected building or home',
    'Albergue temporal': 'Temporary shelter',
    'Centro de acopio barrial': 'Neighborhood collection center',
    'Salón comunal o refugio': 'Community hall or refuge',
    'Punto aislado o vía bloqueada': 'Isolated point or blocked road',
    'Hospital o centro médico': 'Hospital or medical center',
    'Otro tipo de lugar': 'Other place type',
  },
  pt: {
    'Comunidad afectada': 'Comunidade afetada',
    'Edificio o vivienda afectada': 'Edifício ou moradia afetada',
    'Albergue temporal': 'Abrigo temporário',
    'Centro de acopio barrial': 'Centro de arrecadação do bairro',
    'Salón comunal o refugio': 'Salão comunitário ou refúgio',
    'Punto aislado o vía bloqueada': 'Ponto isolado ou via bloqueada',
    'Hospital o centro médico': 'Hospital ou centro médico',
    'Otro tipo de lugar': 'Outro tipo de local',
  },
  fr: {
    'Comunidad afectada': 'Communauté touchée',
    'Edificio o vivienda afectada': 'Bâtiment ou logement touché',
    'Albergue temporal': 'Refuge temporaire',
    'Centro de acopio barrial': 'Centre de collecte de quartier',
    'Salón comunal o refugio': 'Salle municipale ou abri',
    'Punto aislado o vía bloqueada': 'Point isolé ou route bloquée',
    'Hospital o centro médico': 'Hôpital ou centre médical',
    'Otro tipo de lugar': 'Autre type de lieu',
  },
};

export const MAPA_PARA_QUIEN: Record<Language, Record<string, string>> = {
  es: {
    'Comité comunitario o vecinos': 'Comité comunitario o vecinos',
    'Líder o lideresa comunitaria': 'Líder o lideresa comunitaria',
    'Persona o familia': 'Persona o familia',
    'Organización u ONG': 'Organización u ONG',
    Fundación: 'Fundación',
    Empresa: 'Empresa',
    'Institución (colegio, centro de salud)': 'Institución (colegio, centro de salud)',
  },
  en: {
    'Comité comunitario o vecinos': 'Community committee or neighbors',
    'Líder o lideresa comunitaria': 'Community leader',
    'Persona o familia': 'Individual or family',
    'Organización u ONG': 'Organization or NGO',
    Fundación: 'Foundation',
    Empresa: 'Company',
    'Institución (colegio, centro de salud)': 'Institution (school, healthcare center)',
  },
  pt: {
    'Comité comunitario o vecinos': 'Comitê comunitário ou vizinhos',
    'Líder o lideresa comunitaria': 'Líder comunitário',
    'Persona o familia': 'Pessoa ou família',
    'Organización u ONG': 'Organização ou ONG',
    Fundación: 'Fundação',
    Empresa: 'Empresa',
    'Institución (colegio, centro de salud)': 'Instituição (escola, centro de saúde)',
  },
  fr: {
    'Comité comunitario o vecinos': 'Comité de quartier ou voisins',
    'Líder o lideresa comunitaria': 'Leader communautaire',
    'Persona o familia': 'Personne ou famille',
    'Organización u ONG': 'Organisation ou ONG',
    Fundación: 'Fondation',
    Empresa: 'Entreprise',
    'Institución (colegio, centro de salud)': 'Institution (école, centre de santé)',
  },
};

export function opcionesTiposLugar(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  const map = MAPA_TIPOS_LUGAR[lang] || MAPA_TIPOS_LUGAR.es;
  return TIPOS_LUGAR.map((tl) => ({ valor: tl, etiqueta: map[tl] || tl }));
}

export function opcionesParaQuien(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  const map = MAPA_PARA_QUIEN[lang] || MAPA_PARA_QUIEN.es;
  return PARA_QUIEN.map((pq) => ({ valor: pq, etiqueta: map[pq] || pq }));
}

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
    dias: 0,
    metas: {},
    det: {},
    dir: '',
    lat: 4.6097,
    lng: -74.0817,
    fotos: [],
    sourceUrl: '',
    contacto: '',
    tel: '',
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
  organizacion: '',
  direccion: '',
  lat: 4.6097,
  lng: -74.0817,
  contacto: '',
  telefono: '',
  inventario: {},
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

export const MAPA_TIPOS_ORG_OFERTA: Record<Language, Record<string, string>> = {
  es: {
    'Organización u ONG': 'Organización u ONG',
    Fundación: 'Fundación',
    Empresa: 'Empresa',
    'Cuerpo de socorro': 'Cuerpo de socorro',
    'Comité comunitario': 'Comité comunitario',
    'Persona o voluntariado independiente': 'Persona o voluntariado independiente',
  },
  en: {
    'Organización u ONG': 'Organization or NGO',
    Fundación: 'Foundation',
    Empresa: 'Company',
    'Cuerpo de socorro': 'Emergency relief agency',
    'Comité comunitario': 'Community committee',
    'Persona o voluntariado independiente': 'Independent volunteer or person',
  },
  pt: {
    'Organización u ONG': 'Organização ou ONG',
    Fundación: 'Fundação',
    Empresa: 'Empresa',
    'Cuerpo de socorro': 'Corpo de socorro',
    'Comité comunitario': 'Comitê comunitário',
    'Persona o voluntariado independiente': 'Voluntário independente',
  },
  fr: {
    'Organización u ONG': 'Organisation ou ONG',
    Fundación: 'Fondation',
    Empresa: 'Entreprise',
    'Cuerpo de socorro': 'Organisme de secours',
    'Comité comunitario': 'Comité communautaire',
    'Persona o voluntariado independiente': 'Bénévole indépendant',
  },
};

export const MAPA_ENVIOS: Record<Language, Record<string, string>> = {
  es: { Gratis: 'Gratis', Contraentrega: 'Contraentrega', 'A convenir': 'A convenir' },
  en: { Gratis: 'Free', Contraentrega: 'Cash on delivery', 'A convenir': 'To be agreed' },
  pt: { Gratis: 'Grátis', Contraentrega: 'A pagar na entrega', 'A convenir': 'A combinar' },
  fr: { Gratis: 'Gratuit', Contraentrega: 'Paiement à la livraison', 'A convenir': 'À convenir' },
};

export const MAPA_DISPONIBLE: Record<Language, Record<string, string>> = {
  es: { 'Hasta agotar': 'Hasta agotar', 'Hasta una fecha': 'Hasta una fecha' },
  en: { 'Hasta agotar': 'While supplies last', 'Hasta una fecha': 'Until a date' },
  pt: { 'Hasta agotar': 'Até esgotar', 'Hasta una fecha': 'Até uma data' },
  fr: { 'Hasta agotar': 'Jusqu\'à épuisement', 'Hasta una fecha': 'Jusqu\'à une date' },
};

export function opcionesTiposOrgOferta(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  const map = MAPA_TIPOS_ORG_OFERTA[lang] || MAPA_TIPOS_ORG_OFERTA.es;
  return TIPOS_ORG_OFERTA.map((to) => ({ valor: to, etiqueta: map[to] || to }));
}

export function opcionesRadios(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  return RADIOS.map((r) => ({
    valor: r,
    etiqueta: r === 'Todo el país' ? (lang === 'en' ? 'Nationwide' : lang === 'pt' ? 'Todo o país' : lang === 'fr' ? 'Tout le pays' : r) : r,
  }));
}

export function opcionesEnvios(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  const map = MAPA_ENVIOS[lang] || MAPA_ENVIOS.es;
  return ENVIOS.map((env) => ({ valor: env, etiqueta: map[env] || env }));
}

export function opcionesDisponible(lang: Language = 'es'): { valor: string; etiqueta: string }[] {
  const map = MAPA_DISPONIBLE[lang] || MAPA_DISPONIBLE.es;
  return DISPONIBLE.map((d) => ({ valor: d, etiqueta: map[d] || d }));
}

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
    dir: '',
    lat: 4.6097,
    lng: -74.0817,
    contacto: '',
    tel: '',
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
    sugerencias: {
      titulo: 'Pueden ayudarte',
      bajada: 'Publicaciones cerca que tienen lo que pediste. Solicita lo que te sirva y te avisamos apenas respondan.',
    },
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
    sugerencias: {
      titulo: 'Pueden solicitarte',
      bajada: 'Publicaciones cerca que piden lo que ofreces. Comprométete con la que puedas cubrir y te avisamos apenas respondan.',
    },
  },
  canales: 'Te avisamos en RaDAR, por WhatsApp y por correo.',
};
