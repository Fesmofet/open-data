export type GalleryApprovalStat = {
  approvePercent: number;
  forCount: number;
  againstCount: number;
  viewer_vote: 'for' | 'against' | null;
  forPreviewVoters?: string[];
  againstPreviewVoters?: string[];
  decisive_privileged_vote?: {
    tier: 'admin' | 'trusted';
    vote: 'for' | 'against';
    voter: string;
  } | null;
  /** Feed update id (present when stat comes from the updates index). */
  updateId?: string;
  /** Update creator username (present when stat comes from the updates index). */
  creator?: string;
};

export type GalleryApprovalStatsIndex = {
  byUpdateId: Record<string, GalleryApprovalStat>;
  byUrl: Record<string, GalleryApprovalStat>;
};

export const EMPTY_GALLERY_APPROVAL_STAT: GalleryApprovalStat = {
  approvePercent: 0,
  forCount: 0,
  againstCount: 0,
  viewer_vote: null,
};

export type GalleryPhotoApprovalSource = {
  update_id?: string;
  url: string;
  approvePercent?: number;
  isAvatar?: boolean;
};

/** Canonical URL key for matching gallery items to update feed rows. */
export function normalizeGalleryImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    return parsed.href;
  } catch {
    return trimmed;
  }
}

export function resolveGalleryPhotoApprovalStat(
  photo: GalleryPhotoApprovalSource,
  index: GalleryApprovalStatsIndex,
): GalleryApprovalStat {
  if (photo.update_id) {
    const byId = index.byUpdateId[photo.update_id];
    if (byId) {
      return byId;
    }
  }

  const normalizedUrl = normalizeGalleryImageUrl(photo.url);
  const byUrl =
    index.byUrl[normalizedUrl] ??
    index.byUrl[photo.url] ??
    index.byUrl[photo.url.trim()];
  if (byUrl) {
    return byUrl;
  }

  if (photo.approvePercent != null && Number.isFinite(photo.approvePercent)) {
    return {
      approvePercent: photo.approvePercent,
      forCount: 0,
      againstCount: 0,
      viewer_vote: null,
    };
  }

  return EMPTY_GALLERY_APPROVAL_STAT;
}
