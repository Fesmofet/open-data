import {
  buildClaimRewardBalanceOp,
  buildTransferOp,
  formatHiveAssetAmount,
} from './hive-l1-wallet-operations';

describe('hive-l1-wallet-operations', () => {
  it('formats hive asset amounts', () => {
    expect(formatHiveAssetAmount(1.5, 'HIVE')).toBe('1.500 HIVE');
    expect(formatHiveAssetAmount(0.014, 'HBD')).toBe('0.014 HBD');
  });

  it('builds transfer op', () => {
    expect(
      buildTransferOp({
        from: 'alice',
        to: 'bob',
        amount: '1.000 HIVE',
        memo: 'hi',
      }),
    ).toEqual({
      type: 'transfer',
      from: 'alice',
      to: 'bob',
      amount: '1.000 HIVE',
      memo: 'hi',
    });
  });

  it('builds claim reward balance op', () => {
    expect(
      buildClaimRewardBalanceOp({
        account: 'alice',
        rewardHive: '0.734 HIVE',
        rewardHbd: '0.012 HBD',
        rewardVests: '123.456789 VESTS',
      }),
    ).toEqual({
      type: 'claim_reward_balance',
      account: 'alice',
      reward_hive: '0.734 HIVE',
      reward_hbd: '0.012 HBD',
      reward_vests: '123.456789 VESTS',
    });
  });
});
