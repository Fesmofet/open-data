import 'server-only';

import { queryApiFetchLive } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { PostDiscussionApi } from '../../application/dto/post-discussion.dto';

export async function fetchPostDiscussion(
  author: string,
  permlink: string,
  viewer?: string | null,
): Promise<PostDiscussionApi | null> {
  const path = `/query/v1/posts/${encodeURIComponent(author)}/${encodeURIComponent(permlink)}/discussion`;
  const headers: Record<string, string> = {};
  if (viewer != null && viewer.trim() !== '') {
    headers['X-Viewer'] = viewer.trim();
  }
  return queryApiFetchLive<PostDiscussionApi>(path, { headers });
}
