import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { AccountAuthorityService } from './account-authority.service';
import { UserAccountAuthsRepository } from '../../repositories/user-account-auths.repository';

describe('AccountAuthorityService', () => {
  const ctx = {
    blockNum: 20,
    timestamp: '2026-01-01T00:00:00',
    transactionIndex: 0,
    operationIndex: 0,
    transaction: { transaction_id: 'tx', block_num: 20, operations: [] },
  } as unknown as HiveOperationHandlerContext;

  function makeService(deps: {
    replaceAuthorityType?: jest.Mock;
    upsertSyncMark?: jest.Mock;
    runInTransaction?: jest.Mock;
  }) {
    const replaceAuthorityType =
      deps.replaceAuthorityType ??
      jest.fn().mockResolvedValue(true);
    const upsertSyncMark = deps.upsertSyncMark ?? jest.fn().mockResolvedValue(undefined);
    const runInTransaction =
      deps.runInTransaction ??
      jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({}));

    const repo = {
      replaceAuthorityType,
      upsertSyncMark,
      runInTransaction,
    } as unknown as UserAccountAuthsRepository;

    return {
      service: new AccountAuthorityService(repo),
      replaceAuthorityType,
      upsertSyncMark,
      runInTransaction,
    };
  }

  it('replaces posting authority and marks sync on account_update', async () => {
    const { service, replaceAuthorityType, upsertSyncMark } = makeService({});

    await service.handleAccountUpdate(
      {
        account: 'flowmaster',
        posting: { account_auths: [['waivio.import', 1]] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'flowmaster',
      'posting',
      ['waivio.import'],
      20,
      expect.anything(),
    );
    expect(upsertSyncMark).toHaveBeenCalledWith('flowmaster', 20, expect.anything());
  });

  it('does not mark sync when block guard rejects all replaces', async () => {
    const { service, upsertSyncMark } = makeService({
      replaceAuthorityType: jest.fn().mockResolvedValue(false),
    });

    await service.handleAccountUpdate(
      {
        account: 'flowmaster',
        posting: { account_auths: [['waivio.import', 1]] },
      },
      ctx,
    );

    expect(upsertSyncMark).not.toHaveBeenCalled();
  });

  it('leaves omitted authority types untouched on partial update', async () => {
    const { service, replaceAuthorityType } = makeService({});

    await service.handleAccountUpdate(
      {
        account: 'flowmaster',
        posting: { account_auths: [['peakd.app', 1]] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalledTimes(1);
    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'flowmaster',
      'posting',
      ['peakd.app'],
      20,
      expect.anything(),
    );
  });

  it('authority-only update still persists edges', async () => {
    const { service, replaceAuthorityType } = makeService({});

    await service.handleAccountUpdate(
      {
        account: 'flowmaster',
        posting: { account_auths: [['waivio.import', 1]] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalled();
  });

  it('replaces empty posting account_auths to revoke grantees', async () => {
    const { service, replaceAuthorityType } = makeService({});

    await service.handleAccountUpdate(
      {
        account: 'flowmaster',
        posting: { account_auths: [] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'flowmaster',
      'posting',
      [],
      20,
      expect.anything(),
    );
  });

  it('handleCreateAccount applies owner and posting types', async () => {
    const { service, replaceAuthorityType } = makeService({});

    await service.handleCreateAccount(
      {
        new_account_name: 'newbie',
        owner: { account_auths: [['recovery', 1]] },
        posting: { account_auths: [['waivio.app', 1]] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'newbie',
      'owner',
      ['recovery'],
      20,
      expect.anything(),
    );
    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'newbie',
      'posting',
      ['waivio.app'],
      20,
      expect.anything(),
    );
  });

  it('handleRecoverAccount replaces owner authority only', async () => {
    const { service, replaceAuthorityType } = makeService({});

    await service.handleRecoverAccount(
      {
        account_to_recover: 'alice',
        new_owner_authority: { account_auths: [['new-rec', 1]] },
      },
      ctx,
    );

    expect(replaceAuthorityType).toHaveBeenCalledTimes(1);
    expect(replaceAuthorityType).toHaveBeenCalledWith(
      'alice',
      'owner',
      ['new-rec'],
      20,
      expect.anything(),
    );
  });
});
