import { shouldApplyAuthorityReplace } from '../domain/hive-social/account-authority-guard';
import { UserAccountAuthsRepository } from './user-account-auths.repository';

describe('shouldApplyAuthorityReplace', () => {
  it('allows replace when no existing rows', () => {
    expect(shouldApplyAuthorityReplace(10, null)).toBe(true);
  });

  it('skips when incoming block is older (TC-006)', () => {
    expect(shouldApplyAuthorityReplace(99, 100)).toBe(false);
  });

  it('allows replace when incoming block equals max (TC-007)', () => {
    expect(shouldApplyAuthorityReplace(100, 100)).toBe(true);
  });
});

describe('UserAccountAuthsRepository.replaceAuthorityType', () => {
  function makeRepo(options: {
    maxBlock: number | null;
    maxThrows?: boolean;
  }) {
    const deleteExecute = jest.fn().mockResolvedValue(undefined);
    const insertExecute = jest.fn().mockResolvedValue(undefined);

    const selectChain = {
      where: jest.fn().mockReturnThis(),
      executeTakeFirst: options.maxThrows
        ? jest.fn().mockRejectedValue(new Error('select failed'))
        : jest.fn().mockResolvedValue({
            max_block: options.maxBlock,
          }),
    };

    const trx = {
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(selectChain),
      }),
      deleteFrom: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        execute: deleteExecute,
      }),
      insertInto: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          execute: insertExecute,
        }),
      }),
    };

    const db = {} as never;
    const repo = new UserAccountAuthsRepository(db);
    return { repo, trx, deleteExecute, insertExecute };
  }

  it('does not delete when block is stale', async () => {
    const { repo, trx, deleteExecute } = makeRepo({ maxBlock: 100 });

    await expect(
      repo.replaceAuthorityType('alice', 'posting', ['bob'], 99, trx as never),
    ).resolves.toBe(false);
    expect(deleteExecute).not.toHaveBeenCalled();
  });

  it('replaces when block equals max', async () => {
    const { repo, trx, deleteExecute, insertExecute } = makeRepo({
      maxBlock: 100,
    });

    await expect(
      repo.replaceAuthorityType('alice', 'posting', ['bob'], 100, trx as never),
    ).resolves.toBe(true);
    expect(deleteExecute).toHaveBeenCalled();
    expect(insertExecute).toHaveBeenCalled();
  });

  it('rethrows maxUpdatedBlock errors without deleting (P0 #2)', async () => {
    const { repo, trx, deleteExecute } = makeRepo({
      maxBlock: null,
      maxThrows: true,
    });

    await expect(
      repo.replaceAuthorityType('alice', 'posting', ['bob'], 100, trx as never),
    ).rejects.toThrow('select failed');
    expect(deleteExecute).not.toHaveBeenCalled();
  });
});
