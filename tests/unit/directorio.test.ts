import { describe, expect, it } from 'vitest';
import { ENTIDADES, ENTIDAD_PROPIA } from '../../src/mocks/directorioMock';
import { PUBLICACIONES, UBICACION } from '../../src/mocks/publicacionesMock';
import { chipsDe, cifraDe, consultaVacia, conteoTexto, cuantosAplicados, entidadesDe, estadoComunidad, filtrar, ofertasDe, pasa, publicacionesDe, recursosDe, recursosDeVista, resumenPublica, solicitudesDe, zonasDe } from '../../src/utils/directorio';

const orgs = entidadesDe('organizacion', ENTIDADES, ENTIDAD_PROPIA);
const coms = entidadesDe('comunidad', ENTIDADES, ENTIDAD_PROPIA);
const de = (nombre: string) => ENTIDADES.find((e) => e.nombre === nombre)!;

describe('el directorio cuenta lo mismo que la Radar', () => {
  it('toda entidad tiene al menos una publicación con su mismo nombre', () => {
    ENTIDADES.forEach((e) => expect(publicacionesDe(e, PUBLICACIONES).length, e.nombre).toBeGreaterThan(0));
  });
  it('toda organización que publica en la Radar está en el directorio', () => {
    const orgsRadar = [...new Set(PUBLICACIONES.map((p) => p.org))];
    orgsRadar.forEach((o) => expect(ENTIDADES.some((e) => e.nombre === o), o).toBe(true));
  });
  it('la propia no sale en ninguna vista', () => {
    expect([...orgs, ...coms].some((e) => e.nombre === ENTIDAD_PROPIA)).toBe(false);
  });
  it('el resumen en números cuenta los recursos que ofrece y los que pide', () => {
    expect(resumenPublica(de('Fundación Manos Unidas'), PUBLICACIONES)).toEqual({ ofrece: 2, pide: 0 });
    expect(resumenPublica(de('JAC Barrio San Francisco'), PUBLICACIONES)).toEqual({ ofrece: 0, pide: solicitudesDe(de('JAC Barrio San Francisco'), PUBLICACIONES) });
  });
  it('lo que ofrece o pide sale de sus publicaciones', () => {
    expect(recursosDe(de('Fundación Manos Unidas'), PUBLICACIONES)).toEqual(['Agua potable', 'Implementos de aseo e higiene']);
    expect(ofertasDe(de('JAC Barrio San Francisco'), PUBLICACIONES)).toHaveLength(0);
  });
});

describe('cifras y estado', () => {
  it('una comunidad cuenta solicitudes (un recurso pedido, una solicitud); una organización, entregas', () => {
    expect(solicitudesDe(de('JAC Barrio San Francisco'), PUBLICACIONES)).toBe(publicacionesDe(de('JAC Barrio San Francisco'), PUBLICACIONES).reduce((t, p) => t + p.recursos.length, 0));
    expect(cifraDe(de('Cruz Roja · seccional Bogotá'), PUBLICACIONES)).toEqual({ n: 57, que: 'entregas confirmadas' });
    expect(cifraDe(de('JAC El Recuerdo'), PUBLICACIONES).que).toBe('solicitud');
  });
  it('el estado de una comunidad sale del avance de lo que pidió', () => {
    expect(estadoComunidad(de('JAC El Recuerdo'), PUBLICACIONES)).toBe('inicial');
    expect(estadoComunidad(de('Comedor Villa Gloria'), PUBLICACIONES)).toBe('proceso');
  });
});

describe('la consulta', () => {
  it('cada sección acota y el texto busca en nombre, tipo, zona, líder y recursos', () => {
    const q = consultaVacia();
    expect(filtrar(coms, PUBLICACIONES, { ...q, lugares: ['Bosa'] }, UBICACION).map((e) => e.nombre)).toEqual(['Albergue Bosa', 'JAC El Recuerdo']);
    expect(filtrar(coms, PUBLICACIONES, { ...q, texto: 'neuta' }, UBICACION).map((e) => e.nombre)).toEqual(['JAC Vereda El Destino']);
    expect(filtrar(orgs, PUBLICACIONES, { ...q, recursos: ['Agua potable'], verificadas: true }, UBICACION).every((e) => e.verificada && pasa(e, PUBLICACIONES, { ...q, recursos: ['Agua potable'] }))).toBe(true);
  });
  it('ordena por cercanía o por la cifra, y la cifra desempata por cercanía', () => {
    const porCerca = filtrar(orgs, PUBLICACIONES, consultaVacia(), UBICACION);
    expect(porCerca[0].nombre).toBe('Alcaldía local de Usme');
    const porCifra = filtrar(orgs, PUBLICACIONES, { ...consultaVacia(), orden: 'cifra' }, UBICACION);
    expect(porCifra[0].nombre).toBe('Cruz Roja · seccional Bogotá');
  });
  it('los chips reflejan lo aplicado y cada uno se quita solo', () => {
    const q = { ...consultaVacia(), lugares: ['Bosa'], recursos: ['Alimentos'], verificadas: true, texto: 'jac' };
    expect(cuantosAplicados(q)).toBe(4);
    const chips = chipsDe(q);
    expect(chips.map((c) => c.texto)).toEqual(['Bosa', 'Alimentos', 'Solo verificadas', '“jac”']);
    expect(cuantosAplicados(chips[0].quitar(q))).toBe(3);
    expect(chips[3].quitar(q).texto).toBe('');
  });
  it('las zonas y los recursos de la hoja salen de la vista', () => {
    expect(zonasDe(coms)).toContain('Bosa');
    expect(recursosDeVista(orgs, PUBLICACIONES)).toContain('Transporte terrestre');
    expect(conteoTexto(0, 'comunidad')).toBe('Nada con estos filtros');
    expect(conteoTexto(1, 'organizacion')).toBe('1 organización');
  });
});
