const MAX_LANDSCAPE_FRAME_ASPECT = 16 / 9;

/** Neutral square placeholder while natural dimensions are loading (avoids letterbox flash). */
export const CONTENT_IMAGE_SKELETON_FRAME_ASPECT = 1;

/** Typical book cover ratio — used only when dimensions are invalid. */
export const CONTENT_IMAGE_DEFAULT_FRAME_ASPECT = 2 / 3;

/** @deprecated Use `CONTENT_IMAGE_DEFAULT_FRAME_ASPECT`. */
export const GALLERY_CAROUSEL_DEFAULT_FRAME_ASPECT = CONTENT_IMAGE_DEFAULT_FRAME_ASPECT;

/** @deprecated Portrait frames now use natural ratio; kept for callers that referenced 3:4. */
export const GALLERY_CAROUSEL_PORTRAIT_FRAME_ASPECT = 3 / 4;

/** Natural aspect for showcase/content frames; landscape capped at 16:9. */
export function resolveContentImageFrameAspect(
  naturalWidth: number,
  naturalHeight: number,
): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return CONTENT_IMAGE_DEFAULT_FRAME_ASPECT;
  }
  const ratio = naturalWidth / naturalHeight;
  if (ratio >= 1) {
    return Math.min(MAX_LANDSCAPE_FRAME_ASPECT, ratio);
  }
  return ratio;
}

/** @deprecated Use `resolveContentImageFrameAspect`. */
export const resolveGalleryCarouselAspectRatio = resolveContentImageFrameAspect;
