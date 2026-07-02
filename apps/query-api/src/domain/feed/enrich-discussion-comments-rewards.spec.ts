import type { HiveContentType } from '@opden-data-layer/clients';
import type { Post } from '@opden-data-layer/core';

import { enrichDiscussionCommentsRewards } from './enrich-discussion-comments-rewards';
import type { DiscussionCommentDto } from './feed-story-dtos';
import type { PostRewardService } from './post-reward.service';

describe('enrichDiscussionCommentsRewards', () => {
  it('batch enriches all discussion comments with one rates snapshot', async () => {
    const comments: Record<string, DiscussionCommentDto> = {
      'bob/c1': {
        id: 'bob/c1',
        author: 'bob',
        permlink: 'c1',
        title: '',
        excerpt: 'hi',
        body: 'hello',
        createdAt: '2024-01-01T00:00:00.000Z',
        feedAt: '2024-01-01T00:00:00.000Z',
        rebloggedBy: null,
        rebloggedByViewer: false,
        isNsfw: false,
        category: null,
        children: 0,
        pendingPayout: '0.000 HBD',
        totalPayout: '0.000 HBD',
        netRshares: '0',
        thumbnailUrl: null,
        videoThumbnailUrl: null,
        videoEmbedUrl: null,
        authorProfile: {
          name: 'bob',
          displayName: null,
          avatarUrl: null,
          reputation: 25,
          wobjectsWeight: 0,
        },
        objects: [],
        votes: { totalCount: 0, previewVoters: [], voted: false },
        reward: null,
        waivRewardEligible: false,
      },
    };

    const content: Record<string, HiveContentType> = {
      'bob/c1': {
        author: 'bob',
        permlink: 'c1',
        pending_payout_value: '1.000 HBD',
        total_payout_value: '0.000 HBD',
        curator_payout_value: '0.000 HBD',
        max_accepted_payout: '1000000.000 HBD',
        cashout_time: '2099-01-01T00:00:00',
        percent_hbd: 10000,
        json_metadata: '{"tags":["waivio"]}',
      } as HiveContentType,
    };

    const postRows: Post[] = [
      {
        author: 'bob',
        permlink: 'c1',
        total_payout_waiv: 5,
        total_rewards_waiv: 0,
      } as Post,
    ];

    const enrichFeedItems = jest.fn().mockResolvedValue([
      {
        ...comments['bob/c1'],
        reward: {
          amount: 2,
          currency: 'USD',
          label: '$ 2.00',
          phase: 'potential',
          breakdown: {
            waiv: { amount: 1, currency: 'USD', label: '$ 1.00' },
            hive: { amount: 0, currency: 'USD', label: '$ 0.00' },
            hbd: { amount: 1, currency: 'USD', label: '$ 1.00' },
            total: { amount: 2, currency: 'USD', label: '$ 2.00' },
          },
        },
        waivRewardEligible: true,
      },
    ]);

    const postRewardService = {
      enrichFeedItems,
    } as unknown as PostRewardService;

    const result = await enrichDiscussionCommentsRewards(
      postRewardService,
      comments,
      content,
      postRows,
      'USD',
      (id) => content[id],
    );

    expect(enrichFeedItems).toHaveBeenCalledTimes(1);
    expect(result['bob/c1'].reward?.label).toBe('$ 2.00');
    expect(result['bob/c1'].waivRewardEligible).toBe(true);
    expect(result['bob/c1'].body).toBe('hello');
  });
});
