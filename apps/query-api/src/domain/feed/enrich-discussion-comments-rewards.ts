import type { HiveContentType } from '@opden-data-layer/clients';
import { Post } from '@opden-data-layer/odl-db-types';

import type { SupportedCurrency } from '@opden-data-layer/core';

import { buildPostRewardInputFromSources } from './build-post-reward-input';
import type { DiscussionCommentDto } from './feed-story-dtos';
import type { PostRewardService } from './post-reward.service';

export async function enrichDiscussionCommentsRewards(
  postRewardService: PostRewardService,
  comments: Record<string, DiscussionCommentDto>,
  content: Record<string, HiveContentType>,
  postRows: Post[],
  currency: SupportedCurrency,
  findNode: (id: string) => HiveContentType | undefined,
): Promise<Record<string, DiscussionCommentDto>> {
  const ids = Object.keys(comments);
  if (ids.length === 0) {
    return comments;
  }

  const postByKey = new Map<string, Post>();
  for (const row of postRows) {
    postByKey.set(`${row.author}\0${row.permlink}`, row);
  }

  const items = ids.map((id) => comments[id]);
  const inputs = ids.map((id) => {
    const node = findNode(id);
    const post = node
      ? postByKey.get(`${node.author}\0${node.permlink}`)
      : undefined;
    return buildPostRewardInputFromSources(node, post);
  });

  const enriched = await postRewardService.enrichFeedItems(items, inputs, currency);
  const out: Record<string, DiscussionCommentDto> = { ...comments };
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const body = comments[id]?.body ?? '';
    out[id] = { ...enriched[i], body };
  }
  return out;
}
