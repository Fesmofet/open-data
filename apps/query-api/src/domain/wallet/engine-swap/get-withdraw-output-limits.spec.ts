import {
  attachWithdrawOutputLimits,
  getWithdrawOutputLimits,
} from './get-withdraw-output-limits';

describe('getWithdrawOutputLimits', () => {
  it('maps BTC minimum from external service', async () => {
    const limits = await getWithdrawOutputLimits({
      fetchBtcMinimum: async () => 0.0002,
    });
    expect(limits.BTC.minimumSwapAmount).toBe(0.0002);
    expect(limits.BTC.minimumReceiveAmount).toBe(0.01);
    expect(limits.HIVE.minimumSwapAmount).toBe(0.002);
    expect(limits.ETH).toBeUndefined();
  });
});

describe('attachWithdrawOutputLimits', () => {
  it('adds limits per output symbol', () => {
    const items = attachWithdrawOutputLimits(
      [{ outputSymbol: 'BTC', inputSymbol: 'WAIV' }],
      {
        BTC: { minimumSwapAmount: 0.0002, minimumReceiveAmount: 0.01 },
      },
    );
    expect(items[0]?.minimumSwapAmount).toBe(0.0002);
  });
});
