import {
  FOLLOWERS_SUB_VALUES,
  OWNERSHIP_SUB_VALUES,
  REVIEWS_FEED_SUB_VALUES,
  type FollowersSubType,
  type OwnershipSubType,
  type ReviewsFeedSubType,
} from '@/modules/object/domain/object-page.types';
import {
  OBJECT_PAGE_DESCRIPTION_SEGMENT,
  OBJECT_PAGE_GALLERY_ALBUM_PARAM,
  OBJECT_PAGE_GALLERY_ALBUM_PATH_SEGMENT,
  OBJECT_PAGE_CATEGORY_NAME_PARAM,
  OBJECT_PAGE_CATEGORY_PATH_SEGMENT,
  OBJECT_PAGE_FIELD_REFERENCE_TYPE_PARAM,
  OBJECT_PAGE_FIELD_REFERENCES_PATH_SEGMENT,
  OBJECT_PAGE_UPDATE_ID_PARAM,
  OBJECT_PAGE_PATH_TAB_SEGMENTS,
  OBJECT_PAGE_VIEW_PATH_PARAM,
  OBJECT_PAGE_REVIEWS_SUB_PARAM,
  REVIEWS_FEED_PATH_SEGMENTS,
  LEGACY_REVIEWS_MESSAGES_SEGMENT,
  isFieldReferenceFeedPathSegment,
  resolveCategoryNameFromObjectUrl,
  resolveCategoryNameForObjectPage,
  resolveFieldReferenceTypeFromObjectUrl,
  resolveFieldReferenceTypeForObjectPage,
} from '@/modules/object/domain/object-page-url.constants';
import { parseViewPathFromSearchParam } from '@/modules/object/domain/object-page-path';
import type { ObjectNestedViewResolved } from '@/modules/object/domain/object-page.types';
import type { ObjectDefaultLanding } from '@/modules/object/domain/resolve-object-default-landing';

/** Search param for the object profile primary tab (Reviews, Updates, …). */
export const OBJECT_PAGE_PRIMARY_TAB_PARAM = 'tab';

/** Supervised vs exclusive lists under the Ownership tab (`?sub=`). Also used for Followers sub (`followed` / `favorited`). */
export const OBJECT_PAGE_OWNERSHIP_SUB_PARAM = 'sub';

/** @deprecated Use {@link OBJECT_PAGE_OWNERSHIP_SUB_PARAM} */
export const OBJECT_PAGE_AUTHORITY_SUB_PARAM = OBJECT_PAGE_OWNERSHIP_SUB_PARAM;

export {
  OBJECT_PAGE_DESCRIPTION_SEGMENT,
  OBJECT_PAGE_GALLERY_ALBUM_PARAM,
  OBJECT_PAGE_CATEGORY_NAME_PARAM,
  OBJECT_PAGE_FIELD_REFERENCE_TYPE_PARAM,
  OBJECT_PAGE_UPDATE_ID_PARAM,
  OBJECT_PAGE_VIEW_PATH_PARAM,
  OBJECT_PAGE_REVIEWS_SUB_PARAM,
};

export type { FollowersSubType, OwnershipSubType, ReviewsFeedSubType };

/** @deprecated Use {@link OwnershipSubType} */
export type AuthoritySubType = OwnershipSubType;

export function firstSearchParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

const LEGACY_OWNERSHIP_SUB_MAP: Record<string, OwnershipSubType> = {
  administrative: 'supervised',
  ownership: 'exclusive',
};

export function parseOwnershipSubTypeParam(
  sp: Record<string, string | string[] | undefined>,
): OwnershipSubType {
  const v = firstSearchParam(sp, OBJECT_PAGE_OWNERSHIP_SUB_PARAM)?.trim();
  if (v && OWNERSHIP_SUB_VALUES.includes(v as OwnershipSubType)) {
    return v as OwnershipSubType;
  }
  if (v && LEGACY_OWNERSHIP_SUB_MAP[v]) {
    return LEGACY_OWNERSHIP_SUB_MAP[v];
  }
  return 'supervised';
}

/** @deprecated Use {@link parseOwnershipSubTypeParam} */
export const parseAuthoritySubTypeParam = parseOwnershipSubTypeParam;

export function parseFollowersSubTypeParam(
  sp: Record<string, string | string[] | undefined>,
): FollowersSubType {
  const v = firstSearchParam(sp, OBJECT_PAGE_OWNERSHIP_SUB_PARAM)?.trim();
  if (v && FOLLOWERS_SUB_VALUES.includes(v as FollowersSubType)) {
    return v as FollowersSubType;
  }
  return 'followed';
}

