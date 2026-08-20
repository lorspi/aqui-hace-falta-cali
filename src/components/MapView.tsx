import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Need, Offer, Priority, ViewMode } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../utils/formatters';
import { ALL_COLOMBIA_ID } from '../data/colombiaCities';

interface MapViewProps {
  needs: Need[];
  selectedNeedId?: string | null;
  onSelectNeed: (need: Need) => void;
  userLat?: number | null;
  userLng?: number | null;
  selectedCityId?: string;
  onMapCenterChanged?: (lat: number, lng: number) => void;
  // Location picker mode
  isPickerMode?: boolean;
  pickerPosition?: { lat: number; lng: number } | null;
  onPickPosition?: (pos: { lat: number; lng: number }) => void;
  // Offers support
  offers?: Offer[];
  viewMode?: ViewMode;
  onSelectOffer?: (offer: Offer) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  needs,
  selectedNeedId,
  onSelectNeed,
  userLat,
  userLng,
  selectedCityId,
  onMapCenterChanged,
  isPickerMode = false,
  pickerPosition,
  onPickPosition,
  offers,
  viewMode,
  onSelectOffer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const offerMarkersRef = useRef<Record<string, L.Marker>>({});
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const isFlyingRef = useRef(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const scrollHintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default Cali Center
  const caliCenter: [number, number] = [3.4516, -76.532];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Don't initialize on hidden containers (mobile: map starts hidden in LIST view)
    const container = mapContainerRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            observer.disconnect();
            setMapReady(true);
          }
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    const map = L.map(mapContainerRef.current, {
      center: caliCenter,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    } as any);

