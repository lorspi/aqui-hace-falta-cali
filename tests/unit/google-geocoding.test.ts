import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGoogleGeocode,
  fetchGoogleReverseGeocodeStructured,
  fetchGoogleReverseGeocode,
  geocodeAddressStructured,
  reverseGeocodeStructured,
  fetchGooglePlacePredictions,
  fetchCoordinatesFromPlaceId,
} from '../../src/utils/geocoding';

describe('Google Geocoding Integration', () => {
  const originalGoogle = (globalThis as any).window?.google;
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    // Simular entorno de navegador con window y google maps
    if (!(globalThis as any).window) {
      (globalThis as any).window = {};
    }
  });

  afterEach(() => {
    if (originalWindow) {
      (globalThis as any).window.google = originalGoogle;
    } else {
      delete (globalThis as any).window;
    }
    vi.restoreAllMocks();
  });

  it('fetchGoogleGeocode retorna GeocodingResult con coordenadas y nombre de Google', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            geometry: {
              location: {
                lat: () => 3.4516,
                lng: () => -76.532,
              },
              location_type: 'ROOFTOP',
            },
            formatted_address: 'Calle 5 # 38-25, San Fernando, Cali, Colombia',
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await fetchGoogleGeocode('Calle 5 # 38-25, Cali');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(3.4516, 4);
    expect(res?.lng).toBeCloseTo(-76.532, 4);
    expect(res?.displayName).toBe('Calle 5 # 38-25, San Fernando, Cali, Colombia');
    expect(res?.isApproximation).toBe(false);
  });

  it('fetchGoogleGeocode descarta centroide de Puerto López', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            geometry: {
              location: {
                lat: () => 4.0999,
                lng: () => -72.9088,
              },
              location_type: 'APPROXIMATE',
            },
            formatted_address: 'Colombia',
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await fetchGoogleGeocode('Dirección inexistente');
    expect(res).toBeNull();
  });

  it('fetchGoogleReverseGeocodeStructured descompone vía, número, barrio y ciudad', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            types: ['street_address'],
            formatted_address: 'Cra. 15 #85-30, Antiguo Country, Bogotá, Colombia',
            address_components: [
              { types: ['street_number'], long_name: '85-30' },
              { types: ['route'], long_name: 'Carrera 15' },
              { types: ['neighborhood', 'sublocality'], long_name: 'Antiguo Country' },
              { types: ['locality'], long_name: 'Bogotá' },
            ],
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await fetchGoogleReverseGeocodeStructured(4.6682, -74.0571);
    expect(res).not.toBeNull();
    expect(res?.direccionNum).toBe('Carrera 15 #85-30');
    expect(res?.barrioSector).toBe('Antiguo Country, Bogotá');
    expect(res?.direccionCompleta).toBe('Cra. 15 #85-30, Antiguo Country, Bogotá, Colombia');
  });

  it('geocodeAddressStructured prioriza Google Geocoding cuando está presente', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            geometry: {
              location: {
                lat: () => 3.421,
                lng: () => -76.541,
              },
              location_type: 'ROOFTOP',
            },
            formatted_address: 'Calle 9 # 44-10, Los Cámbulos, Cali, Colombia',
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await geocodeAddressStructured('Calle 9 # 44-10', 'Los Cámbulos, Cali');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(3.421, 3);
    expect(res?.lng).toBeCloseTo(-76.541, 3);
    expect(mockGeocode).toHaveBeenCalledTimes(1);
  });

  it('reverseGeocodeStructured prioriza Google Reverse Geocoding cuando está presente', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            types: ['street_address'],
            formatted_address: 'Cl. 5 #38-25, San Fernando, Cali, Valle del Cauca, Colombia',
            address_components: [
              { types: ['street_number'], long_name: '38-25' },
              { types: ['route'], long_name: 'Calle 5' },
              { types: ['neighborhood'], long_name: 'San Fernando' },
              { types: ['locality'], long_name: 'Cali' },
            ],
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await reverseGeocodeStructured(3.431, -76.535);
    expect(res).not.toBeNull();
    expect(res?.direccionNum).toBe('Calle 5 #38-25');
    expect(res?.barrioSector).toBe('San Fernando, Cali');
    expect(mockGeocode).toHaveBeenCalledTimes(1);
  });

  it('fetchGooglePlacePredictions soporta la moderna Places API (New) con AutocompleteSuggestion', async () => {
    const mockFetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
      suggestions: [
        {
          placePrediction: {
            placeId: 'places_new_456',
            text: { toString: () => 'Cra. 23 #100-32, Bogotá, Colombia' },
            mainText: { toString: () => 'Cra. 23 #100-32' },
            secondaryText: { toString: () => 'Bogotá, Colombia' },
          },
        },
      ],
    });

    (globalThis as any).window.google = {
      maps: {
        places: {
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: mockFetchAutocompleteSuggestions,
          },
        },
      },
    };

    const res = await fetchGooglePlacePredictions('cra 23#100-32', { lat: 4.68, lng: -74.05 });
    expect(res).toHaveLength(1);
    expect(res[0].placeId).toBe('places_new_456');
    expect(res[0].mainText).toBe('Cra. 23 #100-32');
    expect(res[0].secondaryText).toBe('Bogotá, Colombia');
    expect(mockFetchAutocompleteSuggestions).toHaveBeenCalledTimes(1);
  });

  it('fetchCoordinatesFromPlaceId soporta la moderna Places API (New) con Place.fetchFields', async () => {
    const mockFetchFields = vi.fn().mockImplementation(async function (this: any) {
      this.formattedAddress = 'Cra. 23 #100-32, Bogotá, Colombia';
      this.location = {
        lat: () => 4.685,
        lng: () => -74.058,
      };
    });

    (globalThis as any).window.google = {
      maps: {
        places: {
          Place: function (opts: any) {
            return {
              id: opts.id,
              fetchFields: mockFetchFields,
            };
          },
        },
      },
    };

    const res = await fetchCoordinatesFromPlaceId('places_new_456');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(4.685, 3);
    expect(res?.lng).toBeCloseTo(-74.058, 3);
    expect(res?.displayName).toBe('Cra. 23 #100-32, Bogotá, Colombia');
    expect(mockFetchFields).toHaveBeenCalledTimes(1);
  });

  it('fetchGooglePlacePredictions retorna lista de sugerencias con mainText y secondaryText en legacy', async () => {
    const mockGetPlacePredictions = vi.fn((req, callback) => {
      callback(
        [
          {
            place_id: 'place_123',
            description: 'Calle 5 # 38-25, San Fernando, Cali, Valle del Cauca, Colombia',
            structured_formatting: {
              main_text: 'Calle 5 # 38-25',
              secondary_text: 'San Fernando, Cali, Valle del Cauca, Colombia',
            },
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        places: {
          AutocompleteService: function () {
            return { getPlacePredictions: mockGetPlacePredictions };
          },
        },
      },
    };

    const res = await fetchGooglePlacePredictions('Calle 5 # 38', { lat: 3.4516, lng: -76.532 });
    expect(res).toHaveLength(1);
    expect(res[0].placeId).toBe('place_123');
    expect(res[0].mainText).toBe('Calle 5 # 38-25');
    expect(res[0].secondaryText).toContain('San Fernando, Cali');
  });

  it('fetchCoordinatesFromPlaceId resuelve coordenadas del placeId', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            geometry: {
              location: {
                lat: () => 3.4516,
                lng: () => -76.532,
              },
            },
            formatted_address: 'Calle 5 # 38-25, San Fernando, Cali, Colombia',
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    const res = await fetchCoordinatesFromPlaceId('place_123');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(3.4516, 4);
    expect(res?.lng).toBeCloseTo(-76.532, 4);
    expect(res?.displayName).toBe('Calle 5 # 38-25, San Fernando, Cali, Colombia');
  });

  it('fetchCoordinatesFromPlaceId resuelve directamente IDs con prefijo osm_ incluso si el nombre contiene guiones bajos', async () => {
    const res = await fetchCoordinatesFromPlaceId('osm_3.4516_-76.5320_Calle%205_Sector_Norte%2C%20Cali');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(3.4516, 4);
    expect(res?.lng).toBeCloseTo(-76.5320, 4);
    expect(res?.displayName).toBe('Calle 5_Sector_Norte, Cali');
    expect(res?.isApproximation).toBe(false);
  });

  it('geocodeAddressStructured desempaqueta un solo campo con comas correctamente', async () => {
    const mockGeocode = vi.fn((req, callback) => {
      callback(
        [
          {
            geometry: {
              location: {
                lat: () => 3.4516,
                lng: () => -76.532,
              },
              location_type: 'ROOFTOP',
            },
            formatted_address: 'Calle 5 # 38-25, San Fernando, Cali, Colombia',
          },
        ],
        'OK'
      );
    });

    (globalThis as any).window.google = {
      maps: {
        Geocoder: function () {
          return { geocode: mockGeocode };
        },
      },
    };

    // Probamos pasando todo en el primer parámetro con comas
    const res = await geocodeAddressStructured('Calle 5 # 38-25, San Fernando, Cali');
    expect(res).not.toBeNull();
    expect(res?.lat).toBeCloseTo(3.4516, 4);
    expect(res?.lng).toBeCloseTo(-76.532, 4);
  });
});
