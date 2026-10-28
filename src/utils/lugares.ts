/**
 * El lugar en la maqueta (lógica pura, sin React): la ciudad como filtro, con la lógica de la
 * herramienta productiva (`components/CityCombobox.tsx`, `App.tsx`): «Cerca de mí» detecta la
 * ciudad y ordena por distancia; las ciudades van agrupadas por departamento, que agrupa y
 * responde al buscador. A diferencia de producción se eligen **varias** ciudades con casillas,
 * el departamento marca todas las suyas y «Seleccionar todo» marca todas (Alejandro, 21 de
 * septiembre de 2026); una lista vacía es «todas las ciudades», sin nombrar el país, para que
 * escale a otros territorios: nada aquí sabe de Colombia salvo el dataset que se le pasa.
 * Sin búsqueda, solo aparecen las ciudades con publicaciones, con su conteo. Reutiliza el
 * dataset de producción (`data/colombiaCities.ts`) en vez de crear otro.
 */
import { ALL_CITIES, DEPARTMENTS, detectCityFromCoords, findCityById, findDepartmentByCityId, getCityCoordinates, type ColombiaCity } from '../data/colombiaCities';
import { TAXONOMIA } from '../mocks/publicacionesMock';
import type { Ubicacion } from '../types/publicacion';

/** Los datos de la maqueta nacieron en Bogotá: lo que no dice ciudad, es de Bogotá. */
export const CIUDAD_POR_DEFECTO = 'bogota';

/** La ciudad (id) de una publicación o entidad. */
export function ciudadDe(x: { ciudad?: string }): string {
  const c = x.ciudad && x.ciudad !== 'todo-colombia' && x.ciudad !== 'all_colombia' ? x.ciudad : undefined;
  if (c === 'bogota-d-c') return 'bogota';
  return c ?? CIUDAD_POR_DEFECTO;
}

/** ¿Pasa el filtro de ciudades? Vacío es todas. */
export function enCiudades(x: { ciudad?: string }, ciudades: string[]): boolean {
  return ciudades.length === 0 || ciudades.includes(ciudadDe(x));
}

/** «Bogotá, Cundinamarca». */
export function nombreCiudad(id: string): string {
  const ciudad = findCityById(id);
  if (!ciudad) return id;
  const depto = findDepartmentByCityId(id);
  return depto ? `${ciudad.name}, ${depto.name}` : ciudad.name;
}

/** Solo el nombre de la ciudad, para chips y textos cortos. */
export function nombreCorto(id: string): string {
  return findCityById(id)?.name ?? id;
}

