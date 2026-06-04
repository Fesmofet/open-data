import { imageGalleryItemJsonSchema } from './image-gallery-item';

describe('imageGalleryItemJsonSchema', () => {
  it('rejects album without cid or url', () => {
    expect(imageGalleryItemJsonSchema.safeParse({ album: 'test album' }).success).toBe(
      false,
    );
  });

  it('accepts album with cid', () => {
    const result = imageGalleryItemJsonSchema.safeParse({
      album: 'test album',
      cid: 'bafybeigdyrzt5g7s',
    });
    expect(result.success).toBe(true);
  });

  it('rejects both cid and url', () => {
    expect(
      imageGalleryItemJsonSchema.safeParse({
        album: 'test album',
        cid: 'bafybeigdyrzt5g7s',
        url: 'https://example.com/a.jpg',
      }).success,
    ).toBe(false);
  });
});
