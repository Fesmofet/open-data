import type { FeedStoryView } from '../application/dto/feed-story.dto';

export const DISCUSSION_COMMENT_SORTS = [
  'BEST',
  'NEWEST',
  'OLDEST',
  'AUTHOR_REPUTATION',
] as const;

export type DiscussionCommentSort = (typeof DISCUSSION_COMMENT_SORTS)[number];

function netRsharesValue(story: FeedStoryView): number {
  const raw = story.netRshares;
  if (raw == null || raw === '') {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function payoutValue(story: FeedStoryView): number {
  const pending = Number(story.pendingPayout ?? 0);
  const total = Number(story.totalPayout ?? 0);
  return (Number.isFinite(pending) ? pending : 0) + (Number.isFinite(total) ? total : 0);
}

export function sortDiscussionComments<T extends FeedStoryView>(
  comments: T[],
  sort: DiscussionCommentSort,
): T[] {
  const sorted = [...comments];
  switch (sort) {
    case 'BEST':
      return sorted.sort((a, b) => {
        const aNeg = netRsharesValue(a) < 0;
        const bNeg = netRsharesValue(b) < 0;
        if (aNeg && !bNeg) {
          return 1;
        }
        if (!aNeg && bNeg) {
          return -1;
        }
        const aPay = payoutValue(a);
        const bPay = payoutValue(b);
        if (aPay !== bPay) {
          return bPay - aPay;
        }
        return netRsharesValue(b) - netRsharesValue(a);
      });
    case 'NEWEST':
      return sorted.sort(
        (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
      ).reverse();
    case 'OLDEST':
      return sorted.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    case 'AUTHOR_REPUTATION':
      return sorted.sort(
        (a, b) => (b.authorReputation ?? 0) - (a.authorReputation ?? 0),
      );
    default:
      return sorted;
  }
}
