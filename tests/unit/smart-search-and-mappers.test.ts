import { describe, it, expect } from 'vitest';
import { buscarCiudadCoincidente, sugerenciasDeUbicacion, sugerenciasDeRecursos, ciudadDe } from '../../src/utils/lugares';
import { needToPublicacion, offerToPublicacion } from '../../src/utils/supabaseMappers';
import type { Need, Offer } from '../../src/types';

describe('Buscador Unificado Inteligente (Opción A) y Corrección de Mappers', () => {
  describe('buscarCiudadCoincidente', () => {
    it('detecta "cali" y devuelve las coordenadas oficiales de Cali', () => {
      const res = buscarCiudadCoincidente('cali');
      expect(res).not.toBeNull();
      expect(res?.ciudad.id).toBe('cali');
      expect(res?.coords.lat).toBeCloseTo(3.4516, 3);
      expect(res?.coords.lng).toBeCloseTo(-76.5320, 3);
    });

    it('detecta "bogota" y resuelve a Bogotá', () => {
      const res = buscarCiudadCoincidente('bogota');
      expect(res).not.toBeNull();
      expect(res?.ciudad.id).toBe('bogota');
      expect(res?.coords.lat).toBeCloseTo(4.7110, 3);
    });

    it('detecta "medellin" con tilde o sin tilde', () => {
      const conTilde = buscarCiudadCoincidente('Medellín');
      const sinTilde = buscarCiudadCoincidente('medellin');
      expect(conTilde?.ciudad.id).toBe('medellin');
      expect(sinTilde?.ciudad.id).toBe('medellin');
    });

    it('no confunde palabras comunes o recursos con ciudades', () => {
      expect(buscarCiudadCoincidente('agua')).toBeNull();
      expect(buscarCiudadCoincidente('calidad')).toBeNull();
      expect(buscarCiudadCoincidente('medicamentos')).toBeNull();
    });
  });

  describe('sugerenciasDeUbicacion y sugerenciasDeRecursos', () => {
    it('sugiere ciudades colombianas al escribir un prefijo', () => {
      const sugs = sugerenciasDeUbicacion('cali');
      expect(sugs.length).toBeGreaterThan(0);
      const nombres = sugs.map((s) => s.nombre.toLowerCase());
      expect(nombres).toContain('cali');
    });

    it('sugiere recursos de la taxonomía al escribir una palabra clave', () => {
      const sugs = sugerenciasDeRecursos('agua');
      expect(sugs).toContain('Agua potable');

      const med = sugerenciasDeRecursos('medicam');
      expect(med).toContain('Medicamentos / Botiquín');
    });
  });

  describe('Corrección de supabaseMappers (Eliminación de fallback hardcodeado "Cali")', () => {
    it('no asigna zona "Cali" a una necesidad con coordenadas en Bogotá sin barrio ni cityId', () => {
      const rawNeed: Need = {
        id: 'test-need-bogota',
        title: 'Prueba en Bogotá',
        description: 'Necesitamos apoyo',
        latitude: 4.6097,
        longitude: -74.0817,
        requesterType: 'PERSONA',
        priority: 'MEDIUM',
        status: 'NEED_HELP_NOW',
        verificationStatus: 'PENDING_VERIFICATION',
        createdAt: '2026-10-27T12:00:00Z',
        updatedAt: '2026-10-27T12:00:00Z',
        source: 'WhatsApp',
      };

      const pub = needToPublicacion(rawNeed);
      expect(pub.zona).not.toBe('Cali');
      expect(pub.ciudad).toBe('bogota');
      expect(pub.zona).toBe('Bogotá');
    });

    it('asigna Cali correctamente cuando las coordenadas corresponden a Cali', () => {
      const rawOffer: Offer = {
        id: 'test-offer-cali',
        title: 'Oferta en Cali',
        description: 'Entrega de agua',
        latitude: 3.4516,
        longitude: -76.5320,
        offerStatus: 'AVAILABLE',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-10-27T12:00:00Z',
        updatedAt: '2026-10-27T12:00:00Z',
        source: 'Web',
      };

      const pub = offerToPublicacion(rawOffer);
      expect(pub.ciudad).toBe('cali');
      expect(pub.zona).toBe('Cali');
    });

    it('ignora cityId "todo-colombia" y normaliza "bogota-d-c" usando coordenadas reales', () => {
      const needTodoColombiaEnCali: Need = {
        id: 'test-need-todo-colombia',
        title: 'Necesidad con placeholder todo-colombia',
        description: 'En Cali',
        latitude: 3.4516,
        longitude: -76.5320,
        cityId: 'todo-colombia',
        requesterType: 'PERSONA',
        priority: 'HIGH',
        status: 'NEED_HELP_NOW',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-10-27T12:00:00Z',
        updatedAt: '2026-10-27T12:00:00Z',
        source: 'Web',
      };

      const pubCali = needToPublicacion(needTodoColombiaEnCali);
      expect(pubCali.ciudad).toBe('cali');
      expect(pubCali.zona).toBe('Cali');

      expect(ciudadDe({ ciudad: 'bogota-d-c' })).toBe('bogota');
      expect(ciudadDe({ ciudad: 'todo-colombia' })).toBe('bogota');
    });
  });
});
