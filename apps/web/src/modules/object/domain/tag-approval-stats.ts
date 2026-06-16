export type TagApprovalStat = {
  approvePercent: number;
  forCount: number;
  againstCount: number;
  viewer_vote: 'for' | 'against' | null;
  updateId?: string;
};

export type TagApprovalStatsIndex = {
  byUpdateId: Record<string, TagApprovalStat>;
};

export const EMPTY_TAG_APPROVAL_STAT: TagApprovalStat = {
  approvePercent: 0,
  forCount: 0,
  againstCount: 0,
  viewer_vote: null,
};

export function resolveTagApprovalStat(
  updateId: string | undefined,
  index: TagApprovalStatsIndex | undefined,
): TagApprovalStat {
  if (!updateId || !index) {
    return EMPTY_TAG_APPROVAL_STAT;
  }
  return index.byUpdateId[updateId] ?? EMPTY_TAG_APPROVAL_STAT;
}