export function parseReviewsFeedSubParam(
  sp: Record<string, string | string[] | undefined>,
): ReviewsFeedSubType {
  const v = firstSearchParam(sp, OBJECT_PAGE_REVIEWS_SUB_PARAM)?.trim();
  if (v === LEGACY_REVIEWS_MESSAGES_SEGMENT) {
    return 'activity';
  }
  if (v && REVIEWS_FEED_SUB_VALUES.includes(v as ReviewsFeedSubType)) {
    return v as ReviewsFeedSubType;
  }
  const tab = firstSearchParam(sp, OBJECT_PAGE_PRIMARY_TAB_PARAM)?.trim();
  if (tab === LEGACY_REVIEWS_MESSAGES_SEGMENT) {
    return 'activity';
  }
  return 'posts';
}

function normalizeLegacyReviewsFeedSub(segment: string): ReviewsFeedSubType | null {
  if (segment === LEGACY_REVIEWS_MESSAGES_SEGMENT) {
    return 'activity';
  }
  if (REVIEWS_FEED_SUB_VALUES.includes(segment as ReviewsFeedSubType)) {
    return segment as ReviewsFeedSubType;
  }
  return null;
}

/** Resolves Reviews sub-tab from visible pathname (and proxy-injected `?reviews_sub=`). */
export function resolveReviewsFeedSubFromObjectUrl(
  objectId: string,
  pathname: string,
  searchParams: URLSearchParams,
): ReviewsFeedSubType {
  const base = `/object/${encodeURIComponent(objectId)}`;
  const path = normalizePathname(pathname);
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const subMatch = path.match(
    new RegExp(
      `^${escapedBase}/reviews/(${[...REVIEWS_FEED_PATH_SEGMENTS, LEGACY_REVIEWS_MESSAGES_SEGMENT].join('|')})$`,
    ),
  );
  if (subMatch?.[1]) {
    const normalized = normalizeLegacyReviewsFeedSub(subMatch[1]);
    if (normalized) {
      return normalized;
    }
  }
  if (path === `${base}/messages`) {
    return 'activity';
  }
  const fromQuery = searchParams.get(OBJECT_PAGE_REVIEWS_SUB_PARAM)?.trim();
  if (fromQuery) {
    const normalized = normalizeLegacyReviewsFeedSub(fromQuery);
    if (normalized) {
      return normalized;
    }
  }
  if (searchParams.get(OBJECT_PAGE_PRIMARY_TAB_PARAM)?.trim() === LEGACY_REVIEWS_MESSAGES_SEGMENT) {
    return 'activity';
  }
  return 'posts';
}

/** Ordered object ids from `?path=id1,id2` (empty when absent or invalid). */
export function parseViewPathParam(
  sp: Record<string, string | string[] | undefined>,
): string[] {
  return parseViewPathFromSearchParam(firstSearchParam(sp, OBJECT_PAGE_VIEW_PATH_PARAM));
}

/**
 * Keeps SSR nested stack aligned with requested path ids.
 * Returns an empty stack when the path could not be resolved (avoids client crash / stale URL).
 */
export function sanitizeNestedStack(
  pathIds: string[],
  stack: ObjectNestedViewResolved[],
): ObjectNestedViewResolved[] {
  if (pathIds.length === 0) {
    return stack;
  }
  if (stack.length === 0) {
    return [];
  }
  const matchesPrefix = stack.every((entry, index) => entry.objectId === pathIds[index]);
  if (!matchesPrefix) {
    return [];
  }
  return stack;
}

const PATH_TAB_SEGMENTS = OBJECT_PAGE_PATH_TAB_SEGMENTS;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Resolves the active primary tab from the visible URL (pathname + optional `?tab=`).
 * Empty string = menu landing (`/object/:id` with no tab segment).
 */
export function resolvePrimarySegmentFromObjectUrl(
  objectId: string,
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const base = `/object/${encodeURIComponent(objectId)}`;
  const path = normalizePathname(pathname);
  const galleryAlbumPrefix = `${base}/gallery/${OBJECT_PAGE_GALLERY_ALBUM_PATH_SEGMENT}/`;
  if (path === `${base}/gallery` || path.startsWith(galleryAlbumPrefix)) {
    return 'gallery';
  }
  const categoryPrefix = `${base}/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/`;
  if (path.startsWith(categoryPrefix)) {
    return OBJECT_PAGE_CATEGORY_PATH_SEGMENT;
  }
  const legacyFieldRefPrefix = `${base}/`;
  if (path.startsWith(legacyFieldRefPrefix)) {
    const segment = path.slice(legacyFieldRefPrefix.length);
    if (isFieldReferenceFeedPathSegment(segment)) {
      return OBJECT_PAGE_FIELD_REFERENCES_PATH_SEGMENT;
    }
  }
  const updatesDetailPrefix = `${base}/updates/`;
  if (path === `${base}/updates` || path.startsWith(updatesDetailPrefix)) {
    return 'updates';
  }
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (
    path === `${base}/reviews` ||
    new RegExp(
      `^${escapedBase}/reviews/(${[...REVIEWS_FEED_PATH_SEGMENTS, LEGACY_REVIEWS_MESSAGES_SEGMENT].join('|')})$`,
    ).test(path)
  ) {
    return 'reviews';
  }
  if (path === `${base}/messages`) {
    return 'reviews';
  }
  for (const segment of PATH_TAB_SEGMENTS) {
    if (path === `${base}/${segment}`) {
      return segment;
    }
  }
  if (path === `${base}/authority`) {
    return 'ownership';
  }
  const tab = searchParams.get(OBJECT_PAGE_PRIMARY_TAB_PARAM)?.trim();
  if (tab === 'authority') {
    return 'ownership';
  }
  if (tab === LEGACY_REVIEWS_MESSAGES_SEGMENT) {
    return 'reviews';
  }
  return tab ?? '';
}

