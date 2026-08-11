import { stripHiveImageProxyPrefix } from '@/shared/infrastructure/image/get-proxy-image-url';

import type {
  ProjectedGalleryAlbumView,
  ProjectedGalleryPhotoView,
} from './object-page.types';

function normalizeGalleryPhotoUrl(url: string): string {
  const withoutQuery = stripHiveImageProxyPrefix(url)
    .split('?')[0]
    ?.split('#')[0] ?? url;
  try {
    const parsed = new URL(withoutQuery);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return withoutQuery.replace(/\/$/, '');
  }
}

/** Photos album for gallery viewer — on-chain `Photos` or preview gallery fallback. */
export function resolveGalleryPhotosAlbum(
  galleryAlbums: readonly ProjectedGalleryAlbumView[],
  previewGallery: readonly ProjectedGalleryPhotoView[],
): ProjectedGalleryAlbumView | null {
  const photosAlbum = galleryAlbums.find((album) => album.name === 'Photos');
  if (photosAlbum) {
    return photosAlbum;
  }
  if (previewGallery.length > 0) {
    return { name: 'Photos', items: [...previewGallery] };
  }
  return null;
}

/** Match a rendered image URL to an album index (tolerates query strings and CDN variants). */
export function resolveGalleryPhotoIndexByUrl(
  album: ProjectedGalleryAlbumView,
  url: string,
): number {
  const normalized = normalizeGalleryPhotoUrl(url);
  return album.items.findIndex((item) => {
    if (item.url === url) {
      return true;
    }
    return normalizeGalleryPhotoUrl(item.url) === normalized;
  });
}
