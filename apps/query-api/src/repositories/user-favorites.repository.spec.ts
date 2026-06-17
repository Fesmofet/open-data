import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { UserFavoritesRepository } from './user-favorites.repository';

function createMockDb(executeQuery: jest.Mock) {
  const executor = {
    transformQuery: (node: unknown) => node,
    compileQuery: (node: unknown) => ({ sql: String(node), parameters: [], query: node }),
    withPlugins<T extends { transformQuery: unknown }>(this: T) {
      return this;
    },
    executeQuery: executeQuery,
  };
  return { getExecutor: () => executor } as unknown as Kysely<Database>;
}

describe('UserFavoritesRepository', () => {
  const scope = {
    account: 'alice',
    hideFavoriteObjects: false,
    shopDeselectObjectIds: [] as string[],
  };

  it('countByScope returns 0 for blank account without querying', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.countByScope({ ...scope, account: '  ' })).resolves.toBe(0);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('findObjectIdsByScope returns [] when limit is 0', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findObjectIdsByScope(scope, undefined, 0, 0)).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('findTypesByScope returns [] for blank account without querying', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findTypesByScope({ ...scope, account: '' })).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('countByScope returns row count from executeQuery', async () => {
    const executeQuery = jest.fn().mockResolvedValue({ rows: [{ c: 4 }] });
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.countByScope(scope)).resolves.toBe(4);
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('countByScope passes objectType filter into query execution', async () => {
    const executeQuery = jest.fn().mockResolvedValue({ rows: [{ c: 1 }] });
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await repo.countByScope(scope, 'restaurant');

    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('findObjectIdsByScope returns object ids from rows', async () => {
    const executeQuery = jest
      .fn()
      .mockResolvedValue({ rows: [{ object_id: 'o1' }, { object_id: 'o2' }] });
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findObjectIdsByScope(scope, undefined, 0, 10)).resolves.toEqual([
      'o1',
      'o2',
    ]);
  });

  it('findTypesByScope returns object types from rows', async () => {
    const executeQuery = jest
      .fn()
      .mockResolvedValue({ rows: [{ object_type: 'restaurant' }, { object_type: 'hotel' }] });
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findTypesByScope(scope)).resolves.toEqual(['restaurant', 'hotel']);
  });

  it('countByScope returns 0 when executeQuery fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.countByScope(scope)).resolves.toBe(0);
  });

  it('findObjectIdsByScope returns [] when executeQuery fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findObjectIdsByScope(scope, undefined, 0, 10)).resolves.toEqual([]);
  });

  it('findTypesByScope returns [] when executeQuery fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(repo.findTypesByScope(scope)).resolves.toEqual([]);
  });

  const mapBox = {
    topPoint: [10, 50] as [number, number],
    bottomPoint: [-10, 40] as [number, number],
  };

  it('findMapObjectIdsByScope returns [] for blank account without querying', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(
      repo.findMapObjectIdsByScope({ ...scope, account: '  ' }, mapBox, undefined, 0, 10),
    ).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('findMapObjectIdsByScope returns [] when limit is 0', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(
      repo.findMapObjectIdsByScope(scope, mapBox, undefined, 0, 0),
    ).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('findMapObjectIdsByScope returns [] when objectTypes resolve to empty', async () => {
    const executeQuery = jest.fn();
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(
      repo.findMapObjectIdsByScope(scope, mapBox, ['not-a-map-type'], 0, 10),
    ).resolves.toEqual([]);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it('findMapObjectIdsByScope returns object ids from rows', async () => {
    const executeQuery = jest
      .fn()
      .mockResolvedValue({ rows: [{ object_id: 'geo-1' }, { object_id: 'geo-2' }] });
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(
      repo.findMapObjectIdsByScope(scope, mapBox, ['restaurant'], 0, 10),
    ).resolves.toEqual(['geo-1', 'geo-2']);
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('findMapObjectIdsByScope returns [] when executeQuery fails', async () => {
    const executeQuery = jest.fn().mockRejectedValue(new Error('db down'));
    const repo = new UserFavoritesRepository(createMockDb(executeQuery));

    await expect(
      repo.findMapObjectIdsByScope(scope, mapBox, undefined, 0, 10),
    ).resolves.toEqual([]);
  });
});
