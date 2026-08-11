export const GALLERY_RANK_MAX = 10_000;
export const GALLERY_RANK_MIN = 0;
/** UI slider step — finer than star-rating half-steps (1000) for smooth dragging. */
export const GALLERY_RANK_STEP = 100;

/** Display label for ODL rank units (0–10000). */
export function formatGalleryRankLabel(rank: number | null | undefined): string {
  if (rank == null || !Number.isFinite(rank)) {
    return '—';
  }
  return String(Math.round(rank));
}

/** Snap slider value to allowed step and bounds. */
export function clampGalleryRank(value: number): number {
  const snapped = Math.round(value / GALLERY_RANK_STEP) * GALLERY_RANK_STEP;
  return Math.min(GALLERY_RANK_MAX, Math.max(GALLERY_RANK_MIN, snapped));
}

/** Modal slider seed: viewer vote when present, else max rank. */
export function defaultGalleryRankSeed(viewerRank: number | null | undefined): number {
  if (viewerRank != null && Number.isFinite(viewerRank)) {
    return clampGalleryRank(viewerRank);
  }
  return GALLERY_RANK_MAX;
}
