import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import { DEFAULT_FEED_CURRENCY } from '../../domain/feed-currency';

export interface UserBlogFeedResponse {
  items: unknown[];
  cursor: string | null;
  hasMore: boolean;
}

export async function fetchUserBlogFeed(
  accountName: string,
  body: { limit?: number; cursor?: string; object_ids?: string[] },
  init?: { viewer?: string | null },
): Promise<UserBlogFeedResponse | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/blog`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.viewer != null && init.viewer.trim() !== '') {
    headers['X-Viewer'] = init.viewer.trim();
  }
  const objectIds = (body.object_ids ?? []).map((id) => id.trim()).filter(Boolean);
  const hasFilters = objectIds.length > 0;
  return queryApiFetch<UserBlogFeedResponse>(path, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      object_ids: objectIds,
      currency: DEFAULT_FEED_CURRENCY,
    }),
    cacheTags: hasFilters ? undefined : [queryApiCacheTags.userBlogFeed(accountName)],
  });
}