/**
 * Parses the active department category name from a visible object URL pathname.
 */
export { resolveCategoryNameFromObjectUrl, resolveCategoryNameForObjectPage };
export {
  resolveFieldReferenceTypeFromObjectUrl,
  resolveFieldReferenceTypeForObjectPage,
};

/**
 * Parses the update id from `/object/:id/updates/:updateId`.
 * Returns `null` on the updates list (`/object/:id/updates`) or when absent.
 */
export function resolveUpdateIdFromObjectUrl(
  objectId: string,
  pathname: string,
): string | null {
  const base = `/object/${encodeURIComponent(objectId)}`;
  const path = normalizePathname(pathname);
  const prefix = `${base}/updates/`;
  if (!path.startsWith(prefix)) {
    return null;
  }
  const encoded = path.slice(prefix.length);
  if (!encoded) {
    return null;
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Parses the active gallery album name from a visible object URL pathname.
 * Returns `null` on the albums list (`/object/:id/gallery`) or when absent.
 */
export function resolveGalleryAlbumFromObjectUrl(
  objectId: string,
  pathname: string,
): string | null {
  const base = `/object/${encodeURIComponent(objectId)}`;
  const path = normalizePathname(pathname);
  const prefix = `${base}/gallery/${OBJECT_PAGE_GALLERY_ALBUM_PATH_SEGMENT}/`;
  if (!path.startsWith(prefix)) {
    return null;
  }
  const encoded = path.slice(prefix.length);
  if (!encoded) {
    return null;
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/** Resolves active gallery album from pathname (preferred) or proxy `?gallery_album=`. */
export function resolveGalleryAlbumForObjectPage(
  objectId: string,
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  const fromPath = resolveGalleryAlbumFromObjectUrl(objectId, pathname);
  if (fromPath !== null) {
    return fromPath;
  }
  const fromQuery = searchParams.get(OBJECT_PAGE_GALLERY_ALBUM_PARAM)?.trim();
  if (!fromQuery) {
    return null;
  }
  try {
    return decodeURIComponent(fromQuery);
  } catch {
    return fromQuery;
  }
}

/**
 * Maps SSR `defaultLanding` to the primary tab segment used when the URL is clean
 * (`/object/:id` with no `?tab=` or path segment).
 */
export function resolveDefaultPrimarySegmentFromLanding(
  landing: ObjectDefaultLanding,
  primaryTabSegments: readonly string[],
): string {
  const allowed = new Set(primaryTabSegments);
  switch (landing.kind) {
    case 'primaryTab':
      if (landing.segment === OBJECT_PAGE_DESCRIPTION_SEGMENT) {
        return OBJECT_PAGE_DESCRIPTION_SEGMENT;
      }
      if (allowed.has(landing.segment)) {
        return landing.segment;
      }
      return '';
    case 'routeStub':
      return allowed.has('reviews') ? 'reviews' : '';
    case 'nestedInHost':
    case 'hostContent':
      return '';
    default:
      return '';
  }
}

/**
 * Resolves active primary tab from URL, falling back to SSR default landing when the URL is
 * clean (`/object/:id` with no `?tab=` or path segment) so default `reviews` can show without
 * `/reviews` in the path.
 */
export function resolvePrimarySegmentForObjectPage(
  objectId: string,
  pathname: string,
  searchParams: URLSearchParams,
  defaultSegmentWhenClean: string,
): string {
  const fromUrl = resolvePrimarySegmentFromObjectUrl(objectId, pathname, searchParams);
  if (fromUrl !== '') {
    return fromUrl;
  }
  if (searchParams.has(OBJECT_PAGE_VIEW_PATH_PARAM)) {
    return defaultSegmentWhenClean !== '' ? defaultSegmentWhenClean : '';
  }
  return defaultSegmentWhenClean;
}
