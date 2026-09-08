import { HivePostingAuthorityGrantBuildService } from './hive-posting-authority-grant-build.service';
import type { HiveChainContextService } from './hive-chain-context.service';
import type { LocalKeysService } from './local-keys.service';

describe('HivePostingAuthorityGrantBuildService', () => {
  const chainContext = {
    getAccount: jest.fn(),
  } as unknown as HiveChainContextService;

  const getReadiness = jest.fn().mockReturnValue({
    account: 'waivio.import',
    activeReady: true,
  });

  const hasAccount = jest.fn().mockReturnValue(false);

  const localKeys = {
    getReadiness,
    hasAccount,
  } as unknown as LocalKeysService;

  let signingMode: 'has' | 'local' = 'local';

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'signingMode') {
        return signingMode;
      }
      return undefined;
    }),
  };

  let service: HivePostingAuthorityGrantBuildService;

  const flowmasterSnapshot = {
    name: 'flowmaster',
    memo_key: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
    json_metadata: '{"beneficiaries":[]}',
    posting: {
      weight_threshold: 1,
      account_auths: [
        ['ecency.app', 1],
        ['waivio.app', 1],
      ],
      key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    signingMode = 'local';
    hasAccount.mockImplementation((account: string) => account === 'flowmaster');
    getReadiness.mockImplementation((account?: string) => ({
      account: account ?? 'waivio.import',
      activeReady: account === 'flowmaster',
    }));
    chainContext.getAccount = jest.fn().mockResolvedValue(flowmasterSnapshot);
    service = new HivePostingAuthorityGrantBuildService(
      config as never,
      chainContext,
      localKeys,
    );
  });

  it('builds account_update with active keyType and signerAccount', async () => {
    hasAccount.mockReturnValue(false);

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.keyType).toBe('active');
    expect(result.signerAccount).toBe('flowmaster');
    expect(result.opsCount).toBe(1);
    expect(result.ops[0]?.[0]).toBe('account_update');
    expect(result.warnings.some((w) => w.includes('local key registry'))).toBe(true);
    expect(result.canSignLocally).toBe(false);
  });

  it('allows local broadcast when grantor is in registry with activeReady', async () => {
    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('allows local broadcast for non-default registry account', async () => {
    hasAccount.mockImplementation((account: string) => account === 'bob');
    getReadiness.mockImplementation((account?: string) => ({
      account,
      activeReady: account === 'bob',
    }));

    const result = await service.buildPostingAuthorityGrant({
      account: 'bob',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(true);
    expect(result.signerAccount).toBe('bob');
  });

  it('returns opsCount 0 when grantee already present', async () => {
    chainContext.getAccount = jest.fn().mockResolvedValue({
      ...flowmasterSnapshot,
      posting: {
        ...flowmasterSnapshot.posting,
        account_auths: [
          ...flowmasterSnapshot.posting.account_auths,
          ['waivio.import', 1],
        ],
      },
    });

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.opsCount).toBe(0);
    expect(result.warnings.some((w) => w.includes('already in'))).toBe(true);
  });

  it('returns opsCount 0 when remove target is absent', async () => {
    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'missing.app',
      action: 'remove',
    });

    expect(result.opsCount).toBe(0);
    expect(result.warnings.some((w) => w.includes('is not in'))).toBe(true);
  });

  it('warns when active key is missing for grantor in registry', async () => {
    getReadiness.mockReturnValue({
      account: 'flowmaster',
      activeReady: false,
    });

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(false);
    expect(result.warnings.some((w) => w.includes('Active key for @flowmaster'))).toBe(
      true,
    );
  });

  it('adds HAS warning when global signing mode is has even if grantor can sign locally', async () => {
    signingMode = 'has';

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(true);
    expect(result.warnings.some((w) => w.includes('has_broadcast'))).toBe(true);
  });
});
