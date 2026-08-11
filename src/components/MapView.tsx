import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Need, Priority } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../utils/formatters';

interface MapViewProps {
  needs: Need[];
  selectedNeedId?: string | null;
  onSelectNeed: (need: Need) => void;
  userLat?: number | null;
  userLng?: number | null;
  // Location picker mode
  isPickerMode?: boolean;
  pickerPosition?: { lat: number; lng: number } | null;
  onPickPosition?: (pos: { lat: number; lng: number }) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  needs,
  selectedNeedId,
  onSelectNeed,
  userLat,
  userLng,
  isPickerMode = false,
  pickerPosition,
  onPickPosition,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Default Cali Center
  const caliCenter: [number, number] = [3.4516, -76.532];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: caliCenter,
      zoom: 13,
      zoomControl: true,
    } as any);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers for Needs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m: L.Marker) => m.remove());
    markersRef.current = {};

    if (isPickerMode) return; // Don't render need pins in location picker mode

    needs.forEach((need) => {
      if (!need.latitude || !need.longitude) return;

      const priority = need.priority || 'MEDIUM';
      const colorHex =
        priority === 'CRITICAL'
          ? '#dc2626'
          : priority === 'HIGH'
          ? '#ea580c'
          : priority === 'MEDIUM'
          ? '#d97706'
          : '#059669';

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
            ${priority === 'CRITICAL' ? '!' : need.categories.length}
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

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="background-color: ${colorHex}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${PRIORITY_CONFIG[priority].label.toUpperCase()}
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
  }, [needs, isPickerMode, onSelectNeed]);

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
    <div className="relative w-full h-full min-h-[300px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Overlay */}
      {!isPickerMode && (
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-300 shadow-md text-xs space-y-1">
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
