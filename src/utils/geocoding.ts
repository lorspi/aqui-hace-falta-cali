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
    const cleanAddress = address.trim();
    if (!cleanAddress) return null;

    const city = cityName || "Cali";
    const cleanNeighborhood = neighborhood?.trim() || "";

    // Check if user already typed a specific city name or Colombia
    const hasExplicitLocation = /colombia|cali|armenia|quimbaya|bogot[aá]|medell[ií]n|barranquilla|bucaramanga|manizales|pereira|pasto|popay[aá]n|c[uú]cuta|cartagena|santa marta|ibagu[eé]/i.test(cleanAddress);

    // 1. Full attempt
    let query1 = cleanAddress;
    if (!hasExplicitLocation) {
      if (cleanNeighborhood && !query1.toLowerCase().includes(cleanNeighborhood.toLowerCase())) {
        query1 += `, ${cleanNeighborhood}`;
      }
      query1 += `, ${city}, Colombia`;
    } else if (!query1.toLowerCase().includes('colombia')) {
      query1 += `, Colombia`;
    }

    let res = await fetchNominatim(query1);
    if (res) return res;

    // 2. Fallback: Strip specific house/building detail modifiers like "Torre X", "Apto Y", "Casa Z"
    const sansDetails = cleanAddress.replace(/(torre|apto|apartamento|casa|local|piso|manzana)\s+[a-z0-9\-]+/gi, "").trim();
    if (sansDetails && sansDetails !== cleanAddress) {
      let queryDetails = hasExplicitLocation ? `${sansDetails}, Colombia` : `${sansDetails}, ${city}, Colombia`;
      res = await fetchNominatim(queryDetails);
      if (res) return res;
    }

    // 3. Fallback: Strip common prefixes like "Barrio", "B/", "Sector"
    const sansPrefix = cleanAddress.replace(/^(barrio|b\/|sector)\s+/i, "").trim();
    if (sansPrefix && sansPrefix !== cleanAddress) {
      let querySans = hasExplicitLocation ? `${sansPrefix}, Colombia` : `${sansPrefix}, ${city}, Colombia`;
      res = await fetchNominatim(querySans);
      if (res) return res;
    }

    // 4. Fallback: Neighborhood + City
    if (cleanNeighborhood) {
      let query2 = `${cleanNeighborhood}, ${city}, Colombia`;
      res = await fetchNominatim(query2);
      if (res) return res;
    }

    // NOTE: We intentionally do NOT fallback to city-center coordinates when an exact address fails!
    return null;
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
 * Reverse geocode lat/lng to a friendly Colombian street address string for input fields.
 */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
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
        "User-Agent": "AquiHaceFalta-Cali/1.0 (Emergency Coordination Platform)",
      },
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (!result || !result.address) return null;

    const addr = result.address;
    const road = addr.road || addr.pedestrian || addr.footway || addr.path || '';
    const houseNumber = addr.house_number || '';
    
    // Clean up technical city strings like "Perímetro Urbano Armenia" -> "Armenia"
    let cityClean = (addr.city || addr.town || addr.municipality || addr.village || '')
      .replace(/perímetro urbano\s*/i, '')
      .trim();

    // Clean up technical neighbourhood / commune strings
    let neighbourhoodClean = (addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || '')
      .replace(/^comuna\s+[a-z0-9\s]+/i, '')
      .replace(/^comuna\s*/i, '')
      .trim();

    if (neighbourhoodClean.toLowerCase() === cityClean.toLowerCase()) {
      neighbourhoodClean = '';
    }

    const parts = [];
    if (road) {
      parts.push(houseNumber ? `${road} #${houseNumber}` : road);
    }
    if (neighbourhoodClean) {
      parts.push(neighbourhoodClean.toLowerCase().startsWith('barrio') ? neighbourhoodClean : `Barrio ${neighbourhoodClean}`);
    }
    if (cityClean) {
      parts.push(cityClean);
    }

    if (parts.length > 0) {
      return parts.join(', ');
    }
    return result.display_name || null;
  } catch {
    return null;
  }
}
