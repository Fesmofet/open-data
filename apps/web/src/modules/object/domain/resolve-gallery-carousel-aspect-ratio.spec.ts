import {
  CONTENT_IMAGE_DEFAULT_FRAME_ASPECT,
  resolveContentImageFrameAspect,
  resolveGalleryCarouselAspectRatio,
} from './resolve-gallery-carousel-aspect-ratio';

describe('resolveContentImageFrameAspect', () => {
  it('uses natural ratio for portrait photos', () => {
    expect(resolveContentImageFrameAspect(600, 900)).toBeCloseTo(2 / 3);
  });

  it('uses square frame for square photos', () => {
    expect(resolveContentImageFrameAspect(800, 800)).toBe(1);
  });

  it('uses natural ratio for landscape photos up to 16:9', () => {
    expect(resolveContentImageFrameAspect(1600, 900)).toBeCloseTo(16 / 9);
    expect(resolveContentImageFrameAspect(1200, 900)).toBeCloseTo(4 / 3);
  });

  it('caps ultra-wide panoramas at 16:9', () => {
    expect(resolveContentImageFrameAspect(3000, 900)).toBeCloseTo(16 / 9);
  });

  it('falls back to default book-cover ratio for invalid dimensions', () => {
    expect(resolveContentImageFrameAspect(0, 900)).toBe(CONTENT_IMAGE_DEFAULT_FRAME_ASPECT);
  });
});

describe('resolveGalleryCarouselAspectRatio (deprecated alias)', () => {
  it('delegates to resolveContentImageFrameAspect', () => {
    expect(resolveGalleryCarouselAspectRatio(600, 900)).toBeCloseTo(2 / 3);
  });
});
