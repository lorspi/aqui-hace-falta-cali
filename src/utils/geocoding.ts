/**
 * Geocoding utility using Google Maps (primary) with seamless fallback to
 * Photon & Nominatim (OpenStreetMap) — high precision in Colombia with zero downtime.
 * Converts an address string to lat/lng coordinates and vice versa.
 */

declare global {
  interface Window {
    google?: any;
  }
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  displayName: string;
  isApproximation?: boolean;
  approximateLevel?: 'intersection' | 'street' | 'neighborhood';
}

/**
 * Carga dinámica y asíncrona del script oficial de Google Maps JavaScript API.
 * Evita llamadas duplicadas y se resuelve inmediatamente si ya está disponible en window.
 */
let googleMapsScriptPromise: Promise<boolean> | null = null;

export function loadGoogleMapsScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (
    window.google?.maps?.Geocoder ||
    window.google?.maps?.places?.AutocompleteService ||
    window.google?.maps?.places?.AutocompleteSuggestion ||
    window.google?.maps?.places?.Place
  ) {
    return Promise.resolve(true);
  }
  if (googleMapsScriptPromise) return googleMapsScriptPromise;
  if (typeof document === 'undefined') return Promise.resolve(false);

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(false);

  googleMapsScriptPromise = new Promise<boolean>((resolve) => {
    const finish = (ok: boolean) => {
      if (!ok) {
        googleMapsScriptPromise = null;
      }
      resolve(ok);
    };

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if (window.google?.maps?.Geocoder) {
        finish(true);
        return;
      }
      existing.addEventListener('load', () => finish(Boolean(window.google?.maps?.Geocoder)));
      existing.addEventListener('error', () => finish(false));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=es&region=CO`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      finish(Boolean(window.google?.maps?.Geocoder));
    };
    script.onerror = () => {
      console.warn('[GoogleMaps] Error cargando Google Maps API script');
      finish(false);
    };
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

/**
 * Consulta geocodificación hacia adelante usando Google Maps Geocoder (para Colombia).
 */
export async function fetchGoogleGeocode(
  query: string,
  bias?: { lat: number; lon: number } | null
): Promise<GeocodingResult | null> {
  try {
    const isLoaded = await loadGoogleMapsScript();
    if (!isLoaded || !window.google?.maps?.Geocoder) return null;

    const geocoder = new window.google.maps.Geocoder();
    const req: any = {
      address: query,
      componentRestrictions: { country: 'CO' },
    };

    if (bias) {
      req.bounds = {
        south: bias.lat - 0.35,
        north: bias.lat + 0.35,
        west: bias.lon - 0.35,
        east: bias.lon + 0.35,
      };
    }

    const results = await new Promise<any[]>((resolve) => {
      geocoder.geocode(req, (res: any, status: string) => {
        if (status === 'OK' && Array.isArray(res) && res.length > 0) {
          resolve(res);
        } else {
          resolve([]);
        }
      });
    });

    if (!results || results.length === 0) return null;

    const best = results[0];
    const loc = best.geometry?.location;
    const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
    const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null;
    if (isCountryCentroid(lat, lng)) return null;

    const locationType = best.geometry?.location_type;
    const isApprox = locationType === 'GEOMETRIC_CENTER' || locationType === 'APPROXIMATE';
    const approxLevel = locationType === 'APPROXIMATE' ? 'neighborhood' : locationType === 'GEOMETRIC_CENTER' ? 'intersection' : 'street';

    return {
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      displayName: best.formatted_address || query,
      isApproximation: isApprox,
      approximateLevel: isApprox ? approxLevel : undefined,
    };
  } catch (err) {
    console.warn('[Google Geocode] Error:', err);
    return null;
  }
}

/**
 * Consulta geocodificación inversa usando Google Maps Geocoder,
 * separando calle/nomenclatura y sector/ciudad de forma estructurada.
 */
export async function fetchGoogleReverseGeocodeStructured(
  lat: number,
  lng: number
): Promise<StructuredAddressResult | null> {
  try {
    const isLoaded = await loadGoogleMapsScript();
    if (!isLoaded || !window.google?.maps?.Geocoder) return null;

    const geocoder = new window.google.maps.Geocoder();
    const results = await new Promise<any[]>((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (res: any, status: string) => {
        if (status === 'OK' && Array.isArray(res) && res.length > 0) {
          resolve(res);
        } else {
          resolve([]);
        }
      });
    });

    if (!results || results.length === 0) return null;

    // Preferir resultados de tipo 'street_address' o 'premise'
    const best = results.find((r: any) => r.types?.includes('street_address') || r.types?.includes('premise')) || results[0];
    const components: any[] = best.address_components || [];
    const getComp = (type: string) => components.find((c: any) => c.types?.includes(type))?.long_name || '';

    const route = getComp('route');
    const streetNumber = getComp('street_number');
    const neighborhood = getComp('neighborhood') || getComp('sublocality') || getComp('sublocality_level_1');
    const city = getComp('locality') || getComp('administrative_area_level_2');

    let direccionNum = route;
    if (route && streetNumber) {
      direccionNum = `${route} #${streetNumber.replace(/^[#№°\s]+/, '')}`;
    } else if (!direccionNum && streetNumber) {
      direccionNum = streetNumber;
    }

    const barrioSector = [neighborhood, city].filter(Boolean).join(', ');
    const direccionCompleta = best.formatted_address || [direccionNum, barrioSector].filter(Boolean).join(', ');

    if (!direccionNum && !barrioSector) return null;

    return {
      direccionNum,
      barrioSector,
      direccionCompleta,
    };
  } catch (err) {
    console.warn('[Google Reverse Geocode] Error:', err);
    return null;
  }
}

