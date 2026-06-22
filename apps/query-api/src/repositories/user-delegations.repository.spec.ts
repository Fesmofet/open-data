import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { UserDelegationsRepository } from './user-delegations.repository';

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
    orderBy: () => chain,
    limit: () => chain,
    execute,
  };
  const db = {
    selectFrom: jest.fn().mockReturnValue(chain),
  } as unknown as Kysely<Database>;
  return { db, execute, selectFrom: db.selectFrom as jest.Mock };
}

describe('UserDelegationsRepository', () => {
  it('findHpDelegationsTo returns rows from execute', async () => {
    const { db, execute, selectFrom } = createMockDb([
      {
        delegator: 'bob',
        delegatee: 'alice',
        vesting_shares: 100,
        delegation_date: null,
      },
    ]);
    const repo = new UserDelegationsRepository(db);

    await expect(repo.findHpDelegationsTo('alice')).resolves.toEqual([
      {
        delegator: 'bob',
        delegatee: 'alice',
        vesting_shares: 100,
        delegation_date: null,
      },
    ]);
    expect(selectFrom).toHaveBeenCalledWith('user_delegations');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('findHpDelegationsFrom returns [] on query error', async () => {
    const { db } = createMockDb(new Error('db down'));
    const repo = new UserDelegationsRepository(db);

    await expect(repo.findHpDelegationsFrom('alice')).resolves.toEqual([]);
  });
});
