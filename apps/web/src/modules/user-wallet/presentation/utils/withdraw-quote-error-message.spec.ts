import { withdrawQuoteErrorMessage } from './withdraw-quote-error-message';

describe('withdrawQuoteErrorMessage', () => {
  const t = (key: string) => key;

  it('returns null when quote has no error', () => {
    expect(withdrawQuoteErrorMessage(t, {})).toBeNull();
  });

  it('maps eth_gas_fee errorCode to i18n key', () => {
    expect(
      withdrawQuoteErrorMessage(t, {
        errorCode: 'eth_gas_fee',
        errorParams: { fee: 0.005 },
      }),
    ).toBe('wallet_withdraw_eth_gas_fee');
  });

  it('maps minimum_withdraw_amount errorCode', () => {
    expect(
      withdrawQuoteErrorMessage(t, {
        errorCode: 'minimum_withdraw_amount',
        errorParams: { amount: 0.01, symbol: 'SWAP.BTC' },
      }),
    ).toBe('wallet_withdraw_minimum_amount');
  });

  it('falls back to error string', () => {
    expect(
      withdrawQuoteErrorMessage(t, { error: 'custom failure' }),
    ).toBe('custom failure');
  });
});
