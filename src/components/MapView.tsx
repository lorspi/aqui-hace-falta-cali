import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Need, Offer, Priority, ViewMode } from '../types';
import { CATEGORY_LABELS, PRIORITY_CONFIG } from '../utils/formatters';
import { ALL_COLOMBIA_ID, getCityCoordinates } from '../data/colombiaCities';
import { useMapClustering, ClusterOrPoint, isCluster } from '../hooks/useMapClustering';

interface MapViewProps {
  needs: Need[];
  selectedNeedId?: string | null;
  onSelectNeed: (need: Need) => void;
  userLat?: number | null;
  userLng?: number | null;
  selectedCityId?: string;
  /** Indicates whether the city change came from the selector (user intent) or from map panning */
  cityChangeSource?: 'selector' | 'map' | 'init';
  onMapCenterChanged?: (lat: number, lng: number) => void;
  // Location picker mode
  isPickerMode?: boolean;
  pickerPosition?: { lat: number; lng: number } | null;
  onPickPosition?: (pos: { lat: number; lng: number }) => void;
  // Offers support
  offers?: Offer[];
  viewMode?: ViewMode;
  onSelectOffer?: (offer: Offer) => void;
  // Cross-highlight
  hoveredItemId?: string | null;
  onHoverMarker?: (id: string | null) => void;
  // Direct marker focus from card CTA
  targetFocusCoords?: { lat: number; lng: number; id: string; timestamp: number } | null;
}

