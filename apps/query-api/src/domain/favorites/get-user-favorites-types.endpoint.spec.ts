import {
  UserFavoritesRepository,
  UserMetadataRepository,
  UserShopDeselectRepository,
} from '../../repositories';
import { GetUserFavoritesTypesEndpoint } from './get-user-favorites-types.endpoint';

describe('GetUserFavoritesTypesEndpoint', () => {
  it('returns empty types for blank username', async () => {
    const endpoint = new GetUserFavoritesTypesEndpoint(
      {} as UserMetadataRepository,
      {} as UserShopDeselectRepository,
      {} as UserFavoritesRepository,
    );
    await expect(endpoint.execute('  ')).resolves.toEqual({ types: [] });
  });

  it('returns types from repository scope', async () => {
    const userMetadataRepo = {
      findShopVisibilityFlags: jest.fn().mockResolvedValue({
        hide_linked_objects: false,
        hide_recipe_objects: false,
        hide_favorite_objects: true,
      }),
    } as unknown as UserMetadataRepository;
    const shopDeselectRepo = {
      findObjectIdsByAccount: jest.fn().mockResolvedValue(['x']),
    } as unknown as UserShopDeselectRepository;
    const favoritesRepo = {
      findTypesByScope: jest.fn().mockResolvedValue(['restaurant', 'list']),
    } as unknown as UserFavoritesRepository;

    const endpoint = new GetUserFavoritesTypesEndpoint(
      userMetadataRepo,
      shopDeselectRepo,
      favoritesRepo,
    );

    await expect(endpoint.execute('alice')).resolves.toEqual({
      types: ['restaurant', 'list'],
    });
    expect(favoritesRepo.findTypesByScope).toHaveBeenCalledWith({
      account: 'alice',
      hideFavoriteObjects: true,
      shopDeselectObjectIds: ['x'],
    });
  });
});
