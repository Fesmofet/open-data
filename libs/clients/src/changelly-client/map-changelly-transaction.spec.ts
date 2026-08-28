import { mapChangellyTransactionResult } from './map-changelly-transaction';

describe('mapChangellyTransactionResult', () => {
  it('maps Changelly createTransaction fields to payin DTO', () => {
    expect(
      mapChangellyTransactionResult({
        payinExtraId: 'memo-1',
        payinAddress: 'changellyhive',
        id: 'ex-abc',
        amountExpectedFrom: '10',
        amountExpectedTo: '0.00042',
        trackUrl: 'https://changelly.com/track/ex-abc',
      }),
    ).toEqual({
      memo: 'memo-1',
      receiver: 'changellyhive',
      exchangeId: 'ex-abc',
      outputAmount: '0.00042',
      trackUrl: 'https://changelly.com/track/ex-abc',
    });
  });
});
