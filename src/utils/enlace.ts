/**
 * La consulta en la URL (lógica pura, sin React): lo que alguien ve en la Radar o en el
 * Directorio se puede compartir por un enlace, que es como se coordina de verdad en una
 * emergencia (por WhatsApp). Las dos secciones hablan el mismo vocabulario —`ciudad`,
 * `recurso`, `orden`, `verificadas`, `buscar`, `vista`— para que un parámetro signifique lo
 * mismo en toda la herramienta; `km`, `estado` y `tipo` son de la Radar, que es la única que
 * los tiene.
 *
 * Nada de esto guarda estado: el que lee da los valores por defecto cuando la URL no dice
 * nada, y el que escribe omite todo lo que esté en su valor por defecto, para que un enlace
 * sin filtros sea una URL limpia.
 */
import type { ConsultaDirectorio, OrdenDirectorio } from '../types/directorio';
import type { TipoPublicacion } from '../types/publicacion';
import { consultaVacia } from './directorio';
import { DISTANCIAS, ORDENES, filtrosVacios, type Filtros, type Orden } from './filtros';
import type { EstadoPublicacion } from './publicaciones';

export type TipoRadar = 'todo' | TipoPublicacion;
export type VistaRadar = 'mapa' | 'lista';

const ESTADOS_VALIDOS: EstadoPublicacion[] = ['inicial', 'proceso', 'cubierta'];

/** Una lista en la URL: `cali,bogota`. Vacía, no se escribe. */
function lista(v: string | null): string[] {
  return (v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function poner(p: URLSearchParams, clave: string, valor: string | string[] | boolean | number | null): void {
  if (valor === null || valor === false || valor === '' || (Array.isArray(valor) && valor.length === 0)) return;
  p.set(clave, valor === true ? '1' : Array.isArray(valor) ? valor.join(',') : String(valor));
}

/* ---------- la Radar ---------- */

export interface ConsultaRadar {
  filtros: Filtros;
  tipo: TipoRadar;
  busqueda: string;
  vista: VistaRadar;
}

export function paramsDeRadar({ filtros: f, tipo, busqueda, vista }: ConsultaRadar): URLSearchParams {
  const p = new URLSearchParams();
  poner(p, 'ciudad', f.ciudades);
  poner(p, 'km', f.distancia);
  poner(p, 'recurso', f.recursos);
  poner(p, 'estado', f.estados);
  poner(p, 'verificadas', f.verificadas);
  if (f.orden !== 'falta') poner(p, 'orden', f.orden);
  if (tipo !== 'todo') poner(p, 'tipo', tipo);
  poner(p, 'buscar', busqueda.trim());
  if (vista !== 'mapa') poner(p, 'vista', vista);
  return p;
}

export function radarDeParams(p: URLSearchParams): ConsultaRadar {
  const km = Number(p.get('km'));
  const orden = ORDENES.find((o) => o.id === p.get('orden'))?.id;
  const tipo = p.get('tipo');
  const filtros: Filtros = {
    ...filtrosVacios(),
    ciudades: lista(p.get('ciudad')),
    distancia: DISTANCIAS.some((d) => d.km === km) ? km : null,
    recursos: lista(p.get('recurso')),
    estados: lista(p.get('estado')).filter((e): e is EstadoPublicacion => ESTADOS_VALIDOS.includes(e as EstadoPublicacion)),
    verificadas: p.get('verificadas') === '1',
    orden: (orden ?? 'falta') as Orden,
  };
  /* El radio en km solo vive con «Más cerca» (223 y la orden del 21 de septiembre de 2026). */
  if (filtros.orden !== 'cerca') filtros.distancia = null;
  return {
    filtros,
    tipo: tipo === 'necesidad' || tipo === 'oferta' ? tipo : 'todo',
    busqueda: p.get('buscar')?.trim() ?? '',
    vista: p.get('vista') === 'lista' ? 'lista' : 'mapa',
  };
}

/* ---------- el Directorio ---------- */

export interface ConsultaDirectorioUrl {
  consulta: ConsultaDirectorio;
  clase: 'organizacion' | 'comunidad';
}

export function paramsDeDirectorio({ consulta: q, clase }: ConsultaDirectorioUrl): URLSearchParams {
  const p = new URLSearchParams();
  if (clase === 'comunidad') p.set('vista', 'comunidades');
  poner(p, 'ciudad', q.ciudades);
  poner(p, 'recurso', q.recursos);
  poner(p, 'verificadas', q.verificadas);
  if (q.orden !== 'cercania') poner(p, 'orden', q.orden);
  poner(p, 'buscar', q.texto.trim());
  return p;
}

export function directorioDeParams(p: URLSearchParams): ConsultaDirectorioUrl {
  return {
    clase: p.get('vista') === 'comunidades' ? 'comunidad' : 'organizacion',
    consulta: {
      ...consultaVacia(),
      ciudades: lista(p.get('ciudad')),
      recursos: lista(p.get('recurso')),
      verificadas: p.get('verificadas') === '1',
      orden: (p.get('orden') === 'cifra' ? 'cifra' : 'cercania') as OrdenDirectorio,
      texto: p.get('buscar')?.trim() ?? '',
    },
  };
}

/** Deja la URL diciendo lo que se ve, sin ensuciar el historial: el botón «atrás» sigue
 *  saliendo de la sección en vez de deshacer filtro por filtro. `extra` conserva los
 *  parámetros que no son de la consulta (`punto` de la Radar). */
export function escribirUrl(params: URLSearchParams, extra: Record<string, string | null> = {}): void {
  if (typeof window === 'undefined') return;
  Object.entries(extra).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
  const cadena = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${cadena ? `?${cadena}` : ''}${window.location.hash}`);
}

export function paramsActuales(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
}
