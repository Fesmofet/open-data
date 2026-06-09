import { normalizeImageCidOrUrlFormValue } from '@/modules/object-updates/application/image-form-value';

import { normalizeGalleryImageUrl } from './gallery-approval-stats';
import type { ProjectedGalleryAlbumView } from './object-page.types';

export type GalleryPhotoImageSource = Pick<ProjectedGalleryPhotoView, 'url' | 'cid'>;

/**
 * Broadcast/storage shape for `image` and `imageGalleryItem` updates from a resolved gallery photo.
 * Prefers canonical `cid` when present; otherwise maps content-gateway display URLs back to `cid`.
 */
export function galleryPhotoToImageCidOrUrlValue(
  photo: GalleryPhotoImageSource,
): Record<string, string> {
  const normalized = normalizeImageCidOrUrlFormValue({
    cid: photo.cid,
    url: photo.url,
  });
  if ('cid' in normalized && typeof normalized.cid === 'string') {
    return { cid: normalized.cid };
  }
  if ('url' in normalized && typeof normalized.url === 'string') {
    return { url: normalized.url };
  }
  return { url: photo.url };
}

/** `imageGalleryItem` payload: album name plus exactly one of `cid` or `url`. */
export function galleryPhotoToGalleryItemValue(
  album: string,
  photo: GalleryPhotoImageSource,
): Record<string, string> {
  return { album, ...galleryPhotoToImageCidOrUrlValue(photo) };
}

/** Stable identity for matching the same image across albums (cid-first, else normalized url). */
export function galleryPhotoIdentity(photo: GalleryPhotoImageSource): string {
  const value = galleryPhotoToImageCidOrUrlValue(photo);
  if ('cid' in value) {
    return `cid:${value.cid}`;
  }
  return `url:${normalizeGalleryImageUrl(value.url)}`;
}

export function galleryPhotosMatch(
  a: GalleryPhotoImageSource,
  b: GalleryPhotoImageSource,
): boolean {
  return galleryPhotoIdentity(a) === galleryPhotoIdentity(b);
}

export function albumContainsPhoto(
  album: Pick<ProjectedGalleryAlbumView, 'items'>,
  photo: GalleryPhotoImageSource,
): boolean {
  return album.items.some((item) => galleryPhotosMatch(item, photo));
}
