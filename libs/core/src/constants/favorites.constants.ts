/**
 * Object types eligible for user favorites (legacy Waivio `FAVORITES_OBJECT_TYPES`).
 * @see tmp/waivio-api-legacy/constants/wobjectsData.js
 */
export const FAVORITES_OBJECT_TYPES = [
  'list',
  'page',
  'business',
  'person',
  'newsfeed',
  'widget',
  'webpage',
  'shop',
  'affiliate',
  'restaurant',
  'dish',
  'drink',
  'service',
  'place',
  'company',
  'organization',
  'app',
  'crypto',
  'indices',
  'commodity',
  'currency',
  'stocks',
  'currencies',
  'hotel',
  'motel',
  'resort',
  'b&b',
  'car',
  'test',
  'map',
  'link',
  'group',
  'html',
  'skill',
] as const;

export type FavoritesObjectType = (typeof FAVORITES_OBJECT_TYPES)[number];
