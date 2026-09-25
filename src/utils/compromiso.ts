/**
 * Lo que se comprometió o se solicitó desde el diálogo de compromiso, y cómo se dice.
 * Vive fuera del componente para poder probarlo: `vitest` corre en `environment: node` y no
 * monta React (auditoría del 22 de septiembre de 2026).
 */
import type { TipoPublicacion } from '../types/publicacion';
import { cifra, unidad } from './publicaciones';
import { numero } from './equivalencias';

export interface ParteCompromiso {
  item: string;
  cantidad: number;
  unidad: string;
}

export interface Compromiso {
  /** Qué y cuánto, para decirlo en el aviso y, con backend, para descontarlo. Una entrada por
   *  recurso marcado: `partes.length` es lo que antes se enviaba suelto como `recursos`. */
  partes: ParteCompromiso[];
  cuando?: string;
  recursos?: number;
}

/** Lo comprometido, dicho en una línea para el aviso: «450 L de agua potable y 20 kits de
 *  alimentos». Con «y» y con comas, nunca con punto medio. De tres en adelante se resume, que
 *  un aviso no es un inventario. Dentro de una necesidad cada recurso es una **solicitud** y
 *  dentro de una oferta es un **recurso** (vocabulario del manual, §7). */
export function textoCompromiso(partes: ParteCompromiso[], tipo: TipoPublicacion): string {
  const uno = (x: ParteCompromiso) => `${cifra(x.cantidad)} ${unidad(x.cantidad, x.unidad)} de ${x.item.toLowerCase()}`;
  if (partes.length === 0) return '';
  if (partes.length === 1) return uno(partes[0]);
  if (partes.length === 2) return `${uno(partes[0])} y ${uno(partes[1])}`;
  const resto = partes.length - 1;
  const que = tipo === 'necesidad' ? 'solicitudes' : 'recursos';
  return `${uno(partes[0])} y ${resto} ${que} más`;
}

/** El aviso de que ya está hecho. En verbo y con RaDAR en primera persona del plural, no en
 *  pasiva impersonal («Compromiso enviado a…»): el manual lo pide en el §2 y el §8 lo muestra
 *  con el aviso de publicar. Una sola frase: «Listo, avisamos a X» era una segunda frase que
 *  repetía lo que el diálogo acaba de decir (Alejandro, 24 de septiembre de 2026: en un aviso
 *  de 3,6 segundos cada palabra tiene que ganarse el sitio). Quedan quién y qué, que es lo que
 *  no está en ninguna otra parte de la pantalla. Los verbos son los del manual (§7):
 *  «comprometerse» dentro de una necesidad, «solicitar» dentro de una oferta. */
export function avisoCompromiso(org: string, tipo: TipoPublicacion, c: Compromiso): string {
  const que = textoCompromiso(c.partes, tipo);
  if (tipo === 'necesidad') return `Listo, te comprometiste con ${que} para ${org}`;
  return `Listo, le solicitaste ${que} a ${org}`;
}

/** Lo que vale de verdad lo escrito en el campo: nunca más de lo que falta, nunca cero ni
 *  basura. Sin número legible, se entiende que va por todo lo que falta. */
export function cantidadDe(escrito: string, queda: number): number {
  const n = numero(escrito);
  if (!Number.isFinite(n) || n <= 0) return queda;
  return Math.min(n, queda);
}

