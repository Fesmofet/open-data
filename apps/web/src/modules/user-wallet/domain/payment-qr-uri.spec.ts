import {
  matchQrSchemeToWithdrawPair,
  parsePaymentQrUri,
} from './payment-qr-uri';

const tokens = [
  {
    inputSymbol: 'WAIV',
    outputSymbol: 'LTC',
    balanceSymbol: 'WAIV',
    displayName: 'Litecoin',
    label: 'WAIV - LTC',
    balance: '1',
    precision: 8,
    requiresExternalAddress: true,
    minimumSwapAmount: null,
    minimumReceiveAmount: null,
  },
] as const;

describe('parsePaymentQrUri', () => {
  it('returns raw string when no scheme', () => {
    expect(parsePaymentQrUri('bc1qexample')).toEqual({
      address: 'bc1qexample',
      scheme: null,
      amount: null,
    });
  });

  it('parses scheme address and amount', () => {
    expect(
      parsePaymentQrUri('litecoin:ltc1abc?amount=0.5'),
    ).toEqual({
      address: 'ltc1abc',
      scheme: 'litecoin',
      amount: 0.5,
    });
  });
});

describe('matchQrSchemeToWithdrawPair', () => {
  it('matches display name containing scheme', () => {
    expect(matchQrSchemeToWithdrawPair('litecoin', tokens)).toEqual({
      inputSymbol: 'WAIV',
      outputSymbol: 'LTC',
    });
  });
});
