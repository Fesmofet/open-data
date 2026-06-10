import type { Post } from '@opden-data-layer/core';

import { buildFeedStoryItemsFromPostPage } from './build-feed-story-items-from-post-page';
import type { FeedStoryItemDto } from './feed-story-dtos';
import { createPassthroughPostRewardServiceMock } from './post-reward.service.mock';
import type { PostRewardService } from './post-reward.service';

describe('buildFeedStoryItemsFromPostPage', () => {
  it('calls batchProject once for a multi-post page', async () => {
    const batchProject = jest.fn().mockResolvedValue([
      {
        object_id: 'obj-1',
        object_type: 'item',
        semantic_type: null,
        weight: null,
        fields: { image: 'https://img.example/x.png' },
        hasAdministrativeAuthority: false,
        hasOwnershipAuthority: false,
      },
    ]);

    const postA = {
      author: 'alice',
      permlink: 'a',
      title: 'A',
      body: 'body a',
      created_unix: 1_700_000_000,
      children: 0,
      pending_payout_value: '0',
      total_payout_value: '0',
      net_rshares: 0,
      json_metadata: '{}',
      category: 'blog',
    } as unknown as Post;
    const postB = {
      ...postA,
      author: 'bob',
      permlink: 'b',
      title: 'B',
      body: 'body b',
    } as unknown as Post;

    const deps = {
      postsRepo: {
        findPostsByKeys: jest.fn().mockResolvedValue([postA, postB]),
        findPostObjectsByKeys: jest.fn().mockResolvedValue([
          {
            author: 'alice',
            permlink: 'a',
            object_id: 'obj-1',
            object_type: 'item',
            percent: 100,
          },
        ]),
        findActiveVoteSummaries: jest.fn().mockResolvedValue(new Map()),
        findViewerRebloggedKeys: jest.fn().mockResolvedValue(new Set()),
      },
      accounts: {
        findByNames: jest.fn().mockResolvedValue([]),
      },
      aggregatedObjectRepo: {
        loadByObjectIds: jest.fn().mockResolvedValue({
          objects: [
            {
              core: {
                object_id: 'obj-1',
                object_type: 'item',
                creator: 'c',
                weight: 1,
                meta_group_id: null,
                canonical: null,
                canonical_creator: null,
                transaction_id: 't',
                status: 'active',
                seq: 0,
                created_at: new Date('2024-01-01T00:00:00.000Z'),
              },
              updates: [],
              validity_votes: [],
              authorities: [],
            },
          ],
          voterWaivPowers: new Map(),
          rankVoteProjection: {
            rankVotesByObjectId: new Map(),
            viewerRankByObjectId: new Map(),
          },
        }),
      },
      objectViewService: {
        resolve: jest.fn().mockReturnValue([
          { object_id: 'obj-1', object_type: 'item', fields: {} },
        ]),
      },
      governanceResolver: {
        resolveMergedForObjectView: jest.fn().mockResolvedValue({}),
      },
      objectProjection: { batchProject },
      postRewardService: createPassthroughPostRewardServiceMock() as unknown as PostRewardService,
    };

    const pageRows = [
      { author: 'alice', permlink: 'a', feed_at: 1_700_000_100, reblogged_by: null },
      { author: 'bob', permlink: 'b', feed_at: 1_700_000_200, reblogged_by: null },
    ];

    const items = await buildFeedStoryItemsFromPostPage(
      deps as never,
      pageRows,
      'en-US',
      undefined,
      undefined,
      'USD',
    );

    expect(batchProject).toHaveBeenCalledTimes(1);
    expect(items).toHaveLength(2);
    expect((items[0] as FeedStoryItemDto).objects).toHaveLength(1);
    expect((items[1] as FeedStoryItemDto).objects).toHaveLength(0);
  });
});
