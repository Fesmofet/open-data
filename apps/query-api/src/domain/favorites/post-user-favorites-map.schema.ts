import { MAP_GEO_OBJECT_TYPES } from '@opden-data-layer/core';
import { z } from 'zod';

import type { MapBoundingBox } from '../../repositories/user-favorites.repository';

const MAX_MAP_PAGE = 100;
const DEFAULT_MAP_PAGE = 10;

const mapCoordinatePairSchema = z.tuple([z.number(), z.number()]);

export const mapBoundingBoxSchema = z.object({
  topPoint: mapCoordinatePairSchema.describe('North-east corner [longitude, latitude]'),
  bottomPoint: mapCoordinatePairSchema.describe('South-west corner [longitude, latitude]'),
});

export type MapBoundingBoxInput = z.input<typeof mapBoundingBoxSchema>;

export const userFavoritesMapBodySchema = z.object({
  box: mapBoundingBoxSchema,
  objectTypes: z
    .array(z.string().min(1))
    .min(1)
    .optional()
    .describe('Subset of MAP_GEO_OBJECT_TYPES; defaults to all map-eligible types'),
  skip: z.number().int().min(0).optional().default(0),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_MAP_PAGE)
    .optional()
    .default(DEFAULT_MAP_PAGE),
});

export type UserFavoritesMapBody = {
  box: MapBoundingBox;
  objectTypes?: string[];
  skip: number;
  limit: number;
};

function toMapBoundingBox(box: z.infer<typeof mapBoundingBoxSchema>): MapBoundingBox {
  const [topLon, topLat] = box.topPoint;
  const [bottomLon, bottomLat] = box.bottomPoint;
  return {
    topPoint: [topLon, topLat],
    bottomPoint: [bottomLon, bottomLat],
  };
}

export function toUserFavoritesMapBody(input: {
  box: MapBoundingBoxInput;
  objectTypes?: string[];
  skip?: number;
  limit?: number;
}): UserFavoritesMapBody {
  const parsed = userFavoritesMapBodySchema.parse(input);
  return {
    box: toMapBoundingBox(parsed.box),
    objectTypes: parsed.objectTypes,
    skip: parsed.skip,
    limit: parsed.limit,
  };
}

export function mapBoundingBoxFromInput(box: MapBoundingBoxInput): MapBoundingBox {
  return toMapBoundingBox(mapBoundingBoxSchema.parse(box));
}

export const userFavoritesMapResponseSchema = z.object({
  items: z.array(z.unknown()),
  hasMore: z.boolean(),
});

export type UserFavoritesMapResponse = {
  items: import('../object-projection/projected-object.types').ProjectedObject[];
  hasMore: boolean;
};

export const MAP_GEO_OBJECT_TYPES_DOC = [...MAP_GEO_OBJECT_TYPES];
