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
  isApproximation?: boolean;
  approximateLevel?: 'intersection' | 'street' | 'neighborhood';
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
    const cleanDir = address?.trim() || '';
    const cleanSector = sectorOrCity?.trim() || '';

    if (!cleanDir && !cleanSector) return null;

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
