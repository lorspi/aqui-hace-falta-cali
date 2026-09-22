/**
 * Contratos del Directorio (mockup/*): quién está en la red. Una entidad es una organización
 * o una comunidad con sus datos de contacto; lo que ofrece y lo que pide NO se guarda aquí:
 * sale de sus publicaciones (`Publicacion.org`), para que el directorio y la Radar digan lo
 * mismo. Origen: `Producto/src/organizaciones.html` del prototipo (decisiones 120, 121, 161).
 */
export type ClaseEntidad = 'organizacion' | 'comunidad';

export interface Entidad {
  id: string;
  /** El mismo nombre que lleva `Publicacion.org`: es la llave que une las dos cosas. */
  nombre: string;
  /** Fundación, Junta de acción comunal, Cuerpo de socorro… */
  tipo: string;
  clase: ClaseEntidad;
  verificada: boolean;
  /** La ciudad (id de `data/colombiaCities.ts`); sin ella, Bogotá (`utils/lugares.ts`). */
  ciudad?: string;
  zona: string;
  lat: number;
  lng: number;
  dir: string;
  tel: string;
  /** El teléfono también recibe WhatsApp. */
  wa: boolean;
  correo?: string;
  /** Solo comunidades: quién lidera, con su cargo. */
  lider?: string;
  personas?: number;
  familias?: number;
  /** Solo organizaciones: entregas confirmadas desde que están en la red. */
  entregas: number;
}

export type OrdenDirectorio = 'cercania' | 'cifra';

/** La consulta del directorio: una sola fuente de verdad para la hoja, los chips y la lista. */
export interface ConsultaDirectorio {
  texto: string;
  /** Ids de ciudad (`data/colombiaCities.ts`); vacío = todas las ciudades (`utils/lugares.ts`). */
  ciudades: string[];
  recursos: string[];
  verificadas: boolean;
  orden: OrdenDirectorio;
}

/** El estado de una comunidad, derivado del avance real de lo que pidió (vocabulario cerrado
 *  del manual §7). Las organizaciones no llevan estado (Alejandro, 14 de septiembre de 2026). */
export type EstadoComunidad = 'inicial' | 'proceso' | 'completo';
