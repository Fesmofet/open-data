import { GetObjectFavoritedByEndpoint } from './get-object-favorited-by.endpoint';

describe('GetObjectFavoritedByEndpoint', () => {
  function makeEndpoint(deps: {
    core: { findByObjectIdForPage: jest.Mock };
    favorite: {
      countByObjectId: jest.Mock;
      findAccountsByObjectId: jest.Mock;
    };
    subscriptions: { listFollowedSubset: jest.Mock };
  }) {
    return new GetObjectFavoritedByEndpoint(
      { findByObjectIdForPage: deps.core.findByObjectIdForPage } as never,
      deps.favorite as never,
      deps.subscriptions as never,
    );
  }

  it('returns null when object is missing', async () => {
    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue(null) },
      favorite: { countByObjectId: jest.fn(), findAccountsByObjectId: jest.fn() },
      subscriptions: { listFollowedSubset: jest.fn() },
    });

    const result = await endpoint.execute('missing', { sort: 'recency', skip: 0, limit: 20 }, undefined);

    expect(result).toBeNull();
  });

  it('sets hasMore false when the first page returns all joinable accounts', async () => {
    const rows = [
      { name: 'alice', profile_image: null, wobjects_weight: 1, users_following_count: 2 },
      { name: 'bob', profile_image: 'https://example.com/bob.png', wobjects_weight: 2, users_following_count: 3 },
    ];

    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue({ object_id: 'o1' }) },
      favorite: {
        countByObjectId: jest.fn().mockResolvedValue(rows.length),
        findAccountsByObjectId: jest.fn().mockResolvedValue(rows),
      },
      subscriptions: { listFollowedSubset: jest.fn().mockResolvedValue(['bob']) },
    });

    const result = await endpoint.execute('o1', { sort: 'recency', skip: 0, limit: 20 }, 'viewer');

    expect(result).toEqual({
      items: [
        {
          name: 'alice',
          avatarUrl: null,
          wobjectsWeight: 1,
          usersFollowingCount: 2,
          isCurrentFollowing: false,
        },
        {
          name: 'bob',
          avatarUrl: 'https://example.com/bob.png',
          wobjectsWeight: 2,
          usersFollowingCount: 3,
          isCurrentFollowing: true,
        },
      ],
      total: 2,
      hasMore: false,
    });
  });
});
