'use server';

import type { PostDiscussionView } from '@/modules/feed/application/dto/post-discussion.dto';
import { mapPostDiscussionApiToView } from '@/modules/feed/application/mappers/post-discussion-from-api.mapper';
import { fetchPostDiscussion } from '@/modules/feed/infrastructure/clients/post-discussion.client';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadPostDiscussionAction(
  author: string,
  permlink: string,
): Promise<PostDiscussionView | null> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username ?? null;
  const raw = await fetchPostDiscussion(author, permlink, viewer);
  if (!raw) {
    return null;
  }
  return mapPostDiscussionApiToView(raw);
}
