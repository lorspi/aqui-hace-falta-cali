/**
 * El motor de coincidencia de RaDAR (Radar Match).
 *
 * Busca y puntúa coincidencias viables entre necesidades y ofertas.
 *
 * Admite 3 modalidades logísticas:
 * 1. Remoto / Virtual (asesorías, telemedicina, apoyo psicosocial, donación económica):
 *    - La distancia física en km es irrelevante (sin barrera geográfica).
 *    - Puntaje base alto (88%) y etiqueta legible «Asistencia virtual».
 * 2. Despachable / Envíos Nacionales (medicamentos, kits, ropa, cobijas, radio 'Todo el país'):
 *    - Conecta municipios y ciudades distantes (ej. Bogotá <-> Cali, Medellín, Mocoa).
 *    - El puntaje decae con la fricción logística (local: 70-98%, regional: 60-85%, nacional: 45-65%).
 *    - Etiqueta «Envío nacional (X km)» o «Regional · a X km».
 * 3. Presencial local estricto (carrotanques, escombros, cocina comunitaria, radio 5-25 km):
 *    - Requiere proximidad física inmediata (radio local de 20 km por defecto).
 */
import type { Publicacion, TipoPublicacion } from '../types/publicacion';
import { distanciaKm, restante } from './publicaciones';

/** Límite estándar para recursos presenciales estrictos sin cobertura ampliada. */
export const CRUCE_KM = 20;

export type AlcanceCoincidencia = 'local' | 'regional' | 'nacional' | 'remoto';

/** Recursos cuya naturaleza permite atención remota, telefónica o digital */
export const RECURSOS_VIRTUALES = new Set([
  'Salud mental y apoyo psicosocial',
  'Asesoría legal y jurídica',
  'Auditoría, contabilidad y finanzas',
  'Ingeniería, arquitectura y peritaje',
  'Evaluación estructural y técnica',
  'Geología, geotecnia y gestión del riesgo',
  'Aporte económico / Donación en dinero',
]);

/** Recursos físicos transportables y despachables entre ciudades por paquetería o corredor */
export const RECURSOS_DESPACHABLES = new Set([
  'Medicamentos / Botiquín',
  'Cobijas y colchonetas',
  'Ropa y calzado',
  'Implementos de aseo e higiene',
  'Alimentos',
  'Protección respiratoria',
  'Herramientas de mano',
  'Plantas eléctricas / Generadores',
  'Equipos de bombeo',
  'Cuidado y alimento de animales',
]);

/** Determina si una coincidencia entre dos publicaciones califica como remota / virtual */
export function esVirtual(pub: Publicacion, otro: Publicacion, item: string): boolean {
  if (pub.modoEntrega === 'remoto' || otro.modoEntrega === 'remoto') return true;
  const texto = `${pub.comoEntrega ?? ''} ${otro.comoEntrega ?? ''}`.toLowerCase();
  if (texto.includes('remoto') || texto.includes('virtual') || texto.includes('videollamada')) return true;
  return RECURSOS_VIRTUALES.has(item);
}

/** Verifica si la publicación declaró cobertura a todo el país o admite envíos */
export function admiteNacional(p: Publicacion): boolean {
  if (p.radio === 'Todo el país') return true;
  const texto = `${p.comoEntrega ?? ''} ${p.descripcion ?? ''}`.toLowerCase();
  return texto.includes('todo el país') || texto.includes('nacional') || texto.includes('envío a todo el país') || texto.includes('envio');
}

/** Convierte el radio de texto declarado en kilómetros numéricos máximos */
export function radioMaximoKm(p: Publicacion): number | null {
  if (p.radio === 'Todo el país') return 1200;
  if (p.radio === '5 km') return 5;
  if (p.radio === '10 km') return 10;
  if (p.radio === '25 km') return 25;
  if (p.radio === '50 km') return 50;
  return null;
}

/**
 * Valida la viabilidad de cruce entre dos publicaciones para un recurso determinado.
 */
