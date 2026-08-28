import { buildHiveChangellyWithdrawTransferOps } from './build-hive-changelly-withdraw-ops';

describe('buildHiveChangellyWithdrawTransferOps', () => {
  it('builds payin and tracking transfers', () => {
    const ops = buildHiveChangellyWithdrawTransferOps({
      account: 'alice',
      createResult: {
        receiver: 'changellyhive',
        memo: 'memo-1',
        exchangeId: 'ex-abc',
        amount: 5.5,
        outputAmount: '0.00042',
        trackUrl: 'https://changelly.com/track/ex-abc',
        outputCoinType: 'btc',
      },
    });

    expect(ops).toHaveLength(2);
    expect(ops[0]).toEqual({
      type: 'transfer',
      from: 'alice',
      to: 'changellyhive',
      amount: '5.500 HIVE',
      memo: 'memo-1',
    });
    expect(ops[1]).toEqual({
      type: 'transfer',
      from: 'alice',
      to: 'alice',
      amount: '0.001 HIVE',
      memo: 'Withdrawal transaction ID for the HIVE-BTC pair via Changelly: https://changelly.com/track/ex-abc',
    });
  });
});
