import { describe, expect, it } from 'vitest';
import { PUBLICACIONES, UBICACION } from '../../src/mocks/publicacionesMock';
import { chipsDe, conDistancia, conOrden, cuantosAplicados, filtrosVacios, pasaResto } from '../../src/utils/filtros';
import { alternarCiudades, ciudadDe, ciudadDeUbicacion, conteoPorCiudad, enCiudades, gruposDeCiudades, nombreCiudad, nombreCiudades, nombreCorto } from '../../src/utils/lugares';

describe('el lugar como en producción', () => {
  it('lo que no dice ciudad es de Bogotá, y la ubicación se detecta como en producción', () => {
    expect(ciudadDe({})).toBe('bogota');
    expect(ciudadDe({ ciudad: 'cali' })).toBe('cali');
    expect(ciudadDeUbicacion(UBICACION)).toBe('bogota');
    expect(ciudadDeUbicacion({ lat: 3.45, lng: -76.53, zona: '', simulada: true })).toBe('cali');
    expect(ciudadDeUbicacion({ lat: 0, lng: 0, zona: '', simulada: true })).toBeNull();
  });
  it('nombra la ciudad con su departamento, y el campo cerrado resume la selección', () => {
    expect(nombreCiudad('cali')).toBe('Cali, Valle del Cauca');
    expect(nombreCorto('mocoa')).toBe('Mocoa');
    expect(nombreCiudades([])).toBe('Todas las ciudades');
    expect(nombreCiudades(['cali'])).toBe('Cali');
    expect(nombreCiudades(['bogota', 'cali'])).toBe('Bogotá y Cali');
    expect(nombreCiudades(['bogota', 'cali', 'medellin', 'mocoa'])).toBe('Bogotá, Cali y 2 más');
  });
  it('sin búsqueda solo salen las ciudades con publicaciones, agrupadas por departamento', () => {
    const grupos = gruposDeCiudades(conteoPorCiudad(PUBLICACIONES));
    expect(grupos.map((g) => g.departamento)).toEqual(['Antioquia', 'Cundinamarca', 'Putumayo', 'Valle del Cauca']);
    const cund = grupos.find((g) => g.departamento === 'Cundinamarca')!;
    expect(cund.ciudades).toEqual([{ id: 'bogota', nombre: 'Bogotá', n: 15 }]);
  });
  it('el buscador encuentra por ciudad o por departamento, sin tildes', () => {
    const conteos = conteoPorCiudad(PUBLICACIONES);
    expect(gruposDeCiudades(conteos, 'medellin').flatMap((g) => g.ciudades.map((c) => c.id))).toEqual(['medellin']);
    const porDepto = gruposDeCiudades(conteos, 'putumayo');
    expect(porDepto).toHaveLength(1);
    expect(porDepto[0].ciudades.length).toBeGreaterThan(5);
    expect(porDepto[0].ciudades.find((c) => c.id === 'mocoa')?.n).toBe(1);
    expect(gruposDeCiudades(conteos, 'zzz')).toEqual([]);
  });
  it('las casillas marcan y desmarcan de a una o por departamento; vacío es Toda Colombia', () => {
    expect(alternarCiudades([], ['cali'], true)).toEqual(['cali']);
    expect(alternarCiudades(['cali'], ['cali', 'buga'], true)).toEqual(['cali', 'buga']);
    expect(alternarCiudades(['cali', 'buga', 'bogota'], ['cali', 'buga'], false)).toEqual(['bogota']);
    expect(enCiudades({ ciudad: 'cali' }, [])).toBe(true);
    expect(enCiudades({}, ['cali'])).toBe(false);
    expect(enCiudades({}, ['cali', 'bogota'])).toBe(true);
  });
});

describe('el filtro de ciudades y el radio en la Radar', () => {
  const f = filtrosVacios();
  it('Toda Colombia deja pasar todo; una o varias ciudades, solo lo suyo', () => {
    expect(PUBLICACIONES.every((p) => pasaResto(p, f, UBICACION, ''))).toBe(true);
    expect(PUBLICACIONES.filter((p) => pasaResto(p, { ...f, ciudades: ['cali'] }, UBICACION, '')).map((p) => p.id)).toEqual(['c1', 'c2']);
    expect(PUBLICACIONES.filter((p) => pasaResto(p, { ...f, ciudades: ['cali', 'mocoa'] }, UBICACION, '')).map((p) => p.id)).toEqual(['c1', 'c2', 'c4']);
  });
  it('el radio en km solo vive con «Más cerca»', () => {
    const cerca = conDistancia(f, 5);
    expect(cerca.orden).toBe('cerca');
    expect(cerca.distancia).toBe(5);
    expect(conOrden(cerca, 'falta').distancia).toBeNull();
    expect(conOrden(cerca, 'cerca').distancia).toBe(5);
    expect(cuantosAplicados(cerca)).toBe(2);
  });
  it('un chip por ciudad, solo con su nombre, y cada uno se quita solo', () => {
    const dos = { ...f, ciudades: ['bogota', 'cali'] };
    expect(chipsDe(dos).map((c) => c.texto)).toEqual(['Bogotá', 'Cali']);
    expect(chipsDe(dos)[0].quitar(dos).ciudades).toEqual(['cali']);
    expect(cuantosAplicados(dos)).toBe(2);
  });
});
