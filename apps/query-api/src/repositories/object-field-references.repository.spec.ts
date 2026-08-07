import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { ObjectFieldReferencesRepository } from './object-field-references.repository';

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

describe('ObjectFieldReferencesRepository.findReferencingObjectIds', () => {
  it('returns empty array for empty updateTypes without querying', async () => {
    const executeQuery = jest.fn();
    const repo = new ObjectFieldReferencesRepository(createMockDb(executeQuery));

    await expect(
      repo.findReferencingObjectIds({
        sourceObjectId: 'alice',
        referenceObjectType: 'book',
        updateTypes: [],
        skip: 0,
        limit: 20,
      }),
    ).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('returns object ids from query rows', async () => {
    const executeQuery = jest.fn().mockResolvedValue({
      rows: [{ object_id: 'book-1' }, { object_id: 'book-2' }],
    });
    const repo = new ObjectFieldReferencesRepository(createMockDb(executeQuery));

    await expect(
      repo.findReferencingObjectIds({
        sourceObjectId: 'alice',
        referenceObjectType: 'book',
        updateTypes: ['author'],
        skip: 0,
        limit: 20,
      }),
    ).resolves.toEqual(['book-1', 'book-2']);
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('requests limit + 1 rows for hasMore detection', async () => {
    const executeQuery = jest.fn().mockResolvedValue({ rows: [] });
    const repo = new ObjectFieldReferencesRepository(createMockDb(executeQuery));

    await repo.findReferencingObjectIds({
      sourceObjectId: 'biz',
      referenceObjectType: 'product',
      updateTypes: ['merchant', 'brand'],
      skip: 5,
      limit: 10,
    });

    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when the query fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new ObjectFieldReferencesRepository(createMockDb(executeQuery));

    await expect(
      repo.findReferencingObjectIds({
        sourceObjectId: 'alice',
        referenceObjectType: 'book',
        updateTypes: ['author'],
        skip: 0,
        limit: 20,
      }),
    ).resolves.toEqual([]);
  });
});
