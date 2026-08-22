import { useRef, useCallback } from 'react';
import Supercluster, { PointFeature, ClusterFeature, ClusterProperties } from 'supercluster';
import L from 'leaflet';
import { Need, Offer } from '../types';

// --- Types ---

export interface NeedPointProperties {
  kind: 'need';
  item: Need;
}

export interface OfferPointProperties {
  kind: 'offer';
  item: Offer;
}

export type MarkerPointProperties = NeedPointProperties | OfferPointProperties;

export type ClusterOrPoint =
  | ClusterFeature<ClusterProperties>
  | PointFeature<MarkerPointProperties>;

/** Type guard to check if a GeoJSON feature is a cluster */
export function isCluster(
  feature: ClusterOrPoint
): feature is ClusterFeature<ClusterProperties> {
  return (feature.properties as any).cluster === true;
}

// --- Hook ---

interface UseMapClusteringOptions {
  /** Cluster radius in pixels (default: 60) */
  radius?: number;
  /** Max zoom at which clusters are created (default: 16) */
  maxZoom?: number;
}

/**
 * Hook that manages Supercluster instances for needs and offers,
 * providing efficient spatial clustering for Leaflet maps.
 */
export function useMapClustering(options: UseMapClusteringOptions = {}) {
  const { radius = 60, maxZoom = 16 } = options;

  const needsClusterRef = useRef<Supercluster<MarkerPointProperties> | null>(null);
  const offersClusterRef = useRef<Supercluster<MarkerPointProperties> | null>(null);

  // Create or reuse the Supercluster instance for needs
  const loadNeedsIndex = useCallback(
    (needs: Need[]) => {
      const points: PointFeature<MarkerPointProperties>[] = needs
        .filter(
          (n) =>
            n.latitude != null &&
            n.longitude != null &&
            !isNaN(n.latitude) &&
            !isNaN(n.longitude)
        )
        .map((n) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [n.longitude, n.latitude] },
          properties: { kind: 'need' as const, item: n },
        }));

      const index = new Supercluster<MarkerPointProperties>({
        radius,
        maxZoom,
        // Return count per priority for cluster coloring
      });
      index.load(points);
      needsClusterRef.current = index;
    },
    [radius, maxZoom]
  );

  // Create or reuse the Supercluster instance for offers
  const loadOffersIndex = useCallback(
    (offers: Offer[]) => {
      const points: PointFeature<MarkerPointProperties>[] = offers
        .filter(
          (o) =>
            o.latitude != null &&
            o.longitude != null &&
            !isNaN(o.latitude) &&
            !isNaN(o.longitude) &&
            o.latitude >= -90 &&
            o.latitude <= 90 &&
            o.longitude >= -180 &&
            o.longitude <= 180
        )
        .map((o) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [o.longitude, o.latitude] },
          properties: { kind: 'offer' as const, item: o },
        }));

      const index = new Supercluster<MarkerPointProperties>({
        radius,
        maxZoom,
      });
      index.load(points);
      offersClusterRef.current = index;
    },
    [radius, maxZoom]
  );

  // Get clusters for the current map viewport
  const getClusters = useCallback(
    (
      map: L.Map,
      type: 'needs' | 'offers'
    ): ClusterOrPoint[] => {
      const index =
        type === 'needs' ? needsClusterRef.current : offersClusterRef.current;
      if (!index) return [];

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      return index.getClusters(bbox, Math.floor(zoom)) as ClusterOrPoint[];
    },
    []
  );

  // Expand cluster zoom level
  const getClusterExpansionZoom = useCallback(
    (clusterId: number, type: 'needs' | 'offers'): number => {
      const index =
        type === 'needs' ? needsClusterRef.current : offersClusterRef.current;
      if (!index) return 16;
      return index.getClusterExpansionZoom(clusterId);
    },
    []
  );

  return {
    loadNeedsIndex,
    loadOffersIndex,
    getClusters,
    getClusterExpansionZoom,
  };
}
