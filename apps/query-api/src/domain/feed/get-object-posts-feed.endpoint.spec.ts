import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import { UPDATE_TYPES } from '@opden-data-layer/core';

import { AggregatedObjectRepository } from '../../repositories/aggregated-object.repository';
import { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import { ObjectsCoreRepository } from '../../repositories/objects-core.repository';
import { PostsRepository } from '../../repositories/posts.repository';
import { UserAccountMutesRepository } from '../../repositories/user-account-mutes.repository';
import { GovernanceResolverService } from '../governance';
import type { ObjectProjectionService } from '../object-projection/object-projection.service';
import { buildFeedStoryItemsFromPostPage } from './build-feed-story-items-from-post-page';
import { encodeFeedCursor } from './feed-cursor';
import type { FeedStoryItemDto } from './feed-story-dtos';
import { GetObjectPostsFeedEndpoint } from './get-object-posts-feed.endpoint';
import { createPassthroughPostRewardServiceMock } from './post-reward.service.mock';
import type { PostRewardService } from './post-reward.service';

jest.mock('./build-feed-story-items-from-post-page', () => ({
  buildFeedStoryItemsFromPostPage: jest.fn(),
}));

const buildFeedStoryItemsFromPostPageMock = buildFeedStoryItemsFromPostPage as jest.MockedFunction<
  typeof buildFeedStoryItemsFromPostPage
>;

function resolvedView(overrides: Partial<ResolvedObjectView> = {}): ResolvedObjectView {
  return {
    object_id: 'waivio',
    object_type: 'hashtag',
    creator: 'alice',
    weight: 10,
    meta_group_id: null,
    canonical: null,
    fields: {},
    ...overrides,
  };
}

function feedItem(author: string, permlink: string): FeedStoryItemDto {
  return {
    id: `${author}/${permlink}`,
    author,
    permlink,
    title: 'Title',
    excerpt: 'Excerpt',
    createdAt: '2024-01-01T00:00:00.000Z',
    feedAt: '2024-01-01T00:00:00.000Z',
    rebloggedBy: null,
    isNsfw: false,
    category: null,
    children: 0,
    pendingPayout: '0',
    totalPayout: '0',
    netRshares: '0',
    thumbnailUrl: null,
    videoThumbnailUrl: null,
    videoEmbedUrl: null,
    authorProfile: {
      name: author,
      displayName: author,
      avatarUrl: null,
      reputation: 25,
      wobjectsWeight: 0,
    },
    objects: [],
    votes: { totalCount: 0, previewVoters: [], voted: false },
    rebloggedByViewer: false,
    reward: null,
    waivRewardEligible: false,
  };
}

describe('GetObjectPostsFeedEndpoint', () => {
  let postsRepo: jest.Mocked<
    Pick<PostsRepository, 'findObjectPostsFeed' | 'findPostsFeedRowsByKeys'>
  >;
  let objectsCoreRepo: jest.Mocked<
    Pick<ObjectsCoreRepository, 'findByObjectIdForPage' | 'findObjectIdsByMetaGroupId' | 'findRelistingObjectIds'>
  >;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let aggregatedObjectRepo: jest.Mocked<Pick<AggregatedObjectRepository, 'loadByObjectIds'>>;
  let objectViewService: jest.Mocked<Pick<ObjectViewService, 'resolve'>>;
  let governanceResolver: jest.Mocked<
    Pick<GovernanceResolverService, 'resolveMergedForObjectView'>
  >;
  let objectProjection: jest.Mocked<Pick<ObjectProjectionService, 'batchProject'>>;
  let userAccountMutesRepo: jest.Mocked<Pick<UserAccountMutesRepository, 'listMutedForMuters'>>;
  let endpoint: GetObjectPostsFeedEndpoint;

  beforeEach(() => {
    postsRepo = {
      findObjectPostsFeed: jest.fn().mockResolvedValue([]),
      findPostsFeedRowsByKeys: jest.fn().mockResolvedValue([]),
    };
    objectsCoreRepo = {
      findByObjectIdForPage: jest.fn().mockResolvedValue({ object_id: 'waivio', object_type: 'hashtag' }),
      findObjectIdsByMetaGroupId: jest.fn().mockResolvedValue([]),
      findRelistingObjectIds: jest.fn().mockResolvedValue([]),
    };
    accounts = { findByName: jest.fn() };
    aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({ objects: [{ object_id: 'waivio' }], voterWaivPowers: {} }),
    };
    objectViewService = {
      resolve: jest.fn().mockReturnValue([resolvedView()]),
    };
    governanceResolver = {
      resolveMergedForObjectView: jest.fn().mockResolvedValue({}),
    };
    objectProjection = { batchProject: jest.fn() };
    userAccountMutesRepo = {
      listMutedForMuters: jest.fn().mockResolvedValue([]),
    };
    buildFeedStoryItemsFromPostPageMock.mockResolvedValue([]);
    endpoint = new GetObjectPostsFeedEndpoint(
      postsRepo as unknown as PostsRepository,
      objectsCoreRepo as unknown as ObjectsCoreRepository,
      accounts as unknown as AccountsCurrentRepository,
      aggregatedObjectRepo as unknown as AggregatedObjectRepository,
      objectViewService as unknown as ObjectViewService,
      governanceResolver as unknown as GovernanceResolverService,
      objectProjection as unknown as ObjectProjectionService,
      createPassthroughPostRewardServiceMock() as unknown as PostRewardService,
      userAccountMutesRepo as unknown as UserAccountMutesRepository,
    );
  });

  it('returns null when object id is empty', async () => {
    await expect(
      endpoint.execute('  ', { limit: 20, currency: 'USD' }, 'en-US'),
    ).resolves.toBeNull();
  });

  it('returns empty feed for invalid cursor', async () => {
    const r = await endpoint.execute(
      'waivio',
      { limit: 20, cursor: 'not-a-cursor', currency: 'USD' },
      'en-US',
    );
    expect(r).toEqual({ items: [], cursor: null, hasMore: false });
    expect(postsRepo.findObjectPostsFeed).not.toHaveBeenCalled();
  });

  it('prepends pinned rows and dedupes them from the feed page', async () => {
    objectViewService.resolve.mockReturnValue([
      resolvedView({
        fields: {
          [UPDATE_TYPES.PIN]: {
            update_type: UPDATE_TYPES.PIN,
            cardinality: 'multi',
            values: [
              {
                update_id: 'p1',
                update_type: 'pin',
                creator: 'bob',
                locale: null,
                created_at_unix: 1,
                event_seq: BigInt(1),
                value_text: 'pinned/post',
                value_geo: null,
                value_json: null,
                validity_status: 'VALID',
                validity_tier: 'baseline',
                decisive_vote_event_seq: null,
                approve_percent: 100,
                field_weight: null,
                rank_score: null,
                rank_context: null,
                rank_decisive_event_seq: null,
              },
            ],
          },
        },
      }),
    ]);
    postsRepo.findPostsFeedRowsByKeys.mockResolvedValue([
      { author: 'pinned', permlink: 'post', feed_at: 100, reblogged_by: null },
    ]);
    postsRepo.findObjectPostsFeed.mockResolvedValue([
      { author: 'pinned', permlink: 'post', feed_at: 100, reblogged_by: null },
      { author: 'feed', permlink: 'one', feed_at: 90, reblogged_by: null },
      { author: 'feed', permlink: 'two', feed_at: 80, reblogged_by: null },
    ]);
    buildFeedStoryItemsFromPostPageMock.mockImplementation(async (_deps, rows) =>
      rows.map((row) => feedItem(row.author, row.permlink)),
    );

    const r = await endpoint.execute('waivio', { limit: 2, currency: 'USD' }, 'en-US');
    expect(r?.items.map((i) => i.permlink)).toEqual(['post', 'one']);
    expect(r?.hasMore).toBe(true);
    expect(postsRepo.findPostsFeedRowsByKeys).toHaveBeenCalledWith([
      { author: 'pinned', permlink: 'post' },
    ]);
  });

  it('attaches pin and remove flags to hydrated items', async () => {
    objectViewService.resolve.mockReturnValue([
      resolvedView({
        fields: {
          [UPDATE_TYPES.PIN]: {
            update_type: UPDATE_TYPES.PIN,
            cardinality: 'multi',
            values: [
              {
                update_id: 'p1',
                update_type: 'pin',
                creator: 'viewer',
                locale: null,
                created_at_unix: 1,
                event_seq: BigInt(1),
                value_text: 'alice/post-1',
                value_geo: null,
                value_json: null,
                validity_status: 'VALID',
                validity_tier: 'baseline',
                decisive_vote_event_seq: null,
                approve_percent: 100,
                field_weight: null,
                rank_score: null,
                rank_context: null,
                rank_decisive_event_seq: null,
              },
            ],
          },
          [UPDATE_TYPES.REMOVE]: {
            update_type: UPDATE_TYPES.REMOVE,
            cardinality: 'multi',
            values: [
              {
                update_id: 'r1',
                update_type: 'remove',
                creator: 'bob',
                locale: null,
                created_at_unix: 1,
                event_seq: BigInt(1),
                value_text: 'bob/post-2',
                value_geo: null,
                value_json: null,
                validity_status: 'VALID',
                validity_tier: 'baseline',
                decisive_vote_event_seq: null,
                approve_percent: 100,
                field_weight: null,
                rank_score: null,
                rank_context: null,
                rank_decisive_event_seq: null,
              },
            ],
          },
        },
      }),
    ]);
    postsRepo.findObjectPostsFeed.mockResolvedValue([
      { author: 'alice', permlink: 'post-1', feed_at: 100, reblogged_by: null },
    ]);
    buildFeedStoryItemsFromPostPageMock.mockResolvedValue([feedItem('alice', 'post-1')]);

    const r = await endpoint.execute(
      'waivio',
      { limit: 20, currency: 'USD' },
      'en-US',
      undefined,
      'viewer',
    );
    expect(r?.items[0]).toMatchObject({
      pin: true,
      hasPinUpdate: true,
    });
  });

  it('returns empty feed for newsfeed object without parseable filter', async () => {
    objectViewService.resolve.mockReturnValue([
      resolvedView({ object_type: 'newsfeed', fields: {} }),
    ]);
    const r = await endpoint.execute('waivio', { limit: 20, currency: 'USD' }, 'en-US');
    expect(r).toEqual({ items: [], cursor: null, hasMore: false });
  });

  it('encodes next cursor from the last page row', async () => {
    postsRepo.findObjectPostsFeed.mockResolvedValue([
      { author: 'alice', permlink: 'post-1', feed_at: 100, reblogged_by: null },
      { author: 'bob', permlink: 'post-2', feed_at: 90, reblogged_by: null },
    ]);
    buildFeedStoryItemsFromPostPageMock.mockResolvedValue([
      feedItem('alice', 'post-1'),
      feedItem('bob', 'post-2'),
    ]);

    const r = await endpoint.execute('waivio', { limit: 1, currency: 'USD' }, 'en-US');
    expect(r?.hasMore).toBe(true);
    expect(r?.cursor).toBe(
      encodeFeedCursor({ feedAt: 100, author: 'alice', permlink: 'post-1' }),
    );
  });
});
