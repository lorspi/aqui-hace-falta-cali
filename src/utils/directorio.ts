/**
 * La lógica del Directorio (pura, sin React): qué publica cada entidad, su estado, y la
 * consulta (filtros, orden, chips). Lo que una entidad ofrece o pide sale de sus
 * publicaciones, nunca de un dato aparte: el directorio y la Radar cuentan lo mismo.
 */
import type { ClaseEntidad, ConsultaDirectorio, Entidad, EstadoComunidad } from '../types/directorio';
import type { Publicacion, Ubicacion } from '../types/publicacion';
import { distanciaKm, estadoPublicacion } from './publicaciones';

export function consultaVacia(): ConsultaDirectorio {
  return { texto: '', lugares: [], recursos: [], verificadas: false, orden: 'cercania' };
}

/** Las publicaciones de una entidad, por su nombre. */
export function publicacionesDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return pubs.filter((p) => p.org === e.nombre);
}

export function ofertasDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return publicacionesDe(e, pubs).filter((p) => p.tipo === 'oferta');
}

export function necesidadesDe(e: Entidad, pubs: Publicacion[]): Publicacion[] {
  return publicacionesDe(e, pubs).filter((p) => p.tipo === 'necesidad');
}

/** Los nombres de recurso que una entidad ofrece o pide (para filtrar y buscar). */
export function recursosDe(e: Entidad, pubs: Publicacion[]): string[] {
  return sinDuplicados(publicacionesDe(e, pubs).flatMap((p) => p.recursos.map((r) => r.item)));
}

/** El resumen en números de lo que publica: cuántos recursos ofrece y cuántos pide. El
 *  Directorio es de consulta (Alejandro, 16 de septiembre de 2026): no muestra el detalle ni
 *  deja actuar; para eso está la Radar, filtrada por la organización. */
export function resumenPublica(e: Entidad, pubs: Publicacion[]): { ofrece: number; pide: number } {
  return {
    ofrece: ofertasDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0),
    pide: necesidadesDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0),
  };
}

/** Cuántas solicitudes tiene abiertas una comunidad: un recurso pedido es una solicitud. */
export function solicitudesDe(e: Entidad, pubs: Publicacion[]): number {
  return necesidadesDe(e, pubs).reduce((t, p) => t + p.recursos.length, 0);
}

/** La cifra que compara en la lista: entregas confirmadas (organización) o solicitudes (comunidad). */
export function cifraDe(e: Entidad, pubs: Publicacion[]): { n: number; que: string } {
  if (e.clase === 'comunidad') {
    const n = solicitudesDe(e, pubs);
    return { n, que: n === 1 ? 'solicitud' : 'solicitudes' };
  }
  return { n: e.entregas, que: e.entregas === 1 ? 'entrega confirmada' : 'entregas confirmadas' };
}

/** El estado de una comunidad sale del avance de lo que pidió: nada movido es «Sin iniciar»,
 *  algo entregado o en camino es «En proceso», todo cubierto es «Completado». */
export function estadoComunidad(e: Entidad, pubs: Publicacion[]): EstadoComunidad {
  const nec = necesidadesDe(e, pubs);
  if (nec.length === 0) return 'inicial';
  if (nec.every((p) => estadoPublicacion(p) === 'cubierta')) return 'completo';
  if (nec.some((p) => estadoPublicacion(p) !== 'inicial')) return 'proceso';
  return 'inicial';
}

export const TEXTO_ESTADO: Record<EstadoComunidad, string> = { inicial: 'Sin iniciar', proceso: 'En proceso', completo: 'Completado' };

/** Las entidades de una vista: la propia no sale (uno no se solicita a sí mismo). */
export function entidadesDe(clase: ClaseEntidad, entidades: Entidad[], propia: string): Entidad[] {
  return entidades.filter((e) => e.clase === clase && e.nombre !== propia);
}

export function zonasDe(entidades: Entidad[]): string[] {
  return sinDuplicados(entidades.map((e) => e.zona)).sort((a, b) => a.localeCompare(b, 'es'));
}

export function recursosDeVista(entidades: Entidad[], pubs: Publicacion[]): string[] {
  return sinDuplicados(entidades.flatMap((e) => recursosDe(e, pubs))).sort((a, b) => a.localeCompare(b, 'es'));
}

/** Cada sección de la hoja acota; entre valores de una misma sección, cualquiera vale. */
export function pasa(e: Entidad, pubs: Publicacion[], q: ConsultaDirectorio): boolean {
  if (q.lugares.length && !q.lugares.includes(e.zona)) return false;
  const recs = recursosDe(e, pubs);
  if (q.recursos.length && !q.recursos.some((r) => recs.includes(r))) return false;
  if (q.verificadas && !e.verificada) return false;
  const texto = q.texto.trim().toLowerCase();
  if (texto) {
    const pajar = [e.nombre, e.tipo, e.zona, e.lider ?? '', ...recs].join(' ').toLowerCase();
    if (!pajar.includes(texto)) return false;
  }
  return true;
}

export function filtrar(entidades: Entidad[], pubs: Publicacion[], q: ConsultaDirectorio, ubicacion: Ubicacion): Entidad[] {
  const km = (e: Entidad) => distanciaKm(ubicacion, e);
  return entidades
    .filter((e) => pasa(e, pubs, q))
    .sort((a, b) => {
      if (q.orden === 'cifra') {
        const d = cifraDe(b, pubs).n - cifraDe(a, pubs).n;
        if (d !== 0) return d;
      }
      return km(a) - km(b);
    });
}

export function cuantosAplicados(q: ConsultaDirectorio): number {
  return q.lugares.length + q.recursos.length + (q.verificadas ? 1 : 0) + (q.texto.trim() ? 1 : 0);
}

export interface ChipDirectorio {
  clave: string;
  texto: string;
  quitar: (q: ConsultaDirectorio) => ConsultaDirectorio;
}

/** Los filtros aplicados, en el orden en que se ven como chips (el orden no es chip). */
export function chipsDe(q: ConsultaDirectorio): ChipDirectorio[] {
  const chips: ChipDirectorio[] = [];
  q.lugares.forEach((z) => chips.push({ clave: `lugar:${z}`, texto: z, quitar: (c) => ({ ...c, lugares: c.lugares.filter((x) => x !== z) }) }));
  q.recursos.forEach((r) => chips.push({ clave: `recurso:${r}`, texto: r, quitar: (c) => ({ ...c, recursos: c.recursos.filter((x) => x !== r) }) }));
  if (q.verificadas) chips.push({ clave: 'verificadas', texto: 'Solo verificadas', quitar: (c) => ({ ...c, verificadas: false }) });
  if (q.texto.trim()) chips.push({ clave: 'texto', texto: `“${q.texto.trim()}”`, quitar: (c) => ({ ...c, texto: '' }) });
  return chips;
}

/** Qué dice el conteo de la lista, para la región viva y la cabecera. */
export function conteoTexto(n: number, clase: ClaseEntidad): string {
  if (n === 0) return 'Nada con estos filtros';
  if (clase === 'comunidad') return `${n} ${n === 1 ? 'comunidad' : 'comunidades'}`;
  return `${n} ${n === 1 ? 'organización' : 'organizaciones'}`;
}

function sinDuplicados<T>(lista: T[]): T[] {
  return lista.filter((x, i) => lista.indexOf(x) === i);
}
