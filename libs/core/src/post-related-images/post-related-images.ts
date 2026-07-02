import { OBJECT_TYPES } from '../object-type-registry/object-types';
import { extractImages } from '../hive-thread/thread-extractors';

/** Legacy OBJECT_TYPES_WITH_ALBUM ∩ ODL registry. */
export const OBJECT_TYPES_WITH_RELATED_ALBUM: readonly string[] = [
  OBJECT_TYPES.LIST,
  OBJECT_TYPES.PRODUCT,
  OBJECT_TYPES.BOOK,
  OBJECT_TYPES.RECIPE,
  OBJECT_TYPES.LINK,
  OBJECT_TYPES.DRINK,
  OBJECT_TYPES.PLACE,
  OBJECT_TYPES.BUSINESS,
  OBJECT_TYPES.PAGE,
  OBJECT_TYPES.SERVICE,
  OBJECT_TYPES.PERSON,
  OBJECT_TYPES.RESTAURANT,
  OBJECT_TYPES.DISH,
  OBJECT_TYPES.NEWSFEED,
] as const;

const HTTPS_IMAGE_URL_RE = /^https:\/\//i;

const OBJECT_TYPES_WITH_RELATED_ALBUM_SET = new Set(
  OBJECT_TYPES_WITH_RELATED_ALBUM,
);

export function isObjectTypeEligibleForRelatedAlbum(
  objectType: string | null | undefined,
): boolean {
  if (!objectType) {
    return false;
  }
  return OBJECT_TYPES_WITH_RELATED_ALBUM_SET.has(objectType);
}

export function filterHttpsPostImageUrls(urls: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (typeof raw !== 'string') {
      continue;
    }
    const url = raw.trim();
    if (!url || !HTTPS_IMAGE_URL_RE.test(url) || seen.has(url)) {
      continue;
    }
    seen.add(url);
    out.push(url);
  }
  return out;
}

export function extractPostImageUrls(jsonMetadata: string): string[] {
  return filterHttpsPostImageUrls(extractImages(jsonMetadata));
}

export interface RelatedImageRowInput {
  object_id: string;
  author: string;
  permlink: string;
  image_url: string;
  sort_ord: number;
}

export interface PostObjectForRelatedImages {
  object_id: string;
  object_type: string | null;
}

export function buildRelatedImageRows(
  postObjects: readonly PostObjectForRelatedImages[],
  author: string,
  permlink: string,
  imageUrls: readonly string[],
): RelatedImageRowInput[] {
  const trimmedAuthor = author.trim();
  const trimmedPermlink = permlink.trim();
  if (!trimmedAuthor || !trimmedPermlink || imageUrls.length === 0) {
    return [];
  }

  const rows: RelatedImageRowInput[] = [];
  for (const po of postObjects) {
    if (!isObjectTypeEligibleForRelatedAlbum(po.object_type)) {
      continue;
    }
    const objectId = po.object_id.trim();
    if (!objectId) {
      continue;
    }
    for (let i = 0; i < imageUrls.length; i++) {
      rows.push({
        object_id: objectId,
        author: trimmedAuthor,
        permlink: trimmedPermlink,
        image_url: imageUrls[i]!,
        sort_ord: i,
      });
    }
  }
  return rows;
}
