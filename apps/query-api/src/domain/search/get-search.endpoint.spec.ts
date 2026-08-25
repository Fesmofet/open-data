import { GetSearchEndpoint } from './get-search.endpoint';
import type { SearchRepository } from '../../repositories';
import { SearchObjectsDisplayService } from './search-objects-display.service';

describe('GetSearchEndpoint', () => {
  it('resolves user profile_image from posting_json_metadata before json_metadata', async () => {
    const searchRepo = {
      searchObjects: jest.fn().mockResolvedValue([]),
      searchUsers: jest.fn().mockResolvedValue([
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
      ]),
    } as unknown as SearchRepository;

    const searchObjectsDisplay = {
      projectByObjectIds: jest.fn(),
    } as unknown as SearchObjectsDisplayService;

    const endpoint = new GetSearchEndpoint(searchRepo, searchObjectsDisplay);
    const result = await endpoint.execute({
      q: 'ali',
      locale: 'en-US',
      limit: 10,
      type: 'users',
    });

    expect(result.users).toEqual([
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
