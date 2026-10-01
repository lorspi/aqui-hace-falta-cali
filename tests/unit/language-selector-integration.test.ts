import { describe, it, expect } from 'vitest';
import { translations, Language, TranslationKey } from '../../src/i18n/translations';

describe('i18n translations & language switcher support', () => {
  const languages: Language[] = ['es', 'en', 'pt', 'fr'];
  const esKeys = Object.keys(translations.es) as TranslationKey[];

  it('should have all Spanish keys present in English, Portuguese, and French', () => {
    languages.forEach((lang) => {
      const currentKeys = Object.keys(translations[lang]);
      expect(currentKeys.length).toBe(esKeys.length);

      esKeys.forEach((key) => {
        expect(
          translations[lang][key],
          `Missing key "${key}" in language "${lang}"`
        ).toBeDefined();
        expect(
          typeof translations[lang][key],
          `Key "${key}" in language "${lang}" is not a string`
        ).toBe('string');
        expect(
          translations[lang][key].length,
          `Key "${key}" in language "${lang}" is empty`
        ).toBeGreaterThan(0);
      });
    });
  });

  it('should provide translated values for navigation and core radar actions', () => {
    // Check navigation keys
    expect(translations.es.navRadar).toBe('Radar');
    expect(translations.en.navRadar).toBe('Radar');
    expect(translations.fr.navRadar).toBe('Radar');
    expect(translations.pt.navRadar).toBe('Radar');

    expect(translations.es.navDirectory).toBe('Directorio');
    expect(translations.en.navDirectory).toBe('Directory');
    expect(translations.fr.navDirectory).toBe('Annuaire');
    expect(translations.pt.navDirectory).toBe('Diretório');

    expect(translations.es.navLogout).toBe('Cerrar sesión');
    expect(translations.en.navLogout).toBe('Log out');
    expect(translations.fr.navLogout).toBe('Déconnexion');
    expect(translations.pt.navLogout).toBe('Sair');

    // Check action buttons
    expect(translations.es.publishNeed).toBe('Pedir ayuda');
    expect(translations.en.publishNeed).toBe('Ask for help');
    expect(translations.pt.publishNeed).toBe('Publicar necessidade');
    expect(translations.fr.publishNeed).toBe('Publier un besoin');

    expect(translations.es.offerHelp).toBe('Ofrecer ayuda');
    expect(translations.en.offerHelp).toBe('Offer help');
    expect(translations.pt.offerHelp).toBe('Oferecer ajuda');
    expect(translations.fr.offerHelp).toBe('Offrir de l\'aide');

    // Check filters & views
    expect(translations.es.filterAll).toBe('Todo');
    expect(translations.en.filterAll).toBe('All');
    expect(translations.pt.filterAll).toBe('Tudo');
    expect(translations.fr.filterAll).toBe('Tout');

    expect(translations.es.filterNeeds).toBe('Necesidades');
    expect(translations.en.filterNeeds).toBe('Needs');
    expect(translations.pt.filterNeeds).toBe('Necessidades');
    expect(translations.fr.filterNeeds).toBe('Besoins');

    expect(translations.es.filterOffers).toBe('Ofertas');
    expect(translations.en.filterOffers).toBe('Offers');
    expect(translations.pt.filterOffers).toBe('Ofertas');
    expect(translations.fr.filterOffers).toBe('Offres');

    expect(translations.es.mapView).toBe('Mapa');
    expect(translations.en.mapView).toBe('Map');
    expect(translations.pt.mapView).toBe('Mapa');
    expect(translations.fr.mapView).toBe('Carte');

    expect(translations.es.listView).toBe('Lista');
    expect(translations.en.listView).toBe('List');
    expect(translations.pt.listView).toBe('Lista');
    expect(translations.fr.listView).toBe('Liste');
  });
});
