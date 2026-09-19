/**
 * La mecánica de ofrecer ayuda (lógica pura, sin React): el camino —qué ofreces, la cantidad
 * por categoría, cómo se entrega, dónde, contacto, fotos, revisar—, qué hace falta para
 * seguir y cómo se dice la entrega. Origen: `src/ofrecer-v2.html` del prototipo.
 */
import { TAXONOMIA } from '../mocks/publicacionesMock';
import type { CampoDetalle, EstadoOfrecer, RespuestasDetalle, SubPaso } from '../types/flujo';
import { camposOferta } from './equivalencias';
import { contactoListo } from './pedir';

export function caminoOfrecer(e: Pick<EstadoOfrecer, 'sel' | 'entrega'>): SubPaso[] {
  const c: SubPaso[] = [{ paso: 1, id: 'recursos', nombre: 'Qué ofreces' }];
  TAXONOMIA.forEach((cat) => {
    const items = cat.items.filter((it) => e.sel.includes(it));
    if (items.length) c.push({ paso: 1, id: `cantidad:${cat.nombre}`, nombre: cat.nombre, items });
  });
  c.push({ paso: 1, id: 'entrega', nombre: 'Cómo se entrega' });
  if (e.entrega !== 'remoto') c.push({ paso: 2, id: 'donde', nombre: 'Dónde' });
  c.push({ paso: 2, id: 'contacto', nombre: 'Contacto' });
  c.push({ paso: 2, id: 'fotos', nombre: 'Fotos' });
  c.push({ paso: 2, id: 'revisar', nombre: 'Revisar' });
  return c;
}

export function campoListo(c: CampoDetalle, d: RespuestasDetalle): boolean {
  if (!c.req) return true;
  const v = d[c.k];
  if (c.t === 'multi') return Array.isArray(v) && v.length > 0;
  if (c.t === 'num') return typeof v === 'number' && v > 0;
  return !!v;
}

export function itemListo(e: EstadoOfrecer, it: string): boolean {
  const d = e.det[it] ?? {};
  if (d.disp === 'Hasta una fecha' && !d.fecha) return false;
  return typeof e.cant[it] === 'number' && e.cant[it] > 0 && camposOferta(it).every((c) => campoListo(c, d));
}

export function listoOfrecer(e: EstadoOfrecer, sub: SubPaso): boolean {
  if (sub.id === 'recursos') return e.sel.length > 0;
  if (sub.id.startsWith('cantidad:')) return (sub.items ?? []).every((it) => itemListo(e, it));
  if (sub.id === 'entrega') {
    if (e.entrega === 'llevamos') return !!e.radio && !!e.envio;
    if (e.entrega === 'remoto') return e.canales.length > 0;
    return true;
  }
  if (sub.id === 'donde') return !!e.dir.trim();
  if (sub.id === 'contacto') return contactoListo(e);
  return true;
}

export function textoEntrega(e: EstadoOfrecer): string {
  if (e.entrega === 'llevamos') return `Lo llevamos · ${e.radio} · envío ${e.envio.toLowerCase()}`;
  if (e.entrega === 'remoto') return `Remoto · ${e.canales.join(', ')}${e.horario ? ` · ${e.horario}` : ''}`;
  return 'En sitio';
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-09-30» → «30 sep». */
export function fechaCorta(f?: string): string {
  if (!f) return '';
  const p = f.split('-');
  return `${parseInt(p[2], 10)} ${MESES[parseInt(p[1], 10) - 1]}`;
}
