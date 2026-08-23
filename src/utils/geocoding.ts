/**
 * Geocoding utility using Nominatim (OpenStreetMap) — free, no API key needed.
 * Converts an address string to lat/lng coordinates.
 *
 * Rate limit: max 1 request per second. We add a small delay for batch operations.
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocode an address in a specific city of Colombia.
 * Appends the city context to improve accuracy.
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
        "User-Agent": "AquiHaceFalta-Cali/1.0 (Emergency Coordination Platform)",
      },
    });

    if (!response.ok) return null;
    const results = await response.json();
    if (!results || results.length === 0) return null;

    const best = results[0];
    const lat = parseFloat(best.lat);
    const lng = parseFloat(best.lon);

    if (isNaN(lat) || isNaN(lng)) return null;

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
 * Geocode an address in a specific city of Colombia.
 * Appends neighborhood and city context, with graceful fallbacks.
 */
export async function geocodeAddress(
  address: string,
  neighborhood?: string,
  cityName?: string
): Promise<GeocodingResult | null> {
  try {
    const city = cityName || "Cali";
    const cleanAddress = address.trim();
    const cleanNeighborhood = neighborhood?.trim() || "";

    // 1. Full attempt: Address + Neighborhood + City
    let query1 = cleanAddress;
    if (cleanNeighborhood && !query1.toLowerCase().includes(cleanNeighborhood.toLowerCase())) {
      query1 += `, ${cleanNeighborhood}`;
    }
    if (!query1.toLowerCase().includes(city.toLowerCase())) {
      query1 += `, ${city}, Colombia`;
    }

    let res = await fetchNominatim(query1);
    if (res) return res;

    // 2. Fallback 1: Neighborhood + City (helpful when exact house/manzana is not mapped in OpenStreetMap)
    if (cleanNeighborhood) {
      let query2 = `${cleanNeighborhood}, ${city}, Colombia`;
      res = await fetchNominatim(query2);
      if (res) return res;
    }

    // 3. Fallback 2: City + Colombia
    let query3 = `${city}, Colombia`;
    res = await fetchNominatim(query3);
    return res;
  } catch (error) {
    console.warn("[Geocoding] Error:", error);
    return null;
  }
}

/**
 * Delay helper for respecting Nominatim rate limits in batch operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
