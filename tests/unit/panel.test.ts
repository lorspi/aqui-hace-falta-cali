import { describe, it, expect } from 'vitest';
import { actasDe, archivarViejas, bloquesResumen, confirmadas, fechaCorta, kpisDe, leerModulos, pendientesCuenta, pendientesDe, pestanasDe, quedan, resumenActas, siglas, textoActa, textoCierre, textoCierreRecibida } from '../../src/utils/panel';
import { NECESIDAD, OFERTA, ORG, RECIBIDAS, SOLICITUDES } from '../../src/mocks/panelMock';

// ============================================================================
// El panel se arma con lo que la cuenta hizo (src/utils/panel.ts): publicar una necesidad
// abre `pide`, publicar una oferta abre `ofrece`. Decisión de Alejandro, 16 de septiembre.
// ============================================================================

const datos = { oferta: OFERTA, sol: SOLICITUDES, necesidad: NECESIDAD, recibidas: RECIBIDAS };
const conteos = { porConfirmarRecibidas: 1, nuevas: 2, porConfirmar: 1 };

describe('leerModulos', () => {
  it('sin nada publicado, nada abierto', () => {
    expect(leerModulos('', null)).toEqual({ pide: false, ofrece: false });
  });
  it('lee lo guardado al publicar', () => {
    expect(leerModulos('', JSON.stringify({ ofrece: true }))).toEqual({ pide: false, ofrece: true });
  });
  it('la URL manda para verlo sin publicar', () => {
    expect(leerModulos('?modulos=pide,ofrece', null)).toEqual({ pide: true, ofrece: true });
    expect(leerModulos('?modulos=ninguno', JSON.stringify({ ofrece: true }))).toEqual({ pide: false, ofrece: false });
  });
});

describe('pestanasDe', () => {
  it('sin módulos: resumen, equipo y datos', () => {
    expect(pestanasDe({ pide: false, ofrece: false }, conteos).map((p) => p.id)).toEqual(['resumen', 'equipo', 'datos']);
  });
  it('ofrecer abre mis ofertas, solicitudes y seguimiento, con sus conteos', () => {
    const p = pestanasDe({ pide: false, ofrece: true }, conteos);
    expect(p.map((x) => x.id)).toEqual(['resumen', 'ofertas', 'solicitudes', 'seguimiento', 'reportes', 'equipo', 'datos']);
    expect(p.find((x) => x.id === 'solicitudes')?.n).toBe(2);
  });
  it('pedir abre mis necesidades y entregas recibidas, antes que lo que se ofrece', () => {
    const p = pestanasDe({ pide: true, ofrece: true }, conteos).map((x) => x.id);
    expect(p.indexOf('necesidades')).toBeLessThan(p.indexOf('ofertas'));
    expect(p).toContain('recibidas');
  });
  it('reportes aparece con cualquier cara abierta, nunca sin módulos', () => {
    expect(pestanasDe({ pide: true, ofrece: false }, conteos).map((x) => x.id)).toContain('reportes');
    expect(pestanasDe({ pide: false, ofrece: false }, conteos).map((x) => x.id)).not.toContain('reportes');
  });
});

describe('cifras y pendientes', () => {
  it('lo que queda de un recurso descuenta todo lo comprometido en adelante, archivado incluido', () => {
    const agua = OFERTA.recursos[0];
    expect(quedan(SOLICITUDES, agua)).toBe(900 - 180 - 270 - 120);
    expect(quedan(archivarViejas(SOLICITUDES, new Date('2026-09-16T12:00:00')), agua)).toBe(900 - 180 - 270 - 120);
  });
  it('los KPI salen solo de los módulos abiertos', () => {
    expect(kpisDe({ pide: false, ofrece: false }, datos)).toHaveLength(0);
    expect(kpisDe({ pide: false, ofrece: true }, datos).map((k) => k.k)).toEqual(['Nuevas', 'En camino', 'Por confirmar', 'Confirmadas']);
    expect(kpisDe({ pide: true, ofrece: true }, datos)).toHaveLength(8);
  });
  it('lo que llegó y falta confirmar va primero y bloquea', () => {
    const p = pendientesDe({ pide: true, ofrece: true }, datos);
    expect(p[0].bloquea).toBe(true);
    expect(p[0].accion.al).toBe('confirmar:101');
  });
  it('los pendientes de la cuenta suman nuevas, por confirmar y lo recibido sin confirmar', () => {
    expect(pendientesCuenta({ pide: true, ofrece: true }, datos)).toBe(2 + 1 + 1);
    expect(pendientesCuenta({ pide: false, ofrece: false }, datos)).toBe(0);
  });
});

