import {
  albumContainsPhoto,
  galleryPhotosMatch,
  galleryPhotoToGalleryItemValue,
  galleryPhotoToImageCidOrUrlValue,
} from './gallery-photo-update-value';

describe('galleryPhotoToImageCidOrUrlValue', () => {
  it('prefers cid when gallery photo carries cid', () => {
    expect(
      galleryPhotoToImageCidOrUrlValue({
        cid: 'bafyTest',
        url: 'https://example.com/ipfs-gateway/content/image/bafyOther',
      }),
    ).toEqual({ cid: 'bafyTest' });
  });

  it('maps content-gateway display URL to cid when cid is absent', () => {
    expect(
      galleryPhotoToImageCidOrUrlValue({
        url: 'https://example.com/ipfs-gateway/content/image/bafyFromGateway',
      }),
    ).toEqual({ cid: 'bafyFromGateway' });
  });

  it('keeps external https URL as url', () => {
    expect(
      galleryPhotoToImageCidOrUrlValue({
        url: 'https://cdn.example.com/photo.jpg',
      }),
    ).toEqual({ url: 'https://cdn.example.com/photo.jpg' });
  });
});

describe('galleryPhotoToGalleryItemValue', () => {
  it('includes album with cid-only image value', () => {
    expect(
      galleryPhotoToGalleryItemValue('Socials', {
        cid: 'bafyAlbum',
        url: 'https://example.com/ipfs-gateway/content/image/bafyAlbum',
      }),
    ).toEqual({ album: 'Socials', cid: 'bafyAlbum' });
  });
});

describe('galleryPhotosMatch', () => {
  it('matches by cid when one photo has cid and the other has gateway url only', () => {
    expect(
      galleryPhotosMatch(
        { cid: 'bafySame', url: 'https://example.com/ipfs-gateway/content/image/bafySame' },
        { url: 'https://other.example.com/ipfs-gateway/content/image/bafySame' },
      ),
    ).toBe(true);
  });

  it('matches by normalized url when both are url-only', () => {
    expect(
      galleryPhotosMatch(
        { url: 'https://cdn.example.com/photo.jpg' },
        { url: 'https://cdn.example.com/photo.jpg#frag' },
      ),
    ).toBe(true);
  });
});

describe('albumContainsPhoto', () => {
  it('returns true when any album item matches the photo', () => {
    const photo = {
      url: 'https://example.com/ipfs-gateway/content/image/bafyInSocials',
      rankScore: null,
      isAvatar: false,
    };
    expect(
      albumContainsPhoto(
        {
          name: 'Socials',
          items: [
            {
              url: 'https://example.com/other.jpg',
              rankScore: null,
              isAvatar: false,
            },
            {
              cid: 'bafyInSocials',
              url: 'https://example.com/ipfs-gateway/content/image/bafyInSocials',
              rankScore: null,
              isAvatar: false,
            },
          ],
        },
        photo,
      ),
    ).toBe(true);
  });
});
