import { GetObjectExpertsEndpoint } from './get-object-experts.endpoint';

describe('GetObjectExpertsEndpoint', () => {
  const objectId = 'ylr-waivio';

  function makeEndpoint(overrides?: {
    core?: { object_id: string } | null;
    total?: number;
    rows?: Array<{
      name: string;
      profile_image: string | null;
      users_following_count: number;
      weight: number;
    }>;
    followedSubset?: string[];
  }) {
    const objectsCore = {
      findByObjectIdForPage: jest.fn().mockResolvedValue(
        overrides && 'core' in overrides ? overrides.core : { object_id: objectId },
      ),
    };
    const userObjectExpertise = {
      countByObjectId: jest.fn().mockResolvedValue(overrides?.total ?? 1),
      listAccountsByObjectId: jest.fn().mockResolvedValue(
        overrides?.rows ?? [
          {
            name: 'alice',
            profile_image: null,
            users_following_count: 42,
            weight: 3.5,
          },
        ],
      ),
    };
    const subscriptions = {
      listFollowedSubset: jest.fn().mockResolvedValue(overrides?.followedSubset ?? ['alice']),
    };
    const endpoint = new GetObjectExpertsEndpoint(
      objectsCore as never,
      userObjectExpertise as never,
      subscriptions as never,
    );
    return { endpoint, objectsCore, userObjectExpertise, subscriptions };
  }

  it('returns null when object is missing', async () => {
    const { endpoint } = makeEndpoint({ core: null });
    const result = await endpoint.execute(objectId, { skip: 0, limit: 20 }, undefined);
    expect(result).toBeNull();
  });

  it('returns per-object expertise weight, not global aggregate', async () => {
    const { endpoint } = makeEndpoint();
    const result = await endpoint.execute(objectId, { skip: 0, limit: 20 }, 'bob');
    expect(result).toEqual({
      items: [
        {
          name: 'alice',
          avatarUrl: null,
          objectExpertiseWeight: 3.5,
          usersFollowingCount: 42,
          isCurrentFollowing: true,
        },
      ],
      total: 1,
      hasMore: false,
    });
  });

  it('computes hasMore from total', async () => {
    const { endpoint } = makeEndpoint({ total: 3 });
    const result = await endpoint.execute(objectId, { skip: 0, limit: 1 }, undefined);
    expect(result?.hasMore).toBe(true);
    expect(result?.items).toHaveLength(1);
  });
});