export function esViableCruce(pub: Publicacion, otro: Publicacion, item: string, km: number): boolean {
  // 1. Remoto / Virtual siempre es viable geográficamente
  if (esVirtual(pub, otro, item)) return true;

  // 2. Cobertura explícita 'Todo el país' o envío nacional
  if (admiteNacional(pub) || admiteNacional(otro)) return true;

  // 3. Si alguna de las publicaciones definió un radio de cobertura explícito
  const rOtro = radioMaximoKm(otro);
  const rPub = radioMaximoKm(pub);
  if (rOtro !== null) return km <= rOtro;
  if (rPub !== null) return km <= rPub;

  // 4. Si el recurso es físicamente transportable / despachable a nivel nacional
  if (RECURSOS_DESPACHABLES.has(item)) {
    if (pub.modoEntrega !== 'sitio' && otro.modoEntrega !== 'sitio') {
      return true; // Se permite despacho intermunicipal con puntaje ajustado
    }
  }

  // 5. Presencial local estricto (ej. carrotanque de agua, maquinaria de escombros, comida caliente)
  return km <= CRUCE_KM;
}

/** Determina la clasificación de alcance según la distancia y naturaleza */
export function resolverAlcance(pub: Publicacion, otro: Publicacion, km: number, item?: string): AlcanceCoincidencia {
  if (item && esVirtual(pub, otro, item)) return 'remoto';
  if (pub.modoEntrega === 'remoto' || otro.modoEntrega === 'remoto') return 'remoto';
  if (km <= CRUCE_KM) return 'local';
  if (km <= 100) return 'regional';
  return 'nacional';
}

/** Genera la etiqueta descriptiva para la tarjeta de sugerencia */
export function etiquetaAlcance(alcance: AlcanceCoincidencia, km: number): string {
  if (alcance === 'remoto') return 'Asistencia virtual';
  if (alcance === 'local') return km < 1 ? 'a menos de 1 km' : `a ${Math.round(km * 10) / 10} km`;
  if (alcance === 'regional') return `Regional · a ${Math.round(km)} km`;
  return `Envío nacional (${Math.round(km)} km)`;
}

export interface Coincidencia {
  id: string;
  org: string;
  verificada: boolean;
  km: number;
  cantidad: number;
  alcance: AlcanceCoincidencia;
  etiquetaAlcance: string;
}

export interface Sugerencia {
  item: string;
  unidad: string;
  pendiente: number;
  otros: Coincidencia[];
}

/** Compara dos nombres de recursos tolerando variaciones léxicas (ej. Planta eléctrica vs Plantas eléctricas / Generadores) */
export function coincideItem(itemA: string, itemB: string): boolean {
  if (itemA === itemB) return true;
  const a = itemA.toLowerCase().trim();
  const b = itemB.toLowerCase().trim();
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

/** Compara unidades tolerando plurales y términos genéricos equivalentes */
export function coincideUnidad(uA: string, uB: string): boolean {
  if (uA === uB) return true;
  const a = uA.toLowerCase().trim().replace(/es$/, '').replace(/s$/, '');
  const b = uB.toLowerCase().trim().replace(/es$/, '').replace(/s$/, '');
  if (a === b) return true;
  const genericas = ['unidad', 'planta', 'motobomba', 'kit', 'juego', 'l'];
  return genericas.some((g) => a.includes(g)) && genericas.some((g) => b.includes(g));
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
          const km = distanciaKm(pub, o);
          if (!esViableCruce(pub, o, r.item, km)) return false;
          return o.recursos.some((x) => coincideItem(x.item, r.item) && coincideUnidad(x.unidad, r.unidad) && restante(x) > 0);
        })
        .map((o) => {
          const suyo = o.recursos.find((x) => coincideItem(x.item, r.item) && coincideUnidad(x.unidad, r.unidad))!;
          const km = distanciaKm(pub, o);
          const alcance = resolverAlcance(pub, o, km, r.item);
          return {
            id: o.id,
            org: o.org || o.titulo,
            verificada: Boolean(o.verificada),
            km,
            cantidad: restante(suyo),
            alcance,
            etiquetaAlcance: etiquetaAlcance(alcance, km),
          };
        })
        .sort((a, b) => {
          if (a.alcance === 'remoto' && b.alcance !== 'remoto') return -1;
          if (b.alcance === 'remoto' && a.alcance !== 'remoto') return 1;
          return a.km - b.km;
        });
      if (!otros.length) return null;
      return { item: r.item, unidad: r.unidad, pendiente, otros };
    })
    .filter((s): s is Sugerencia => s !== null);
}

export function sugerenciasDe(pub: Publicacion, todas: Publicacion[]): Sugerencia[] {
  return cruzar(pub, todas, pub.tipo === 'necesidad' ? 'oferta' : 'necesidad');
}

