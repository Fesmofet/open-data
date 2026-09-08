import { HivePostingAuthorityGrantBuildService } from './hive-posting-authority-grant-build.service';
import type { HiveChainContextService } from './hive-chain-context.service';
import type { HasSessionService } from './has-session.service';
import type { LocalKeysService } from './local-keys.service';

describe('HivePostingAuthorityGrantBuildService', () => {
  const chainContext = {
    getAccount: jest.fn(),
  } as unknown as HiveChainContextService;

  const getReadiness = jest.fn().mockReturnValue({
    account: 'waivio.import',
    activeReady: true,
  });

  const localKeys = {
    getReadiness,
  } as unknown as LocalKeysService;

  const getSessionInfo = jest.fn().mockReturnValue(null);

  const hasSession = {
    getSessionInfo,
  } as unknown as HasSessionService;

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
    getReadiness.mockReturnValue({
      account: 'waivio.import',
      activeReady: true,
    });
    getSessionInfo.mockReturnValue(null);
    chainContext.getAccount = jest.fn().mockResolvedValue(flowmasterSnapshot);
    service = new HivePostingAuthorityGrantBuildService(
      config as never,
      chainContext,
      localKeys,
      hasSession,
    );
  });

  it('builds account_update with active keyType and signerAccount', async () => {
    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.keyType).toBe('active');
    expect(result.signerAccount).toBe('flowmaster');
    expect(result.opsCount).toBe(1);
    expect(result.ops[0]?.[0]).toBe('account_update');
    expect(result.warnings.some((w) => w.includes('cannot self-sign'))).toBe(true);
    expect(result.canSignLocally).toBe(false);
  });

  it('allows local broadcast when wallet identity matches grantor and activeReady', async () => {
    getReadiness.mockReturnValue({
      account: 'flowmaster',
      activeReady: true,
    });

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(true);
    expect(result.warnings).toEqual([]);
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

  it('warns when active key is missing for self-sign grantor', async () => {
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
    expect(result.warnings.some((w) => w.includes('HIVE_ACTIVE_KEY not configured'))).toBe(
      true,
    );
  });

  it('tells HAS grantor to has_broadcast instead of claiming missing HIVE_ACTIVE_KEY', async () => {
    signingMode = 'has';
    getSessionInfo.mockReturnValue({ account: 'flowmaster', expiresAt: Date.now() });

    const result = await service.buildPostingAuthorityGrant({
      account: 'flowmaster',
      grantee: 'waivio.import',
      action: 'add',
    });

    expect(result.canSignLocally).toBe(false);
    expect(result.warnings.some((w) => w.includes('has_broadcast'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('HIVE_ACTIVE_KEY'))).toBe(false);
  });
});
