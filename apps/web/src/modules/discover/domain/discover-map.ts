import type { MapBoundingBox, MapPosition, MapViewChange } from '@/modules/map';

import type { DiscoverBox, DiscoverMapView } from './discover-url';
import {
  DISCOVER_MAP_DEFAULT_CENTER,
  DISCOVER_MAP_DEFAULT_ZOOM,
} from '../constants/discover-map.constants';

const MAP_BOX_EPSILON = 1e-4;

export type DiscoverGeoPoint = {
  latitude: number;
  longitude: number;
};

export function discoverBoxToMapBoundingBox(box: DiscoverBox): MapBoundingBox {
  return {
    topPoint: [box.neLng, box.neLat] as const,
    bottomPoint: [box.swLng, box.swLat] as const,
  };
}

export function mapBoundingBoxToDiscoverBox(box: MapBoundingBox): DiscoverBox {
  return {
    swLng: box.bottomPoint[0],
    swLat: box.bottomPoint[1],
    neLng: box.topPoint[0],
    neLat: box.topPoint[1],
  };
}

export function discoverBoxesEqual(a: DiscoverBox, b: DiscoverBox): boolean {
  return (
    Math.abs(a.swLng - b.swLng) < MAP_BOX_EPSILON &&
    Math.abs(a.swLat - b.swLat) < MAP_BOX_EPSILON &&
    Math.abs(a.neLng - b.neLng) < MAP_BOX_EPSILON &&
    Math.abs(a.neLat - b.neLat) < MAP_BOX_EPSILON
  );
}

export function extractDiscoverGeo(
  fields: Record<string, unknown>,
): DiscoverGeoPoint | null {
  const geo = fields.geo;
  if (geo == null || typeof geo !== 'object') {
    return null;
  }
  const latitude = (geo as { latitude?: unknown }).latitude;
  const longitude = (geo as { longitude?: unknown }).longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

export function discoverBoxToFitBoundsPositions(
  box: DiscoverBox,
): readonly [MapPosition, MapPosition] {
  return [
    [box.swLat, box.swLng],
    [box.neLat, box.neLng],
  ] as const;
}

export function mapViewChangeToDiscoverMapView(view: MapViewChange): DiscoverMapView {
  return {
    latitude: view.center[0],
    longitude: view.center[1],
    zoom: view.zoom,
  };
}

export function resolveDiscoverMapCamera(
  mapView: DiscoverMapView | null,
  box: DiscoverBox | null,
): {
  center: MapPosition;
  zoom: number;
  fitBox: DiscoverBox | null;
} {
  if (mapView) {
    return {
      center: [mapView.latitude, mapView.longitude],
      zoom: mapView.zoom,
      fitBox: null,
    };
  }
  if (box) {
    const latitude = (box.swLat + box.neLat) / 2;
    const longitude = (box.swLng + box.neLng) / 2;
    return {
      center: [latitude, longitude],
      zoom: DISCOVER_MAP_DEFAULT_ZOOM,
      fitBox: box,
    };
  }
  return {
    center: DISCOVER_MAP_DEFAULT_CENTER,
    zoom: DISCOVER_MAP_DEFAULT_ZOOM,
    fitBox: null,
  };
}
