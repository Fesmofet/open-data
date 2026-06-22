import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { UserRcDelegationsRepository } from './user-rc-delegations.repository';

function createMockDb(rows: unknown[] | Error) {
  const execute = jest.fn().mockImplementation(() => {
    if (rows instanceof Error) {
      return Promise.reject(rows);
    }
    return Promise.resolve(rows);
  });
  const chain = {
    selectAll: () => chain,
    where: () => chain,
    execute,
  };
  const db = {
    selectFrom: jest.fn().mockReturnValue(chain),
  } as unknown as Kysely<Database>;
  return { db, execute, selectFrom: db.selectFrom as jest.Mock };
}

describe('UserRcDelegationsRepository', () => {
  it('findRcDelegationsTo returns rows from execute', async () => {
    const { db, execute, selectFrom } = createMockDb([
      { delegator: 'bob', delegatee: 'alice', rc: '1000000000' },
    ]);
    const repo = new UserRcDelegationsRepository(db);

    await expect(repo.findRcDelegationsTo('alice')).resolves.toEqual([
      { delegator: 'bob', delegatee: 'alice', rc: '1000000000' },
    ]);
    expect(selectFrom).toHaveBeenCalledWith('user_rc_delegations');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('findRcDelegationsTo returns [] on query error', async () => {
    const { db } = createMockDb(new Error('db down'));
    const repo = new UserRcDelegationsRepository(db);

    await expect(repo.findRcDelegationsTo('alice')).resolves.toEqual([]);
  });
});
