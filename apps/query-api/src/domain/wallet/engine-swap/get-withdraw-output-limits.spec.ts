import {
  attachWithdrawOutputLimits,
  getWithdrawOutputLimits,
} from './get-withdraw-output-limits';

describe('getWithdrawOutputLimits', () => {
  it('maps ETH gas and BTC minimum from external services', async () => {
    const limits = await getWithdrawOutputLimits({
      fetchEthFee: async () => 0.005,
      fetchBtcMinimum: async () => 0.0002,
    });
    expect(limits.ETH.minimumSwapAmount).toBe(0.005);
    expect(limits.BTC.minimumSwapAmount).toBe(0.0002);
    expect(limits.BTC.minimumReceiveAmount).toBe(0.01);
    expect(limits.HIVE.minimumSwapAmount).toBe(0.002);
  });
});

describe('attachWithdrawOutputLimits', () => {
  it('adds limits per output symbol', () => {
    const items = attachWithdrawOutputLimits(
      [{ outputSymbol: 'ETH', inputSymbol: 'WAIV' }],
      {
        ETH: { minimumSwapAmount: 0.005, minimumReceiveAmount: null },
      },
    );
    expect(items[0]?.minimumSwapAmount).toBe(0.005);
  });
});
