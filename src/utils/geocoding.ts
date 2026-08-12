/**
 * Geocoding utility using Nominatim (OpenStreetMap) — free, no API key needed.
 * Converts an address string to lat/lng coordinates.
 *
 * Rate limit: max 1 request per second. We add a small delay for batch operations.
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Geocode an address in a specific city of Valle del Cauca, Colombia.
 * Appends the city context to improve accuracy.
 */
export async function geocodeAddress(
  address: string,
  neighborhood?: string,
  cityName?: string
): Promise<GeocodingResult | null> {
  try {
    // Build a search query optimized for Valle del Cauca addresses
    let query = address.trim();

    // Add neighborhood if provided and not already in address
    if (neighborhood && !query.toLowerCase().includes(neighborhood.toLowerCase())) {
      query += `, ${neighborhood}`;
    }

    // Append city context (defaults to Cali for backward compat)
    const city = cityName || "Cali";
    if (!query.toLowerCase().includes(city.toLowerCase())) {
      query += `, ${city}, Valle del Cauca, Colombia`;
    }

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

    if (results.length === 0) return null;

    const best = results[0];
    return {
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      displayName: best.display_name,
    };
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
