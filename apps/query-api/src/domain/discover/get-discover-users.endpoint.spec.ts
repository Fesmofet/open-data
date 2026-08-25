import { GetDiscoverUsersEndpoint } from './get-discover-users.endpoint';
import type { DiscoverRepository } from '../../repositories';

describe('GetDiscoverUsersEndpoint', () => {
  it('resolves user profile_image from posting_json_metadata before json_metadata', async () => {
    const discoverRepo = {
      listUsers: jest.fn().mockResolvedValue({
        rows: [
          {
            name: 'alice',
            posting_json_metadata: JSON.stringify({
              profile: { profile_image: 'https://posting.test/a.jpg' },
            }),
            json_metadata: JSON.stringify({
              profile: { profile_image: 'https://json.test/b.jpg' },
            }),
            profile_image: 'https://column.test/c.jpg',
            object_reputation: 50,
            wobjects_weight: 1,
            followers_count: 2,
            is_following: false,
          },
        ],
        hasMore: false,
      }),
      buildUserCursor: jest.fn(),
    } as unknown as DiscoverRepository;

    const endpoint = new GetDiscoverUsersEndpoint(discoverRepo);
    const result = await endpoint.execute({ query: { limit: 10 } });

    expect(result.items).toEqual([
      {
        name: 'alice',
        profile_image: 'https://posting.test/a.jpg',
        reputation: 50,
        wobjects_weight: 1,
        followers_count: 2,
        is_following: false,
      },
    ]);
  });
});
