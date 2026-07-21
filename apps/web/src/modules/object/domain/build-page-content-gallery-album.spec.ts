import {
  buildPageContentGalleryAlbum,
  extractImageUrlsFromPageHtml,
  isPageContentVirtualGalleryAlbum,
  PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME,
} from './build-page-content-gallery-album';

describe('extractImageUrlsFromPageHtml', () => {
  it('extracts img src values in order', () => {
    const html =
      '<p>One</p><img src="https://example.com/a.jpg" alt=""><img src="https://example.com/b.jpg">';
    expect(extractImageUrlsFromPageHtml(html)).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ]);
  });

  it('dedupes repeated URLs', () => {
    const html =
      '<img src="https://example.com/a.jpg"><img src="https://example.com/a.jpg">';
    expect(extractImageUrlsFromPageHtml(html)).toEqual(['https://example.com/a.jpg']);
  });
});

describe('buildPageContentGalleryAlbum', () => {
  it('returns null when HTML has no images', () => {
    expect(buildPageContentGalleryAlbum('<p>Text only</p>')).toBeNull();
  });

  it('builds virtual album items', () => {
    const album = buildPageContentGalleryAlbum(
      '<img src="https://example.com/a.jpg">',
    );
    expect(album).toEqual({
      name: PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME,
      items: [{ url: 'https://example.com/a.jpg', rankScore: 1, isAvatar: false }],
    });
  });
});

describe('isPageContentVirtualGalleryAlbum', () => {
  it('detects virtual page-content album', () => {
    expect(
      isPageContentVirtualGalleryAlbum({
        name: PAGE_CONTENT_VIRTUAL_GALLERY_ALBUM_NAME,
      }),
    ).toBe(true);
    expect(isPageContentVirtualGalleryAlbum({ name: 'Photos' })).toBe(false);
  });
});
