/**
 * Un predicado para tarjetas y pines (lógica pura, sin React). Origen: `filtros.js` del
 * prototipo. Decide sobre una publicación y lo consultan por igual la lista y el mapa. Los
 * conteos del segmentado cuentan, por tipo, las publicaciones que pasan todos los demás
 * filtros; ninguna cifra se escribe a mano. En la maqueta los recursos sí filtran (los
 * nombres coinciden con `recursos[].item`), a diferencia del prototipo.
 */
import type { Publicacion, TipoPublicacion, Ubicacion } from '../types/publicacion';
import { enCiudades, nombreCiudades, nombreCorto } from './lugares';
import { distanciaKm, estadoPublicacion, type EstadoPublicacion } from './publicaciones';

export type Orden = 'falta' | 'cerca' | 'reciente';

export interface Filtros {
  /** Ids de ciudad (`data/colombiaCities.ts`); vacío = todas las ciudades (`utils/lugares.ts`). */
  ciudades: string[];
  /** km desde la ubicación de la persona; null = cualquier distancia. Complementa el orden
   *  «Más cerca» (Alejandro, 21 de septiembre de 2026): solo se elige con ese orden, y al
   *  cambiar de orden se apaga. */
  distancia: number | null;
  recursos: string[];
  estados: EstadoPublicacion[];
  verificadas: boolean;
  orden: Orden;
}

export const DISTANCIAS: { km: number | null; etiqueta: string; chip: string }[] = [
  { km: null, etiqueta: 'Cualquiera', chip: 'Cualquier distancia' },
  { km: 2, etiqueta: '2 km', chip: 'A menos de 2 km' },
  { km: 5, etiqueta: '5 km', chip: 'A menos de 5 km' },
  { km: 10, etiqueta: '10 km', chip: 'A menos de 10 km' },
  { km: 25, etiqueta: '25 km', chip: 'A menos de 25 km' },
];

export const ESTADOS: { id: EstadoPublicacion; etiqueta: string }[] = [
  { id: 'inicial', etiqueta: 'Sin iniciar' },
  { id: 'proceso', etiqueta: 'En proceso' },
  { id: 'cubierta', etiqueta: 'Cubierta' },
];

export const ORDENES: { id: Orden; etiqueta: string }[] = [
  { id: 'falta', etiqueta: 'Donde más falta' },
  { id: 'cerca', etiqueta: 'Más cerca' },
  { id: 'reciente', etiqueta: 'Más reciente' },
];

export function filtrosVacios(): Filtros {
  return { ciudades: [], distancia: null, recursos: [], estados: [], verificadas: false, orden: 'falta' };
}

/** Cambiar el orden: el radio en km solo vive con «Más cerca». */
export function conOrden(f: Filtros, orden: Orden): Filtros {
  return { ...f, orden, distancia: orden === 'cerca' ? f.distancia : null };
}

/** Elegir un radio en km enciende «Más cerca» si no estaba. */
export function conDistancia(f: Filtros, km: number | null): Filtros {
  return { ...f, distancia: km, orden: km === null ? f.orden : 'cerca' };
}

function textosDe(p: Publicacion): string[] {
  return [p.titulo, p.org, p.zona, p.localidad, p.dir, ...p.recursos.map((r) => r.item)].filter(Boolean).map((s) => String(s).toLowerCase());
}

/** Todo menos el tipo: es lo que cuentan los tres números del segmentado. */
export function pasaResto(p: Publicacion, f: Filtros, ubicacion: Ubicacion, busqueda: string): boolean {
  if (!enCiudades(p, f.ciudades)) return false;
  if (f.distancia !== null && !(distanciaKm(ubicacion, p) < f.distancia)) return false;
  if (f.recursos.length && !p.recursos.some((r) => f.recursos.includes(r.item))) return false;
  if (f.estados.length && !f.estados.includes(estadoPublicacion(p))) return false;
  if (f.verificadas && !p.verificada) return false;
  const q = busqueda.trim().toLowerCase();
  if (q && !textosDe(p).some((s) => s.includes(q))) return false;
  return true;
}

export function pasa(p: Publicacion, tipo: 'todo' | TipoPublicacion, f: Filtros, ubicacion: Ubicacion, busqueda: string): boolean {
  if (tipo !== 'todo' && p.tipo !== tipo) return false;
  return pasaResto(p, f, ubicacion, busqueda);
}

/** Cuántos filtros hay aplicados (los que no son el valor por defecto). */
export function cuantosAplicados(f: Filtros): number {
  return f.ciudades.length + (f.distancia !== null ? 1 : 0) + f.recursos.length + f.estados.length + (f.verificadas ? 1 : 0) + (f.orden !== 'falta' ? 1 : 0);
}

