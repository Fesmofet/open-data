import { GetUserBlogObjectFiltersEndpoint } from './get-user-blog-object-filters.endpoint';
import type { PostsRepository } from '../../repositories/posts.repository';
import type { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import type { AggregatedObjectRepository } from '../../repositories/aggregated-object.repository';
import type { ObjectViewService } from '@opden-data-layer/objects-domain';
import type { ObjectProjectionService } from '../object-projection';

describe('GetUserBlogObjectFiltersEndpoint', () => {
  it('returns empty items when account is missing', async () => {
    const accounts = { findByName: jest.fn().mockResolvedValue(null) } as unknown as AccountsCurrentRepository;
    const endpoint = new GetUserBlogObjectFiltersEndpoint(
      accounts,
      {} as PostsRepository,
      {} as AggregatedObjectRepository,
      {} as ObjectViewService,
      {} as ObjectProjectionService,
    );

    const result = await endpoint.execute('missing', { objects: [] }, 'en-US');

    expect(result).toBeNull();
  });

  it('maps facets with projected names and object_id fallback', async () => {
    const accounts = { findByName: jest.fn().mockResolvedValue({ name: 'alice' }) };
    const postsRepo = {
      findUserBlogObjectFacets: jest.fn().mockResolvedValue([
        { object_id: 'waivio', post_count: 5 },
        { object_id: 'no-name', post_count: 1 },
      ]),
    };
    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [],
        voterWaivPowers: new Map(),
        rankVoteProjection: { countByUpdateId: new Map(), viewerRankByUpdateId: new Map() },
      }),
    };
    const objectViewService = { resolve: jest.fn().mockReturnValue([]) };
    const objectProjection = {
      batchProject: jest.fn().mockResolvedValue([
        { object_id: 'waivio', fields: { name: 'Waivio' } },
        { object_id: 'no-name', fields: {} },
      ]),
    };

    const endpoint = new GetUserBlogObjectFiltersEndpoint(
      accounts as never,
      postsRepo as never,
      aggregatedObjectRepo as never,
      objectViewService as never,
      objectProjection as never,
    );

    const result = await endpoint.execute('alice', { objects: [] }, 'en-US');

    expect(postsRepo.findUserBlogObjectFacets).toHaveBeenCalledWith('alice', []);
    expect(result?.items).toEqual([
      { object_id: 'waivio', name: 'Waivio', count: 5 },
      { object_id: 'no-name', name: 'no-name', count: 1 },
    ]);
  });
});
