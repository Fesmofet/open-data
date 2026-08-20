import type { Kysely } from 'kysely';
import type { OdlDatabase } from '@opden-data-layer/odl-db-types';
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

  it('findExistingAccountNames returns empty set for blank names without querying', async () => {
    const db = { selectFrom: jest.fn() } as unknown as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);
    await expect(repo.findExistingAccountNames(['', '  '])).resolves.toEqual(
      new Set(),
    );
    expect(db.selectFrom).not.toHaveBeenCalled();
  });

  it('findExistingAccountNames queries accounts_current with IN clause', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue([{ name: 'alice' }, { name: 'bob' }]);
    const where = jest.fn().mockReturnValue({ execute });
    const select = jest.fn().mockReturnValue({ where });
    const selectFrom = jest.fn().mockReturnValue({ select });
    const db = { selectFrom } as unknown as Kysely<OdlDatabase>;
    const repo = new TelegramSubscriptionsRepository(db);

    await expect(
      repo.findExistingAccountNames(['alice', 'bob', 'ghost']),
    ).resolves.toEqual(new Set(['alice', 'bob']));

    expect(selectFrom).toHaveBeenCalledWith('accounts_current');
    expect(where).toHaveBeenCalledWith('name', 'in', ['alice', 'bob', 'ghost']);
  });
});
