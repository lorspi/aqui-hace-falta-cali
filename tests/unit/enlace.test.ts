import { describe, expect, it } from 'vitest';
import { consultaVacia, vacioDe as vacioDirectorio } from '../../src/utils/directorio';
import { directorioDeParams, paramsDeDirectorio, paramsDeRadar, radarDeParams } from '../../src/utils/enlace';
import { filtrosVacios, vacioDe } from '../../src/utils/filtros';

const url = (p: URLSearchParams) => p.toString();

describe('la consulta viaja en la URL', () => {
  it('sin filtros, la URL queda limpia', () => {
    expect(url(paramsDeRadar({ filtros: filtrosVacios(), tipo: 'todo', busqueda: '', vista: 'mapa' }))).toBe('');
    expect(url(paramsDeDirectorio({ consulta: consultaVacia(), clase: 'organizacion' }))).toBe('');
  });
  it('la Radar escribe y vuelve a leer lo mismo', () => {
    const consulta = {
      filtros: { ...filtrosVacios(), ciudades: ['cali', 'bogota'], distancia: 5, recursos: ['Agua potable'], estados: ['inicial' as const], verificadas: true, orden: 'cerca' as const },
      tipo: 'necesidad' as const,
      busqueda: 'agua',
      vista: 'lista' as const,
    };
    const p = paramsDeRadar(consulta);
    expect(p.get('ciudad')).toBe('cali,bogota');
    expect(p.get('km')).toBe('5');
    expect(p.get('verificadas')).toBe('1');
    expect(radarDeParams(p)).toEqual(consulta);
  });
  it('el Directorio escribe y vuelve a leer lo mismo', () => {
    const consulta = { consulta: { ...consultaVacia(), ciudades: ['mocoa'], recursos: ['Alimentos'], verificadas: true, orden: 'cifra' as const, texto: 'jac' }, clase: 'comunidad' as const };
    const p = paramsDeDirectorio(consulta);
    expect(p.get('vista')).toBe('comunidades');
    expect(directorioDeParams(p)).toEqual(consulta);
  });
  it('lo que no entiende, lo ignora sin romperse', () => {
    const { filtros, tipo, vista } = radarDeParams(new URLSearchParams('ciudad=&km=7&estado=inventado&orden=zzz&tipo=zzz&vista=zzz'));
    expect(filtros.ciudades).toEqual([]);
    expect(filtros.distancia).toBeNull();
    expect(filtros.estados).toEqual([]);
    expect(filtros.orden).toBe('falta');
    expect(tipo).toBe('todo');
    expect(vista).toBe('mapa');
  });
  it('un radio sin «Más cerca» no se queda colgado', () => {
    expect(radarDeParams(new URLSearchParams('km=5')).filtros.distancia).toBeNull();
    expect(radarDeParams(new URLSearchParams('km=5&orden=cerca')).filtros.distancia).toBe(5);
  });
});

describe('el vacío nombra el filtro que más acota', () => {
  it('en la Radar: búsqueda, luego radio, luego ciudad, luego todo', () => {
    const f = filtrosVacios();
    expect(vacioDe({ ...f, ciudades: ['cali'], distancia: 5 }, 'agua').accion).toBe('Quitar la búsqueda');
    expect(vacioDe({ ...f, ciudades: ['cali'], distancia: 5 }).titulo).toBe('Nada a menos de 5 km');
    const ciudad = vacioDe({ ...f, ciudades: ['cali'] });
    expect(ciudad.titulo).toBe('Nada en Cali');
    expect(ciudad.aflojar({ ...f, ciudades: ['cali'] }).ciudades).toEqual([]);
    expect(vacioDe({ ...f, recursos: ['Alimentos'] }).accion).toBe('Quitar los filtros');
  });
  it('en el Directorio: nombra la ciudad y a quiénes busca', () => {
    const q = consultaVacia();
    expect(vacioDirectorio({ ...q, ciudades: ['mocoa'] }, 'comunidad').titulo).toBe('Ninguna en Mocoa');
    expect(vacioDirectorio({ ...q, ciudades: ['mocoa'] }, 'comunidad').texto).toContain('comunidades');
    expect(vacioDirectorio({ ...q, texto: 'jac' }, 'organizacion').accion).toBe('Quitar la búsqueda');
    expect(vacioDirectorio(q, 'organizacion').titulo).toBe('Ninguna organización con estos filtros');
  });
});
