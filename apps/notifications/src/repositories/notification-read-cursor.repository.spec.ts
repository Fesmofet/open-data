import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
import { NotificationReadCursorRepository } from './notification-read-cursor.repository';

function createMockDb(
  accountExists: boolean,
): {
  db: Kysely<OdlDatabase>;
  doUpdateSet: jest.Mock;
  insertExecute: jest.Mock;
} {
  const insertExecute = jest.fn().mockResolvedValue(undefined);
  const doUpdateSet = jest.fn();
  const onConflict = jest.fn(
    (handler: (oc: {
      column: (name: string) => { doUpdateSet: typeof doUpdateSet };
    }) => void) => {
      handler({
        column: () => ({ doUpdateSet }),
      });
      return { execute: insertExecute };
    },
  );
  const insertInto = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({ onConflict }),
  });
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    executeTakeFirst: jest
      .fn()
      .mockResolvedValue(accountExists ? { name: 'alice' } : undefined),
  };
  const db = {
    selectFrom: jest.fn().mockReturnValue(selectChain),
    insertInto,
  } as unknown as Kysely<OdlDatabase>;

  return { db, doUpdateSet, insertExecute };
}

describe('NotificationReadCursorRepository', () => {
  it('upserts notifications_last_timestamp when account exists', async () => {
    const { db, doUpdateSet, insertExecute } = createMockDb(true);
    const repo = new NotificationReadCursorRepository(db);

    await repo.setLastReadTimestamp('alice', 1_700_000_000_000);

    expect(db.insertInto).toHaveBeenCalledWith('user_metadata');
    expect(doUpdateSet).toHaveBeenCalledWith({
      notifications_last_timestamp: 1_700_000_000_000,
    });
    expect(insertExecute).toHaveBeenCalled();
  });

  it('skips upsert when accounts_current row is missing', async () => {
    const { db } = createMockDb(false);
    const repo = new NotificationReadCursorRepository(db);
    await repo.setLastReadTimestamp('ghost', 100);

    expect(db.insertInto).not.toHaveBeenCalled();
  });
});