/**
 * Consulta geocodificación inversa para obtener ciudad, departamento y país con Google.
 */
export async function fetchGoogleReverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodingResult | null> {
  try {
    const isLoaded = await loadGoogleMapsScript();
    if (!isLoaded || !window.google?.maps?.Geocoder) return null;

    const geocoder = new window.google.maps.Geocoder();
    const results = await new Promise<any[]>((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (res: any, status: string) => {
        if (status === 'OK' && Array.isArray(res) && res.length > 0) {
          resolve(res);
        } else {
          resolve([]);
        }
      });
    });

    if (!results || results.length === 0) return null;
    const best = results[0];
    const components: any[] = best.address_components || [];
    const getComp = (type: string) => components.find((c: any) => c.types?.includes(type))?.long_name || '';

    const city = getComp('locality') || getComp('administrative_area_level_2');
    const department = getComp('administrative_area_level_1');
    const country = getComp('country');

    return {
      city,
      department,
      country,
      displayName: best.formatted_address || '',
    };
  } catch {
    return null;
  }
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * Calcula la distancia aproximada en kilómetros entre dos coordenadas geográficas.
 */
function distanciaAproximadaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111.32;
  const dLon = (lon2 - lon1) * 111.32 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Consulta sugerencias de direcciones y lugares mediante la API abierta Photon (OpenStreetMap).
 * Funciona como respaldo instantáneo y sin costo si la API de Google Places no está disponible o falla.
 * Incluye sanitización de caracteres colombianos (#, No.) y filtro geográfico para descartar resultados lejanos.
 */
export async function fetchPhotonPredictions(
  input: string,
  biasCoords?: { lat: number; lng: number } | null
): Promise<PlaceSuggestion[]> {
  try {
    const rawInput = input?.trim();
    if (!rawInput || rawInput.length < 3) return [];

    // Limpiar caracteres especiales de nomenclatura (#, No., N°) que rompen la tokenización de OSM
    const cleanInput = rawInput
      .replace(/[#№°]/g, ' ')
      .replace(/\b(no|nro|numero)\.?\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanInput)}&limit=8`;
    if (biasCoords && typeof biasCoords.lat === 'number' && typeof biasCoords.lng === 'number') {
      url += `&lat=${biasCoords.lat}&lon=${biasCoords.lng}`;
    }

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data?.features || !Array.isArray(data.features)) return [];

    // Filtrar para evitar resultados absurdos a miles de km (Polonia, Egipto, etc.) cuando hay biasCoords
    const featuresFiltradas = data.features.filter((f: any) => {
      if (!f.geometry?.coordinates || f.geometry.coordinates.length < 2) return false;
      if (!biasCoords) return true;

      const [lon, lat] = f.geometry.coordinates;
      const dKm = distanciaAproximadaKm(biasCoords.lat, biasCoords.lng, lat, lon);
      return dKm <= 1500;
    });

    return featuresFiltradas
      .slice(0, 5)
      .map((f: any) => {
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties || {};
        const main = p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || cleanInput;
        const secondary = [p.locality || p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
        const full = [main, secondary].filter(Boolean).join(', ');
        return {
          placeId: `osm_${lat}_${lon}_${encodeURIComponent(full)}`,
          description: full,
          mainText: main,
          secondaryText: secondary,
        };
      });
  } catch (err) {
    console.warn('[Photon Predictions] Error:', err);
    return [];
  }
}

let autocompleteService: any = null;

/**
 * Consulta predicciones de lugares y direcciones usando:
 * 1. Google Places API (New) moderna: AutocompleteSuggestion.fetchAutocompleteSuggestions
 * 2. Google Places API clásica: AutocompleteService.getPlacePredictions
 * 3. Fallback inteligente a Photon (OpenStreetMap) sanitizado y con sesgo por cercanía.
 */
export async function fetchGooglePlacePredictions(
  input: string,
  biasCoords?: { lat: number; lng: number } | null
): Promise<PlaceSuggestion[]> {
  const cleanInput = input?.trim();
  if (!cleanInput || cleanInput.length < 3) return [];

  const isLoaded = await loadGoogleMapsScript();
  if (!isLoaded || !window.google?.maps) {
    return fetchPhotonPredictions(cleanInput, biasCoords);
  }

  // 1. Intentar con Places API (New) moderna: AutocompleteSuggestion
  let AutocompleteSuggestion = window.google?.maps?.places?.AutocompleteSuggestion;
  if (!AutocompleteSuggestion && typeof window.google.maps.importLibrary === 'function') {
    try {
      const lib = await window.google.maps.importLibrary('places');
      AutocompleteSuggestion = lib?.AutocompleteSuggestion;
    } catch {
      // Ignorar si importLibrary falla
    }
  }

  if (AutocompleteSuggestion && typeof AutocompleteSuggestion.fetchAutocompleteSuggestions === 'function') {
    try {
      const req: any = {
        input: cleanInput,
        language: 'es',
        region: 'co',
      };
      if (biasCoords && typeof biasCoords.lat === 'number' && typeof biasCoords.lng === 'number') {
        req.locationBias = {
          center: { lat: biasCoords.lat, lng: biasCoords.lng },
          radius: 50000,
        };
      }

      const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
      const suggestions = response?.suggestions;
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        const results: PlaceSuggestion[] = suggestions
          .slice(0, 5)
          .map((s: any) => {
            const pred = s.placePrediction || s;
            const main =
              pred.mainText?.text ||
              (typeof pred.mainText?.toString === 'function' ? pred.mainText.toString() : '') ||
              pred.text?.toString() ||
              cleanInput;
            const sec =
              pred.secondaryText?.text ||
              (typeof pred.secondaryText?.toString === 'function' ? pred.secondaryText.toString() : '') ||
              '';
            const full =
              pred.text?.text ||
              (typeof pred.text?.toString === 'function' ? pred.text.toString() : '') ||
              [main, sec].filter(Boolean).join(', ');
            return {
              placeId: pred.placeId || '',
              description: full,
              mainText: main,
              secondaryText: sec,
            };
          })
          .filter((s) => Boolean(s.placeId));

        if (results.length > 0) {
          return results;
        }
      }
    } catch (err) {
      console.warn('[Google Places (New)] Error:', err);
    }
  }

  // 2. Intentar con Places API clásica: AutocompleteService
  if (window.google?.maps?.places?.AutocompleteService) {
    try {
      if (!autocompleteService) {
        autocompleteService = new window.google.maps.places.AutocompleteService();
      }

      const req: any = {
        input: cleanInput,
      };

      if (biasCoords && window.google?.maps?.LatLng) {
        req.location = new window.google.maps.LatLng(biasCoords.lat, biasCoords.lng);
        req.radius = 50000;
      }

      const classicResults = await new Promise<PlaceSuggestion[]>((resolve) => {
        autocompleteService.getPlacePredictions(req, (predictions: any[], status: string) => {
          if (status === 'OK' && Array.isArray(predictions) && predictions.length > 0) {
            const results = predictions.slice(0, 5).map((p) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
            }));
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });

      if (classicResults.length > 0) {
        return classicResults;
      }
    } catch (err) {
      console.warn('[Google Places Legacy] Error:', err);
    }
  }

  // 3. Fallback automático e inteligente a Photon (OpenStreetMap)
  return fetchPhotonPredictions(cleanInput, biasCoords);
}

/**
 * Obtiene coordenadas exactas y dirección formateada a partir del placeId.
 * Soporta IDs de Places API (New), Places API clásica y predicciones nativas 'osm_' de Photon/OSM.
 */
export async function fetchCoordinatesFromPlaceId(
  placeId: string
): Promise<GeocodingResult | null> {
  if (placeId.startsWith('osm_')) {
    const parts = placeId.split('_');
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    const displayName = parts.length > 3 ? decodeURIComponent(parts.slice(3).join('_')) : '';
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        latitude: lat,
        longitude: lng,
        lat,
        lng,
        displayName,
        isApproximation: false,
      };
    }
    return null;
  }

  const isLoaded = await loadGoogleMapsScript();
  if (!isLoaded || !window.google?.maps) return null;

  // 1. Intentar resolver con la nueva Places API (New): google.maps.places.Place
  let PlaceClass = window.google?.maps?.places?.Place;
  if (!PlaceClass && typeof window.google.maps.importLibrary === 'function') {
    try {
      const lib = await window.google.maps.importLibrary('places');
      PlaceClass = lib?.Place;
    } catch {
      // Ignorar si importLibrary falla
    }
  }

  if (PlaceClass) {
    try {
      const place = new PlaceClass({ id: placeId });
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
      const loc = place.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
      const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return {
          latitude: lat,
          longitude: lng,
          lat,
          lng,
          displayName: place.formattedAddress || place.displayName || '',
          isApproximation: false,
        };
      }
    } catch (err) {
      console.warn('[Google Place (New)] Error en fetchFields, intentando Geocoder fallback:', err);
    }
  }

  // 2. Fallback a Geocoder clásico con placeId (Geocoding API)
  if (window.google?.maps?.Geocoder) {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise<GeocodingResult | null>((resolve) => {
      geocoder.geocode({ placeId }, (results: any[], status: string) => {
        if (status === 'OK' && Array.isArray(results) && results.length > 0) {
          const best = results[0];
          const loc = best.geometry?.location;
          const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
          const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            resolve(null);
            return;
          }
          resolve({
            latitude: lat,
            longitude: lng,
            lat,
            lng,
            displayName: best.formatted_address || '',
            isApproximation: false,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  return null;
}



/**
 * Extrae la vía principal y secundaria de una dirección colombiana estándar para buscar el cruce vial.
 * Ejemplos:
 * - "Carrera 18 #123-43" -> { via1: "Carrera 18", via2: "Calle 123", viaPrincipal: "Carrera 18" }
 * - "Cra 15 # 85-30"     -> { via1: "Carrera 15", via2: "Calle 85", viaPrincipal: "Carrera 15" }
 * - "Calle 72 # 11-20"   -> { via1: "Calle 72", via2: "Carrera 11", viaPrincipal: "Calle 72" }
 * - "Diag 45 # 20-10"    -> { via1: "Diagonal 45", via2: "Transversal 20", viaPrincipal: "Diagonal 45" }
 */
export function extractColombianIntersection(address: string): { via1: string; via2: string; viaPrincipal: string } | null {
  const norm = address.trim();
  const regex = /(?:^|\b)(carrera|cra|kra|kr|k|calle|cll|cl|c|diagonal|diag|dg|transversal|transv|trv|tv|avenida|av)\.?\s*([0-9]+\s*[a-z]?(?:\s*bis)?(?:\s*[a-z])?(?:\s*(?:sur|norte|este|oeste))?)\s*(?:#|no\.?|n°|nro\.?|numero|con)\s*(?:(carrera|cra|kra|kr|k|calle|cll|cl|c|diagonal|diag|dg|transversal|transv|trv|tv|avenida|av)\.?\s*)?([0-9]+\s*[a-z]?(?:\s*bis)?(?:\s*[a-z])?(?:\s*(?:sur|norte|este|oeste))?)/i;

  const match = norm.match(regex);
  if (!match || !match[1] || !match[2] || !match[4]) return null;

  const tipoRaw1 = match[1].toLowerCase();
  const num1 = match[2].trim();
  const tipoRaw2 = match[3]?.toLowerCase();
  const num2 = match[4].trim();

  let tipo1 = 'Calle';
  let tipo2 = 'Carrera';

  if (/^(carrera|cra|kra|kr|k)/i.test(tipoRaw1)) {
    tipo1 = 'Carrera';
    tipo2 = 'Calle';
  } else if (/^(calle|cll|cl|c)/i.test(tipoRaw1)) {
    tipo1 = 'Calle';
    tipo2 = 'Carrera';
  } else if (/^(diagonal|diag|dg)/i.test(tipoRaw1)) {
    tipo1 = 'Diagonal';
    tipo2 = 'Transversal';
  } else if (/^(transversal|transv|trv|tv)/i.test(tipoRaw1)) {
    tipo1 = 'Transversal';
    tipo2 = 'Calle';
  } else if (/^(avenida|av)/i.test(tipoRaw1)) {
    tipo1 = 'Avenida';
    tipo2 = 'Calle';
  }

  if (tipoRaw2) {
    if (/^(carrera|cra|kra|kr|k)/i.test(tipoRaw2)) tipo2 = 'Carrera';
    else if (/^(calle|cll|cl|c)/i.test(tipoRaw2)) tipo2 = 'Calle';
    else if (/^(diagonal|diag|dg)/i.test(tipoRaw2)) tipo2 = 'Diagonal';
    else if (/^(transversal|transv|trv|tv)/i.test(tipoRaw2)) tipo2 = 'Transversal';
  }

  return {
    via1: `${tipo1} ${num1}`,
    via2: `${tipo2} ${num2}`,
    viaPrincipal: `${tipo1} ${num1}`,
  };
}

/**
 * Detecta si una dirección escrita por el usuario está incompleta (a medio escribir)
 * para evitar consultas anticipadas o erráticas mientras teclea.
 */
export function isAddressIncomplete(address: string): boolean {
  const t = address.trim();
  if (t.length < 3) return true;
  // Termina en símbolo de placa incompleto, separador o conector
  if (/[#№°\-\/\\,]$/.test(t)) return true;
  if (/\b(con|y|no|nro|numero)\.?\s*$/i.test(t)) return true;
  // Solo escribió el nombre de la vía sin número: "cra", "calle", "diagonal"
  if (/^(carrera|cra|kra|kr|k|calle|cll|cl|c|diagonal|diag|dg|transversal|transv|trv|tv|avenida|av)\.?$/i.test(t)) return true;
  // Termina en guión con o sin espacios: "100 -" o "100-"
  if (/\d+\s*-\s*$/.test(t)) return true;
  return false;
}

const BOGOTA_LOCALITIES = /\b(usaqu[eé]n|chapinero|santa fe|san crist[oó]bal|usme|tunjuelito|bosa|kennedy|fontib[oó]n|engativ[aá]|suba|barrios unidos|teusaquillo|los m[aá]rtires|antonio nari[ñn]o|puente aranda|la candelaria|rafael uribe|ciudad bol[ií]var|sumapaz)\b/i;
const MEDELLIN_COMUNAS = /\b(el poblado|poblado|laureles|bel[eé]n|castilla|robledo|guayabal|buenos aires|aranjuez)\b/i;
const CITIES_REGEX = /\b(bogot[aá]|cali|medell[ií]n|barranquilla|bucaramanga|cartagena|c[uú]cuta|pereira|manizales|ibagu[eé]|santa marta|villavicencio|pasto|monter[ií]a|valledupar|armenia|popay[aá]n|sincelejo|florencia|riohacha|quibd[oó]|tunja|quimbaya|soacha|bello|soledad|itag[uü][ií]|envigado|palmira|dosquebradas|floridablanca|girardot|facatativ[aá]|chia|ch[ií]a|zipaquir[aá]|rionegro)\b/i;

export interface StructuredAddressResult {
  direccionNum: string;
  barrioSector: string;
  direccionCompleta: string;
}

/**
 * Verifica si unas coordenadas corresponden al centroide geográfico de Colombia (Puerto López, Meta)
 * para evitar pins erróneos en el mapa cuando un buscador cae a nivel país.
 */
function isCountryCentroid(lat: number, lon: number): boolean {
  return Math.abs(lat - 4.0999) < 0.1 && Math.abs(lon - (-72.9088)) < 0.1;
}

/**
 * Valida si un resultado de Photon es aceptable y no un límite administrativo a nivel país o departamento.
 */
function isValidPhotonFeature(feat: any, hasStreet: boolean): boolean {
  if (!feat || !feat.properties || !feat.geometry?.coordinates) return false;
  const p = feat.properties;
  const [lon, lat] = feat.geometry.coordinates;

  if (p.type === 'country' || p.name === 'Colombia' || (p.country === 'Colombia' && !p.city && !p.state && !p.street && !p.name)) {
    return false;
  }
  if (isCountryCentroid(lat, lon)) {
    return false;
  }
  if (hasStreet) {
    if (p.type === 'county' || p.type === 'state' || (p.type === 'city' && !p.street && !p.housenumber)) {
      return false;
    }
  }
  return true;
}

/**
 * Consulta el geocodificador Photon (OSM) con tolerancia a fallos y sin los bloqueos 429 de Nominatim.
 */
async function fetchPhoton(query: string, biasLat?: number, biasLon?: number, hasStreet?: boolean): Promise<GeocodingResult | null> {
  try {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
    if (biasLat !== undefined && biasLon !== undefined) {
      url += `&lat=${biasLat}&lon=${biasLon}`;
    }
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const feats = (data.features || []).filter((f: any) => isValidPhotonFeature(f, Boolean(hasStreet)));
    if (feats.length === 0) return null;

    const best = feats.find((f: any) => f.properties.street || f.properties.housenumber || f.properties.type === 'house' || f.properties.type === 'street') || feats[0];
    const [lon, lat] = best.geometry.coordinates;
    const p = best.properties;
    const displayName = [p.name || p.street, p.housenumber, p.locality || p.district, p.city, p.country].filter(Boolean).join(', ');

    return {
      latitude: lat,
      longitude: lon,
      lat,
      lng: lon,
      displayName,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta de respaldo a Nominatim OSM (con filtro estricto anti-Puerto López).
 */
async function fetchNominatim(query: string): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "co",
      addressdetails: "1",
    })}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AquiHaceFalta-Colombia/1.0 (Plataforma Coordinacion de Ayudas)",
      },
    });

    if (!response.ok) return null;
    const results = await response.json();
    if (!results || results.length === 0) return null;

    const best = results[0];
    const lat = parseFloat(best.lat);
    const lng = parseFloat(best.lon);

    if (isNaN(lat) || isNaN(lng)) return null;
    if (best.type === 'country' || best.display_name === 'Colombia' || isCountryCentroid(lat, lng)) {
      return null;
    }

    return {
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      displayName: best.display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Geocodifica combinando sector (ciudad, localidad o barrio) y dirección/nomenclatura
 * con fallbacks inteligentes y Photon + Nominatim para que nunca mande al usuario a Puerto López o lugares erráticos.
 */
export async function geocodeAddressStructured(
  address?: string,
  sectorOrCity?: string
): Promise<GeocodingResult | null> {
  try {
    let cleanDir = address?.trim() || '';
    let cleanSector = sectorOrCity?.trim() || '';

    if (!cleanDir && !cleanSector) return null;

    // Desempaquetado inteligente si la dirección viene en un solo campo (ej: "Calle 5 # 38-25, Cali")
    if (!cleanSector && cleanDir.includes(',')) {
      const partes = cleanDir.split(',').map((p) => p.trim()).filter(Boolean);
      if (partes.length > 1) {
        cleanDir = partes[0];
        cleanSector = partes.slice(1).join(', ');
      }
    }

    // Detectar ciudad explícita o inferida desde el sector o la dirección
    let effectiveCity = '';
    const combined = `${cleanSector} ${cleanDir}`.trim();
    if (BOGOTA_LOCALITIES.test(combined)) {
      effectiveCity = 'Bogotá';
    } else if (MEDELLIN_COMUNAS.test(combined)) {
      effectiveCity = 'Medellín';
    } else {
      const cityMatch = combined.match(CITIES_REGEX);
      if (cityMatch) {
        effectiveCity = cityMatch[0];
      }
    }

    const cityLower = effectiveCity.toLowerCase();
    const bias = cityLower.includes('bogot') ? { lat: 4.7110, lon: -74.0721 } :
      cityLower.includes('cali') ? { lat: 3.4516, lon: -76.5320 } :
        cityLower.includes('medell') ? { lat: 6.2442, lon: -75.5812 } : null;

    // 0. Intento prioritario con Google Maps (máxima precisión y cobertura en Colombia)
    const queryBase = [cleanDir, cleanSector, effectiveCity].filter(Boolean).join(', ');
    if (queryBase.length >= 3) {
      const googleRes = await fetchGoogleGeocode(queryBase, bias);
      if (googleRes) {
        return googleRes;
      }
    }

    const hasStreet = cleanDir.length >= 3;

    if (hasStreet) {
      const cruce = extractColombianIntersection(cleanDir);
      const queries: string[] = [];

      if (cruce) {
        if (cleanSector) {
          queries.push(`${cruce.via2} con ${cruce.via1} ${cleanSector} ${effectiveCity}`);
          queries.push(`${cruce.via1} con ${cruce.via2} ${cleanSector} ${effectiveCity}`);
          queries.push(`${cruce.via2} ${cruce.via1} ${cleanSector} ${effectiveCity}`);
          queries.push(`${cruce.via1} ${cruce.via2} ${cleanSector} ${effectiveCity}`);
          queries.push(`${cleanDir.replace(/[#№]/g, ' ')} ${cleanSector}`);
        }
        if (effectiveCity) {
          queries.push(`${cruce.via2} con ${cruce.via1} ${effectiveCity}`);
          queries.push(`${cruce.via1} con ${cruce.via2} ${effectiveCity}`);
          queries.push(`${cruce.via2} ${cruce.via1} ${effectiveCity}`);
          queries.push(`${cruce.via1} ${cruce.via2} ${effectiveCity}`);
        }
        queries.push(`${cruce.via2} con ${cruce.via1} Colombia`);
        queries.push(`${cruce.via1} con ${cruce.via2} Colombia`);
      } else {
        if (cleanSector) queries.push(`${cleanDir.replace(/[#№]/g, ' ')} ${cleanSector} ${effectiveCity}`);
        if (effectiveCity) queries.push(`${cleanDir.replace(/[#№]/g, ' ')} ${effectiveCity}`);
        queries.push(`${cleanDir.replace(/[#№]/g, ' ')} Colombia`);
      }

      const seen = new Set<string>();
      for (const rawQ of queries) {
        const q = rawQ.replace(/\s+/g, ' ').trim();
        if (seen.has(q)) continue;
        seen.add(q);

        // 1. Probar en Photon
        const resPhoton = await fetchPhoton(q, bias?.lat, bias?.lon, true);
        if (resPhoton) {
          return { ...resPhoton, isApproximation: Boolean(cruce), approximateLevel: cruce ? 'intersection' : 'street' };
        }

        // 2. Probar en Nominatim como respaldo
        const resNominatim = await fetchNominatim(q);
        if (resNominatim) {
          return { ...resNominatim, isApproximation: Boolean(cruce), approximateLevel: cruce ? 'intersection' : 'street' };
        }
      }
    }

    // 2. Si solo hay sector o la dirección no resolvió un número exacto:
    if (cleanSector && cleanSector.length >= 3) {
      const sectorQueries = [
        `${cleanSector} ${effectiveCity || 'Colombia'}`,
        `${cleanSector} Colombia`,
      ];
      for (const rawQ of sectorQueries) {
        const q = rawQ.replace(/\s+/g, ' ').trim();
        const resPhoton = await fetchPhoton(q, bias?.lat, bias?.lon, false);
        if (resPhoton) {
          return { ...resPhoton, isApproximation: true, approximateLevel: 'neighborhood' };
        }
        const resNom = await fetchNominatim(q);
        if (resNom) {
          return { ...resNom, isApproximation: true, approximateLevel: 'neighborhood' };
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('[Geocoding] Error:', error);
    return null;
  }
}

/**
 * Geocode an address in a specific city of Colombia.
 * Appends neighborhood and city context, with graceful fallbacks.
 */
export async function geocodeAddress(
  address: string,
  neighborhood?: string,
  cityName?: string
): Promise<GeocodingResult | null> {
  const cleanAddr = address?.trim() || '';
  if (!cleanAddr || cleanAddr.length < 3) return null;

  // Si address es inválido (ej. "zzzz" sin números ni indicadores viales)
  const hasStreetIndicator = /\b(cra|carrera|kr|calle|cll|cl|av|avenida|dg|diagonal|tv|transversal|v[ií]a|manzana|mz|lote|circular|autopista)\b/i.test(cleanAddr);
  const hasNumbers = /[0-9]/.test(cleanAddr);
  if (!hasStreetIndicator && !hasNumbers && !cleanAddr.includes(',')) {
    return null;
  }

  const sector = [neighborhood, cityName].filter(Boolean).join(', ');
  return geocodeAddressStructured(cleanAddr, sector);
}

/**
 * Delay helper for respecting Nominatim rate limits in batch operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reverse geocoding result structure for Colombia.
 */
export interface ReverseGeocodingResult {
  city: string;
  department: string;
  country: string;
  displayName: string;
}

/**
 * Reverse geocode lat/lng coordinates to a location name using Nominatim.
 * Returns city (municipio), department, and country if possible.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
  // 0. Intento prioritario con Google Maps Geocoder
  try {
    const googleRes = await fetchGoogleReverseGeocode(lat, lng);
    if (googleRes) return googleRes;
  } catch {
    /* fallback a Nominatim */
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: "json",
      addressdetails: "1",
      zoom: "10",
    })}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AquiHaceFalta-Cali/1.0 (Emergency Coordination Platform)",
      },
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (!result || !result.address) return null;

    const address = result.address;
    const city = address.city || address.town || address.municipality || address.village || '';
    const department = address.state || '';
    const country = address.country || '';

    return {
      city,
      department,
      country,
      displayName: result.display_name || '',
    };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode estructurado que separa la dirección en los dos campos de la UI:
 * - direccionNum: Calle/Carrera y número (ej. Transversal 23 #98-27)
 * - barrioSector: Barrio/Localidad y Ciudad (ej. Chicó Lago, Bogotá)
 * - direccionCompleta: Cadena unificada para almacenamiento
 */
export async function reverseGeocodeStructured(lat: number, lng: number): Promise<StructuredAddressResult | null> {
  // 0. Intento prioritario con Google Maps (oficial y máxima precisión de direcciones en Colombia)
  try {
    const googleRes = await fetchGoogleReverseGeocodeStructured(lat, lng);
    if (googleRes) return googleRes;
  } catch {
    /* fallback a Photon y Nominatim */
  }

  // 1. Intento primario con Photon (rápido, sin bloqueo 429)
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    if (res.ok) {
      const data = await res.json();
      const feat = data.features?.[0];
      if (feat && feat.properties) {
        const p = feat.properties;
        const road = p.street || (p.type === 'street' || p.type === 'house' ? p.name : '') || '';
        const num = p.housenumber ? `#${p.housenumber}` : '';
        const direccionNum = road ? (num ? `${road} ${num}` : road) : '';

        let neighbourhood = (p.locality || p.district || '').replace(/^localidad\s*/i, '').trim();
        let city = (p.city || p.town || p.municipality || '').trim();
        if (neighbourhood.toLowerCase() === city.toLowerCase()) neighbourhood = '';
        const barrioSector = [neighbourhood, city].filter(Boolean).join(', ');
        const direccionCompleta = [direccionNum, barrioSector].filter(Boolean).join(', ');

        if (direccionNum || barrioSector) {
          return { direccionNum, barrioSector, direccionCompleta };
        }
      }
    }
  } catch {
    /* fallback a Nominatim */
  }

  // 2. Intento de respaldo con Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: "json",
      addressdetails: "1",
      zoom: "18",
    })}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AquiHaceFalta-Colombia/1.0 (Plataforma Coordinacion de Ayudas)",
      },
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (!result || !result.address) return null;

    const addr = result.address;
    const road = addr.road || addr.pedestrian || addr.footway || addr.path || '';
    const houseNumber = addr.house_number || '';
    const direccionNum = road ? (houseNumber ? `${road} #${houseNumber}` : road) : '';

    let cityClean = (addr.city || addr.town || addr.municipality || addr.village || '')
      .replace(/perímetro urbano\s*/i, '')
      .trim();

    const esLocalidad = /^localidad\s*/i.test(addr.suburb || '');
    let neighbourhoodClean = (addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || '')
      .replace(/^comuna\s+[a-z0-9\s]+/i, '')
      .replace(/^comuna\s*/i, '')
      .replace(/^localidad\s*/i, '')
      .trim();

    if (neighbourhoodClean.toLowerCase() === cityClean.toLowerCase()) {
      neighbourhoodClean = '';
    }

    const prefijo = (esLocalidad || neighbourhoodClean.toLowerCase().startsWith('barrio')) ? '' : 'Barrio ';
    const barrioTexto = neighbourhoodClean ? `${prefijo}${neighbourhoodClean}` : '';
    const barrioSector = [barrioTexto, cityClean].filter(Boolean).join(', ');
    const direccionCompleta = [direccionNum, barrioSector].filter(Boolean).join(', ') || result.display_name || '';

    return { direccionNum, barrioSector, direccionCompleta };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode lat/lng to a friendly Colombian street address string for input fields.
 */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  const structured = await reverseGeocodeStructured(lat, lng);
  return structured?.direccionCompleta || null;
}