export interface Chip {
  clave: string;
  texto: string;
  quitar: (f: Filtros) => Filtros;
}

export interface Vacio {
  titulo: string;
  texto: string;
  accion: string;
  aflojar: (f: Filtros) => Filtros;
}

/** Qué decir cuando no queda nada: en vez de un consejo genérico, nombra el filtro que más
 *  acota y ofrece soltar ese, de lo más estrecho a lo más ancho (la búsqueda, luego el radio,
 *  luego la ciudad, y si no, todo). */
export function vacioDe(f: Filtros, busqueda = ''): Vacio {
  const q = busqueda.trim();
  if (q) return { titulo: `Nada para «${q}»`, texto: 'Prueba con otra palabra, o quita la búsqueda y filtra por recurso.', accion: 'Quitar la búsqueda', aflojar: (x) => x };
  if (f.distancia !== null) return { titulo: `Nada a menos de ${f.distancia} km`, texto: 'Lo que hace falta puede estar un poco más lejos.', accion: 'Quitar la distancia', aflojar: (x) => ({ ...x, distancia: null }) };
  if (f.ciudades.length) return { titulo: `Nada en ${nombreCiudades(f.ciudades)}`, texto: 'Todavía nadie publicó aquí con estos filtros.', accion: 'Ver todas las ciudades', aflojar: (x) => ({ ...x, ciudades: [] }) };
  return { titulo: 'Nada con estos filtros', texto: 'Prueba con menos filtros.', accion: 'Quitar los filtros', aflojar: () => filtrosVacios() };
}

/** Los chips de lo aplicado, en el orden de la hoja, cada uno con cómo quitarse. Un chip por
 *  ciudad, con solo su nombre; la de la persona es un filtro común y se quita como cualquiera
 *  (plan T2, 2.4). */
export function chipsDe(f: Filtros): Chip[] {
  const chips: Chip[] = [];
  f.ciudades.forEach((c) => chips.push({ clave: `ciudad:${c}`, texto: nombreCorto(c), quitar: (x) => ({ ...x, ciudades: x.ciudades.filter((y) => y !== c) }) }));
  if (f.distancia !== null) {
    const d = DISTANCIAS.find((x) => x.km === f.distancia);
    chips.push({ clave: 'dist', texto: d?.chip ?? `A menos de ${f.distancia} km`, quitar: (x) => ({ ...x, distancia: null }) });
  }
  f.recursos.forEach((r) => chips.push({ clave: `recurso:${r}`, texto: r, quitar: (x) => ({ ...x, recursos: x.recursos.filter((y) => y !== r) }) }));
  f.estados.forEach((e) => chips.push({ clave: `estado:${e}`, texto: ESTADOS.find((x) => x.id === e)?.etiqueta ?? e, quitar: (x) => ({ ...x, estados: x.estados.filter((y) => y !== e) }) }));
  if (f.verificadas) chips.push({ clave: 'verificadas', texto: 'Solo verificadas', quitar: (x) => ({ ...x, verificadas: false }) });
  if (f.orden !== 'falta') chips.push({ clave: 'orden', texto: ORDENES.find((x) => x.id === f.orden)?.etiqueta ?? f.orden, quitar: (x) => ({ ...x, orden: 'falta' }) });
  return chips;
}

/** «Donde más falta» = menos avance primero; «Más cerca» = por distancia; «Más reciente» =
 *  el orden de los datos (no hay fecha de publicación en la maqueta). */
export function ordenar(pubs: Publicacion[], orden: Orden, ubicacion: Ubicacion): Publicacion[] {
  /* Lo propio va primero siempre: la persona ve lo suyo arriba (como en el prototipo). */
  const copia = [...pubs].sort((a, b) => Number(!!b.propia) - Number(!!a.propia));
  if (orden === 'cerca') return copia.sort((a, b) => Number(!!b.propia) - Number(!!a.propia) || distanciaKm(ubicacion, a) - distanciaKm(ubicacion, b));
  if (orden === 'falta') {
    const avance = (p: Publicacion) => {
      const n = p.recursos.length || 1;
      return p.recursos.reduce((t, r) => t + (r.total ? (r.total - Math.max(0, r.total - r.tramos.reduce((s, x) => s + x.cant, 0))) / r.total : 0), 0) / n;
    };
    return copia.sort((a, b) => Number(!!b.propia) - Number(!!a.propia) || avance(a) - avance(b));
  }
  return copia;
}
