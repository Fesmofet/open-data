import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { ObjectCategoriesRepository } from './object-categories.repository';

function createMockDb(executeQuery: jest.Mock) {
  const executor = {
    transformQuery: (node: unknown) => node,
    compileQuery: (node: unknown) => ({ sql: String(node), parameters: [], query: node }),
    withPlugins<T extends { transformQuery: unknown }>(this: T) {
      return this;
    },
    executeQuery,
  };
  return { getExecutor: () => executor } as unknown as Kysely<Database>;
}

describe('ObjectCategoriesRepository.findObjectIdsByCategoryName', () => {
  it('returns empty result for blank category name without querying', async () => {
    const executeQuery = jest.fn();
    const repo = new ObjectCategoriesRepository(createMockDb(executeQuery));

    await expect(
      repo.findObjectIdsByCategoryName({
        categoryName: '  ',
        limit: 20,
        cursor: null,
      }),
    ).resolves.toEqual({ rows: [], hasMore: false });
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('returns empty result when limit is 0', async () => {
    const executeQuery = jest.fn();
    const repo = new ObjectCategoriesRepository(createMockDb(executeQuery));

    await expect(
      repo.findObjectIdsByCategoryName({
        categoryName: 'Active Skirts',
        limit: 0,
        cursor: null,
      }),
    ).resolves.toEqual({ rows: [], hasMore: false });
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('returns rows and hasMore when extra row is fetched', async () => {
    const executeQuery = jest.fn().mockResolvedValue({
      rows: [
        { object_id: 'a', weight: 10 },
        { object_id: 'b', weight: 5 },
        { object_id: 'c', weight: 1 },
      ],
    });
    const repo = new ObjectCategoriesRepository(createMockDb(executeQuery));

    const result = await repo.findObjectIdsByCategoryName({
      categoryName: 'Active Skirts',
      limit: 2,
      cursor: null,
    });

    expect(result).toEqual({
      rows: [
        { object_id: 'a', weight: 10 },
        { object_id: 'b', weight: 5 },
      ],
      hasMore: true,
    });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('passes exclude_object_id and cursor to the repo filters', async () => {
    const executeQuery = jest.fn().mockResolvedValue({
      rows: [{ object_id: 'x', weight: 3 }],
    });
    const repo = new ObjectCategoriesRepository(createMockDb(executeQuery));

    await repo.findObjectIdsByCategoryName({
      categoryName: 'Skirts',
      limit: 20,
      cursor: { weight: 5, object_id: 'prev' },
      excludeObjectId: 'host-1',
    });

    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('re-throws when the query fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new ObjectCategoriesRepository(createMockDb(executeQuery));

    await expect(
      repo.findObjectIdsByCategoryName({
        categoryName: 'Active Skirts',
        limit: 20,
        cursor: null,
      }),
    ).rejects.toThrow('db down');
  });
});
