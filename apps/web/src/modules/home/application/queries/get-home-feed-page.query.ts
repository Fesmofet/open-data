import {
  mapFeedStoryItemApiToView,
  userBlogFeedResponseSchema,
} from '@/modules/feed/application/mappers/feed-story-from-api.mapper';
import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';

import { fetchHomeFeed } from '../../infrastructure/clients/home-feed.client';

export async function getHomeFeedPageQuery(
  body: { limit?: number; cursor?: string } = {},
  viewer?: string | null,
): Promise<UserBlogFeedPage> {
  const raw = await fetchHomeFeed(body, { viewer });
  if (!raw) {
    return { items: [], cursor: null, hasMore: false };
  }
  const parsed = userBlogFeedResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      '[getHomeFeedPageQuery] unexpected response shape:',
      parsed.error.flatten(),
    );
    return { items: [], cursor: null, hasMore: false };
  }
  return {
    items: parsed.data.items.map(mapFeedStoryItemApiToView),
    cursor: parsed.data.cursor,
    hasMore: parsed.data.hasMore,
  };
}
