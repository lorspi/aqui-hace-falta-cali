import { describe, it, expect } from 'vitest';
import { calcularMetas, numero } from '../../src/utils/equivalencias';
import { caminoPedir, faltanCantidades, listoPedir } from '../../src/utils/pedir';
import { caminoOfrecer, listoOfrecer, textoEntrega } from '../../src/utils/ofrecer';
import { estadoInicialOfrecer, estadoInicialPedir } from '../../src/mocks/flujosMock';
import { cifra } from '../../src/utils/publicaciones';

// ============================================================================
// La conversión de RaDAR (src/utils/equivalencias.ts) y la mecánica de los flujos de
// publicar (src/utils/pedir.ts, src/utils/ofrecer.ts). Los casos de la conversión son los
// de `rdProbarEquivalencias()` del prototipo.
// ============================================================================

describe('calcularMetas', () => {
  it('agua: 3 L por persona al día, multiplicado por los días', () => {
    const [r] = calcularMetas(['Agua potable'], { personas: 12 }, 3);
    expect(r.meta).toBe(108);
    expect(r.unidad).toBe('L');
    expect(r.formula).toContain('durante 3 días');
  });

  it('alimentos: 1 kit cada 5 personas cada 15 días', () => {
    const [r] = calcularMetas(['Alimentos'], { personas: 300 }, 15);
    expect(r.meta).toBe(60);
    expect(r.unidad).toBe('kits');
  });

  it('escombros: los días acompañan pero no multiplican', () => {
    const [r] = calcularMetas(['Remoción de escombros y barro'], { inmuebles: 3 }, 2);
    expect(r.meta).toBe(1);
    expect(r.unidad).toBe('cuadrillas');
    expect(r.formula).toContain('la misma cantidad cada día');
  });

  it('sin meta: voluntariado y maquinaria la declara quien publica', () => {
    expect(calcularMetas(['Voluntariado en terreno'], {}, 3)[0].meta).toBeNull();
    expect(calcularMetas(['Maquinaria pesada y operarios'], {}, 1)[0].meta).toBeNull();
  });

  it('sin responder la base no hay meta, y lo dice', () => {
    const [r] = calcularMetas(['Agua potable'], {}, 3);
    expect(r.meta).toBeNull();
    expect(r.motivo).toContain('personas');
  });
});

describe('numero y cifra (el formato del manual)', () => {
  it('lee miles con punto y decimales con coma', () => {
    expect(numero('1.500')).toBe(1500);
    expect(numero('1.500,25')).toBe(1500.25);
    expect(numero('4,2')).toBe(4.2);
    expect(numero('450 L')).toBe(450);
    expect(Number.isNaN(numero('las que puedan'))).toBe(true);
  });
  it('escribe miles con punto y decimales con coma', () => {
    expect(cifra(1500)).toBe('1.500');
    expect(cifra(108.4)).toBe('108,4');
    expect(cifra(450)).toBe('450');
  });
});

describe('caminoPedir', () => {
  it('sin recursos: emergencia, qué hace falta y la fase 2', () => {
    const c = caminoPedir({ sel: [] }).map((s) => s.id);
    expect(c).toEqual(['evento', 'recursos', 'donde', 'contacto', 'fotos', 'revisar']);
  });

  it('con agua: incluye el paso de personas directamente (días y personas van juntos)', () => {
    const c = caminoPedir({ sel: ['Agua potable'] }).map((s) => s.id);
    expect(c).toContain('grupo:personas');
    expect(c).not.toContain('dias');
  });

  it('un recurso sin meta pide su cantidad en «Cantidades»', () => {
    const c = caminoPedir({ sel: ['Equipos de bombeo'] }).map((s) => s.id);
    expect(c).toContain('declarar');
    expect(c).not.toContain('grupo:personas');
  });

  it('no deja publicar un recurso sin cifra', () => {
    const e = { ...estadoInicialPedir(), sel: ['Equipos de bombeo'] };
    expect(faltanCantidades(e)).toEqual(['Equipos de bombeo']);
    expect(listoPedir(e, { paso: 2, id: 'revisar', nombre: 'Revisar' })).toBe(false);
    e.det = { 'Equipos de bombeo': { num: 2 } };
    expect(listoPedir(e, { paso: 2, id: 'revisar', nombre: 'Revisar' })).toBe(true);
  });
});

describe('caminoOfrecer', () => {
  it('agrupa la cantidad por categoría y omite «Dónde» si es remoto', () => {
    const c = caminoOfrecer({ sel: ['Agua potable', 'Alimentos', 'Transporte terrestre'], entrega: 'remoto' }).map((s) => s.id);
    expect(c).toEqual(['recursos', 'cantidad:Víveres y bienestar básico', 'cantidad:Transporte e instalaciones', 'entrega', 'contacto', 'fotos', 'revisar']);
  });

  it('la cantidad exige número y los campos obligatorios del recurso', () => {
    const e = { ...estadoInicialOfrecer(), sel: ['Agua potable'] };
    const sub = caminoOfrecer(e).find((s) => s.id.startsWith('cantidad:'))!;
    expect(listoOfrecer(e, sub)).toBe(false);
    e.cant = { 'Agua potable': 450 };
    expect(listoOfrecer(e, sub)).toBe(false);
    e.det = { 'Agua potable': { pres: 'Carrotanque' } };
    expect(listoOfrecer(e, sub)).toBe(true);
  });

  it('dice la entrega como frase', () => {
    expect(textoEntrega(estadoInicialOfrecer())).toBe('Lo llevamos, 10 km, envío gratis');
  });
});

