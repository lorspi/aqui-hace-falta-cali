import { describe, it, expect } from 'vitest';
import { actasDe, archivarViejas, bloquesResumen, confirmadas, fechaCorta, kpisDe, leerModulos, pendientesCuenta, pendientesDe, pestanasDe, quedan, resumenActas, siglas, textoActa, textoCierre, textoCierreRecibida } from '../../src/utils/panel';
import { NECESIDAD, OFERTA, ORG, RECIBIDAS, SOLICITUDES } from '../../src/mocks/panelMock';
import { obtenerPublicaciones, PUBLICACIONES } from '../../src/mocks/publicacionesMock';

// ============================================================================
// El panel se arma con lo que la cuenta hizo (src/utils/panel.ts): publicar una necesidad
// abre `pide`, publicar una oferta abre `ofrece`. Decisión de Alejandro, 16 de septiembre.
// ============================================================================

const storageMap = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, String(v)),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
(globalThis as any).localStorage = fakeStorage;
(globalThis as any).window = { localStorage: fakeStorage };

const datos = { oferta: OFERTA, sol: SOLICITUDES, necesidad: NECESIDAD, recibidas: RECIBIDAS };
const conteos = { porConfirmarRecibidas: 1, nuevas: 2, porConfirmar: 1 };

describe('leerModulos', () => {
  it('sin nada publicado, nada abierto', () => {
    expect(leerModulos('', null)).toEqual({ pide: false, ofrece: false });
  });
  it('lee lo guardado al publicar', () => {
    expect(leerModulos('', JSON.stringify({ ofrece: true }))).toEqual({ pide: false, ofrece: true });
  });
  it('activa ofrece si existe oferta guardada en localStorage', () => {
    localStorage.setItem('rd-oferta-creada-gestion', JSON.stringify({ id: 'oferta-creada' }));
    expect(leerModulos('', null)).toEqual({ pide: false, ofrece: true });
    localStorage.removeItem('rd-oferta-creada-gestion');
  });
  it('activa pide si existe necesidad guardada en localStorage', () => {
    localStorage.setItem('rd-necesidad-creada-gestion', JSON.stringify({ id: 'necesidad-creada' }));
    expect(leerModulos('', null)).toEqual({ pide: true, ofrece: false });
    localStorage.removeItem('rd-necesidad-creada-gestion');
  });
  it('la URL manda para verlo sin publicar', () => {
    expect(leerModulos('?modulos=pide,ofrece', null)).toEqual({ pide: true, ofrece: true });
    expect(leerModulos('?modulos=ninguno', JSON.stringify({ ofrece: true }))).toEqual({ pide: false, ofrece: false });
  });
});