describe('el resumen en dos niveles y el cierre de dos lados (rama de Fede, 16 de septiembre)', () => {
  it('las decisiones son responder y confirmar lo recibido; lo demás es operación', () => {
    const p = pendientesDe({ pide: true, ofrece: true }, datos);
    expect(p.filter((x) => x.grupo === 'decision').map((x) => x.accion.texto)).toEqual(['Confirmar recibido', 'Aceptar', 'Aceptar']);
    expect(p.find((x) => x.id === 'nueva-5')?.secundaria?.texto).toBe('No podemos');
    expect(p.filter((x) => x.grupo === 'operacion').map((x) => x.accion.texto)).toEqual(['Asignar', 'Ver el seguimiento', 'Certificar', 'Ampliar la fecha']);
  });
  it('la pestaña Seguimiento cuenta lo nuevo, porque el tablero arranca en «Nuevas»', () => {
    expect(pestanasDe({ pide: false, ofrece: true }, conteos).find((x) => x.id === 'seguimiento')?.n).toBe(2);
  });
  it('las confirmadas de 30 días o más pasan solas a Archivadas y siguen contando', () => {
    const hoy = new Date('2026-09-16T12:00:00');
    const l = archivarViejas(SOLICITUDES, hoy);
    expect(l.find((s) => s.id === 8)?.estado).toBe('archivada');
    expect(l.find((s) => s.id === 1)?.estado).toBe('confirmada');
    expect(confirmadas(l)).toBe(confirmadas(SOLICITUDES));
  });
  it('el resumen va en dos bloques que no se cruzan: lo pedido y lo ofrecido, cada uno con su barra por estado', () => {
    const b = bloquesResumen({ pide: true, ofrece: true }, datos);
    expect(b.map((x) => x.id)).toEqual(['pide', 'ofrece']);
    expect(b[0].kpis.map((k) => k.k)).toEqual(['Comprometidas', 'En camino', 'Por confirmar', 'Confirmadas']);
    expect(b[0].kpis.map((k) => k.estado)).toEqual(['aceptada', 'camino', 'entregada', 'confirmada']);
    expect(b[0].barra.map((t) => `${t.estado}:${t.n}`)).toEqual(['entregada:1', 'confirmada:1']);
    expect(b[1].barra.reduce((t, x) => t + x.n, 0)).toBe(SOLICITUDES.length);
    /* Cada cuadrito es un tramo de la barra con la misma cifra (las archivadas no se suman). */
    b.forEach((bloque) => bloque.kpis.forEach((k) => expect(k.v).toBe(bloque.barra.find((t) => t.estado === k.estado)?.n ?? 0)));
    expect(bloquesResumen({ pide: false, ofrece: true }, datos).map((x) => x.id)).toEqual(['ofrece']);
  });
  it('el cierre dice quién confirmó (las fotos van aparte, como galería)', () => {
    expect(textoCierre({ quien: 'Albergue Bosa', cierre: { entrega: { fotos: 2 }, recibe: { fotos: 1 } } })).toBe('Confirmada por ti y por Albergue Bosa');
    expect(textoCierre({ quien: 'Comedor', cierre: { recibe: { fotos: 1 } } })).toBe('Confirmada por Comedor');
    expect(textoCierre({ quien: 'Comedor', cierre: { entrega: { fotos: 0 } } })).toBe('Certificada por ti · Comedor aún no confirma');
    expect(textoCierre({ quien: 'Comedor' })).toBe('Confirmada');
  });
});

describe('reportes: las actas de entrega', () => {
  const lleva = (s: { vol: number | null }) => (s.vol ? `Voluntario ${s.vol}` : null);
  it('una acta por entrega confirmada o archivada de cada cara, la más reciente primero, numerada por orden de cierre', () => {
    const a = actasDe({ pide: true, ofrece: true }, { sol: SOLICITUDES, recibidas: RECIBIDAS, org: ORG.nombre, lleva });
    expect(a).toHaveLength(4);
    expect(a.map((x) => x.fecha)).toEqual([...a.map((x) => x.fecha)].sort().reverse());
    expect(a[a.length - 1].codigo).toBe('RD-2026-BVU-0001');
    expect(a[0].codigo).toBe('RD-2026-BVU-0004');
    expect(a.find((x) => x.lado === 'pide')).toMatchObject({ entrego: 'Alcaldía local de Usme', recibio: ORG.nombre, lleva: 'Transporte de la alcaldía' });
    expect(a.find((x) => x.origen.id === 1 && x.lado === 'ofrece')).toMatchObject({ entrego: ORG.nombre, recibio: 'Albergue Bosa', lleva: 'Voluntario 3', confirmacion: 'Confirmada por ti y por Albergue Bosa' });
  });
  it('sin módulos no hay actas; solo pide, solo las recibidas', () => {
    expect(actasDe({ pide: false, ofrece: false }, { sol: SOLICITUDES, recibidas: RECIBIDAS, org: ORG.nombre, lleva })).toHaveLength(0);
    expect(actasDe({ pide: true, ofrece: false }, { sol: SOLICITUDES, recibidas: RECIBIDAS, org: ORG.nombre, lleva }).every((x) => x.lado === 'pide')).toBe(true);
  });
  it('el texto del acta lleva todo lo que se va a mostrar, sin líneas vacías', () => {
    const a = actasDe({ pide: true, ofrece: true }, { sol: SOLICITUDES, recibidas: RECIBIDAS, org: ORG.nombre, lleva }).find((x) => x.origen.id === 1)!;
    const t = textoActa(a);
    expect(t.split('\n')[0]).toBe(`Acta de entrega ${a.codigo} · RaDAR de ayuda`);
    expect(t).toContain('Recibió: Albergue Bosa');
    expect(t).toContain('Lo que permitió:');
    expect(t.split('\n').some((l) => l.trim() === '')).toBe(false);
  });
  it('siglas, fecha corta, cierre visto por quien recibe y el resumen', () => {
    expect(siglas('Bomberos Voluntarios Usme')).toBe('BVU');
    expect(siglas('Cruz Roja · seccional Bogotá')).toBe('CRS');
    expect(fechaCorta('2026-09-12')).toBe('12 sep 2026');
    expect(textoCierreRecibida({ org: 'Cruz Roja', cierre: { entrega: { fotos: 1 } } })).toBe('Certificada por Cruz Roja · falta tu confirmación');
    expect(textoCierreRecibida({ org: 'Cruz Roja', cierre: { recibe: { fotos: 1 } } })).toBe('Confirmada por ti');
    const r = resumenActas(actasDe({ pide: true, ofrece: true }, { sol: SOLICITUDES, recibidas: RECIBIDAS, org: ORG.nombre, lleva }));
    expect(r).toEqual({ actas: 4, organizaciones: 4 });
  });
});
