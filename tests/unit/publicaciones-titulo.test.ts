import { describe, expect, it } from 'vitest';
import type { Publicacion } from '../../src/types/publicacion';
import { actorPublicacion, tituloPublicacion } from '../../src/utils/publicaciones';

describe('Reglas de generación de títulos institucionales de publicaciones', () => {
  it('genera título para necesidad con 1 solo recurso de organización', () => {
    const pub: Publicacion = {
      id: 'p1',
      tipo: 'necesidad',
      titulo: '',
      punto: 'Albergue Bosa',
      org: 'Fundación Colombia Unida',
      verificada: true,
      lat: 4.61,
      lng: -74.2,
      zona: 'Bosa',
      recursos: [{ item: 'Agua potable', unidad: 'L', total: 900, tramos: [] }],
    };
    expect(actorPublicacion(pub)).toBe('Albergue Bosa');
    expect(tituloPublicacion(pub)).toBe('Agua potable · Albergue Bosa');
  });

  it('genera título para necesidad con 2 recursos de organización', () => {
    const pub: Publicacion = {
      id: 'p2',
      tipo: 'necesidad',
      titulo: '',
      org: 'Bomberos Voluntarios Usme',
      verificada: true,
      lat: 4.51,
      lng: -74.11,
      zona: 'Usme',
      recursos: [
        { item: 'Agua potable', unidad: 'L', total: 900, tramos: [] },
        { item: 'Alimentos', unidad: 'kits', total: 50, tramos: [] },
      ],
    };
    expect(tituloPublicacion(pub)).toBe('Agua potable y Alimentos · Bomberos Voluntarios Usme');
  });

  it('genera título para necesidad con 3 o más recursos comunitarios', () => {
    const pub: Publicacion = {
      id: 'p3',
      tipo: 'necesidad',
      titulo: '',
      org: 'JAC El Recuerdo',
      verificada: false,
      lat: 4.61,
      lng: -74.19,
      zona: 'Bosa',
      recursos: [
        { item: 'Alimentos', unidad: 'kits', total: 100, tramos: [] },
        { item: 'Agua potable', unidad: 'L', total: 500, tramos: [] },
        { item: 'Ropa y calzado', unidad: 'mudas', total: 50, tramos: [] },
        { item: 'Cobijas y colchonetas', unidad: 'juegos', total: 30, tramos: [] },
        { item: 'Medicamentos / Botiquín', unidad: 'botiquines', total: 10, tramos: [] },
      ],
    };
    expect(tituloPublicacion(pub)).toBe('Alimentos y 4 más · JAC El Recuerdo');
  });

  it('genera título simétrico para oferta institucional sin "Disponibilidad de"', () => {
    const pub: Publicacion = {
      id: 'o1',
      tipo: 'oferta',
      titulo: '',
      org: 'Bomberos Voluntarios Usme',
      verificada: true,
      lat: 4.51,
      lng: -74.11,
      zona: 'Usme',
      recursos: [{ item: 'Agua potable', unidad: 'L', total: 1500, tramos: [] }],
    };
    expect(tituloPublicacion(pub)).toBe('Agua potable · Bomberos Voluntarios Usme');
  });

  it('genera título para oferta con múltiples recursos', () => {
    const pub: Publicacion = {
      id: 'o2',
      tipo: 'oferta',
      titulo: '',
      org: 'Cruz Roja seccional',
      verificada: true,
      lat: 4.61,
      lng: -74.18,
      zona: 'Teusaquillo',
      recursos: [
        { item: 'Atención médica', unidad: 'profesionales', total: 5, tramos: [] },
        { item: 'Medicamentos / Botiquín', unidad: 'botiquines', total: 200, tramos: [] },
        { item: 'Implementos de aseo e higiene', unidad: 'kits', total: 50, tramos: [] },
      ],
    };
    expect(tituloPublicacion(pub)).toBe('Atención médica y 2 más · Cruz Roja seccional');
  });

  it('protege la privacidad de una persona individual en necesidad con contexto geográfico', () => {
    const pub: Publicacion = {
      id: 'ind-n1',
      tipo: 'necesidad',
      perfil: 'individual',
      titulo: '',
      org: 'Carlos Gómez',
      verificada: false,
      lat: 4.61,
      lng: -74.19,
      zona: 'Bosa',
      recursos: [
        { item: 'Cobijas y colchonetas', unidad: 'juegos', total: 4, tramos: [] },
        { item: 'Ropa y calzado', unidad: 'mudas', total: 6, tramos: [] },
        { item: 'Alimentos', unidad: 'kits', total: 2, tramos: [] },
      ],
    };
    expect(actorPublicacion(pub)).toBe('Familia en Bosa');
    expect(tituloPublicacion(pub)).toBe('Cobijas y colchonetas y 2 más · Familia en Bosa');
  });

  it('protege la privacidad de una persona individual en necesidad sin zona', () => {
    const pub: Publicacion = {
      id: 'ind-n2',
      tipo: 'necesidad',
      perfil: 'individual',
      titulo: '',
      org: 'María Torres',
      verificada: false,
      lat: 4.61,
      lng: -74.19,
      zona: '',
      recursos: [
        { item: 'Cobijas y colchonetas', unidad: 'juegos', total: 4, tramos: [] },
        { item: 'Alimentos', unidad: 'kits', total: 2, tramos: [] },
      ],
    };
    expect(actorPublicacion(pub)).toBe('Familia afectada');
    expect(tituloPublicacion(pub)).toBe('Cobijas y colchonetas y Alimentos · Familia afectada');
  });

  it('protege la privacidad de una persona individual en oferta con zona', () => {
    const pub: Publicacion = {
      id: 'ind-o1',
      tipo: 'oferta',
      perfil: 'individual',
      titulo: '',
      org: 'Pedro Ruiz',
      verificada: true,
      lat: 4.64,
      lng: -74.06,
      zona: 'Chapinero',
      recursos: [{ item: 'Ropa y calzado', unidad: 'mudas', total: 30, tramos: [] }],
    };
    expect(actorPublicacion(pub)).toBe('Donante en Chapinero');
    expect(tituloPublicacion(pub)).toBe('Ropa y calzado · Donante en Chapinero');
  });

  it('protege la privacidad de una persona individual en oferta sin zona', () => {
    const pub: Publicacion = {
      id: 'ind-o2',
      tipo: 'oferta',
      perfil: 'individual',
      titulo: '',
      org: 'Pedro Ruiz',
      verificada: true,
      lat: 4.64,
      lng: -74.06,
      zona: '',
      recursos: [{ item: 'Herramientas de mano', unidad: 'unidades', total: 10, tramos: [] }],
    };
    expect(actorPublicacion(pub)).toBe('Donante particular');
    expect(tituloPublicacion(pub)).toBe('Herramientas de mano · Donante particular');
  });
});
