jest.mock('./build-user-categories-response', () => ({
  buildUserCategoriesResponse: jest.fn(),
}));

import { buildUserCategoriesResponse } from './build-user-categories-response';
import { GetUserCategoriesEndpoint } from './get-user-categories.endpoint';

const mockedBuild = buildUserCategoriesResponse as jest.MockedFunction<
  typeof buildUserCategoriesResponse
>;

describe('GetUserCategoriesEndpoint', () => {
  beforeEach(() => {
    mockedBuild.mockReturnValue({
      items: [{ name: 'Desserts', objects_count: 2, has_children: false }],
      uncategorized_count: 99,
      show_other: false,
    });
  });

  it('replaces root uncategorized_count with live scoped count', async () => {
    const objectCategoriesRelatedRepository = {
      findByUserScope: jest.fn().mockResolvedValue([]),
    };
    const objectCategoriesRepo = {
      countUncategorizedObjectIdsByScope: jest.fn().mockResolvedValue(3),
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

    const endpoint = new GetUserCategoriesEndpoint(
      objectCategoriesRelatedRepository as never,
      objectCategoriesRepo as never,
      userMetadataRepo as never,
      shopDeselectRepo as never,
    );

    const result = await endpoint.execute('alice', {
      types: ['recipe'],
      path: [],
      excluded: [],
    });

    expect(result.uncategorized_count).toBe(3);
    expect(objectCategoriesRepo.countUncategorizedObjectIdsByScope).toHaveBeenCalled();
  });

  it('keeps sentinel uncategorized_count when drilling into a department', async () => {
    const objectCategoriesRepo = {
      countUncategorizedObjectIdsByScope: jest.fn(),
    };

    const endpoint = new GetUserCategoriesEndpoint(
      { findByUserScope: jest.fn().mockResolvedValue([]) } as never,
      objectCategoriesRepo as never,
      {} as never,
      {} as never,
    );

    const result = await endpoint.execute('alice', {
      types: ['recipe'],
      name: 'Desserts',
      path: [],
      excluded: [],
    });

    expect(result.uncategorized_count).toBe(99);
    expect(objectCategoriesRepo.countUncategorizedObjectIdsByScope).not.toHaveBeenCalled();
  });
});
