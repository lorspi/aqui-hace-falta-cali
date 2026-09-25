/**
 * Contratos de los flujos de publicar (mockup/*): pedir una necesidad y ofrecer un recurso.
 * Origen: `Producto/assets/equivalencias.js`, `flujo.js`, `src/pedir.html` y
 * `src/ofrecer-v2.html` del prototipo de RaDAR.
 */

/** Qué mide una base de cálculo (personas, viviendas, animales). */
export interface Base {
  unidad: string;
  /** El número lo escribe la persona; `sugeridos` solo llenan el campo. */
  libre: boolean;
  sugeridos?: number[];
}

/** La ración de un recurso: cuánto por unidad de base, y si se consume a diario. */
export interface Equivalencia {
  base: string;
  por: 'persona' | 'familia' | 'vivienda' | 'animal' | 'directo';
  cantidad: number;
  unidad: string;
  diario: boolean;
  /** Ausente = true. En falso los días acompañan la cifra sin multiplicarla. */
  multiplicaDias?: boolean;
  /** La regla en palabras, tal como se muestra. */
  racion: string;
  fuente: string;
}

export type TipoCampoDetalle = 'multi' | 'una' | 'num' | 'texto';

export interface CampoDetalle {
  k: string;
  t: TipoCampoDetalle;
  l: string;
  /** Unidad (num). */
  u?: string;
  /** Opciones (una · multi). */
  op?: string[];
  /** Placeholder o ejemplo (texto). */
  p?: string;
  req?: boolean;
  /** Cifras sugeridas (num). */
  sug?: number[];
}

export interface DetalleRecurso {
  pregunta: string;
  ayuda?: string;
  campos: CampoDetalle[];
}

export interface OfertaRecurso {
  unidad?: string;
  campos: CampoDetalle[];
}

/** Una meta calculada (o no) para un recurso pedido. */
export interface Meta {
  item: string;
  meta: number | null;
  unidad?: string;
  formula?: string;
  fuente?: string;
  porValidar?: boolean;
  motivo?: string;
}

/** Lo respondido en el detalle de un recurso: por clave del campo. */
export type RespuestasDetalle = Record<string, string | number | string[] | undefined>;

/** Un archivo adjunto a la publicación. La miniatura es un `objectURL` local. */
export interface Foto {
  nombre: string;
  peso: string;
  tipo: 'imagen' | 'video';
  url: string;
}

/** Un sub-paso del camino. `paso` es la fase (1 = qué, 2 = revisar y publicar). */
export interface SubPaso {
  paso: 1 | 2;
  id: string;
  nombre: string;
  /** Solo en ofrecer: los recursos de esa categoría. */
  items?: string[];
}

export type ModoEntrega = 'llevamos' | 'sitio' | 'remoto';

/** Estado del flujo de pedir. Las contraseñas no existen aquí; los objectURL de fotos no se
 *  guardan en el borrador. */
export interface EstadoPedir {
  evento: string;
  sel: string[];
  grupo: Record<string, number>;
  dias: number;
  /** Metas escritas a mano en «Revisar», por recurso. */
  metas: Record<string, number>;
  det: Record<string, RespuestasDetalle>;
  dir: string;
  lat: number;
  lng: number;
  fotos: Foto[];
  contacto: string;
  tel: string;
  wa: string;
  mismoWa: boolean;
  telAlt: string;
  tipoLugar: string;
  comoLlegar: string;
  paraQuien: string;
  detalles: string;
  q: string;
  abiertos: Record<string, boolean>;
  publicado: boolean;
  i: number;
  ultimoDeFase: Record<number, string>;
}

export interface EstadoOfrecer {
  sel: string[];
  cant: Record<string, number>;
  det: Record<string, RespuestasDetalle>;
  entrega: ModoEntrega;
  radio: string;
  envio: string;
  canales: string[];
  horario: string;
  dir: string;
  lat: number;
  lng: number;
  contacto: string;
  tel: string;
  wa: string;
  mismoWa: boolean;
  telAlt: string;
  tipoOrg: string;
  condiciones: string;
  mostrarNombre: boolean;
  fotos: Foto[];
  q: string;
  abiertos: Record<string, boolean>;
  publicado: boolean;
  i: number;
  ultimoDeFase: Record<number, string>;
  /** Cuando el flujo se abre desde una donación (`?insumo=&cant=&u=&origen=`). */
  origenDonacion?: string;
  origenCant?: string;
}

/** Lo que la cuenta ya sabe: llega resuelto y solo se confirma. */
export interface CuentaFlujo {
  organizacion: string;
  contacto: string;
  telefono: string;
  direccion: string;
  lat: number;
  lng: number;
  ciudad?: string;
  /** Ofrecer: lo registrado, por recurso, con su cantidad y lo que declaró. */
  inventario?: Record<string, { cantidad: number } & Record<string, string | number>>;
}
