// =============================================================================
// _shared/geocoding.ts — Enriquecimiento de ubicación (S5)
// Ticket: DEV-35
//
// Módulo PURE con Web Standards únicamente (fetch, URLSearchParams): comparte
// la lógica de geocoding + detección de ciudad entre la Edge Function `webhook`
// (Deno) y los tests unitarios (vitest/Node). Cumple NFR-4.
//
// S5 enriquece la ubicación del incidente cuando la conversación no aportó
// coordenadas:
//   1. `createNominatimGeocoder()` → geocoding directo de dirección a lat/lng
//      usando Nominatim (OpenStreetMap), sin API key. Si no resuelve, devuelve
//      null (el flujo NO rechaza el evento de completado; el incidente queda
//      con lat/lng NULL y `location_enrichment_status=PENDING`).
//   2. `detectCityFromCoords(lat, lng)` → resuelve `city_id` a partir de las
//      coordenadas usando el listado de ciudades del Valle del Cauca (la
//      emergencia "terremoto-cali-2026" es regional). Cae a 'cali' por defecto.
//
// La lógica de detección de ciudad replica la de `src/data/valleCities.ts`
// (fuera de alcance de la Edge Function: no se importa código de la app Vite
// en las funciones de Supabase para mantenerlas autocontenidas).
// =============================================================================

// -----------------------------------------------------------------------------
// Ciudades del Valle del Cauca (coordenadas centrales + radio de detección)
// -----------------------------------------------------------------------------

