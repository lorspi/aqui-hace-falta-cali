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
      'zoomIn',
      'zoomOut',
      'mapNeedsAndOffers',
      'mapMarkerNeed',
      'mapMarkerOffer',
      'sections',
      'radarHome',
      'languageSelector',
      'whatToSee',
      'viewSelector',
      'publicationsList',
      'newPlural',
      'newSingular',
      'hideNotice',
      'devModeNotice',
      'closeMenu',
      'menu',
      'unread',
      'markAsRead',
      'viewAllNotices',
      'whatNoticesToSee',
      'noticesEmpty',
      'nothingUnread',
      'nothingNew',
      'verifiedCommunity',
      'today',
      'yesterday',
      'earlier',
      'pendingPlural',
      'viewUserProfile',
      'closeFilters',
      'seeMoreFiltersApplied',
      'clearSearch',
      'removeFilter',
      'previousPhoto',
      'nextPhoto',
      'organizationsTab',
      'communitiesTab',
      'communityAndZone',
      'activityAndResources',
      'flowGroupPeopleQuestion',
      'flowGroupHomesQuestion',
      'flowGroupAnimalsQuestion',
      'unitPeople',
      'unitHomes',
      'unitAnimals',
      'flowHowManyDays',
      'flowHowMuchNeededEach',
      'flowGpsLoading',
      'flowGpsButton',
      'flowCitySectorLabel',
      'flowAddressNumberLabel',
      'flowAddressRequired',
      'flowSearchingLocationOnMap',
      'flowLocationNotFoundError',
      'flowPlaceTypeLabel',
      'flowHowToGetThere',
      'flowMapAdjustPointAria',
      'flowCenterLocationOrPin',
      'flowPinDragTooltip',
      'flowSomethingMoreNeed',
      'flowSomethingMoreOffer',
      'flowWhoIsHelpFor',
      'flowUnspecified',
      'flowNoPhotos',
      'flowNoLink',
      'flowLink',
      'flowAdd',
      'flowHowCalculated',
      'flowGuideNotice',
      'flowWeCalculated',
      'flowCalculated',
      'flowDeliveryRadius',
      'flowDeliveryShipping',
      'flowPickupDescription',
      'flowRemoteChannels',
      'flowSchedule',
      'flowSchedulePlaceholder',
      'flowShowOrgOnMap',
      'flowOrgType',
      'flowConditions',
      'flowConditionsPlaceholder',
      'flowAvailableQuantity',
      'flowAvailability',
      'flowAvailableUntilDate',
      'flowDatePastError',
      'flowDateRequiredError',
      'flowRegisteredBadge',
      'flowFromDonationTitle',
      'flowNoRegisteredResourcesTitle',
      'flowNoRegisteredResourcesText',
      'flowGettingAddressFromPin',
      'flowGpsNotSupported',
      'flowGpsPermissionDenied',
      'flowGpsFailed',
    ] as const;

    const langs = ['es', 'en', 'pt', 'fr'] as const;

    for (const lang of langs) {
      for (const key of keys) {
        expect(translations[lang][key]).toBeDefined();
        expect(translations[lang][key].length).toBeGreaterThan(0);
      }
    }
  });

  it('verifica que las traducciones en inglés no tengan textos en español para los casos de QA (23 oct)', () => {
    expect(translations.en.moreActions).toBe('More actions');
    expect(translations.en.collapseMenu).toBe('Collapse menu');
    expect(translations.en.expandMenu).toBe('Expand menu');
    expect(translations.en.minimizePanel).toBe('Minimize panel');
    expect(translations.en.showPanel).toBe('Show panel');
    expect(translations.en.showRightPanel).toBe('Show right panel');
    expect(translations.en.goToMyLocation).toBe('Go to my location');
    expect(translations.en.zoomIn).toBe('Zoom in');
    expect(translations.en.zoomOut).toBe('Zoom out');
    expect(translations.en.mapNeedsAndOffers).toBe('Map of needs and offers');
    expect(translations.en.mapMarkerNeed).toBe('Need');
    expect(translations.en.mapMarkerOffer).toBe('Offer');

    // 8 etiquetas reportadas por QA el 23 oct 2026:
    expect(translations.en.sections).toBe('Sections');
    expect(translations.en.radarHome).toBe('RaDAR de ayuda, home');
    expect(translations.en.languageSelector).toBe('Language');
    expect(translations.en.whatToSee).toBe('What you want to see');
    expect(translations.en.viewSelector).toBe('View');
    expect(translations.en.newPlural).toBe('new');
    expect(translations.en.hideNotice).toBe('Hide notice');
    expect(translations.en.unread).toBe('Unread');
    expect(translations.en.markAsRead).toBe('Mark as read');
    expect(translations.en.viewAllNotices).toBe('View all');
    expect(translations.en.closeFilters).toBe('Close filters');
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

  it('maneja publicaciones comunitarias con titulo inicializado en español sin propagar frases compuestas a actorPublicacion', () => {
    // Caso QA: publicaciones con titulo mock "Agua potable, de Comunidad" pero org/punto vacíos
    const pub: Publicacion = {
      id: 'p4',
      tipo: 'necesidad',
      perfil: 'comunitario',
      titulo: 'Agua potable, de Comunidad',
      org: '',
      punto: '',
      verificada: false,
      lat: 4.6,
      lng: -74.1,
      zona: 'Bosa',
      recursos: [{ item: 'Agua potable', unidad: 'L', total: 100, tramos: [] }],
    };

    // actorPublicacion no debe devolver la frase en español "Agua potable, de Comunidad"
    expect(actorPublicacion(pub, 'es')).toBe('Comunidad en Bosa');
    expect(actorPublicacion(pub, 'en')).toBe('Community in Bosa');
    expect(tituloPublicacion(pub, 'en')).toBe('Drinking water, from Community in Bosa');
  });
});
