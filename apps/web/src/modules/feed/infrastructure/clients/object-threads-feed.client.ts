import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import { DEFAULT_FEED_CURRENCY } from '../../domain/feed-currency';
import type { FeedStoryItemApi } from '../../application/mappers/feed-story-from-api.mapper';

export interface ObjectThreadsFeedResponse {
  items: FeedStoryItemApi[];
  cursor: string | null;
  hasMore: boolean;
}

export async function fetchObjectThreadsFeed(
  objectId: string,
  body: { limit?: number; cursor?: string; sort?: 'latest' | 'oldest' },
  init?: { viewer?: string | null },
): Promise<ObjectThreadsFeedResponse | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/threads`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.viewer != null && init.viewer.trim() !== '') {
    headers['X-Viewer'] = init.viewer.trim();
  }
  return queryApiFetch<ObjectThreadsFeedResponse>(path, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      sort: body.sort ?? 'latest',
      currency: DEFAULT_FEED_CURRENCY,
    }),
    cacheTags: [queryApiCacheTags.objectThreadsFeed(objectId)],
  });
}
