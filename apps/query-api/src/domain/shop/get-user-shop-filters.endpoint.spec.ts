import { GetUserShopFiltersEndpoint } from './get-user-shop-filters.endpoint';

describe('GetUserShopFiltersEndpoint', () => {
  it('returns static ratings and grouped categories', async () => {
    const objectCategoriesRepo = {
      getShopTagCategories: jest.fn().mockResolvedValue([
        { category: 'Pros', tag_value: 'coffee', object_count: 2 },
      ]),
    };
    const userMetadataRepo = {
      findShopVisibilityFlags: jest.fn().mockResolvedValue({
        hide_linked_objects: false,
        hide_recipe_objects: false,
      }),
    };
    const shopDeselectRepo = {
      findObjectIdsByAccount: jest.fn().mockResolvedValue([]),
    };

    const endpoint = new GetUserShopFiltersEndpoint(
      userMetadataRepo as never,
      shopDeselectRepo as never,
      objectCategoriesRepo as never,
    );

    const result = await endpoint.execute('alice', {
      types: ['product'],
      categoryPath: [],
      uncategorizedOnly: false,
      tags: [],
    });

    expect(result).toEqual({
      ratings: [10, 8, 6],
      categories: [{ category: 'Pros', items: [{ value: 'coffee', count: 2 }] }],
    });
  });

  it('returns null for blank username', async () => {
    const endpoint = new GetUserShopFiltersEndpoint({} as never, {} as never, {} as never);
    expect(await endpoint.execute('  ', { types: ['product'], categoryPath: [], uncategorizedOnly: false, tags: [] })).toBeNull();
  });

  it('passes rating to tag facet query', async () => {
    const objectCategoriesRepo = {
      getShopTagCategories: jest.fn().mockResolvedValue([]),
    };
    const userMetadataRepo = {
      findShopVisibilityFlags: jest.fn().mockResolvedValue({
        hide_linked_objects: false,
        hide_recipe_objects: false,
      }),
    };
    const shopDeselectRepo = {
      findObjectIdsByAccount: jest.fn().mockResolvedValue([]),
    };

    const endpoint = new GetUserShopFiltersEndpoint(
      userMetadataRepo as never,
      shopDeselectRepo as never,
      objectCategoriesRepo as never,
    );

    await endpoint.execute('alice', {
      types: ['recipe'],
      categoryPath: [],
      uncategorizedOnly: false,
      tags: [],
      rating: 10,
    });

    expect(objectCategoriesRepo.getShopTagCategories).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'alice' }),
      [],
      10,
    );
  });
});
