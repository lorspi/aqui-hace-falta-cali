/**
 * La mecánica de pedir ayuda (lógica pura, sin React): el camino —una pregunta por
 * pantalla, calculado cada vez porque depende de lo marcado—, qué hace falta para seguir y
 * qué recursos declaran su cifra a mano. Origen: `src/pedir.html` del prototipo.
 */
import { BASES, DETALLE, EQUIV, SIN_META } from '../mocks/equivalenciasMock';
import { NOMBRE_GRUPO } from '../mocks/flujosMock';
import type { EstadoPedir, SubPaso } from '../types/flujo';
import { calcularMetas, declarado } from './equivalencias';

export function gruposNecesarios(sel: string[]): string[] {
  const g: Record<string, true> = {};
  sel.forEach((it) => {
    const eq = EQUIV[it];
    if (eq) g[eq.base] = true;
  });
  return Object.keys(g);
}

export function hayDiarios(sel: string[]): boolean {
  return sel.some((it) => EQUIV[it]?.diario);
}

/** Los recursos marcados cuya cantidad la escribe la persona (sin meta y con campo `num`),
 *  en el orden en que se marcaron: alimentan el sub-paso «Cantidades». */
export function aDeclarar(sel: string[]): string[] {
  return sel.filter((it) => SIN_META.includes(it) && !!DETALLE[it]?.campos.some((c) => c.k === 'num'));
}

/** El camino. Los días van con la cantidad en una sola pantalla (sin paso separado).
 *  El detalle no es un paso: vive dentro de «Revisar», al lado de la cifra que describe. */
export function caminoPedir(e: Pick<EstadoPedir, 'sel'>): SubPaso[] {
  const c: SubPaso[] = [
    { paso: 1, id: 'evento', nombre: 'Emergencia' },
    { paso: 1, id: 'recursos', nombre: 'Qué hace falta' },
  ];
  gruposNecesarios(e.sel).forEach((g) => c.push({ paso: 1, id: `grupo:${g}`, nombre: NOMBRE_GRUPO[g] ?? 'Cantidad' }));
  if (aDeclarar(e.sel).length) c.push({ paso: 1, id: 'declarar', nombre: 'Cantidades' });
  c.push({ paso: 2, id: 'donde', nombre: 'Dónde' });
  c.push({ paso: 2, id: 'contacto', nombre: 'Contacto' });
  c.push({ paso: 2, id: 'fotos', nombre: 'Fotos' });
  c.push({ paso: 2, id: 'revisar', nombre: 'Revisar' });
  return c;
}

/** Falta cantidad cuando el recurso se publicaría sin cifra, venga de donde venga: se mira
 *  el resultado del cálculo, no la lista a la que pertenece. */
export function faltanCantidades(e: EstadoPedir): string[] {
  return calcularMetas(e.sel, e.grupo, e.dias)
    .filter((m) => {
      if (m.meta != null) return false;
      if (e.metas[m.item] > 0) return false;
      const dec = declarado(m.item, e.det[m.item]);
      return !dec || !(dec.valor && dec.valor > 0);
    })
    .map((m) => m.item);
}

export function contactoListo(e: { contacto: string; tel: string; mismoWa: boolean; wa: string }): boolean {
  return !!e.contacto.trim() && !!e.tel.trim() && (e.mismoWa || !!e.wa.trim());
}

/** Si ese sub-paso ya puede dejar continuar. «Cantidades» solo responde por lo que pregunta;
 *  «Revisar» mira todo, porque ahí están todos los campos. */
export function listoPedir(e: EstadoPedir, sub: SubPaso): boolean {
  if (sub.id === 'recursos') return e.sel.length > 0;
  if (sub.id.startsWith('grupo:')) {
    const g = sub.id.split(':')[1];
    const v = e.grupo[g];
    return BASES[g].libre ? Number(v) > 0 : !!v;
  }
  if (sub.id === 'contacto') return contactoListo(e);
  if (sub.id === 'donde') return !!e.dir.trim();
  if (sub.id === 'declarar')
    return aDeclarar(e.sel).every((it) => {
      const dec = declarado(it, e.det[it]);
      return !!dec && !!dec.valor && dec.valor > 0;
    });
  if (sub.id === 'revisar') return faltanCantidades(e).length === 0;
  return true;
}

/** Enumeración con «y» final, como manda la RAE. */
export function listaY(lista: string[]): string {
  if (lista.length <= 1) return lista[0] ?? '';
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}
