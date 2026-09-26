/**
 * Cuentas puras sobre publicaciones y recursos (sin React). Una sola cuenta para todo el
 * producto: el anillo del pin, la barra de cada recurso y las sugerencias del cruce salen de
 * aquí. Origen: `Producto/assets/datos.js` del prototipo de RaDAR.
 */
import type { Publicacion, Recurso, TipoPublicacion, TipoTramo } from '../types/publicacion';

/** Lo que ya se movió de un recurso en un tipo de tramo (hecho o en camino). */
export function movido(recurso: Recurso, tipo: TipoTramo): number {
  return (recurso.tramos || []).reduce((t, x) => (x.t === tipo ? t + x.cant : t), 0);
}

/** Lo que queda: total − hecho − camino, nunca negativo. */
export function restante(recurso: Recurso): number {
  return Math.max(0, recurso.total - movido(recurso, 'hecho') - movido(recurso, 'camino'));
}

/** Porcentaje del anillo y de la barra. Entero: el anillo no distingue décimas. */
export function porcentaje(recurso: Recurso, tipo: TipoTramo): number {
  if (!recurso.total) return 0;
  return Math.round((movido(recurso, tipo) / recurso.total) * 100);
}

/** El anillo del pin resume la publicación entera: promedio simple de sus recursos.
 *  Simple a propósito: ponderar por cantidad mezclaría litros con profesionales. */
export function resumen(p: Publicacion): { hecho: number; camino: number } {
  const n = (p.recursos || []).length;
  if (!n) return { hecho: 0, camino: 0 };
  let h = 0;
  let c = 0;
  p.recursos.forEach((r) => {
    h += porcentaje(r, 'hecho');
    c += porcentaje(r, 'camino');
  });
  return { hecho: Math.round(h / n), camino: Math.round(c / n) };
}

/** Cómo se nombra una cantidad. El singular importa: «falta 1 profesionales» es de las
 *  cosas que hacen desconfiar de una herramienta. */
const SINGULAR: Record<string, string> = {
  kits: 'kit',
  unidades: 'unidad',
  profesionales: 'profesional',
  plantas: 'planta',
  botiquines: 'botiquín',
  viajes: 'viaje',
  cuadrillas: 'cuadrilla',
  personas: 'persona',
  juegos: 'juego',
  evaluaciones: 'evaluación',
  donantes: 'donante',
  máquinas: 'máquina',
  motobombas: 'motobomba',
  tejas: 'teja',
  bultos: 'bulto',
  viviendas: 'vivienda',
  familias: 'familia',
  animales: 'animal',
  días: 'día',
  noches: 'noche',
  raciones: 'ración',
  estudiantes: 'estudiante',
  mudas: 'muda',
};

export function unidad(cant: number, u: string): string {
  return cant === 1 && SINGULAR[u] ? SINGULAR[u] : u;
}

/** Cifras como manda el manual: punto de miles y coma decimal («1.500 L», «4,2 km»). */
export function cifra(n: number): string {
  if (!isFinite(n)) return '';
  const [entero, decimal] = Math.abs(n).toString().split('.');
  return (n < 0 ? '-' : '') + entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (decimal ? `,${decimal}` : '');
}

/** El estado de un recurso, dicho como manda el manual: lo que falta con «faltar», lo
 *  disponible con «quedar», y lo cubierto como «N de M». */
export function estadoRecurso(r: Recurso, tipo: TipoPublicacion): string {
  const queda = restante(r);
  if (queda === 0) return `${cifra(r.total)} de ${cifra(r.total)} ${unidad(r.total, r.unidad)}`;
  const verbo = tipo === 'oferta' ? (queda === 1 ? 'queda' : 'quedan') : queda === 1 ? 'falta' : 'faltan';
  return `${verbo} ${cifra(queda)} ${unidad(queda, r.unidad)}`;
}

/** Distancia en km entre dos puntos (Haversine). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** La distancia a la persona, como manda el manual: «a 4,2 km de tu ubicación», con coma
 *  decimal, y «a 600 m» por debajo del kilómetro. Sin distancia, nada. */
