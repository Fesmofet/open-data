import {
  mapFeedStoryItemApiToView,
  userBlogFeedResponseSchema,
} from '../mappers/feed-story-from-api.mapper';
import { fetchObjectPostsFeed } from '../../infrastructure/clients/object-posts-feed.client';
import type { UserBlogFeedPage } from '../dto/user-blog-feed-page.dto';

const EMPTY_PAGE: UserBlogFeedPage = { items: [], cursor: null, hasMore: false };

export async function getObjectPostsFeedPageQuery(
  objectId: string,
  body: { limit?: number; cursor?: string } = {},
  viewer?: string | null,
): Promise<UserBlogFeedPage> {
  const raw = await fetchObjectPostsFeed(objectId, body, { viewer });
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
