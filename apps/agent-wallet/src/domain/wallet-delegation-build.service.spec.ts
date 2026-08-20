import { WalletDelegationBuildService } from './wallet-delegation-build.service';
import type { HiveChainContextService } from './hive-chain-context.service';

describe('WalletDelegationBuildService', () => {
  const chainContext = {
    getChainContext: jest.fn().mockResolvedValue({
      totalVestingShares: '341884293795.055689 VESTS',
      totalVestingFundSteem: '210857021.344 HIVE',
    }),
  } as unknown as HiveChainContextService;

  let service: WalletDelegationBuildService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletDelegationBuildService(chainContext);
  });

  it('builds HP delegation with active keyType', async () => {
    const result = await service.buildHpDelegation({
      delegator: 'alice',
      delegatee: 'bob',
      amountHp: 5,
    });

    expect(result.keyType).toBe('active');
    expect(result.ops).toHaveLength(1);
    expect(result.ops[0]?.type).toBe('delegate_vesting_shares');
  });

  it('builds HP undelegate with zero VESTS', async () => {
    const result = await service.buildHpDelegation({
      delegator: 'alice',
      delegatee: 'bob',
      amountHp: 0,
    });

    expect(result.ops[0]).toMatchObject({
      type: 'delegate_vesting_shares',
      vesting_shares: '0.000000 VESTS',
    });
  });

  it('rejects both amountHp and vestingShares', async () => {
    await expect(
      service.buildHpDelegation({
        delegator: 'a',
        delegatee: 'b',
        amountHp: 1,
        vestingShares: '1.000000 VESTS',
      }),
    ).rejects.toThrow('exactly one of amountHp or vestingShares');
  });

  it('warns when amountHp is below minimum delegation', async () => {
    const result = await service.buildHpDelegation({
      delegator: 'alice',
      delegatee: 'bob',
      amountHp: 0.5,
    });

    expect(result.warnings.some((w) => w.includes('minimum delegation'))).toBe(true);
  });

  it('builds RC delegation with posting keyType', () => {
    const result = service.buildRcDelegation({
      from: 'flowmaster',
      delegatees: ['wiv01'],
      maxRc: 111_000_000_000,
    });

    expect(result.keyType).toBe('posting');
    const op = result.ops[0];
    expect(op?.type).toBe('custom_json');
    if (op?.type !== 'custom_json') {
      throw new Error('expected custom_json');
    }
    expect(JSON.parse(op.json)).toEqual([
      'delegate_rc',
      {
        from: 'flowmaster',
        delegatees: ['wiv01'],
        max_rc: 111_000_000_000,
      },
    ]);
  });

  it('rejects empty delegatees', () => {
    expect(() =>
      service.buildRcDelegation({ from: 'a', delegatees: [], maxRc: 1 }),
    ).toThrow('at least one account');
  });

  it('builds engine delegate with active keyType', () => {
    const result = service.buildEngineDelegation({
      account: 'alice',
      symbol: 'WAIV',
      quantity: '1',
      action: 'delegate',
      to: 'bob',
    });

    expect(result.keyType).toBe('active');
    const op = result.ops[0];
    expect(op?.type).toBe('custom_json');
    if (op?.type !== 'custom_json') {
      throw new Error('expected custom_json');
    }
    expect(op.required_auths).toEqual(['alice']);
  });

  it('requires to for engine delegate', () => {
    expect(() =>
      service.buildEngineDelegation({
        account: 'alice',
        symbol: 'WAIV',
        quantity: '1',
        action: 'delegate',
      }),
    ).toThrow('to is required');
  });
});