export function distanciaTexto(km: number | null | undefined): string {
  if (km === null || km === undefined || !isFinite(km)) return '';
  const metros = Math.round(km * 1000);
  if (metros < 1000) return `a ${metros} m de tu ubicación`;
  const redondeada = Math.round(km * 10) / 10;
  return `a ${String(redondeada).replace('.', ',')} km de tu ubicación`;
}

/** Iniciales para el avatar: dos letras de la organización. */
export function iniciales(nombre: string): string {
  const partes = nombre.replace(/[·,]/g, ' ').split(/\s+/).filter((p) => p && p.length > 2 && !/^(de|del|la|el|los|las|y)$/i.test(p));
  return (partes.slice(0, 2).map((p) => p[0]).join('') || nombre.slice(0, 2)).toUpperCase();
}

/** Estado de una publicación para el chip: cubierta si todo llegó; en proceso si algo se
 *  movió; sin iniciar si nada. */
export type EstadoPublicacion = 'cubierta' | 'proceso' | 'inicial';
export function estadoPublicacion(p: Publicacion): EstadoPublicacion {
  const r = resumen(p);
  if (p.recursos.length && p.recursos.every((x) => restante(x) === 0 && movido(x, 'camino') === 0)) return 'cubierta';
  if (r.hecho > 0 || r.camino > 0) return 'proceso';
  return 'inicial';
}

/**
 * Determina el nombre del actor o punto territorial visible según el perfil de la cuenta,
 * protegiendo la privacidad y datos personales en el caso de personas naturales / hogares.
 */
export function actorPublicacion(p: Publicacion): string {
  const zona = p.zona || p.localidad || '';

  if (p.perfil === 'individual') {
    if (p.tipo === 'necesidad') {
      return zona ? `Familia en ${zona}` : 'Familia afectada';
    }
    return zona ? `Donante en ${zona}` : 'Donante particular';
  }

  return p.punto?.trim() || p.org?.trim() || p.titulo?.trim() || (p.tipo === 'necesidad' ? (zona ? `Comunidad en ${zona}` : 'Comunidad') : 'Organización');
}

/**
 * Genera el título institucional unificado de una publicación siguiendo la regla canónica:
 * [Bloque de Recursos] · [Bloque de Identidad]
 *
 * 1 recurso: "Agua potable · Albergue Bosa"
 * 2 recursos: "Agua potable y Alimentos · Bomberos Voluntarios Usme"
 * 3 o más: "Alimentos y 4 más · JAC El Recuerdo"
 *
 * Casos individuales (protección de identidad):
 * - "Cobijas y 2 más · Familia en Bosa"
 * - "Ropa y calzado · Donante en Chapinero"
 */
/** El bloque de recursos del título, solo: «Agua potable», «Agua potable y Alimentos»,
 *  «Alimentos y 4 más». Aparte del título porque el globo del mapa pone los recursos y el
 *  actor en líneas distintas, y ahí el título entero no sirve. */
export function recursosPublicacion(p: Publicacion): string {
  const recursos = p.recursos || [];
  if (recursos.length === 0) return p.tipo === 'oferta' ? 'Ayuda disponible' : 'Ayuda requerida';
  if (recursos.length === 1) return recursos[0].item;
  if (recursos.length === 2) return `${recursos[0].item} y ${recursos[1].item}`;
  return `${recursos[0].item} y ${recursos.length - 1} más`;
}

/**
 * El título como **texto plano**: para el nombre accesible del pin, la etiqueta del ⋮, el campo
 * `titulo` del dato y el asunto al compartir. Une con «, de» y no con punto medio, que Alejandro
 * prohibió en toda la herramienta (16 de septiembre de 2026); ahí no cabe un divisor, que es
 * lo que se usa donde el título se pinta (`TituloPublicacion`).
 */
export function tituloPublicacion(p: Publicacion): string {
  return `${recursosPublicacion(p)}, de ${actorPublicacion(p)}`;
}
