import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, CheckCircle2, Loader2, Compass } from 'lucide-react';
import { geocodeAddress } from '../../../../utils/geocoding';

interface StepOrgMapLocationProps {
  searchAddress: string;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  errors?: {
    searchAddress?: string;
    latitude?: string;
    longitude?: string;
  };
  onChangeSearchAddress: (val: string) => void;
  onChangeCoordinates: (lat: number, lng: number) => void;
}

// Icono personalizado de Pin Rojo Draggable
const createRedMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-org-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="absolute -bottom-1 w-3 h-1 bg-black/30 rounded-full blur-[1px]"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export const StepOrgMapLocation: React.FC<StepOrgMapLocationProps> = ({
  searchAddress,
  latitude = 3.4516, // Coordenadas predeterminadas (Cali)
  longitude = -76.532,
  cityName = 'Cali',
  errors,
  onChangeSearchAddress,
  onChangeCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Coordenadas actuales activas
  const currentLat = latitude || 3.4516;
  const currentLng = longitude || -76.532;

  // Inicializar o actualizar el mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Crear mapa
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Crear Marcador Draggable
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: createRedMarkerIcon(),
      }).addTo(map);

      // Evento al arrastrar el marcador
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeCoordinates(pos.lat, pos.lng);
      });

      // Evento al hacer clic en cualquier parte del mapa
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChangeCoordinates(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Actualizar posición existente
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      }
      mapInstanceRef.current.setView([currentLat, currentLng], 15);
    }
  }, [currentLat, currentLng]);

  // Ejecutar búsqueda de dirección por geocodificación
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchAddress.trim()) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const result = await geocodeAddress(searchAddress, undefined, cityName);
      if (result) {
        onChangeCoordinates(result.latitude, result.longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([result.latitude, result.longitude], 16);
        }
      } else {
        setGeocodingError('No se encontró la dirección especificada. Intenta con una referencia cercana.');
      }
    } catch (err) {
      console.error('[StepOrgMapLocation] Geocoding Error:', err);
      setGeocodingError('Ocurrió un error al buscar la dirección.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Autodetectar ubicación actual del navegador
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeocodingError('Tu navegador no soporta la geolocalización.');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChangeCoordinates(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16);
        }
        setIsGeocoding(false);
      },
      (err) => {
        console.warn('[StepOrgMapLocation] Geolocation denied:', err);
        setGeocodingError('No pudimos obtener tu ubicación actual. Permite el acceso e intenta de nuevo.');
        setIsGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Encabezado del Paso 4 de Organización */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ¿Dónde están ubicados?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Marca el punto exacto: es lo que verá la gente en el mapa para saber dónde llegar.
        </p>
      </div>

      {/* Input de Búsqueda de Dirección con Botón Buscar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => onChangeSearchAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchAddress();
                }
              }}
              placeholder="Ej: Calle 5 # 38-25, Cali..."
              className={`
                w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400
                ${
                  errors?.searchAddress
                    ? 'border-red-500 bg-red-50/30 focus:border-red-600'
                    : 'border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }
              `}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSearchAddress();
            }}
            disabled={isGeocoding || !searchAddress.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDetectLocation}
            title="Usar mi ubicación actual"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {errors?.searchAddress && (
          <p className="text-xs text-red-600 font-semibold">{errors.searchAddress}</p>
        )}
        {geocodingError && (
          <p className="text-xs text-amber-700 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
            {geocodingError}
          </p>
        )}
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-56 sm:h-64 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Texto de Confirmación Inferior en Verde */}
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl text-xs font-semibold animate-in fade-in">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Punto fijado. Arrastra el pin si no quedó exacto.</span>
      </div>
    </div>
  );
};
