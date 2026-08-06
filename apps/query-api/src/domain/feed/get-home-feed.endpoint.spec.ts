import { GetHomeFeedEndpoint } from './get-home-feed.endpoint';
import { encodeFeedCursor } from './feed-cursor';
import { buildFeedStoryItemsFromPostPage } from './build-feed-story-items-from-post-page';

jest.mock('./build-feed-story-items-from-post-page', () => ({
  buildFeedStoryItemsFromPostPage: jest.fn().mockResolvedValue([]),
}));

describe('GetHomeFeedEndpoint', () => {
  it('returns empty page when cursor is invalid', async () => {
    const endpoint = new GetHomeFeedEndpoint(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await endpoint.execute(
      { limit: 20, cursor: 'not-a-valid-cursor', currency: 'USD' },
      'en-US',
    );

    expect(result).toEqual({ items: [], cursor: null, hasMore: false });
  });

  it('encodes next cursor when more rows exist', async () => {
    const postsRepo = {
      findHomeFeed: jest.fn().mockResolvedValue([
        { author: 'a', permlink: 'p1', feed_at: 100, reblogged_by: null },
        { author: 'b', permlink: 'p2', feed_at: 90, reblogged_by: null },
        { author: 'c', permlink: 'p3', feed_at: 80, reblogged_by: null },
      ]),
    };
    const userAccountMutesRepo = { listMutedForMuters: jest.fn().mockResolvedValue([]) };
    const endpoint = new GetHomeFeedEndpoint(
      postsRepo as never,
      {} as never,
      userAccountMutesRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await endpoint.execute({ limit: 2, currency: 'USD' }, 'en-US', undefined, 'alice');

    expect(postsRepo.findHomeFeed).toHaveBeenCalledWith('alice', [], null, 3);
    expect(buildFeedStoryItemsFromPostPage).toHaveBeenCalled();
    expect(result.hasMore).toBe(true);
    expect(result.cursor).toBe(
      encodeFeedCursor({ feedAt: 90, author: 'b', permlink: 'p2' }),
    );
  });

  it('loads global feed for guest without loading mutes', async () => {
    const postsRepo = {
      findHomeFeed: jest.fn().mockResolvedValue([]),
    };
    const userAccountMutesRepo = {
      listMutedForMuters: jest.fn().mockResolvedValue([]),
    };
    const endpoint = new GetHomeFeedEndpoint(
      postsRepo as never,
      {} as never,
      userAccountMutesRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await endpoint.execute({ limit: 20, currency: 'USD' }, 'en-US');

    expect(userAccountMutesRepo.listMutedForMuters).not.toHaveBeenCalled();
    expect(postsRepo.findHomeFeed).toHaveBeenCalledWith(undefined, [], null, 21);
  });
});
