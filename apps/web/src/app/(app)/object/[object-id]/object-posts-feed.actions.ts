'use server';

import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { getObjectPostsFeedPageQuery } from '@/modules/feed/application/queries/get-object-posts-feed.query';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadMoreObjectPostsFeedAction(
  objectId: string,
  cursor: string,
): Promise<UserBlogFeedPage> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username ?? null;
  return getObjectPostsFeedPageQuery(objectId, { cursor, limit: 20 }, viewer);
}
