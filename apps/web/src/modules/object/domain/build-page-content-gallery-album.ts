import type {
  ProjectedGalleryAlbumView,
  ProjectedGalleryPhotoView,
} from './object-page.types';

/** Virtual album name for embedded page HTML images (not on-chain gallery). */
export const PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME = '__page_content__';

const IMG_SRC_RE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

/** Collect unique image URLs from sanitized page HTML in document order. */
export function extractImageUrlsFromPageHtml(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(IMG_SRC_RE)) {
    const url = match[1]?.trim();
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function isPageContentVirtualGalleryAlbum(
  album: Pick<ProjectedGalleryAlbumView, 'name'>,
): boolean {
  return album.name === PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME;
}

export function buildPageContentGalleryAlbum(
  html: string,
): ProjectedGalleryAlbumView | null {
  const urls = extractImageUrlsFromPageHtml(html);
  if (urls.length === 0) {
    return null;
  }
  const items: ProjectedGalleryPhotoView[] = urls.map((url, index) => ({
    url,
    rankScore: urls.length - index,
    isAvatar: false,
  }));
  return {
    name: PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME,
    items,
  };
}
