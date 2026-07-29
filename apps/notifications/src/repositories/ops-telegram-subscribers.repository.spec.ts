import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';
import { OpsTelegramSubscribersRepository } from './ops-telegram-subscribers.repository';

describe('OpsTelegramSubscribersRepository', () => {
  it('returns empty chat ids on read error', async () => {
    const db = {
      selectFrom: () => {
        throw new Error('db down');
      },
    } as unknown as Kysely<OdlDatabase>;
    const repo = new OpsTelegramSubscribersRepository(db);
    await expect(repo.findAllChatIds()).resolves.toEqual([]);
  });

  it('subscribe returns false for blank chat id', async () => {
    const db = {} as Kysely<OdlDatabase>;
    const repo = new OpsTelegramSubscribersRepository(db);
    await expect(repo.subscribe('  ')).resolves.toBe(false);
  });
});
