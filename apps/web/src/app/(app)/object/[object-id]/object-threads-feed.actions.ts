'use server';

import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { getObjectThreadsFeedPageQuery } from '@/modules/feed/application/queries/get-object-threads-feed.query';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadObjectThreadsFeedAction(
  objectId: string,
  cursor: string | null,
): Promise<UserBlogFeedPage> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username ?? null;
  return getObjectThreadsFeedPageQuery(
    objectId,
    { cursor: cursor ?? undefined, limit: 20, sort: 'latest' },
    viewer,
  );
}