export const MapView: React.FC<MapViewProps> = ({
  needs,
  selectedNeedId,
  onSelectNeed,
  userLat,
  userLng,
  selectedCityId,
  cityChangeSource = 'init',
  onMapCenterChanged,
  isPickerMode = false,
  pickerPosition,
  onPickPosition,
  offers,
  viewMode,
  onSelectOffer,
  hoveredItemId,
  onHoverMarker,
  targetFocusCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const offerMarkersRef = useRef<L.Marker[]>([]);
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  // Map from item ID to its marker for cross-highlight
  const markerByIdRef = useRef<Record<string, L.Marker>>({});
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const isFlyingRef = useRef(false);
  const userPannedRef = useRef(false);
  const isZoomingRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Connector lines for displaced overlapping markers
  const displacementLinesRef = useRef<L.Polyline[]>([]);

  // Clustering hook (radius 75px)
  const { loadClusterIndex, getClusters, getClusterExpansionZoom, getClusterLeaves } =
    useMapClustering({ radius: 75, maxZoom: 16 });

  // Default Colombia Center (Panorámica Nacional ~4.57, -74.29)
  const colombiaCenter: [number, number] = [4.5709, -74.2973];

  // --- Cluster rendering helpers ---

  const createClusterIcon = (count: number, needCount: number, offerCount: number): L.DivIcon => {
    // Balanced visual scale
    const size = count < 10 ? 36 : count < 50 ? 42 : 48;
    const fontSize = size < 42 ? 12 : size < 48 ? 13 : 14;

    let bgStyle = '';
    if (needCount > 0 && offerCount > 0) {
      bgStyle = 'background: linear-gradient(135deg, #1e293b 50%, #2563eb 50%);';
    } else if (offerCount > 0) {
      bgStyle = 'background-color: #2563eb;';
    } else {
      bgStyle = 'background-color: #1e293b;';
    }

    return L.divIcon({
      className: 'custom-cluster-icon',
      html: `
        <div style="
          ${bgStyle}
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${fontSize}px;
          font-weight: bold;
          cursor: pointer;
        ">
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Handle cluster click: zoom/fly to fit all points inside the cluster
  const handleClusterClick = useCallback(
    (clusterId: number, clusterLat: number, clusterLng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const leaves = getClusterLeaves(clusterId, Infinity);
      const expansionZoom = getClusterExpansionZoom(clusterId);
      const currentZoom = map.getZoom();

      if (leaves && leaves.length > 0) {
        const coords = leaves.map((leaf) => [
          leaf.geometry.coordinates[1],
          leaf.geometry.coordinates[0],
        ] as [number, number]);

        const bounds = L.latLngBounds(coords);

        // If all items in cluster share identical coordinates
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
          const targetZoom = Math.max(currentZoom + 3, expansionZoom, 16);
          map.flyTo([clusterLat, clusterLng], targetZoom, { animate: true, duration: 0.5 });
        } else {
          // Zoom and pan to frame all points in cluster with padding
          map.flyToBounds(bounds, {
            padding: [50, 50],
            maxZoom: 17,
            animate: true,
            duration: 0.6,
          });
        }
      } else {
        const targetZoom = Math.max(currentZoom + 3, expansionZoom);
        map.flyTo([clusterLat, clusterLng], targetZoom, { animate: true, duration: 0.5 });
      }
    },
    [getClusterLeaves, getClusterExpansionZoom]
  );

  // Render unified clusters and single point markers on the map
  const renderMapClusters = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || isPickerMode) return;

    // Clear displacement lines
    displacementLinesRef.current.forEach((line) => line.remove());
    displacementLinesRef.current = [];

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    offerMarkersRef.current.forEach((m) => m.remove());
    offerMarkersRef.current = [];
    clusterMarkersRef.current.forEach((m) => m.remove());
    clusterMarkersRef.current = [];
    markerByIdRef.current = {};

    const clusters = getClusters(map);

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (isCluster(feature)) {
        const count = feature.properties.point_count;
        const clusterId = feature.properties.cluster_id;
        const needCount = feature.properties.needCount || 0;
        const offerCount = feature.properties.offerCount || 0;

        const icon = createClusterIcon(count, needCount, offerCount);
        const marker = L.marker([lat, lng], { icon }).addTo(map);

        const tooltipText =
          needCount > 0 && offerCount > 0
            ? `${needCount} necesidades, ${offerCount} ofertas`
            : needCount > 0
            ? `${needCount} necesidades`
            : `${offerCount} ofertas`;

        marker.bindTooltip(
          `<div style="font-family: 'Hanken Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 2px 4px;">${tooltipText}</div>`,
          { direction: 'top', offset: [0, -15], opacity: 0.95 }
        );

        marker.on('click', () => {
          handleClusterClick(clusterId, lat, lng);
        });

        clusterMarkersRef.current.push(marker);
      } else {
        const props = feature.properties;
        if (props.kind === 'need') {
          const need = props.item;
          const priority = need.priority || 'MEDIUM';
          const isCollectionCenter = need.placeType === 'CENTRO_ACOPIO';
          const colorHex = isCollectionCenter
            ? '#7c3aed'
            : priority === 'CRITICAL'
            ? '#CE3B3B'
            : priority === 'HIGH'
            ? '#ea580c'
            : priority === 'MEDIUM'
            ? '#F2C33D'
            : '#059669';

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

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

          const catIcons = need.categories
            .slice(0, 3)
            .map((c) => CATEGORY_LABELS[c]?.icon || '🔹')
            .join(' ');

          const priorityLabel = isCollectionCenter ? 'CENTRO DE ACOPIO' : PRIORITY_CONFIG[priority].label.toUpperCase();

          const tooltipHtml = `
            <div style="font-family: 'Hanken Grotesk', sans-serif; min-width: 180px; max-width: 240px; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span style="background-color: ${colorHex}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                  ${priorityLabel}
                </span>
                <span style="font-size: 11px; color: #64748b; font-weight: 600;">${need.neighborhood}</span>
              </div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
                ${need.title}
              </h4>
              <p style="font-size: 11px; color: #334155; margin: 0;">
                ${catIcons} ${need.categories.map((c) => CATEGORY_LABELS[c]?.label).join(', ')}
              </p>
            </div>
          `;

          marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -20], opacity: 0.95 });

          marker.on('click', () => {
            onSelectNeed(need);
          });

          marker.on('mouseover', () => {
            if (onHoverMarker) onHoverMarker(need.id);
          });
          marker.on('mouseout', () => {
            if (onHoverMarker) onHoverMarker(null);
          });

          markerByIdRef.current[need.id] = marker;
          markersRef.current.push(marker);
        } else if (props.kind === 'offer') {
          const offer = props.item;
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

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

          const catIcons = offer.categories
            .slice(0, 3)
            .map((c) => CATEGORY_LABELS[c]?.icon || '🔹')
            .join(' ');

          const tooltipHtml = `
            <div style="font-family: 'Hanken Grotesk', sans-serif; min-width: 180px; max-width: 240px; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                  OFERTA
                </span>
                <span style="font-size: 11px; color: #64748b; font-weight: 600;">${offer.neighborhood}</span>
              </div>
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
                ${offer.title}
              </h4>
              <p style="font-size: 11px; color: #334155; margin: 0;">
                ${catIcons} ${offer.categories.map((c) => CATEGORY_LABELS[c]?.label || c).join(', ')}
              </p>
            </div>
          `;

          marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -20], opacity: 0.95 });

          marker.on('click', () => {
            if (onSelectOffer) onSelectOffer(offer);
          });

          marker.on('mouseover', () => {
            if (onHoverMarker) onHoverMarker(offer.id);
          });
          marker.on('mouseout', () => {
            if (onHoverMarker) onHoverMarker(null);
          });

          markerByIdRef.current[offer.id] = marker;
          offerMarkersRef.current.push(marker);
        }
      }
    });
  }, [getClusters, handleClusterClick, isPickerMode, onSelectNeed, onSelectOffer, onHoverMarker]);

  // Auto-displace overlapping markers so all are accessible
  const displaceOverlappingMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous connector lines
    displacementLinesRef.current.forEach((line) => line.remove());
    displacementLinesRef.current = [];

    const allMarkers = [...markersRef.current, ...offerMarkersRef.current, ...clusterMarkersRef.current];
    if (allMarkers.length < 2) return;

    const nearbyDistance = 32; // pixels
    const spreadRadius = 24; // pixels offset from center
    const processed = new Set<L.Marker>();

    // Pre-calculate container points once for all markers
    const points = allMarkers.map((m) => map.latLngToContainerPoint(m.getLatLng()));

    for (let i = 0; i < allMarkers.length; i++) {
      const marker = allMarkers[i];
      if (processed.has(marker)) continue;

      const markerPoint = points[i];
      const group: L.Marker[] = [marker];
      const groupPoints: L.Point[] = [markerPoint];

      // Find all markers near this one
      for (let j = i + 1; j < allMarkers.length; j++) {
        const other = allMarkers[j];
        if (processed.has(other)) continue;
        if (markerPoint.distanceTo(points[j]) < nearbyDistance) {
          group.push(other);
          groupPoints.push(points[j]);
        }
      }

      if (group.length <= 1) continue;

      // Mark all as processed
      group.forEach((m) => processed.add(m));

      // Calculate center of the group
      const centerPoint = groupPoints.reduce(
        (acc, p) => L.point(acc.x + p.x / group.length, acc.y + p.y / group.length),
        L.point(0, 0)
      );

      // Spread markers in a circle around center
      const angleStep = (2 * Math.PI) / group.length;
      const radius = group.length <= 3 ? spreadRadius : spreadRadius + (group.length - 3) * 6;

      group.forEach((m, idx) => {
        const originalLatLng = m.getLatLng();
        const angle = angleStep * idx - Math.PI / 2;
        const newPoint = L.point(
          centerPoint.x + radius * Math.cos(angle),
          centerPoint.y + radius * Math.sin(angle)
        );
        const newLatLng = map.containerPointToLatLng(newPoint);

        // Move marker to displaced position
        m.setLatLng(newLatLng);

        // Draw connector line from displaced position to real position
        const line = L.polyline([newLatLng, originalLatLng], {
          color: '#334155',
          weight: 2,
          opacity: 0.7,
          dashArray: '4 4',
        }).addTo(map);
        displacementLinesRef.current.push(line);
      });
    }
  }, []);

  // Debounced cluster update on map move/zoom
  const debouncedUpdateClusters = useCallback(() => {
    if (isZoomingRef.current) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (isZoomingRef.current) return;
      requestAnimationFrame(() => {
        renderMapClusters();
        displaceOverlappingMarkers();
      });
    }, 100);
  }, [renderMapClusters, displaceOverlappingMarkers]);

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

    const isColombiaView = !selectedCityId || selectedCityId === ALL_COLOMBIA_ID || selectedCityId === 'ALL_COLOMBIA' || selectedCityId === 'todo-colombia';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    let initialCenter: [number, number] = colombiaCenter;
    let initialZoom = isMobile ? 5.6 : 6.0;

    if (!isColombiaView && selectedCityId) {
      const coords = getCityCoordinates(selectedCityId);
      initialCenter = [coords.lat, coords.lng];
      initialZoom = 13;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    } as any);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapInitialized(true);

    map.on('zoomstart', () => {
      isZoomingRef.current = true;
    });

    map.on('zoomend', () => {
      isZoomingRef.current = false;
      debouncedUpdateClusters();
    });

    map.on('movestart', () => {
      isZoomingRef.current = true;
    });

    map.on('moveend', () => {
      isZoomingRef.current = false;
      if (isFlyingRef.current) return;
      userPannedRef.current = true;
      if (onMapCenterChanged) {
        const center = map.getCenter();
        onMapCenterChanged(center.lat, center.lng);
      }
      debouncedUpdateClusters();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapReady]);

  // Re-render clusters on map move/zoom with debounce
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMoveEnd = () => {
      debouncedUpdateClusters();
    };

    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
  }, [mapInitialized, debouncedUpdateClusters]);

  // Fly to selected city when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCityId) return;

    // If the city change came from the selector, reset the manual pan flag and fly
    if (cityChangeSource === 'selector') {
      userPannedRef.current = false;
    }

    // Skip centering if the user has manually panned the map
    // (only center for selector picks or initial load)
    if (userPannedRef.current) return;

    isFlyingRef.current = true;

    const onFlyEnd = () => {
      isFlyingRef.current = false;
      map.off('moveend', onFlyEnd);
    };
    map.on('moveend', onFlyEnd);

    if (selectedCityId === ALL_COLOMBIA_ID || selectedCityId === 'ALL_COLOMBIA' || selectedCityId === 'todo-colombia') {
      // Focus on Colombia overview (macro zoom)
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      map.flyTo(colombiaCenter, isMobile ? 5.6 : 6.0, { animate: true, duration: 1.2 });
    } else {
      const coords = getCityCoordinates(selectedCityId);
      map.flyTo([coords.lat, coords.lng], 13, { animate: true, duration: 1.2 });
    }
  }, [selectedCityId, cityChangeSource]);

  // Fly to target focus coordinates when requested from card CTA "Ver en mapa"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetFocusCoords) return;

    const { lat, lng, id } = targetFocusCoords;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      userPannedRef.current = true;
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

      setTimeout(() => {
        const marker = markerByIdRef.current[id];
        if (marker) {
          marker.openPopup();
          const el = marker.getElement();
          if (el) {
            el.style.transform += ' scale(1.4)';
            el.style.zIndex = '10000';
            el.style.filter = 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.7))';
          }
        }
      }, 1250);
    }
  }, [targetFocusCoords]);

  // Load points into Supercluster index and render
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;
    if (isPickerMode) return;

    loadClusterIndex(needs, offers || [], viewMode);
    renderMapClusters();
    displaceOverlappingMarkers();
  }, [needs, offers, viewMode, isPickerMode, mapInitialized, loadClusterIndex, renderMapClusters, displaceOverlappingMarkers]);

  // Cross-highlight: when hoveredItemId changes, highlight the pin visually without panning or moving the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Only apply on desktop
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) return;

    // Reset all markers to normal scale
    Object.values(markerByIdRef.current).forEach((marker) => {
      const el = marker.getElement();
      if (el) {
        el.style.transform = el.style.transform.replace(/\s*scale\([^)]*\)/, '');
        el.style.zIndex = '';
        el.style.filter = '';
      }
    });

    if (!hoveredItemId) return;

    const marker = markerByIdRef.current[hoveredItemId];
    if (marker) {
      const el = marker.getElement();
      if (el) {
        el.style.transform += ' scale(1.4)';
        el.style.zIndex = '10000';
        el.style.filter = 'drop-shadow(0 0 6px rgba(0,0,0,0.4))';
        el.style.transition = 'transform 0.15s ease, filter 0.15s ease';
      }
    }
  }, [hoveredItemId]);

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



      {/* Picker Instructions */}
      {isPickerMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-950 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-emerald-500/50">
          <span>📍 Haz clic en el mapa para ubicar el punto exacto en Cali</span>
        </div>
      )}
    </div>
  );
};
