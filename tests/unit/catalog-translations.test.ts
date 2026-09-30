import { describe, it, expect } from 'vitest';
import {
  translateCategory,
  translateItem,
  translateUnit,
  translateResourceStatus,
  translateDistance,
  translateResourcesTitle,
} from '../../src/i18n/catalogTranslations';
import type { Recurso } from '../../src/types/publicacion';

describe('Traducciones de catálogo y datos estructurados (catalogTranslations.ts)', () => {
  it('traduce categorías en los 4 idiomas', () => {
    const cat = 'Víveres y bienestar básico';
    expect(translateCategory(cat, 'es')).toBe('Víveres y bienestar básico');
    expect(translateCategory(cat, 'en')).toBe('Food & Basic Welfare');
    expect(translateCategory(cat, 'pt')).toBe('Mantimentos e bem-estar básico');
    expect(translateCategory(cat, 'fr')).toBe('Vivres et bien-être de base');
  });

  it('traduce ítems de recursos individuales', () => {
    expect(translateItem('Agua potable', 'es')).toBe('Agua potable');
    expect(translateItem('Agua potable', 'en')).toBe('Drinking water');
    expect(translateItem('Agua potable', 'pt')).toBe('Água potável');
    expect(translateItem('Agua potable', 'fr')).toBe('Eau potable');

    expect(translateItem('Alimentos', 'en')).toBe('Food');
    expect(translateItem('Alimentos', 'fr')).toBe('Nourriture');
  });

  it('traduce y pluraliza unidades de medida', () => {
    expect(translateUnit(1, 'kits', 'en')).toBe('kit');
    expect(translateUnit(5, 'kits', 'en')).toBe('kits');
    expect(translateUnit(1, 'raciones', 'en')).toBe('meal');
    expect(translateUnit(10, 'raciones', 'en')).toBe('meals');

    expect(translateUnit(1, 'personas', 'en')).toBe('person');
    expect(translateUnit(3, 'personas', 'en')).toBe('people');
    expect(translateUnit(3, 'personas', 'pt')).toBe('pessoas');
    expect(translateUnit(3, 'personas', 'fr')).toBe('personnes');
  });

  it('genera la frase de estado de un recurso según el idioma y el tipo', () => {
    const recOferta: Recurso = {
      item: 'Alimentos',
      unidad: 'kits',
      total: 10,
      tramos: [{ t: 'hecho', cant: 6, quien: 'Voluntario', cuando: 'Ayer' }],
    };

    // 10 - 6 = 4 restantes
    expect(translateResourceStatus(recOferta, 'oferta', 'es')).toBe('quedan 4 kits');
    expect(translateResourceStatus(recOferta, 'oferta', 'en')).toBe('4 kits left');
    expect(translateResourceStatus(recOferta, 'oferta', 'pt')).toBe('restam 4 kits');
    expect(translateResourceStatus(recOferta, 'oferta', 'fr')).toBe('4 kits restants');

    const recNecesidad: Recurso = {
      item: 'Agua potable',
      unidad: 'litros',
      total: 100,
      tramos: [{ t: 'hecho', cant: 99, quien: 'Acopio', cuando: 'Hoy' }],
    };

    // 100 - 99 = 1 restante
    expect(translateResourceStatus(recNecesidad, 'necesidad', 'es')).toBe('falta 1 litro');
    expect(translateResourceStatus(recNecesidad, 'necesidad', 'en')).toBe('1 liter needed');
    expect(translateResourceStatus(recNecesidad, 'necesidad', 'pt')).toBe('falta 1 litro');
    expect(translateResourceStatus(recNecesidad, 'necesidad', 'fr')).toBe('1 litre requis');

    // Cubierto
    const recCubierto: Recurso = {
      item: 'Medicamentos',
      unidad: 'botiquines',
      total: 5,
      tramos: [{ t: 'hecho', cant: 5, quien: 'Cruz Roja', cuando: 'Hoy' }],
    };
    expect(translateResourceStatus(recCubierto, 'necesidad', 'es')).toBe('5 de 5 botiquines');
    expect(translateResourceStatus(recCubierto, 'necesidad', 'en')).toBe('5 of 5 first-aid kits');
    expect(translateResourceStatus(recCubierto, 'necesidad', 'pt')).toBe('5 de 5 kits de primeiros socorros');
    expect(translateResourceStatus(recCubierto, 'necesidad', 'fr')).toBe('5 sur 5 trousses de secours');
  });

  it('traduce la distancia al usuario', () => {
    expect(translateDistance(0.5, 'es')).toBe('a 500 m de tu ubicación');
    expect(translateDistance(0.5, 'en')).toBe('500 m from your location');
    expect(translateDistance(0.5, 'pt')).toBe('a 500 m da sua localização');
    expect(translateDistance(0.5, 'fr')).toBe('à 500 m de votre position');

    expect(translateDistance(3.2, 'es')).toBe('a 3,2 km de tu ubicación');
    expect(translateDistance(3.2, 'en')).toBe('3.2 km from your location');
    expect(translateDistance(3.2, 'pt')).toBe('a 3,2 km da sua localização');
    expect(translateDistance(3.2, 'fr')).toBe('à 3,2 km de votre position');
  });

  it('traduce el bloque de recursos en el título', () => {
    const recursos: Recurso[] = [
      { item: 'Agua potable', unidad: 'L', total: 100, tramos: [] },
      { item: 'Alimentos', unidad: 'kits', total: 50, tramos: [] },
    ];

    expect(translateResourcesTitle(recursos, 'necesidad', 'es')).toBe('Agua potable y Alimentos');
    expect(translateResourcesTitle(recursos, 'necesidad', 'en')).toBe('Drinking water and Food');
    expect(translateResourcesTitle(recursos, 'necesidad', 'pt')).toBe('Água potável e Alimentos');
    expect(translateResourcesTitle(recursos, 'necesidad', 'fr')).toBe('Eau potable et Nourriture');
  });

  it('traduce los 7 eventos de emergencia en todos los idiomas', async () => {
    const { translateEmergency } = await import('../../src/i18n/catalogTranslations');
    const emergencias = [
      'Inundación',
      'Terremoto',
      'Vendaval / Tormenta',
      'Incendio forestal / Erupción',
      'Derrumbe / Deslizamiento',
      'Epidemia / Emergencia sanitaria',
      'Otra emergencia comunitaria',
    ];

    for (const ev of emergencias) {
      expect(translateEmergency(ev, 'es')).toBe(ev);
      expect(translateEmergency(ev, 'en')).toBeTruthy();
      expect(translateEmergency(ev, 'en')).not.toBe('');
      expect(translateEmergency(ev, 'pt')).toBeTruthy();
      expect(translateEmergency(ev, 'fr')).toBeTruthy();
    }

    expect(translateEmergency('Inundación', 'en')).toBe('Flood');
    expect(translateEmergency('Terremoto', 'en')).toBe('Earthquake');
    expect(translateEmergency('Terremoto', 'fr')).toBe('Séisme / Tremblement de terre');
    expect(translateEmergency('Incendio forestal / Erupción', 'pt')).toBe('Incêndio florestal / Erupção');
  });

  it('no crashea al renderizarse con renderToStaticMarkup sin LanguageProvider (aislado/Leaflet)', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const React = await import('react');
    const { EtiquetaTipo, EtiquetaEstado } = await import('../../src/components/ui/Etiqueta');

    // Debe renderizar sin arrojar error incluso si no hay un LanguageProvider en el árbol
    expect(() => {
      const htmlTipo = renderToStaticMarkup(React.createElement(EtiquetaTipo, { tipo: 'necesidad' }));
      expect(htmlTipo).toContain('Se necesita');

      const htmlEstado = renderToStaticMarkup(React.createElement(EtiquetaEstado, { estado: 'cubierta' }));
      expect(htmlEstado).toContain('Cubierta');
    }).not.toThrow();
  });

  it('traduce el conteo de coincidencias en textoSugerencias según el idioma', async () => {
    const { textoSugerencias } = await import('../../src/components/ui/Coincidencias');
    expect(textoSugerencias(1, undefined, 5, 'es')).toBe('1 match');
    expect(textoSugerencias(3, undefined, 5, 'es')).toBe('3 matches');
    expect(textoSugerencias(6, undefined, 5, 'es')).toBe('5+ matches');

    expect(textoSugerencias(1, undefined, 5, 'pt')).toBe('1 correspondência');
    expect(textoSugerencias(3, undefined, 5, 'pt')).toBe('3 correspondências');

    expect(textoSugerencias(1, undefined, 5, 'fr')).toBe('1 correspondance');
    expect(textoSugerencias(3, undefined, 5, 'fr')).toBe('3 correspondances');
  });

  it('garantiza paridad de llaves en los 4 idiomas para perfil, flujos, radar match y panel', async () => {
    const { translations } = await import('../../src/i18n/translations');
    const esKeys = Object.keys(translations.es);
    const enKeys = Object.keys(translations.en);
    const ptKeys = Object.keys(translations.pt);
    const frKeys = Object.keys(translations.fr);

    expect(enKeys).toEqual(expect.arrayContaining(esKeys));
    expect(ptKeys).toEqual(expect.arrayContaining(esKeys));
    expect(frKeys).toEqual(expect.arrayContaining(esKeys));

    // Validar llaves de perfil, panel y radar match
    const requiredKeys = [
      'goToMyActivity',
      'goToDashboard',
      'profileTitle',
      'profileTabInfo',
      'profileTabAccess',
      'profileTabNotifs',
      'profileTabSecurity',
      'dashboardTitle',
      'dashboardCommunityTitle',
      'dashboardTabSummary',
      'dashboardTabNeeds',
      'dashboardTabOffers',
      'dashboardTabDeliveries',
      'dashboardTabReports',
      'dashboardTabTeam',
      'radarMatchTitleNeed',
      'radarMatchTitleOffer',
      'radarMatchOffersNear',
      'radarMatchNeedsNear',
      'radarMatchFor',
      'commitmentHelpTitle',
      'commitmentRequestTitle',
      'commitmentNeedCovered',
      'commitmentOfferDepleted',
    ];

    for (const k of requiredKeys) {
      expect((translations.es as any)[k]).toBeDefined();
      expect((translations.en as any)[k]).toBeDefined();
      expect((translations.pt as any)[k]).toBeDefined();
      expect((translations.fr as any)[k]).toBeDefined();
    }
  });
});

