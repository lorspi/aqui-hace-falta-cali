/**
 * La conversión de RaDAR (lógica pura, sin React): de lo que se responde por grupo a una meta
 * por recurso, con su fórmula. Origen: `Producto/assets/equivalencias.js`. Las tablas viven
 * en `mocks/equivalenciasMock.ts`.
 */
import { BASES, DETALLE, EQUIV, OFERTA, SIN_META } from '../mocks/equivalenciasMock';
import type { CampoDetalle, Meta, RespuestasDetalle } from '../types/flujo';
import { unidad } from './publicaciones';

/** Los campos que declara una oferta de ese recurso; si no tiene entrada propia, los del
 *  detalle de pedir que no son cantidad. */
export function camposOferta(item: string): CampoDetalle[] {
  if (OFERTA[item]) return OFERTA[item].campos;
  const D = DETALLE[item];
  return D ? D.campos.filter((c) => c.t !== 'num') : [];
}

/** En qué se cuenta la oferta de un recurso. */
export function unidadOferta(item: string): string {
  if (OFERTA[item]?.unidad) return OFERTA[item].unidad as string;
  if (EQUIV[item]) return EQUIV[item].unidad;
  const dec = declarado(item, {});
  return dec ? dec.unidad : 'unidades';
}

/** Texto corto de un conjunto de campos ya respondidos: «Kits de mercado · Hasta agotar». */
export function camposTexto(campos: CampoDetalle[], d: RespuestasDetalle = {}): string {
  const partes: string[] = [];
  campos.forEach((c) => {
    const v = d[c.k];
    if (v == null || v === '' || (c.t === 'multi' && !(v as string[]).length)) return;
    if (c.t === 'multi') partes.push((v as string[]).join(', '));
    else if (c.t === 'una') partes.push(String(v));
    else if (c.t === 'num' && c.k !== 'num') partes.push(`${v} ${c.u ?? ''}`.trim());
    else if (c.t === 'texto') partes.push(String(v));
  });
  return partes.join(', ');
}

/** Texto corto del detalle de un recurso pedido, para el resumen y la tarjeta. */
export function detalleTexto(item: string, det?: RespuestasDetalle): string {
  const D = DETALLE[item];
  return D ? camposTexto(D.campos, det) : '';
}

/** Cantidad declarada de un recurso sin meta (su campo `num`). */
export function declarado(item: string, det?: RespuestasDetalle): { valor: number | undefined; unidad: string } | null {
  const D = DETALLE[item];
  if (!D) return null;
  const campo = D.campos.find((c) => c.k === 'num');
  if (!campo) return null;
  const v = det?.num;
  return { valor: typeof v === 'number' ? v : undefined, unidad: campo.u ?? '' };
}

/** Redondeo de lo que se mide en litros, kilos o metros: nadie pide 0,24 botiquines, pero
 *  108,4 L sí existen. */
export function redondear(n: number): number {
  if (n >= 100) return Math.round(n);
  if (n >= 10) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

const UNIDADES_CONTINUAS = ['L', 'kg', 'm²'];

/** Una meta por recurso pedido, con la fórmula visible. `valores` es lo respondido por base
 *  (`{ personas: 12 }`); `dias`, el período. */
export function calcularMetas(necesidades: string[], valores: Record<string, number>, dias = 1): Meta[] {
  return necesidades.map((item): Meta => {
    if (SIN_META.includes(item)) return { item, meta: null, motivo: 'Esta ayuda no se calcula: la cantidad la declara quien publica.' };
    const eq = EQUIV[item];
    if (!eq) return { item, meta: null, motivo: 'Sin equivalencia definida todavía.' };
    const base = BASES[eq.base];
    const unidadesBase = Number(valores[eq.base]);
    if (!(unidadesBase > 0)) return { item, meta: null, motivo: `Falta responder cuántas ${base.unidad}.` };

    let meta = unidadesBase * eq.cantidad;
    let formula = `${eq.racion}, para ${unidadesBase} ${unidad(unidadesBase, base.unidad)}`;
    if (eq.diario) {
      const textoDias = `, durante ${dias} ${dias === 1 ? 'día' : 'días'}`;
      if (eq.multiplicaDias === false) {
        /* Capacidad sostenida: la misma cuadrilla y la misma gente cada día. */
        formula += textoDias + (dias === 1 ? '' : ' (la misma cantidad cada día)');
      } else {
        meta *= dias;
        formula += textoDias;
      }
    }
    return {
      item,
      meta: UNIDADES_CONTINUAS.includes(eq.unidad) ? redondear(meta) : Math.ceil(meta - 1e-9),
      unidad: eq.unidad,
      formula,
      fuente: eq.fuente,
      porValidar: eq.fuente === 'Por validar',
    };
  });
}

/** Verdadero solo si los días multiplican de verdad la cifra de ese recurso. */
export function porDias(item: string): boolean {
  const eq = EQUIV[item];
  return !!(eq && eq.diario && eq.multiplicaDias !== false);
}

/** Un número limpio a partir de lo que escribe la persona, con el formato del manual:
 *  «1.500» y «1.500,25» son miles; «4,2» y «450» van directo; lo que no es número es NaN. */
export function numero(txt: string | number | null | undefined): number {
  const t = String(txt ?? '')
    .replace(/[\s ]/g, '')
    .match(/-?\d[\d.,]*/);
  if (!t) return NaN;
  let s = t[0];
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  return parseFloat(s);
}
