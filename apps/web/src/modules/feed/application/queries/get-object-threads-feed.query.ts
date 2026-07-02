import {
  mapFeedStoryItemApiToView,
  userBlogFeedResponseSchema,
} from '../mappers/feed-story-from-api.mapper';
import { fetchObjectThreadsFeed } from '../../infrastructure/clients/object-threads-feed.client';
import type { UserBlogFeedPage } from '../dto/user-blog-feed-page.dto';

const EMPTY_PAGE: UserBlogFeedPage = { items: [], cursor: null, hasMore: false };

export async function getObjectThreadsFeedPageQuery(
  objectId: string,
  body: { limit?: number; cursor?: string; sort?: 'latest' | 'oldest' } = {},
  viewer?: string | null,
): Promise<UserBlogFeedPage> {
  const raw = await fetchObjectThreadsFeed(objectId, body, { viewer });
  if (!raw) {
    return EMPTY_PAGE;
  }
  const parsed = userBlogFeedResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return EMPTY_PAGE;
  }
  return {
    items: parsed.data.items.map(mapFeedStoryItemApiToView),
    cursor: parsed.data.cursor,
    hasMore: parsed.data.hasMore,
  };
}
