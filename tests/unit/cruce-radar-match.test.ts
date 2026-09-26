import { describe, it, expect } from 'vitest';
import { PUBLICACIONES, obtenerPublicaciones } from '../../src/mocks/publicacionesMock';
import { coincidenciasDe, coincideItem, coincideUnidad, puntajeCoincidencia } from '../../src/utils/cruce';
import { textoSugerencias } from '../../src/components/ui/Coincidencias';
import { needToPublicacion, offerToPublicacion } from '../../src/utils/supabaseMappers';
import type { Need, Offer } from '../../src/types';

describe('Radar Match v2 Integration & Logic', () => {
  it('identifies matches across mock publications as expected in mockup main', () => {
    const pubs = obtenerPublicaciones();
    const withMatches = pubs.filter((p) => coincidenciasDe(p, pubs).length > 0);
    expect(withMatches.length).toBeGreaterThan(10);

    const bosa = pubs.find((p) => p.id === 'necesidad-bosa')!;
    const matchesBosa = coincidenciasDe(bosa, pubs);
    expect(matchesBosa.length).toBeGreaterThan(0);
    expect(matchesBosa[0].puntaje).toBeGreaterThanOrEqual(70);
    expect(matchesBosa[0].puntaje).toBeLessThanOrEqual(98);
  });

  it('maps Supabase needs without explicit resources using categories to canonical resources', () => {
    const rawNeed: Need = {
      id: 'test-need-1',
      title: 'Necesitamos agua urgente',
      description: 'Sin servicio de agua en el barrio',
      organizationName: 'JAC La Paz',
      contactName: 'Carlos Pérez',
      phone: '3001234567',
      address: 'Calle 10 #5-20',
      neighborhood: 'La Paz',
      cityId: 'bogota',
      departmentId: 'cundinamarca',
      latitude: 4.6097,
      longitude: -74.0817,
      priority: 'HIGH',
      status: 'OPEN',
      verificationStatus: 'VERIFIED',
      categories: ['AGUA', 'ALIMENTOS'],
      resources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pub = needToPublicacion(rawNeed);
    expect(pub.recursos.length).toBe(2);
    expect(pub.recursos.some((r) => r.item.toLowerCase().includes('agua'))).toBe(true);
    expect(pub.recursos.some((r) => r.item.toLowerCase().includes('alimento'))).toBe(true);
  });

  it('maps Supabase offers without explicit resources using categories to canonical resources', () => {
    const rawOffer: Offer = {
      id: 'test-offer-1',
      title: 'Disponibilidad de kits de agua y víveres',
      description: 'Podemos despachar tanques y alimentos no perecederos',
      organizationName: 'Fundación Solidaria',
      contactName: 'Ana Gómez',
      phone: '3109876543',
      address: 'Carrera 15 #80-10',
      neighborhood: 'Chapinero',
      cityId: 'bogota',
      departmentId: 'cundinamarca',
      latitude: 4.6597,
      longitude: -74.0617,
      offerStatus: 'AVAILABLE',
      verificationStatus: 'VERIFIED',
      categories: ['AGUA'],
      resources: [],
      deliveryMode: 'DELIVERY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pub = offerToPublicacion(rawOffer);
    expect(pub.recursos.length).toBe(1);
    expect(pub.recursos[0].item.toLowerCase().includes('agua')).toBe(true);
  });

  it('matches Need and Offer across flexible humanitarian synonym items and units', () => {
    expect(coincideItem('Remoción de escombros y barro', 'Evaluación estructural y remoción de escombros')).toBe(true);
    expect(coincideItem('Medicamentos / Botiquín', 'Kits médicos')).toBe(true);
    expect(coincideItem('Agua potable', 'Fabrico awa')).toBe(true);
    expect(coincideUnidad('litros', 'botellas')).toBe(true);
    expect(coincideUnidad('equipos', 'personas')).toBe(true);
  });

  it('generates unified readable match counters', () => {
    expect(textoSugerencias(1)).toBe('1 compatible');
    expect(textoSugerencias(3)).toBe('3 compatibles');
    expect(textoSugerencias(5)).toBe('5 compatibles');
    expect(textoSugerencias(5, 8)).toBe('5+ compatibles');
  });
});
