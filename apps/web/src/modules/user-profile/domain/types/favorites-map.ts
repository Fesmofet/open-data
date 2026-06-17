import { z } from 'zod';

import { projectedObjectViewSchema } from '@/modules/feed/application/dto/feed-story.dto';

export const mapBoundingBoxSchema = z.object({
  topPoint: z.tuple([z.number(), z.number()]),
  bottomPoint: z.tuple([z.number(), z.number()]),
});

export type MapBoundingBox = {
  topPoint: readonly [number, number];
  bottomPoint: readonly [number, number];
};

export const favoritesMapPageSchema = z.object({
  items: z.array(projectedObjectViewSchema),
  hasMore: z.boolean(),
});

export type FavoritesMapPage = z.infer<typeof favoritesMapPageSchema>;

export type FavoritesMapFetchResult =
  | { ok: true; page: FavoritesMapPage }
  | { ok: false };

export const MAP_LIST_PAGE_SIZE = 10;
export const MAP_MARKERS_LIMIT = 100;
export const MAP_RELOAD_DISTANCE_KM = 20;

/** Mirrors `@opden-data-layer/core` `MAP_GEO_OBJECT_TYPES` for client-safe checks. */
export const MAP_GEO_OBJECT_TYPES = [
  'restaurant',
  'person',
  'business',
  'place',
  'indices',
  'commodity',
  'currency',
  'stocks',
  'app',
  'currencies',
  'company',
  'organization',
  'hotel',
  'motel',
  'resort',
  'b&b',
  'car',
] as const;

export type ProjectedObjectGeo = {
  latitude: number;
  longitude: number;
};

export function extractObjectGeo(
  fields: Record<string, unknown>,
): ProjectedObjectGeo | null {
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

const MAP_BOX_EPSILON = 1e-4;

export function mapBoxesEqual(a: MapBoundingBox, b: MapBoundingBox): boolean {
  return (
    Math.abs(a.topPoint[0] - b.topPoint[0]) < MAP_BOX_EPSILON &&
    Math.abs(a.topPoint[1] - b.topPoint[1]) < MAP_BOX_EPSILON &&
    Math.abs(a.bottomPoint[0] - b.bottomPoint[0]) < MAP_BOX_EPSILON &&
    Math.abs(a.bottomPoint[1] - b.bottomPoint[1]) < MAP_BOX_EPSILON
  );
}

export function boxCenter(box: MapBoundingBox): { latitude: number; longitude: number } {
  return {
    longitude: (box.topPoint[0] + box.bottomPoint[0]) / 2,
    latitude: (box.topPoint[1] + box.bottomPoint[1]) / 2,
  };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasMapEligibleFavoriteTypes(types: readonly string[]): boolean {
  const allowed = new Set<string>(MAP_GEO_OBJECT_TYPES);
  return types.some((t) => allowed.has(t));
}
