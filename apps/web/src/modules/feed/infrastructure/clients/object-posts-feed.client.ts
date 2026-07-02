import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import { DEFAULT_FEED_CURRENCY } from '../../domain/feed-currency';
import type { FeedStoryItemApi } from '../../application/mappers/feed-story-from-api.mapper';

export interface ObjectPostsFeedResponse {
  items: FeedStoryItemApi[];
  cursor: string | null;
  hasMore: boolean;
}

export async function fetchObjectPostsFeed(
  objectId: string,
  body: { limit?: number; cursor?: string },
  init?: { viewer?: string | null },
): Promise<ObjectPostsFeedResponse | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/posts`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.viewer != null && init.viewer.trim() !== '') {
    headers['X-Viewer'] = init.viewer.trim();
  }
  return queryApiFetch<ObjectPostsFeedResponse>(path, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      currency: DEFAULT_FEED_CURRENCY,
    }),
    cacheTags: [queryApiCacheTags.objectPostsFeed(objectId)],
  });
}
