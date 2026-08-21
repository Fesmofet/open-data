import { GetObjectOwnershipEndpoint } from './get-object-ownership.endpoint';

describe('GetObjectOwnershipEndpoint', () => {
  it('returns null when object is missing', async () => {
    const endpoint = new GetObjectOwnershipEndpoint(
      { findByObjectIdForPage: jest.fn().mockResolvedValue(null) } as never,
      {
        countByObjectIdAndType: jest.fn(),
        findAccountsByObjectIdAndType: jest.fn(),
      } as never,
      { listFollowedSubset: jest.fn() } as never,
    );

    const result = await endpoint.execute(
      'missing',
      { ownership_type: 'exclusive', sort: 'recency', skip: 0, limit: 20 },
      undefined,
    );

    expect(result).toBeNull();
  });

  it('returns paginated ownership accounts', async () => {
    const rows = [{ name: 'alice', profile_image: null, wobjects_weight: 1, users_following_count: 2 }];
    const findAccountsByObjectIdAndType = jest.fn().mockResolvedValue(rows);
    const countByObjectIdAndType = jest.fn().mockResolvedValue(1);

    const endpoint = new GetObjectOwnershipEndpoint(
      { findByObjectIdForPage: jest.fn().mockResolvedValue({ object_id: 'o1' }) } as never,
      { countByObjectIdAndType, findAccountsByObjectIdAndType } as never,
      { listFollowedSubset: jest.fn().mockResolvedValue([]) } as never,
    );

    const result = await endpoint.execute(
      'o1',
      { ownership_type: 'supervised', sort: 'recency', skip: 0, limit: 20 },
      undefined,
    );

    expect(findAccountsByObjectIdAndType).toHaveBeenCalledWith('o1', 'supervised', 'recency', 0, 20);
    expect(result).toEqual({
      items: [
        {
          name: 'alice',
          avatarUrl: null,
          wobjectsWeight: 1,
          usersFollowingCount: 2,
          isCurrentFollowing: false,
        },
      ],
      total: 1,
      hasMore: false,
    });
  });
});
