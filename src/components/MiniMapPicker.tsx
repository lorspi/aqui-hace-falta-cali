import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MiniMapPickerProps {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lng: number) => void;
  height?: string;
}

/**
 * A small interactive map that shows a draggable marker.
 * Click on the map or drag the marker to set the position.
 */
export const MiniMapPicker: React.FC<MiniMapPickerProps> = ({
  latitude,
  longitude,
  onPositionChange,
  height = "200px",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OSM",
    }).addTo(map);

    // Draggable marker
    const markerIcon = L.divIcon({
      className: "picker-marker",
      html: `<div style="
        background: #4f46e5;
        width: 24px; height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: grab;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([latitude, longitude], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onPositionChange(pos.lat, pos.lng);
    });

    // Click on map to move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPositionChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker position when lat/lng change externally (geocoding)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], 16, { animate: true });
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-500">
        Haz clic en el mapa o arrastra el marcador para ajustar la ubicación.
      </p>
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-slate-300"
      />
    </div>
  );
};