describe('pestanasDe', () => {
  it('sin módulos: resumen y equipo', () => {
    expect(pestanasDe({ pide: false, ofrece: false }, conteos).map((p) => p.id)).toEqual(['resumen', 'equipo']);
  });
  it('ofrecer abre mis ofertas y seguimiento, con sus conteos', () => {
    const p = pestanasDe({ pide: false, ofrece: true }, conteos);
    expect(p.map((x) => x.id)).toEqual(['resumen', 'ofertas', 'seguimiento', 'reportes', 'equipo']);
    expect(p.find((x) => x.id === 'seguimiento')?.n).toBe(2);
  });
  it('pedir abre mis necesidades antes que lo que se ofrece, y seguimiento unificado', () => {
    const p = pestanasDe({ pide: true, ofrece: true }, conteos).map((x) => x.id);
    expect(p.indexOf('necesidades')).toBeLessThan(p.indexOf('ofertas'));
    expect(p).toContain('seguimiento');
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

describe('obtenerPublicaciones sincronizado con ofertas y necesidades', () => {
  it('agrega oferta y necesidad dinámicas desde localStorage', () => {
    const ofertaTest = { id: 'oferta-creada', tipo: 'oferta', titulo: 'Oferta de prueba', org: 'Bomberos', verificada: true, lat: 4.5, lng: -74.1, zona: 'Usme', recursos: [] };
    const necesidadTest = { id: 'necesidad-creada', tipo: 'necesidad', titulo: 'Necesidad de prueba', org: 'Comunidad', verificada: true, lat: 4.5, lng: -74.1, zona: 'Usme', recursos: [] };

    localStorage.setItem('rd-oferta-publicacion', JSON.stringify(ofertaTest));
    localStorage.setItem('rd-necesidad-publicacion', JSON.stringify(necesidadTest));

    const pubs = obtenerPublicaciones();
    expect(pubs.some((p) => p.id === 'oferta-creada')).toBe(true);
    expect(pubs.some((p) => p.id === 'necesidad-creada')).toBe(true);
    expect(pubs.length).toBe(PUBLICACIONES.length + 2);

    localStorage.removeItem('rd-oferta-publicacion');
    localStorage.removeItem('rd-necesidad-publicacion');
  });

  it('acumula múltiples ofertas y necesidades desde rd-publicaciones-creadas sin sobreescribir las anteriores', () => {
    const pub1 = { id: 'necesidad-101', tipo: 'necesidad', titulo: 'Necesidad 1', org: 'Comunidad', verificada: true, lat: 4.5, lng: -74.1, zona: 'Usme', recursos: [] } as any;
    const pub2 = { id: 'oferta-102', tipo: 'oferta', titulo: 'Oferta 2', org: 'Bomberos', verificada: true, lat: 4.5, lng: -74.1, zona: 'Usme', recursos: [] } as any;

    localStorage.setItem('rd-publicaciones-creadas', JSON.stringify([pub1, pub2]));

    const pubs = obtenerPublicaciones();
    expect(pubs.some((p) => p.id === 'necesidad-101')).toBe(true);
    expect(pubs.some((p) => p.id === 'oferta-102')).toBe(true);
    expect(pubs.length).toBe(PUBLICACIONES.length + 2);

    localStorage.removeItem('rd-publicaciones-creadas');
  });
});

describe('MiEquipo filtros y ubicación', () => {
  it('los miembros de EQUIPO tienen ubicación asignada', async () => {
    const { EQUIPO } = await import('../../src/mocks/panelMock');
    expect(EQUIPO.every((m) => typeof m.ubicacion === 'string')).toBe(true);
    expect(EQUIPO.some((m) => m.ubicacion === 'Bogotá D. C.')).toBe(true);
    expect(EQUIPO.some((m) => m.ubicacion === 'Cundinamarca')).toBe(true);
  });

  it('filtra correctamente por ubicación, vehículo y disponibilidad', async () => {
    const { EQUIPO } = await import('../../src/mocks/panelMock');

    const filtrar = (equipo: typeof EQUIPO, ubi: string, veh: string, disp: string) => {
      return equipo.filter((m) => {
        if (ubi && m.ubicacion !== ubi) return false;
        if (veh && m.veh !== veh) return false;
        if (disp) {
          if (disp === 'tiempo_completo') {
            if (!['tiempo_completo', 'tardes', 'hoy', 'manana'].includes(m.disp)) return false;
          } else if (disp === 'fines_de_semana') {
            if (!['fines_de_semana', 'finde'].includes(m.disp)) return false;
          } else if (disp === 'emergencias') {
            if (m.disp !== 'emergencias') return false;
          } else if (m.disp !== disp) {
            return false;
          }
        }
        return true;
      });
    };

    // Filtro por ubicación 'Bogotá D. C.' (Mateo y Laura)
    const enBogota = filtrar(EQUIPO, 'Bogotá D. C.', '', '');
    expect(enBogota).toHaveLength(2);
    expect(enBogota.map((m) => m.n)).toEqual(['Mateo Rojas', 'Laura Díaz']);

    // Filtro por vehículo 'Moto' (Andrés)
    const conMoto = filtrar(EQUIPO, '', 'Moto', '');
    expect(conMoto).toHaveLength(1);
    expect(conMoto[0].n).toBe('Andrés Peña');

    // Filtro por disponibilidad 'fines_de_semana' (Sofía)
    const finDeSemana = filtrar(EQUIPO, '', '', 'fines_de_semana');
    expect(finDeSemana).toHaveLength(1);
    expect(finDeSemana[0].n).toBe('Sofía Mora');

    // Filtro combinado: Bogotá D. C. + Camioneta (Mateo)
    const combinado = filtrar(EQUIPO, 'Bogotá D. C.', 'Camioneta', '');
    expect(combinado).toHaveLength(1);
    expect(combinado[0].n).toBe('Mateo Rojas');

    // Filtro sin coincidencias
    const vacio = filtrar(EQUIPO, 'Amazonas', '', '');
    expect(vacio).toHaveLength(0);
  });

  it('filtra en tiempo real por búsqueda de texto (nombre, profesión / rol)', async () => {
    const { EQUIPO } = await import('../../src/mocks/panelMock');

    const buscar = (equipo: typeof EQUIPO, q: string) => {
      const term = q.toLowerCase().trim();
      return equipo.filter((m) => {
        if (!term) return true;
        return (
          m.n.toLowerCase().includes(term) ||
          (m.rol || '').toLowerCase().includes(term) ||
          (m.correo || '').toLowerCase().includes(term) ||
          (m.ubicacion || '').toLowerCase().includes(term)
        );
      });
    };

    // Búsqueda por profesión técnica
    expect(buscar(EQUIPO, 'peritaje').map((m) => m.n)).toEqual(['Mateo Rojas', 'Andrés Peña']);
    expect(buscar(EQUIPO, 'hídrico').map((m) => m.n)).toEqual(['Andrés Peña']);
    expect(buscar(EQUIPO, 'médica').map((m) => m.n)).toEqual(['Sofía Mora']);

    // Búsqueda por nombre
    expect(buscar(EQUIPO, 'laura').map((m) => m.n)).toEqual(['Laura Díaz']);

    // Búsqueda sin coincidencias
    expect(buscar(EQUIPO, 'electricista')).toHaveLength(0);
  });
});