/** Lo que dice el campo cerrado: «Todas las ciudades», «Cali», «Bogotá y Cali», «Bogotá, Cali y 2 más». */
export function nombreCiudades(ciudades: string[]): string {
  const nombres = ciudades.map(nombreCorto);
  if (nombres.length === 0) return 'Todas las ciudades';
  if (nombres.length === 1) return nombres[0];
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres[0]}, ${nombres[1]} y ${nombres.length - 2} más`;
}

/** La ciudad de la persona: la que ya se sabe o, como el GPS en producción, la que sale de
 *  sus coordenadas. Si ninguna ciudad conocida queda cerca, no hay ciudad. */
export function ciudadDeUbicacion(u: Ubicacion): string | null {
  return u.ciudad ?? detectCityFromCoords(u.lat, u.lng)?.id ?? null;
}

/** Cuántas cosas hay por ciudad. */
export function conteoPorCiudad(cosas: { ciudad?: string }[]): Map<string, number> {
  const c = new Map<string, number>();
  cosas.forEach((x) => c.set(ciudadDe(x), (c.get(ciudadDe(x)) ?? 0) + 1));
  return c;
}

export interface GrupoCiudades {
  departamento: string;
  ciudades: { id: string; nombre: string; n: number }[];
}

/** Las ciudades para elegir, agrupadas por departamento. Sin búsqueda, solo las que tienen
 *  algo; con búsqueda, las que coinciden por nombre de ciudad o de departamento. */
export function gruposDeCiudades(conteos: Map<string, number>, busqueda = ''): GrupoCiudades[] {
  const q = normalizar(busqueda);
  const grupos: GrupoCiudades[] = [];
  for (const depto of DEPARTMENTS) {
    const enDepto = normalizar(depto.name).includes(q);
    const ciudades = depto.cities
      .filter((c) => (q ? enDepto || normalizar(c.name).includes(q) : (conteos.get(c.id) ?? 0) > 0))
      .map((c) => ({ id: c.id, nombre: c.name, n: conteos.get(c.id) ?? 0 }));
    if (ciudades.length) grupos.push({ departamento: depto.name, ciudades });
  }
  return grupos;
}

/** Marcar o desmarcar un conjunto de ciudades dentro de la selección. */
export function alternarCiudades(seleccion: string[], ids: string[], marcar: boolean): string[] {
  if (marcar) return [...seleccion, ...ids.filter((id) => !seleccion.includes(id))];
  return seleccion.filter((id) => !ids.includes(id));
}

const ALIASES: Record<string, string> = {
  'bogota-d-c': 'bogota',
  'bogota-dc': 'bogota',
  'cartagena': 'cartagena-de-indias',
};

/** Busca si un término de búsqueda coincide exactamente con una ciudad colombiana */
export function buscarCiudadCoincidente(termino: string): { ciudad: ColombiaCity; coords: { lat: number; lng: number } } | null {
  if (!termino || termino.trim().length < 2) return null;
  const q = normalizar(termino);
  const slug = q.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slugEfectivo = ALIASES[slug] || slug;

  let encontrada = ALL_CITIES.find((c) => c.id === slugEfectivo || normalizar(c.name) === q);

  if (!encontrada && q.length >= 4) {
    encontrada = ALL_CITIES.find((c) => normalizar(c.name) === q || c.id === slug);
  }

  if (encontrada) {
    const coords = getCityCoordinates(encontrada.id, encontrada.departmentId);
    return { ciudad: encontrada, coords };
  }
  return null;
}

/** Devuelve sugerencias de ciudades colombianas para el autocompletado del buscador */
export function sugerenciasDeUbicacion(termino: string, limite = 4): { id: string; nombre: string; depto: string; lat: number; lng: number }[] {
  if (!termino || termino.trim().length < 2) return [];
  const q = normalizar(termino);
  const slug = q.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slugEfectivo = ALIASES[slug] || slug;

  const resultados: { id: string; nombre: string; depto: string; lat: number; lng: number }[] = [];
  const vistos = new Set<string>();

  // 1. Coincidencia por inicio del nombre o id
  for (const c of ALL_CITIES) {
    if (resultados.length >= limite) break;
    const norm = normalizar(c.name);
    if (c.id === slugEfectivo || norm.startsWith(q) || norm === q) {
      if (!vistos.has(c.id)) {
        vistos.add(c.id);
        const depto = findDepartmentByCityId(c.id, c.departmentId)?.name || '';
        const coords = getCityCoordinates(c.id, c.departmentId);
        resultados.push({ id: c.id, nombre: c.name, depto, lat: coords.lat, lng: coords.lng });
      }
    }
  }

  // 2. Coincidencia por inclusión dentro del nombre
  if (resultados.length < limite) {
    for (const c of ALL_CITIES) {
      if (resultados.length >= limite) break;
      const norm = normalizar(c.name);
      if (norm.includes(q) && !vistos.has(c.id)) {
        vistos.add(c.id);
        const depto = findDepartmentByCityId(c.id, c.departmentId)?.name || '';
        const coords = getCityCoordinates(c.id, c.departmentId);
        resultados.push({ id: c.id, nombre: c.name, depto, lat: coords.lat, lng: coords.lng });
      }
    }
  }

  return resultados;
}

/** Devuelve sugerencias de insumos/recursos de la taxonomía */
export function sugerenciasDeRecursos(termino: string, limite = 3): string[] {
  if (!termino || termino.trim().length < 2) return [];
  const q = normalizar(termino);
  const resultados: string[] = [];
  const vistos = new Set<string>();

  for (const cat of TAXONOMIA) {
    for (const item of cat.items) {
      if (resultados.length >= limite) break;
      const norm = normalizar(item);
      if (norm.includes(q) && !vistos.has(norm)) {
        vistos.add(norm);
        resultados.push(item);
      }
    }
    if (resultados.length >= limite) break;
  }
  return resultados;
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
