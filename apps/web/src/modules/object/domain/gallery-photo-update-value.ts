import { normalizeImageCidOrUrlFormValue } from '@/modules/object-updates/application/image-form-value';

import type { ProjectedGalleryPhotoView } from './object-page.types';

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
