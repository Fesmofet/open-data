import { solveWithdrawInputForTargetReceive } from './solve-withdraw-input-for-target-receive';

describe('solveWithdrawInputForTargetReceive', () => {
  it('finds input quantity for linear quote', async () => {
    const result = await solveWithdrawInputForTargetReceive({
      targetReceive: 10,
      maxInput: 100,
      fetchQuote: async (quantity) => {
        const q = Number.parseFloat(quantity);
        return { predictiveAmount: q * 0.5 };
      },
    });
    expect(result).toEqual({ ok: true, quantity: expect.any(String) });
    if (result.ok) {
      expect(Number.parseFloat(result.quantity)).toBeCloseTo(20, 1);
    }
  });

  it('rejects invalid target', async () => {
    expect(
      await solveWithdrawInputForTargetReceive({
        targetReceive: 0,
        maxInput: 10,
        fetchQuote: async () => ({ predictiveAmount: 1 }),
      }),
    ).toEqual({ ok: false, reason: 'invalid_target' });
  });
});
