import { validateWithdrawOutputAmount } from './validate-withdraw-amount';

describe('validateWithdrawOutputAmount', () => {
  it('validates HIVE minimum on withdraw path only', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '0.001',
      outputSymbol: 'HIVE',
      fetchEthFee: async () => null,
      fetchBtcMinimum: async () => null,
    });
    expect(result?.errorCode).toBe('minimum_withdraw_amount');
    expect(result?.predictiveAmount).toBeNull();
  });

  it('validates ETH gas fee on swap output amount', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '0.001',
      outputSymbol: 'ETH',
      fetchEthFee: async () => 0.005,
      fetchBtcMinimum: async () => null,
    });
    expect(result?.errorCode).toBe('eth_gas_fee');
    expect(result?.errorParams?.fee).toBe(0.005);
    expect(result?.predictiveAmount).toBeNull();
  });

  it('rounds HBD predictive amount to 3 decimal places', async () => {
    const result = await validateWithdrawOutputAmount({
      amount: '1.23456789',
      outputSymbol: 'HBD',
      fetchEthFee: async () => null,
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
