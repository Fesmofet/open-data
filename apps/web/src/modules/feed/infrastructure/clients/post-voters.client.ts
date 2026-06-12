import 'server-only';

import { queryApiFetchLive } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { PostVotersPageApi } from '../../application/dto/post-voters.dto';
import { DEFAULT_FEED_CURRENCY } from '../../domain/feed-currency';

export type FetchPostVotersParams = {
  author: string;
  permlink: string;
  direction: 'up' | 'down';
  contentType?: 'post' | 'thread';
  cursor?: string | null;
  limit?: number;
};

export async function fetchPostVoters(
  params: FetchPostVotersParams,
): Promise<PostVotersPageApi | null> {
  const search = new URLSearchParams({
    direction: params.direction,
    currency: DEFAULT_FEED_CURRENCY,
  });
  if (params.contentType === 'thread') {
    search.set('contentType', 'thread');
  }
  if (params.cursor) {
    search.set('cursor', params.cursor);
  }
  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }

  const path = `/query/v1/posts/${encodeURIComponent(params.author)}/${encodeURIComponent(params.permlink)}/voters?${search.toString()}`;
  return queryApiFetchLive<PostVotersPageApi>(path);
}
