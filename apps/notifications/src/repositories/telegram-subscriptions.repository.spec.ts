import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';
import { TelegramSubscriptionsRepository } from './telegram-subscriptions.repository';

describe('TelegramSubscriptionsRepository', () => {
  it('returns empty chat ids for blank account', async () => {
    const db = {} as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);
    await expect(repo.findChatIdsByAccount('  ')).resolves.toEqual([]);
  });

  it('accountExists returns false for blank name without querying', async () => {
    const db = { selectFrom: jest.fn() } as unknown as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);
    await expect(repo.accountExists('')).resolves.toBe(false);
    expect(db.selectFrom).not.toHaveBeenCalled();
  });
});