export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export const VALLE_CITIES: City[] = [
  { id: "cali", name: "Cali", latitude: 3.4516, longitude: -76.532, radiusKm: 12 },
  { id: "palmira", name: "Palmira", latitude: 3.5394, longitude: -76.3036, radiusKm: 8 },
  { id: "buenaventura", name: "Buenaventura", latitude: 3.8824, longitude: -77.0198, radiusKm: 10 },
  { id: "tulua", name: "Tuluá", latitude: 4.0847, longitude: -76.1994, radiusKm: 6 },
  { id: "buga", name: "Guadalajara de Buga", latitude: 3.9006, longitude: -76.2978, radiusKm: 6 },
  { id: "cartago", name: "Cartago", latitude: 4.7461, longitude: -75.9117, radiusKm: 5 },
  { id: "jamundi", name: "Jamundí", latitude: 3.2618, longitude: -76.5394, radiusKm: 6 },
  { id: "yumbo", name: "Yumbo", latitude: 3.5847, longitude: -76.4967, radiusKm: 5 },
  { id: "florida", name: "Florida", latitude: 3.3255, longitude: -76.2358, radiusKm: 5 },
  { id: "candelaria", name: "Candelaria", latitude: 3.4073, longitude: -76.3469, radiusKm: 5 },
  { id: "pradera", name: "Pradera", latitude: 3.4225, longitude: -76.2456, radiusKm: 5 },
  { id: "dagua", name: "Dagua", latitude: 3.6578, longitude: -76.6928, radiusKm: 6 },
  { id: "la-cumbre", name: "La Cumbre", latitude: 3.6578, longitude: -76.5667, radiusKm: 5 },
  { id: "vijes", name: "Vijes", latitude: 3.6942, longitude: -76.4361, radiusKm: 4 },
  { id: "ginebra", name: "Ginebra", latitude: 3.7239, longitude: -76.2683, radiusKm: 4 },
  { id: "el-cerrito", name: "El Cerrito", latitude: 3.6894, longitude: -76.3189, radiusKm: 5 },
  { id: "guacari", name: "Guacarí", latitude: 3.7633, longitude: -76.3317, radiusKm: 4 },
  { id: "san-pedro", name: "San Pedro", latitude: 3.9972, longitude: -76.2233, radiusKm: 4 },
  { id: "sevilla", name: "Sevilla", latitude: 4.2714, longitude: -75.9347, radiusKm: 5 },
  { id: "caicedonia", name: "Caicedonia", latitude: 4.3292, longitude: -75.8319, radiusKm: 4 },
  { id: "roldanillo", name: "Roldanillo", latitude: 4.4133, longitude: -76.1539, radiusKm: 4 },
  { id: "zarzal", name: "Zarzal", latitude: 4.3947, longitude: -76.0736, radiusKm: 4 },
  { id: "la-union", name: "La Unión", latitude: 4.5331, longitude: -76.1042, radiusKm: 4 },
  { id: "restrepo", name: "Restrepo", latitude: 3.8267, longitude: -76.5242, radiusKm: 4 },
  { id: "calima-darien", name: "Calima-Darién", latitude: 3.9167, longitude: -76.4833, radiusKm: 5 },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detecta en qué ciudad caen unas coordenadas (dentro del radio de la ciudad).
 * Devuelve null si las coordenadas no están dentro de ninguna ciudad conocida.
 */
export function detectCityFromCoords(lat: number, lng: number): City | null {
  let closest: City | null = null;
  let closestDist = Infinity;

  for (const city of VALLE_CITIES) {
    const dist = getDistanceKm(lat, lng, city.latitude, city.longitude);
    if (dist <= city.radiusKm && dist < closestDist) {
      closest = city;
      closestDist = dist;
    }
  }

  return closest;
}

/** City id a usar cuando las coordenadas no caen en ninguna ciudad conocida. */
export const DEFAULT_CITY_ID = "cali";

/** Resuelve city_id a partir de coordenadas, con fallback al default regional. */
export function resolveCityIdFromCoords(lat: number, lng: number): string {
  return detectCityFromCoords(lat, lng)?.id ?? DEFAULT_CITY_ID;
}

// -----------------------------------------------------------------------------
// Geocoding (Nominatim / OpenStreetMap)
// -----------------------------------------------------------------------------

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/** Geocoder mínimo que la capa S5 necesita para enriquecer la ubicación. */
export interface Geocoder {
  geocode(address: string, neighborhood?: string): Promise<GeocodingResult | null>;
}

export interface NominatimGeocoderOptions {
  /** Para inyectar un fetch falso en tests. */
  fetchFn?: typeof fetch;
  /** Ciudad que se agrega como contexto a la búsqueda (default: Cali). */
  cityName?: string;
}

/**
 * Geocoder real con Nominatim (OpenStreetMap) — gratuito, sin API key.
 * Convierte una dirección (con barrio opcional) en coordenadas lat/lng.
 *
 * - Agrega contexto de ciudad ("Cali, Colombia") para mejorar la precisión.
 * - Respeta el rate-limit de Nominatim: 1 request/segundo (el flujo S5 no
 *   hace geocoding en batch; solo enriquece el incidente del completado).
 * - Si no resuelve o la red falla, devuelve null (el flujo NO rechaza el
 *   evento de completado; el incidente queda pendiente de enriquecimiento).
 */
export function createNominatimGeocoder(
  opts: NominatimGeocoderOptions = {},
): Geocoder {
  const f = opts.fetchFn ?? fetch;
  const city = opts.cityName ?? "Cali";

  return {
    async geocode(address: string, neighborhood?: string): Promise<GeocodingResult | null> {
      try {
        let query = address.trim();
        if (neighborhood && !query.toLowerCase().includes(neighborhood.toLowerCase())) {
          query += `, ${neighborhood}`;
        }
        if (!query.toLowerCase().includes(city.toLowerCase())) {
          query += `, ${city}, Colombia`;
        }

        const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
          q: query,
          format: "json",
          limit: "1",
          countrycodes: "co",
          addressdetails: "1",
        })}`;

        const response = await f(url, {
          headers: {
            "User-Agent": "AquiHaceFalta-Cali/1.0 (Emergency Coordination Platform)",
          },
        });
        if (!response.ok) return null;

        const results = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
        if (!Array.isArray(results) || results.length === 0) return null;

        const best = results[0];
        const latitude = Number.parseFloat(best.lat ?? "");
        const longitude = Number.parseFloat(best.lon ?? "");
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        return {
          latitude,
          longitude,
          displayName: best.display_name ?? "",
        };
      } catch {
        return null;
      }
    },
  };
}