describe('coincidenciasDe (el «Radar Match» con nuestro cruce)', () => {
  it('agrupa por organización, puntúa y ordena de mayor a menor', async () => {
    const { coincidenciasDe } = await import('../../src/utils/cruce');
    const { PUBLICACIONES } = await import('../../src/mocks/publicacionesMock');
    const nueva = { id: 'nueva', tipo: 'necesidad' as const, titulo: 'X', org: 'Fundación Colombia Unida', verificada: true, lat: 4.6197, lng: -74.202, zona: '', recursos: [{ item: 'Agua potable', unidad: 'L', total: 450, tramos: [] }] };
    const c = coincidenciasDe(nueva, PUBLICACIONES);
    expect(c.length).toBeGreaterThan(0);
    expect(c.length).toBeLessThanOrEqual(5);
    expect(c.every((x) => x.puntaje >= 70 && x.puntaje <= 98)).toBe(true);
    expect(c.every((x) => x.recursos.some((r) => r.item === 'Agua potable'))).toBe(true);
    for (let i = 1; i < c.length; i++) expect(c[i - 1].puntaje).toBeGreaterThanOrEqual(c[i].puntaje);
  });
  it('la cifra: 70 de base, hasta 15 por cercanía y 8 por cada recurso más, tope 98', async () => {
    const { puntajeCoincidencia } = await import('../../src/utils/cruce');
    expect(puntajeCoincidencia(3, 1)).toBe(85);
    expect(puntajeCoincidencia(12, 1)).toBe(75);
    expect(puntajeCoincidencia(3, 4)).toBe(98);
  });
  it('soporta modalidad remota/virtual con puntaje alto e ignorando distancia física', async () => {
    const { puntajeCoincidencia, resolverAlcance, etiquetaAlcance } = await import('../../src/utils/cruce');
    const alcance = resolverAlcance({ modoEntrega: 'remoto' } as any, {} as any, 450);
    expect(alcance).toBe('remoto');
    expect(etiquetaAlcance('remoto', 450)).toBe('Asistencia virtual');
    expect(puntajeCoincidencia(450, 1, 'remoto')).toBe(88);
    expect(puntajeCoincidencia(450, 2, 'remoto')).toBe(96);
  });
  it('soporta envíos nacionales intermunicipales (ej. Bogotá a Cali ~320 km) con puntaje modulado', async () => {
    const { puntajeCoincidencia, resolverAlcance, etiquetaAlcance } = await import('../../src/utils/cruce');
    const alcance = resolverAlcance({ radio: 'Todo el país' } as any, {} as any, 320);
    expect(alcance).toBe('nacional');
    expect(etiquetaAlcance('nacional', 320)).toBe('Envío nacional (320 km)');
    expect(puntajeCoincidencia(320, 1, 'nacional')).toBe(50);
    expect(puntajeCoincidencia(320, 2, 'nacional')).toBe(55);
  });
});

/* La interfaz dice «compatible», nunca «match» (Alejandro, 24 de septiembre de 2026). «Radar
   Match» sigue siendo el nombre del motor, no la palabra que se lee en pantalla. */
describe('textoSugerencias (etiquetas y límites del cruce)', () => {
  it('unifica la nomenclatura en singular y plural («1 compatible», «N compatibles»)', async () => {
    const { textoSugerencias } = await import('../../src/components/ui/Coincidencias');
    expect(textoSugerencias(1)).toBe('1 compatible');
    expect(textoSugerencias(2)).toBe('2 compatibles');
    expect(textoSugerencias(5)).toBe('5 compatibles');
  });

  it('aplica el tope máximo mostrando «5+ compatibles» cuando hay más disponibles', async () => {
    const { textoSugerencias, TOPE_SUGERENCIAS_DEFECTO } = await import('../../src/components/ui/Coincidencias');
    expect(TOPE_SUGERENCIAS_DEFECTO).toBe(5);
    // n=5 pero total=8 en base de datos
    expect(textoSugerencias(5, 8)).toBe('5+ compatibles');
    // n=5 y total=5 exactos
    expect(textoSugerencias(5, 5)).toBe('5 compatibles');
    // directo con n > 5
    expect(textoSugerencias(9)).toBe('5+ compatibles');
  });

  it('no deja pasar la palabra en inglés en ningún caso', async () => {
    const { textoSugerencias } = await import('../../src/components/ui/Coincidencias');
    [0, 1, 2, 5, 9].forEach((n) => expect(textoSugerencias(n)).not.toMatch(/match/i));
  });
});

