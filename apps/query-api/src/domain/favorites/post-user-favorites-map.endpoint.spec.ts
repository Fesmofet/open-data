import type { UserFavoritesMapBody } from './post-user-favorites-map.schema';
import { PostUserFavoritesMapEndpoint } from './post-user-favorites-map.endpoint';

describe('PostUserFavoritesMapEndpoint', () => {
  const box: UserFavoritesMapBody['box'] = {
    topPoint: [-123, 49],
    bottomPoint: [-124, 48],
  };

  const body: UserFavoritesMapBody = { box, skip: 0, limit: 10 };

  it('returns null for blank username', async () => {
    const endpoint = new PostUserFavoritesMapEndpoint(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await expect(
      endpoint.execute('  ', body, 'en-US', undefined, undefined),
    ).resolves.toBeNull();
  });

  it('returns empty when no map objects in bbox', async () => {
    const favoritesRepo = {
      findMapObjectIdsByScope: jest.fn().mockResolvedValue([]),
    };
    const userMetadataRepo = {
      findShopVisibilityFlags: jest.fn().mockResolvedValue({
        hide_linked_objects: false,
        hide_recipe_objects: false,
        hide_favorite_objects: false,
      }),
    };
    const shopDeselectRepo = {
      findObjectIdsByAccount: jest.fn().mockResolvedValue([]),
    };

    const endpoint = new PostUserFavoritesMapEndpoint(
      userMetadataRepo as never,
      shopDeselectRepo as never,
      favoritesRepo as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(endpoint.execute('alice', body, 'en-US', undefined, undefined)).resolves.toEqual({
      items: [],
      hasMore: false,
    });
  });

  it('sets hasMore when repo returns limit+1 ids', async () => {
    const favoritesRepo = {
      findMapObjectIdsByScope: jest.fn().mockResolvedValue(['o1', 'o2', 'o3']),
    };
    const userMetadataRepo = {
      findShopVisibilityFlags: jest.fn().mockResolvedValue({
        hide_linked_objects: false,
        hide_recipe_objects: false,
        hide_favorite_objects: false,
      }),
    };
    const shopDeselectRepo = {
      findObjectIdsByAccount: jest.fn().mockResolvedValue([]),
    };
    const aggregatedObjectRepo = {
      loadByObjectIds: jest.fn().mockResolvedValue({
        objects: [
          { core: { object_id: 'o1' } },
          { core: { object_id: 'o2' } },
        ],
        voterWaivPowers: new Map(),
        rankVoteProjection: undefined,
      }),
    };
    const objectViewService = {
      resolve: jest.fn().mockReturnValue([{ object_id: 'o1' }, { object_id: 'o2' }]),
    };
    const objectProjection = {
      batchProject: jest.fn().mockResolvedValue([{ object_id: 'o1' }, { object_id: 'o2' }]),
    };

    const endpoint = new PostUserFavoritesMapEndpoint(
      userMetadataRepo as never,
      shopDeselectRepo as never,
      favoritesRepo as never,
      aggregatedObjectRepo as never,
      objectViewService as never,
      objectProjection as never,
    );

    const result = await endpoint.execute(
      'alice',
      { ...body, limit: 2 },
      'en-US',
      undefined,
      undefined,
    );

    expect(result).toEqual({
      items: [{ object_id: 'o1' }, { object_id: 'o2' }],
      hasMore: true,
    });
    expect(favoritesRepo.findMapObjectIdsByScope).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'alice' }),
      box,
      undefined,
      0,
      3,
    );
  });
});
