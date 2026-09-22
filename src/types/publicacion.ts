/**
 * Contratos de las publicaciones de RaDAR (mockup/*): lo que alguien pide (necesidad) o
 * da (oferta), recurso por recurso, con lo que ya se movió sobre cada total.
 * Origen: `Producto/assets/datos.js` y `taxonomia.js` del prototipo.
 *
 *   tipo      'necesidad' (alguien pide) | 'oferta' (alguien da)
 *   recursos  cada uno con su unidad y su total. En una necesidad el total es la META; en
 *             una oferta, lo que se puso a DISPOSICIÓN.
 *   tramos    lo que ya se movió sobre ese total: 'hecho' = entregado y confirmado;
 *             'camino' = comprometido o en camino, todavía no confirmado. Lo que queda es
 *             total − hecho − camino.
 */
export type TipoPublicacion = 'necesidad' | 'oferta';

export type TipoTramo = 'hecho' | 'camino';

export interface Tramo {
  t: TipoTramo;
  cant: number;
  quien: string;
  cuando: string;
}

export interface Recurso {
  item: string;
  unidad: string;
  total: number;
  tramos: Tramo[];
  /** Pares etiqueta · valor que se muestran bajo el recurso (disponibilidad, cómo se entrega). */
  ficha?: [string, string][];
}

/** Una foto ya publicada (de una publicación o de una entrega): dónde está y quién la subió.
 *  En producción `url` es la URL firmada del almacenamiento; en la maqueta, una ruta local. */
export interface FotoPublicada {
  url: string;
  alt: string;
  quien: string;
  cuando: string;
}

export interface Publicacion {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  org: string;
  verificada: boolean;
  /** La publicó la organización con sesión. */
  propia?: boolean;
  lat: number;
  lng: number;
  /** La ciudad (id de `data/colombiaCities.ts`); sin ella, Bogotá (`utils/lugares.ts`). */
  ciudad?: string;
  zona: string;
  localidad?: string;
  dir?: string;
  descripcion?: string;
  recursos: Recurso[];
  /** Las fotos de la publicación: públicas en el mapa, como en la app real. */
  fotos?: FotoPublicada[];
}

/** Icono del catálogo (Phosphor en el prototipo; aquí se resuelve a Lucide en la vista). */
export type IconoRecurso = 'bowl' | 'stetho' | 'shovel' | 'hammer' | 'truck' | 'package' | 'seal' | 'house' | 'drop' | 'shirt' | 'pill' | 'bolt';

export interface CategoriaRecurso {
  nombre: string;
  items: string[];
  icono: IconoRecurso;
}

/** La ubicación de quien mira. En producción la da el dispositivo; en la maqueta se declara. */
export interface Ubicacion {
  lat: number;
  lng: number;
  /** La ciudad (id de `data/colombiaCities.ts`) si ya se sabe; si no, se detecta por coordenadas. */
  ciudad?: string;
  zona: string;
  simulada: boolean;
}
