import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/core';
import { TelegramSubscriptionsRepository } from './telegram-subscriptions.repository';

describe('TelegramSubscriptionsRepository', () => {
  it('returns an empty map for blank accounts without querying', async () => {
    const db = { selectFrom: jest.fn() } as unknown as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);
    await expect(repo.findChatIdsByAccounts(['  ', ''])).resolves.toEqual(
      new Map(),
    );
    expect(db.selectFrom).not.toHaveBeenCalled();
  });

  it('accountExists returns false for blank name without querying', async () => {
    const db = { selectFrom: jest.fn() } as unknown as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);
    await expect(repo.accountExists('')).resolves.toBe(false);
    expect(db.selectFrom).not.toHaveBeenCalled();
  });
});
