import { useRef, useCallback } from 'react';
import Supercluster, { PointFeature, ClusterFeature, ClusterProperties } from 'supercluster';
import L from 'leaflet';
import { Need, Offer, ViewMode } from '../types';

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

export interface CustomClusterProps {
  needCount: number;
  offerCount: number;
}

export type ClusterOrPoint =
  | ClusterFeature<ClusterProperties & CustomClusterProps>
  | PointFeature<MarkerPointProperties>;

/** Type guard to check if a GeoJSON feature is a cluster */
export function isCluster(
  feature: ClusterOrPoint
): feature is ClusterFeature<ClusterProperties & CustomClusterProps> {
  return (feature.properties as any).cluster === true;
}

// --- Hook ---

interface UseMapClusteringOptions {
  /** Cluster radius in pixels (default: 75) */
  radius?: number;
  /** Max zoom at which clusters are created (default: 16) */
  maxZoom?: number;
}

/**
 * Hook that manages a unified Supercluster instance for needs and offers,
 * providing efficient spatial clustering without overlapping clusters.
 */
export function useMapClustering(options: UseMapClusteringOptions = {}) {
  const { radius = 75, maxZoom = 16 } = options;

  const clusterIndexRef = useRef<Supercluster<MarkerPointProperties, CustomClusterProps> | null>(null);

  // Load points into unified Supercluster index
  const loadClusterIndex = useCallback(
    (needs: Need[], offers: Offer[], viewMode?: ViewMode) => {
      const points: PointFeature<MarkerPointProperties>[] = [];

      if (viewMode !== 'OFFERS') {
        (needs || [])
          .filter(
            (n) =>
              n.latitude != null &&
              n.longitude != null &&
              !isNaN(n.latitude) &&
              !isNaN(n.longitude)
          )
          .forEach((n) => {
            points.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [n.longitude, n.latitude] },
              properties: { kind: 'need', item: n },
            });
          });
      }

      if (viewMode !== 'NEEDS') {
        (offers || [])
          .filter(
            (o) =>
              o.latitude != null &&
              o.longitude != null &&
              !isNaN(o.latitude) &&
              !isNaN(o.longitude) &&
              o.latitude >= -90 &&
              o.latitude <= 90 &&
              o.longitude >= -180 &&
              o.longitude <= 180 &&
              (o.verificationStatus === 'VERIFIED' || o.verificationStatus === 'PENDING_VERIFICATION') &&
              (o.offerStatus === 'AVAILABLE' || o.offerStatus === 'PARTIALLY_AVAILABLE')
          )
          .forEach((o) => {
            points.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [o.longitude, o.latitude] },
              properties: { kind: 'offer', item: o },
            });
          });
      }

      const index = new Supercluster<MarkerPointProperties, CustomClusterProps>({
        radius,
        maxZoom,
        map: (props) => ({
          needCount: props.kind === 'need' ? 1 : 0,
          offerCount: props.kind === 'offer' ? 1 : 0,
        }),
        reduce: (acc, props) => {
          acc.needCount += props.needCount;
          acc.offerCount += props.offerCount;
        },
      });

      index.load(points);
      clusterIndexRef.current = index;
    },
    [radius, maxZoom]
  );

  // Get clusters for current viewport
  const getClusters = useCallback((map: L.Map): ClusterOrPoint[] => {
    const index = clusterIndexRef.current;
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
  }, []);

  // Expand cluster zoom level
  const getClusterExpansionZoom = useCallback((clusterId: number): number => {
    const index = clusterIndexRef.current;
    if (!index) return 16;
    return index.getClusterExpansionZoom(clusterId);
  }, []);

  // Get leaf points of a cluster
  const getClusterLeaves = useCallback(
    (clusterId: number, limit = Infinity): PointFeature<MarkerPointProperties>[] => {
      const index = clusterIndexRef.current;
      if (!index) return [];
      return index.getLeaves(clusterId, limit);
    },
    []
  );

  return {
    loadClusterIndex,
    getClusters,
    getClusterExpansionZoom,
    getClusterLeaves,
  };
}
