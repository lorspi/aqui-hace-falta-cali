/**
 * Ciudades y municipios del Valle del Cauca afectados
 * Coordenadas centrales y radio aproximado para detección automática
 */

export interface ValleCity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number; // radio para detección automática
}

export const VALLE_CITIES: ValleCity[] = [
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

// "Todos" option for the dropdown
export const ALL_VALLE_ID = "valle-del-cauca";

/**
 * Detect which city a coordinate falls into based on distance from center
 */
export function detectCityFromCoords(lat: number, lng: number): ValleCity | null {
  let closest: ValleCity | null = null;
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
