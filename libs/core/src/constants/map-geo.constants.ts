/**
 * Object types shown on user profile / website maps (legacy Waivio `listOfMapObjectTypes`).
 * @see tmp/waivio-frontend-legacy/src/common/constants/listOfObjectTypes.js
 */
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

export type MapGeoObjectType = (typeof MAP_GEO_OBJECT_TYPES)[number];
