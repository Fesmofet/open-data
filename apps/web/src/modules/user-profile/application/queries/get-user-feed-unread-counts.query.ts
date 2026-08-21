import 'server-only';

import { fetchUserFeedUnreadCounts } from '../../infrastructure/clients/feed-unread.client';

export async function getUserFeedUnreadCountsQuery(
  accountName: string,
  viewer: string | null | undefined,
): Promise<{ posts: number; threads: number; messages: number } | null> {
  const viewerTrimmed = viewer?.trim() ?? '';
  const account = accountName.trim();
  if (!viewerTrimmed || viewerTrimmed.toLowerCase() !== account.toLowerCase()) {
    return null;
  }
  return fetchUserFeedUnreadCounts(account, viewerTrimmed);
}
