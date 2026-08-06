import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import { DEFAULT_FEED_CURRENCY } from '@/modules/feed/domain/feed-currency';

export interface HomeFeedResponse {
  items: unknown[];
  cursor: string | null;
  hasMore: boolean;
}

export async function fetchHomeFeed(
  body: { limit?: number; cursor?: string },
  init?: { viewer?: string | null },
): Promise<HomeFeedResponse | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const viewer = init?.viewer?.trim() ?? '';
  if (viewer.length > 0) {
    headers['X-Viewer'] = viewer;
  }
  const viewerKey = viewer.length > 0 ? viewer.toLowerCase() : 'guest';
  return queryApiFetch<HomeFeedResponse>('/query/v1/posts/feed', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      currency: DEFAULT_FEED_CURRENCY,
    }),
    cacheTags: [queryApiCacheTags.homeFeed(viewerKey)],
  });
}
