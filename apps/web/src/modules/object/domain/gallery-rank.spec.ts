import {
  clampGalleryRank,
  defaultGalleryRankSeed,
  formatGalleryRankLabel,
  GALLERY_RANK_MAX,
  GALLERY_RANK_STEP,
} from './gallery-rank';

describe('gallery-rank', () => {
  it('formatGalleryRankLabel returns em dash for null', () => {
    expect(formatGalleryRankLabel(null)).toBe('—');
  });

  it('defaultGalleryRankSeed uses viewer rank when set', () => {
    expect(defaultGalleryRankSeed(7000)).toBe(7000);
  });

  it('defaultGalleryRankSeed uses max when viewer rank absent', () => {
    expect(defaultGalleryRankSeed(null)).toBe(GALLERY_RANK_MAX);
  });

  it('clampGalleryRank snaps to step and bounds', () => {
    expect(clampGalleryRank(5550)).toBe(5600);
    expect(clampGalleryRank(-100)).toBe(0);
    expect(clampGalleryRank(99999)).toBe(GALLERY_RANK_MAX);
    expect(clampGalleryRank(GALLERY_RANK_STEP * 3)).toBe(300);
  });
});
