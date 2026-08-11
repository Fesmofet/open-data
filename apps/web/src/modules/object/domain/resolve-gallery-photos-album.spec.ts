import {
  resolveGalleryPhotoIndexByUrl,
  resolveGalleryPhotosAlbum,
} from './resolve-gallery-photos-album';

describe('resolveGalleryPhotosAlbum', () => {
  it('prefers on-chain Photos album', () => {
    const albums = [
      { name: 'Photos', items: [{ url: 'https://example.com/a.jpg', rankScore: 1, isAvatar: false }] },
      { name: 'Other', items: [] },
    ];
    expect(resolveGalleryPhotosAlbum(albums, [])).toEqual(albums[0]);
  });

  it('falls back to preview gallery', () => {
    const preview = [{ url: 'https://example.com/b.jpg', rankScore: 1, isAvatar: false }];
    expect(resolveGalleryPhotosAlbum([], preview)).toEqual({
      name: 'Photos',
      items: preview,
    });
  });
});

describe('resolveGalleryPhotoIndexByUrl', () => {
  const album = {
    name: 'Photos',
    items: [
      { url: 'https://cdn.example.com/photo.jpg', rankScore: 1, isAvatar: false },
      { url: 'https://cdn.example.com/other.jpg', rankScore: 2, isAvatar: false },
    ],
  };

  it('matches exact URLs', () => {
    expect(resolveGalleryPhotoIndexByUrl(album, 'https://cdn.example.com/photo.jpg')).toBe(0);
  });

  it('matches browser currentSrc with query params stripped', () => {
    expect(
      resolveGalleryPhotoIndexByUrl(
        album,
        'https://cdn.example.com/photo.jpg?w=1200&h=800',
      ),
    ).toBe(0);
  });

  it('returns -1 when URL is not in album', () => {
    expect(resolveGalleryPhotoIndexByUrl(album, 'https://cdn.example.com/missing.jpg')).toBe(-1);
  });

  it('matches Hive-proxied DOM currentSrc to raw album URL', () => {
    const raw = 'https://ipfs.busy.org/ipfs/QmExample';
    const proxiedAlbum = {
      name: 'Photos',
      items: [{ url: raw, rankScore: 1, isAvatar: false }],
    };
    expect(
      resolveGalleryPhotoIndexByUrl(
        proxiedAlbum,
        `https://images.hive.blog/0x0/${raw}`,
      ),
    ).toBe(0);
  });

  it('matches double-proxied Hive resize URLs to raw album URL', () => {
    const raw = 'https://ipfs.busy.org/ipfs/QmResize';
    const hiveResize = `https://images.hive.blog/1280x0/${raw}`;
    const resizeAlbum = {
      name: 'Photos',
      items: [{ url: hiveResize, rankScore: 1, isAvatar: false }],
    };
    expect(
      resolveGalleryPhotoIndexByUrl(
        resizeAlbum,
        `https://images.hive.blog/0x0/${hiveResize}`,
      ),
    ).toBe(0);
  });
});
