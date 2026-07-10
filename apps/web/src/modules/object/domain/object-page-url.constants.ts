/** Comma-separated nested object ids in the center column (list/page stack). */
export const OBJECT_PAGE_VIEW_PATH_PARAM = 'path';

/** Path segment and `?tab=` value for full description in the center column. */
export const OBJECT_PAGE_DESCRIPTION_SEGMENT = 'description';

/**
 * Primary tabs exposed as `/object/:id/<segment>` (proxy rewrites to `?tab=` internally).
 * Gallery and experts were previously `?tab=` only; all listed segments use clean paths.
 */
export const OBJECT_PAGE_PATH_TAB_SEGMENTS = [
  'reviews',
  'updates',
  'followers',
  'authority',
  OBJECT_PAGE_DESCRIPTION_SEGMENT,
  'gallery',
  'experts',
  'related',
  'similar',
  'add-on',
] as const;

export type ObjectPagePathTabSegment = (typeof OBJECT_PAGE_PATH_TAB_SEGMENTS)[number];

/** Internal query param when proxy rewrites `/object/:id/gallery/album/:name`. */
export const OBJECT_PAGE_GALLERY_ALBUM_PARAM = 'gallery_album';

/** Internal query param when proxy rewrites `/object/:id/category/:name`. */
export const OBJECT_PAGE_CATEGORY_NAME_PARAM = 'category_name';

/** Path segment before encoded department category name. */
export const OBJECT_PAGE_CATEGORY_PATH_SEGMENT = 'category';

/** Path segment between `/gallery/` and album name. */
export const OBJECT_PAGE_GALLERY_ALBUM_PATH_SEGMENT = 'album';

export function buildObjectGalleryAlbumPath(
  objectId: string,
  albumName: string,
): string {
  return `/object/${encodeURIComponent(objectId)}/gallery/${OBJECT_PAGE_GALLERY_ALBUM_PATH_SEGMENT}/${encodeURIComponent(albumName)}`;
}

export function buildObjectGalleryPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/gallery`;
}

export function buildObjectRelatedPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/related`;
}

export function buildObjectSimilarPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/similar`;
}

export function buildObjectAddOnPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/add-on`;
}

export function buildObjectCategoryPath(objectId: string, categoryName: string): string {
  return `/object/${encodeURIComponent(objectId)}/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/${encodeURIComponent(categoryName)}`;
}

function normalizeObjectPagePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Parses the active department category name from `/object/:id/category/:name`. */
export function resolveCategoryNameFromObjectUrl(
  objectId: string,
  pathname: string,
): string | null {
  const path = normalizeObjectPagePathname(pathname);
  const match = path.match(
    new RegExp(`^/object/([^/]+)/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/(.+)$`),
  );
  if (!match?.[1] || !match[2]) {
    return null;
  }
  const pathObjectId = match[1];
  let decodedObjectId = pathObjectId;
  try {
    decodedObjectId = decodeURIComponent(pathObjectId);
  } catch {
    // keep raw segment
  }
  if (decodedObjectId !== objectId && pathObjectId !== objectId) {
    return null;
  }
  try {
    return decodeURIComponent(match[2]);
  } catch {
    return match[2];
  }
}

/** Resolves active category from pathname (preferred) or proxy `?category_name=`. */
export function resolveCategoryNameForObjectPage(
  objectId: string,
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  const fromPath = resolveCategoryNameFromObjectUrl(objectId, pathname);
  if (fromPath !== null) {
    return fromPath;
  }
  const fromQuery = searchParams.get(OBJECT_PAGE_CATEGORY_NAME_PARAM)?.trim();
  if (!fromQuery) {
    return null;
  }
  try {
    return decodeURIComponent(fromQuery);
  } catch {
    return fromQuery;
  }
}

export function buildObjectFollowersPath(objectId: string): string {
  return `/object/${encodeURIComponent(objectId)}/followers`;
}