    // Enable scroll zoom only when Ctrl/Cmd is held
    map.on('mousedown', () => {});
    mapContainerRef.current.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        map.scrollWheelZoom.enable();
      } else {
        map.scrollWheelZoom.disable();
        setShowScrollHint(true);
        if (scrollHintTimeout.current) clearTimeout(scrollHintTimeout.current);
        scrollHintTimeout.current = setTimeout(() => setShowScrollHint(false), 1500);
      }
    }, { passive: false });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapInitialized(true);

    // Fire onMapCenterChanged when user pans/zooms (not during programmatic flyTo)
    map.on('moveend', () => {
      if (isFlyingRef.current) return;
      if (onMapCenterChanged) {
        const center = map.getCenter();
        onMapCenterChanged(center.lat, center.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapReady]);

  // Fly to selected city when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCityId) return;

    isFlyingRef.current = true;

    const onFlyEnd = () => {
      isFlyingRef.current = false;
      map.off('moveend', onFlyEnd);
    };
    map.on('moveend', onFlyEnd);

    if (selectedCityId === ALL_COLOMBIA_ID) {
      // Show all of Colombia
      map.flyTo([4.5, -74.0], 6, { animate: true, duration: 1 });
    } else {
      // When a specific city is selected, let the markers define the bounds
      // If there are visible needs/offers with coordinates, the map will adjust via the marker bounds
      // Otherwise fall back to Colombia center
      isFlyingRef.current = false;
      map.off('moveend', onFlyEnd);
    }
  }, [selectedCityId]);

  // Update Markers for Needs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m: L.Marker) => m.remove());
    markersRef.current = {};

    if (isPickerMode) return; // Don't render need pins in location picker mode

    // When ViewMode is "OFFERS", do NOT render need markers
    if (viewMode === 'OFFERS') return;

    needs.forEach((need) => {
      if (!need.latitude || !need.longitude || isNaN(need.latitude) || isNaN(need.longitude)) return;

      const priority = need.priority || 'MEDIUM';
      const isCollectionCenter = need.placeType === 'CENTRO_ACOPIO';
      const colorHex = isCollectionCenter
        ? '#7c3aed'
        : priority === 'CRITICAL'
        ? '#dc2626'
        : priority === 'HIGH'
        ? '#ea580c'
        : priority === 'MEDIUM'
        ? '#d97706'
        : '#059669';

      // SVG icon for collection center (package-open from Lucide)
      const collectionCenterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-9"/><path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z"/><path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13"/><path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36"/></svg>`;

      const innerContent = isCollectionCenter
        ? collectionCenterSvg
        : priority === 'CRITICAL' ? '!' : String(need.categories.length);

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${colorHex};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          ">
            ${innerContent}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([need.latitude, need.longitude], { icon: customIcon }).addTo(map);

      // Popup html
      const catIcons = need.categories
        .slice(0, 3)
        .map((c) => CATEGORY_LABELS[c]?.icon || '🔹')
        .join(' ');

      const priorityLabel = isCollectionCenter ? 'CENTRO DE ACOPIO' : PRIORITY_CONFIG[priority].label.toUpperCase();

      const popupHtml = `
        <div style="font-family: 'Hanken Grotesk', sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="background-color: ${colorHex}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${priorityLabel}
            </span>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">${need.neighborhood}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${need.title}
          </h4>
          <p style="font-size: 11px; color: #334155; margin: 0 0 6px 0;">
            ${catIcons} ${need.categories.map((c) => CATEGORY_LABELS[c]?.label).join(', ')}
          </p>
          <div style="margin-top: 6px;">
            <button id="btn-popup-${need.id}" style="
              width: 100%;
              background-color: #0f172a;
              color: white;
              border: none;
              padding: 6px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              cursor: pointer;
            ">
              Ver detalles y ayudar →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${need.id}`);
        if (btn) {
          btn.onclick = () => onSelectNeed(need);
        }
      });

      // On mobile, double-tap marker opens detail directly
      let lastTap = 0;
      marker.on('click', () => {
        const now = Date.now();
        if (now - lastTap < 400) {
          // Double tap — open detail directly
          onSelectNeed(need);
        }
        lastTap = now;
      });

      markersRef.current[need.id] = marker;
    });
  }, [needs, isPickerMode, onSelectNeed, viewMode, mapInitialized]);

  // Update Markers for Offers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing offer markers
    Object.values(offerMarkersRef.current).forEach((m) => m.remove());
    offerMarkersRef.current = {};

    if (isPickerMode) return; // Don't render offer pins in location picker mode

    // When ViewMode is "NEEDS", do NOT render offer markers
    if (viewMode === 'NEEDS' || !viewMode) return;

    // Only render offers that are VERIFIED or PENDING_VERIFICATION and AVAILABLE or PARTIALLY_AVAILABLE
    const visibleOffers = (offers || []).filter((offer) => {
      if (offer.verificationStatus !== 'VERIFIED' && offer.verificationStatus !== 'PENDING_VERIFICATION') return false;
      if (offer.offerStatus !== 'AVAILABLE' && offer.offerStatus !== 'PARTIALLY_AVAILABLE') return false;
      // Skip offers with invalid/missing lat/lng
      if (
        offer.latitude == null ||
        offer.longitude == null ||
        isNaN(offer.latitude) ||
        isNaN(offer.longitude) ||
        offer.latitude < -90 ||
        offer.latitude > 90 ||
        offer.longitude < -180 ||
        offer.longitude > 180
      ) {
        return false;
      }
      return true;
    });

    visibleOffers.forEach((offer) => {
      // SVG icon for offers (heart-handshake from Lucide)
      const heartHandshakeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/></svg>`;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: #2563eb;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
          ">
            ${heartHandshakeSvg}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([offer.latitude, offer.longitude], { icon: customIcon }).addTo(map);

      // Build popup HTML matching need popup style
      const catIcons = offer.categories
        .slice(0, 3)
        .map((c) => CATEGORY_LABELS[c]?.icon || '🔹')
        .join(' ');

      const popupHtml = `
        <div style="font-family: 'Hanken Grotesk', sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              OFERTA
            </span>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">${offer.neighborhood}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${offer.title}
          </h4>
          <p style="font-size: 11px; color: #334155; margin: 0 0 6px 0;">
            ${catIcons} ${offer.categories.map((c) => CATEGORY_LABELS[c]?.label || c).join(', ')}
          </p>
          <div style="margin-top: 6px;">
            <button id="btn-popup-offer-${offer.id}" style="
              width: 100%;
              background-color: #2563eb;
              color: white;
              border: none;
              padding: 6px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              cursor: pointer;
            ">
              Ver detalles →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-offer-${offer.id}`);
        if (btn) {
          btn.onclick = () => { if (onSelectOffer) onSelectOffer(offer); };
        }
      });

      // Double-tap opens detail directly
      let lastTap = 0;
      marker.on('click', () => {
        const now = Date.now();
        if (now - lastTap < 400) {
          if (onSelectOffer) onSelectOffer(offer);
        }
        lastTap = now;
      });

      offerMarkersRef.current[offer.id] = marker as any;
    });
  }, [offers, isPickerMode, viewMode, mapInitialized, onSelectOffer]);

  // Center on Selected Need
  useEffect(() => {
    if (!selectedNeedId || !mapInstanceRef.current) return;
    const need = needs.find((n) => n.id === selectedNeedId);
    if (need && need.latitude && need.longitude) {
      mapInstanceRef.current.setView([need.latitude, need.longitude], 15, { animate: true });
      const marker = markersRef.current[need.id];
      if (marker) marker.openPopup();
    }
  }, [selectedNeedId, needs]);

  // User Location Marker
  const userMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLat && userLng) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #3b82f6;
            border: 3px solid white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      } else {
        userMarkerRef.current = L.marker([userLat, userLng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);
        userMarkerRef.current.bindPopup(
          '<div style="font-family: \'Hanken Grotesk\', sans-serif; text-align: center; padding: 2px;"><strong style="font-size: 12px;">📍 Tu ubicación</strong></div>'
        );
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLat, userLng]);

  // Location Picker logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode) {
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (onPickPosition) {
          onPickPosition({ lat, lng });
        }
      };

      map.on('click', handleMapClick);

      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [isPickerMode, onPickPosition]);

  // Render Picker Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && pickerPosition) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickerPosition.lat, pickerPosition.lng]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'picker-pin',
          html: `
            <div style="
              background-color: #059669;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
            ">📍</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        pickerMarkerRef.current = L.marker([pickerPosition.lat, pickerPosition.lng], {
          icon: pickerIcon,
          draggable: true,
        }).addTo(map);

        pickerMarkerRef.current.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          if (onPickPosition) {
            onPickPosition({ lat: latlng.lat, lng: latlng.lng });
          }
        });
      }
      map.setView([pickerPosition.lat, pickerPosition.lng], 15);
    } else if (!isPickerMode && pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerPosition, onPickPosition]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Overlay */}
      {!isPickerMode && (
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-300 shadow-md text-xs space-y-1 hidden">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
            Prioridad de ayuda
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span className="text-slate-700">Crítica</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span className="text-slate-700">Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-700">Media</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-slate-700">Baja</span>
          </div>
          {userLat && userLng && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-white shadow-sm" />
              <span className="text-slate-700">Tu ubicación</span>
            </div>
          )}
        </div>
      )}

      {/* Scroll Zoom Hint */}
      {showScrollHint && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm">
            Usa <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] mx-0.5">Ctrl</kbd> + scroll para hacer zoom
          </div>
        </div>
      )}

      {/* Picker Instructions */}
      {isPickerMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-950 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-emerald-500/50">
          <span>📍 Haz clic en el mapa para ubicar el punto exacto en Cali</span>
        </div>
      )}
    </div>
  );
};