/** «2 organizaciones cerca ofrecen agua potable» · «1 organización cerca necesita 2 de los recursos que ofreces». */
export function textoSugerencia(sug: Sugerencia[], tipo: TipoPublicacion): string {
  if (!sug.length) return '';
  const orgs = new Set<string>();
  sug.forEach((s) => s.otros.forEach((o) => orgs.add(o.id)));
  const cuantas = orgs.size;
  const una = cuantas === 1;
  const quien = una ? '1 organización' : `${cuantas} organizaciones`;
  const verbo = tipo === 'necesidad' ? (una ? 'ofrece' : 'ofrecen') : una ? 'necesita' : 'necesitan';
  if (sug.length === 1) return `${quien} ${verbo} ${sug[0].item.toLowerCase()}`;
  return `${quien} ${verbo} ${sug.length} de los recursos que ${tipo === 'necesidad' ? 'te faltan' : 'ofreces'}`;
}

export interface CoincidenciaPublicacion {
  id: string;
  org: string;
  verificada: boolean;
  km: number;
  /** Los recursos en común, con lo que la otra parte tiene o le falta. */
  recursos: { item: string; unidad: string; cantidad: number }[];
  /** 40–98. */
  puntaje: number;
  alcance: AlcanceCoincidencia;
  etiquetaAlcance: string;
}

/**
 * Calcula el puntaje de coincidencia ponderado:
 * - Remoto / Virtual: 88% base (+8% por cada recurso adicional, tope 98%)
 * - Local (<= 20 km): 70% base (+15% si <=5 km, +10% si <=10 km, +5% si <=20 km, +8% multirrecurso, tope 98%)
 * - Regional (20 a 100 km): 60% base (+8% si <=50 km, +4% si <=100 km, +6% multirrecurso, tope 85%)
 * - Nacional (> 100 km, ej. Bogotá <-> Cali): 45% base (+5% si <=400 km, +5% multirrecurso, tope 65%)
 */
export function puntajeCoincidencia(km: number, recursosEnComun: number, alcance?: AlcanceCoincidencia): number {
  const calcAlcance = alcance ?? (km <= CRUCE_KM ? 'local' : km <= 100 ? 'regional' : 'nacional');
  const bonoMulti = (recursosEnComun - 1) * 8;

  if (calcAlcance === 'remoto') {
    return Math.min(98, 88 + bonoMulti);
  }
  if (calcAlcance === 'local') {
    const cercania = km <= 5 ? 15 : km <= 10 ? 10 : km <= CRUCE_KM ? 5 : 0;
    return Math.min(98, 70 + cercania + bonoMulti);
  }
  if (calcAlcance === 'regional') {
    const cercania = km <= 50 ? 8 : 4;
    return Math.min(85, 60 + cercania + (recursosEnComun - 1) * 6);
  }
  // calcAlcance === 'nacional'
  const cercania = km <= 400 ? 5 : 0;
  return Math.min(65, 45 + cercania + (recursosEnComun - 1) * 5);
}

/** Hasta `tope` publicaciones que coinciden con la que se acaba de publicar, de mayor a menor puntaje */
export function coincidenciasDe(pub: Publicacion, todas: Publicacion[], tope = 5): CoincidenciaPublicacion[] {
  const porId = new Map<
    string,
    {
      id: string;
      org: string;
      verificada: boolean;
      km: number;
      recursos: { item: string; unidad: string; cantidad: number }[];
      alcance: AlcanceCoincidencia;
    }
  >();

  sugerenciasDe(pub, todas).forEach((s) => {
    s.otros.forEach((o) => {
      const c = porId.get(o.id) ?? {
        id: o.id,
        org: o.org,
        verificada: o.verificada,
        km: o.km,
        recursos: [],
        alcance: o.alcance ?? 'local',
      };
      c.recursos.push({ item: s.item, unidad: s.unidad, cantidad: o.cantidad });
      porId.set(o.id, c);
    });
  });

  const ordenadas = [...porId.values()]
    .map((c) => {
      const puntaje = puntajeCoincidencia(c.km, c.recursos.length, c.alcance);
      return {
        ...c,
        puntaje,
        etiquetaAlcance: etiquetaAlcance(c.alcance, c.km),
      };
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.km - b.km);

  const seleccionadas: CoincidenciaPublicacion[] & { total?: number } = ordenadas.slice(0, tope);
  seleccionadas.total = ordenadas.length;
  return seleccionadas;
}
