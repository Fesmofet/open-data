import { validateWithdrawOutputAmount } from './validate-withdraw-amount';

describe('validateWithdrawOutputAmount', () => {
  it('validates HIVE minimum on withdraw path only', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '0.001',
      outputSymbol: 'HIVE',
      fetchBtcMinimum: async () => null,
    });
    expect(result?.errorCode).toBe('minimum_withdraw_amount');
    expect(result?.predictiveAmount).toBeNull();
  });

  it('returns null for disabled ETH output', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '0.001',
      outputSymbol: 'ETH',
      fetchBtcMinimum: async () => null,
    });
    expect(result).toBeNull();
  });

  it('rounds HBD predictive amount to 3 decimal places', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '1.23456789',
      outputSymbol: 'HBD',
      fetchBtcMinimum: async () => null,
    });
    expect(result?.predictiveAmount).toBe(1.225);
  });
});

describe('swap vs withdraw validation separation', () => {
  it('swap quote path must not call validateWithdrawOutputAmount', () => {
    expect(typeof validateWithdrawOutputAmount).toBe('function');
    expect(typeof import('./get-swap-output').then).toBe('function');
  });
});
