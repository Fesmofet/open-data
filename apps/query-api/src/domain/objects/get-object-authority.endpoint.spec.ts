import { GetObjectAuthorityEndpoint } from './get-object-authority.endpoint';

describe('GetObjectAuthorityEndpoint', () => {
  function makeEndpoint(deps: {
    core: { findByObjectIdForPage: jest.Mock };
    authority: {
      countByObjectIdAndType: jest.Mock;
      findAccountsByObjectIdAndType: jest.Mock;
    };
    subscriptions: { listFollowedSubset: jest.Mock };
  }) {
    return new GetObjectAuthorityEndpoint(
      { findByObjectIdForPage: deps.core.findByObjectIdForPage } as never,
      deps.authority as never,
      deps.subscriptions as never,
    );
  }

  it('returns null when object is missing', async () => {
    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue(null) },
      authority: {
        countByObjectIdAndType: jest.fn(),
        findAccountsByObjectIdAndType: jest.fn(),
      },
      subscriptions: { listFollowedSubset: jest.fn() },
    });

    const result = await endpoint.execute(
      'missing',
      { authority_type: 'administrative', sort: 'recency', skip: 0, limit: 20 },
      undefined,
    );

    expect(result).toBeNull();
  });

  it('sets hasMore false when the first page returns all joinable accounts', async () => {
    const rows = [
      {
        name: 'alice',
        profile_image: null,
        wobjects_weight: 1,
        users_following_count: 2,
      },
      {
        name: 'bob',
        profile_image: 'https://example.com/bob.png',
        wobjects_weight: 2,
        users_following_count: 3,
      },
    ];

    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue({ object_id: 'o1' }) },
      authority: {
        countByObjectIdAndType: jest.fn().mockResolvedValue(rows.length),
        findAccountsByObjectIdAndType: jest.fn().mockResolvedValue(rows),
      },
      subscriptions: { listFollowedSubset: jest.fn().mockResolvedValue(['bob']) },
    });

    const result = await endpoint.execute(
      'o1',
      { authority_type: 'administrative', sort: 'recency', skip: 0, limit: 20 },
      'viewer',
    );

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

  it('sets hasMore false when a tail page is empty', async () => {
    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue({ object_id: 'o1' }) },
      authority: {
        countByObjectIdAndType: jest.fn().mockResolvedValue(4),
        findAccountsByObjectIdAndType: jest.fn().mockResolvedValue([]),
      },
      subscriptions: { listFollowedSubset: jest.fn().mockResolvedValue([]) },
    });

    const result = await endpoint.execute(
      'o1',
      { authority_type: 'administrative', sort: 'recency', skip: 4, limit: 20 },
      undefined,
    );

    expect(result).toEqual({
      items: [],
      total: 4,
      hasMore: false,
    });
  });
});
