import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { UserObjectExpertiseRepository } from './user-object-expertise.repository';

function createQueryChain(terminal: jest.Mock) {
  const chain: Record<string, jest.Mock> = {};
  const self = () => chain;
  for (const method of [
    'selectFrom',
    'innerJoin',
    'select',
    'where',
    'orderBy',
    'offset',
    'limit',
  ]) {
    chain[method] = jest.fn(self);
  }
  chain.executeTakeFirst = terminal;
  chain.execute = terminal;
  return chain;
}

describe('UserObjectExpertiseRepository', () => {
  it('countByScope filters active objects with weight > 0', async () => {
    const terminal = jest.fn().mockResolvedValue({ count: 2 });
    const chain = createQueryChain(terminal);
    const db = { selectFrom: jest.fn().mockReturnValue(chain) } as unknown as Kysely<Database>;
    const repo = new UserObjectExpertiseRepository(db);

    const count = await repo.countByScope('alice', 'hashtags');

    expect(count).toBe(2);
    expect(chain.where).toHaveBeenCalledWith('user_object_expertise.account', '=', 'alice');
    expect(chain.where).toHaveBeenCalledWith('user_object_expertise.weight', '>', 0);
    expect(chain.where).toHaveBeenCalledWith('objects_core.status', '=', 'active');
    expect(chain.where).toHaveBeenCalledWith('objects_core.object_type', '=', 'hashtag');
  });

  it('listByScope orders by weight desc then object_id asc', async () => {
    const rows = [{ object_id: 'b', weight: 2, object_type: 'restaurant' }];
    const terminal = jest.fn().mockResolvedValue(rows);
    const chain = createQueryChain(terminal);
    const db = { selectFrom: jest.fn().mockReturnValue(chain) } as unknown as Kysely<Database>;
    const repo = new UserObjectExpertiseRepository(db);

    const result = await repo.listByScope('alice', 'objects', 0, 10);

    expect(result).toEqual(rows);
    expect(chain.where).toHaveBeenCalledWith('objects_core.status', '=', 'active');
    expect(chain.where).toHaveBeenCalledWith('objects_core.object_type', '!=', 'hashtag');
    expect(chain.orderBy).toHaveBeenCalledWith('user_object_expertise.weight', 'desc');
    expect(chain.orderBy).toHaveBeenCalledWith('user_object_expertise.object_id', 'asc');
    expect(chain.limit).toHaveBeenCalledWith(11);
  });

  it('returns 0 on count error after logging', async () => {
    const terminal = jest.fn().mockRejectedValue(new Error('db down'));
    const chain = createQueryChain(terminal);
    const db = { selectFrom: jest.fn().mockReturnValue(chain) } as unknown as Kysely<Database>;
    const repo = new UserObjectExpertiseRepository(db);
    const errorSpy = jest.spyOn(repo['logger'], 'error').mockImplementation();

    await expect(repo.countByScope('alice', 'objects')).resolves.toBe(0);
    expect(errorSpy).toHaveBeenCalledWith('db down');
    errorSpy.mockRestore();
  });
});
