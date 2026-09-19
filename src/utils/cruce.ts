/**
 * El cruce de RaDAR (lógica pura). Origen: `cruce.js` del prototipo. Para cada recurso que
 * todavía falta en una necesidad busca ofertas cercanas con ese mismo recurso disponible (y
 * al revés). Reglas: mismo ítem y unidad; solo lo que queda; otra organización; a menos de
 * 20 km; de más cerca a más lejos. La sugerencia lleva a ver quién, no compromete a nadie.
 */
import type { Publicacion, TipoPublicacion } from '../types/publicacion';
import { distanciaKm, restante } from './publicaciones';

/** Más allá, la sugerencia estorba más de lo que ayuda. */
export const CRUCE_KM = 20;

export interface Coincidencia {
  id: string;
  org: string;
  verificada: boolean;
  km: number;
  cantidad: number;
}

export interface Sugerencia {
  item: string;
  unidad: string;
  pendiente: number;
  otros: Coincidencia[];
}

export function cruzar(pub: Publicacion, todas: Publicacion[], busco: TipoPublicacion): Sugerencia[] {
  return pub.recursos
    .map((r) => {
      const pendiente = restante(r);
      if (pendiente <= 0) return null;
      const otros = todas
        .filter((o) => {
          if (o.tipo !== busco || o.id === pub.id) return false;
          if (o.org && pub.org && o.org === pub.org) return false;
          if (distanciaKm(pub, o) > CRUCE_KM) return false;
          return o.recursos.some((x) => x.item === r.item && x.unidad === r.unidad && restante(x) > 0);
        })
        .map((o) => {
          const suyo = o.recursos.find((x) => x.item === r.item && x.unidad === r.unidad)!;
          return { id: o.id, org: o.org || o.titulo, verificada: Boolean(o.verificada), km: distanciaKm(pub, o), cantidad: restante(suyo) };
        })
        .sort((a, b) => a.km - b.km);
      if (!otros.length) return null;
      return { item: r.item, unidad: r.unidad, pendiente, otros };
    })
    .filter((s): s is Sugerencia => s !== null);
}

export function sugerenciasDe(pub: Publicacion, todas: Publicacion[]): Sugerencia[] {
  return cruzar(pub, todas, pub.tipo === 'necesidad' ? 'oferta' : 'necesidad');
}

/** «2 organizaciones cerca ofrecen agua potable» · «1 organización cerca necesita 2 de los
 *  recursos que ofreces». */
export function textoSugerencia(sug: Sugerencia[], tipo: TipoPublicacion): string {
  if (!sug.length) return '';
  const orgs = new Set<string>();
  sug.forEach((s) => s.otros.forEach((o) => orgs.add(o.id)));
  const cuantas = orgs.size;
  const una = cuantas === 1;
  const quien = una ? '1 organización cerca' : `${cuantas} organizaciones cerca`;
  const verbo = tipo === 'necesidad' ? (una ? 'ofrece' : 'ofrecen') : una ? 'necesita' : 'necesitan';
  if (sug.length === 1) return `${quien} ${verbo} ${sug[0].item.toLowerCase()}`;
  return `${quien} ${verbo} ${sug.length} de los recursos que ${tipo === 'necesidad' ? 'te faltan' : 'ofreces'}`;
}

/* ---------- las coincidencias al publicar (el «Radar Match» de la app real) ----------
   En producción, al publicar se abre un modal con hasta cinco coincidencias, cada una con
   un porcentaje (`fetchMatchingOffersForNeed` en `lib/supabaseService.ts`: 70 + 15 por la
   misma ciudad + 8 por categoría en común, tope 98). Aquí el cruce ya es por recurso y por
   distancia, así que la cifra sale de eso: 70 de base por compartir al menos un recurso,
   hasta 15 por cercanía (a menos de 5 km los 15; hasta 10, 10; hasta 20, 5) y 8 por cada
   recurso más en común, con el mismo tope de 98. Es una cifra de orden, no una promesa. */

export interface CoincidenciaPublicacion {
  id: string;
  org: string;
  verificada: boolean;
  km: number;
  /** Los recursos en común, con lo que la otra parte tiene o le falta. */
  recursos: { item: string; unidad: string; cantidad: number }[];
  /** 70–98. */
  puntaje: number;
}

export function puntajeCoincidencia(km: number, recursosEnComun: number): number {
  const cercania = km <= 5 ? 15 : km <= 10 ? 10 : km <= CRUCE_KM ? 5 : 0;
  return Math.min(98, 70 + cercania + (recursosEnComun - 1) * 8);
}

/** Hasta `tope` publicaciones que coinciden con la que se acaba de publicar, de mayor a
 *  menor puntaje (a igual puntaje, la más cercana primero). */
export function coincidenciasDe(pub: Publicacion, todas: Publicacion[], tope = 5): CoincidenciaPublicacion[] {
  const porId = new Map<string, CoincidenciaPublicacion>();
  sugerenciasDe(pub, todas).forEach((s) => {
    s.otros.forEach((o) => {
      const c = porId.get(o.id) ?? { id: o.id, org: o.org, verificada: o.verificada, km: o.km, recursos: [], puntaje: 0 };
      c.recursos.push({ item: s.item, unidad: s.unidad, cantidad: o.cantidad });
      porId.set(o.id, c);
    });
  });
  return [...porId.values()]
    .map((c) => ({ ...c, puntaje: puntajeCoincidencia(c.km, c.recursos.length) }))
    .sort((a, b) => b.puntaje - a.puntaje || a.km - b.km)
    .slice(0, tope);
}
