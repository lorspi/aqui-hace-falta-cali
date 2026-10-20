import { describe, it, expect } from 'vitest';
import { translations } from '../../src/i18n/translations';
import { actorPublicacion, recursosPublicacion, tituloPublicacion } from '../../src/utils/publicaciones';
import type { Publicacion } from '../../src/types/publicacion';

describe('Pruebas unitarias para A11y e i18n (A11-01, A11-02, A11-06)', () => {
  it('todas las nuevas claves de traducción están definidas en los 4 idiomas', () => {
    const keys = [
      'moreActions',
      'collapseMenu',
      'expandMenu',
      'minimizePanel',
      'showPanel',
      'showRightPanel',
      'goToMyLocation',
      'mapNeedsAndOffers',
      'mapMarkerNeed',
      'mapMarkerOffer',
    ] as const;

    const langs = ['es', 'en', 'pt', 'fr'] as const;

    for (const lang of langs) {
      for (const key of keys) {
        expect(translations[lang][key]).toBeDefined();
        expect(translations[lang][key].length).toBeGreaterThan(0);
      }
    }
  });

  it('verifica que las traducciones en inglés no tengan textos en español', () => {
    expect(translations.en.moreActions).toBe('More actions');
    expect(translations.en.collapseMenu).toBe('Collapse menu');
    expect(translations.en.expandMenu).toBe('Expand menu');
    expect(translations.en.minimizePanel).toBe('Minimize panel');
    expect(translations.en.showPanel).toBe('Show panel');
    expect(translations.en.showRightPanel).toBe('Show right panel');
    expect(translations.en.goToMyLocation).toBe('Go to my location');
    expect(translations.en.mapNeedsAndOffers).toBe('Map of needs and offers');
    expect(translations.en.mapMarkerNeed).toBe('Need');
    expect(translations.en.mapMarkerOffer).toBe('Offer');
  });

  it('traduce tituloPublicacion en inglés sin romper retrocompatibilidad en español', () => {
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

    // Por defecto / en español
    expect(tituloPublicacion(pub)).toBe('Agua potable, de Albergue Bosa');
    expect(tituloPublicacion(pub, 'es')).toBe('Agua potable, de Albergue Bosa');

    // En inglés
    expect(tituloPublicacion(pub, 'en')).toBe('Drinking water, from Albergue Bosa');
  });

  it('traduce múltiples recursos y conectores ("and", "more", "from") en inglés', () => {
    const pub: Publicacion = {
      id: 'p2',
      tipo: 'necesidad',
      titulo: '',
      org: 'Bomberos Voluntarios',
      verificada: true,
      lat: 4.51,
      lng: -74.11,
      zona: 'Usme',
      recursos: [
        { item: 'Agua potable', unidad: 'L', total: 900, tramos: [] },
        { item: 'Alimentos', unidad: 'kits', total: 50, tramos: [] },
      ],
    };

    expect(recursosPublicacion(pub, 'es')).toBe('Agua potable y Alimentos');
    expect(recursosPublicacion(pub, 'en')).toBe('Drinking water and Food');
    expect(tituloPublicacion(pub, 'en')).toBe('Drinking water and Food, from Bomberos Voluntarios');
  });

  it('traduce actor individual protegido ("Citizen" en inglés, "Ciudadano" en español)', () => {
    const pub: Publicacion = {
      id: 'p3',
      tipo: 'necesidad',
      perfil: 'individual',
      titulo: '',
      org: '',
      verificada: false,
      lat: 4.6,
      lng: -74.1,
      zona: 'Bosa',
      recursos: [{ item: 'Alimentos', unidad: 'kits', total: 5, tramos: [] }],
    };

    expect(actorPublicacion(pub, 'es')).toBe('Ciudadano');
    expect(actorPublicacion(pub, 'en')).toBe('Citizen');
    expect(tituloPublicacion(pub, 'en')).toBe('Food, from Citizen');
  });
});
