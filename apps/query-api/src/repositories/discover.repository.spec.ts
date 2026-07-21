import { DiscoverRepository } from './discover.repository';
import { PostgresQueryCompiler, type Kysely } from 'kysely';
import type { RedisClientFactory } from '@opden-data-layer/clients';
import { encodeDiscoverObjectCursor } from '../domain/discover/discover-cursor';

function createMockDb(executeImpl: jest.Mock) {
  return {
    execute: executeImpl,
  } as unknown as Kysely<unknown>;
}

function createQueryCapturingDb(executeQuery: jest.Mock) {
  const compiler = new PostgresQueryCompiler();
  const executor = {
    transformQuery: (node: unknown) => node,
    compileQuery: (node: unknown, queryId: unknown) =>
      compiler.compileQuery(node as never, queryId as never),
    withPlugins<T extends { transformQuery: unknown }>(this: T) {
      return this;
    },
    executeQuery,
  };
  return { getExecutor: () => executor } as unknown as Kysely<unknown>;
}

function emptyRedisFactory(): RedisClientFactory {
  return {
    getClient: () => ({ get: jest.fn(), set: jest.fn() }),
  } as unknown as RedisClientFactory;
}

describe('DiscoverRepository', () => {
  it('getTagCategories returns cached JSON without hitting DB', async () => {
    const cached = JSON.stringify([
      { category: 'Pros', tag_value: 'Bitter', object_count: 1 },
    ]);
    const redisGet = jest.fn().mockResolvedValue(cached);
    const redisSet = jest.fn().mockResolvedValue(undefined);
    const redisFactory = {
      getClient: () => ({ get: redisGet, set: redisSet }),
    } as unknown as RedisClientFactory;

    const execute = jest.fn();
    const db = createMockDb(execute);
    const repo = new DiscoverRepository(db as never, redisFactory);

    const rows = await repo.getTagCategories('product');

    expect(rows).toHaveLength(1);
    expect(execute).not.toHaveBeenCalled();
    expect(redisGet).toHaveBeenCalled();
  });

  it('getTagCategories with active tags skips redis cache', async () => {
    const redisGet = jest.fn().mockResolvedValue(null);
    const redisSet = jest.fn().mockResolvedValue(undefined);
    const redisFactory = {
      getClient: () => ({ get: redisGet, set: redisSet }),
    } as unknown as RedisClientFactory;

    const execute = jest.fn().mockResolvedValue({ rows: [] });
    const db = createMockDb(execute);
    const repo = new DiscoverRepository(db as never, redisFactory);

    await repo.getTagCategories('restaurant', [{ category: 'Cuisine', value: 'Asian' }]);

    expect(redisGet).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('getTagCategories with q skips redis cache', async () => {
    const redisGet = jest.fn();
    const redisSet = jest.fn();
    const redisFactory = {
      getClient: () => ({ get: redisGet, set: redisSet }),
    } as unknown as RedisClientFactory;

    const execute = jest.fn().mockResolvedValue({ rows: [] });
    const db = createMockDb(execute);
    const repo = new DiscoverRepository(db as never, redisFactory);

    const rows = await repo.getTagCategories('product', [], 'burger');

    expect(rows).toEqual([]);
    expect(redisGet).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('listObjects rank cursor uses object_id ASC tie-break (>)', async () => {
    const executeQuery = jest.fn().mockResolvedValue({ rows: [] });
    const db = createQueryCapturingDb(executeQuery);
    const repo = new DiscoverRepository(db as never, emptyRedisFactory());

    const cursor = encodeDiscoverObjectCursor({
      sort: 'rank',
      created_at: '2026-01-01T00:00:00.000Z',
      weight: 0,
      object_id: 'cursor-obj',
    });

    await repo.listObjects({
      tags: [],
      sort: 'rank',
      cursor,
      limit: 20,
    });

    expect(executeQuery).toHaveBeenCalledTimes(1);
    const compiled = executeQuery.mock.calls[0][0] as { sql: string };
    expect(compiled.sql).toMatch(/oc\.object_id\s*>/);
    expect(compiled.sql).not.toMatch(/oc\.object_id\s*</);
    expect(compiled.sql).toMatch(/::float8/);
    expect(compiled.sql).toContain('ORDER BY oc.weight DESC NULLS LAST, oc.object_id ASC');
  });
});
