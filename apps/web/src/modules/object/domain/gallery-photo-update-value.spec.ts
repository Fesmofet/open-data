import {
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
