import {
  computeWaivPaidFromHistory,
  sumWaivAuthorBeneficiaryFromHistory,
  sumWaivCurationFromHistory,
  waivCashoutHistoryWindow,
} from './waiv-history.util';

describe('waivCashoutHistoryWindow', () => {
  it('uses legacy 6d23h .. 7d5h offsets from created', () => {
    const created = 1_700_000_000;
    const { timestampStart, timestampEnd } = waivCashoutHistoryWindow(created);
    expect(timestampEnd - timestampStart).toBe(6 * 3600);
  });
});

describe('sumWaivAuthorBeneficiaryFromHistory', () => {
  it('doubles matched authorperm quantities', () => {
    const total = sumWaivAuthorBeneficiaryFromHistory(
      [
        {
          authorperm: '@alice/post-1',
          quantity: '1.25',
        },
        {
          authorperm: '@other/p',
          quantity: '9',
        },
      ],
      '@alice/post-1',
    );
    expect(total).toBe(2.5);
  });
});

describe('sumWaivCurationFromHistory', () => {
  it('does not double curation quantities', () => {
    const total = sumWaivCurationFromHistory(
      [
        {
          authorperm: '@alice/post-1',
          quantity: '0.5',
        },
      ],
      '@alice/post-1',
    );
    expect(total).toBe(0.5);
  });
});

describe('computeWaivPaidFromHistory', () => {
  it('combines author/ben (doubled) and curation', () => {
    const total = computeWaivPaidFromHistory(
      [{ authorperm: '@a/p', quantity: '1' }],
      [{ authorperm: '@a/p', quantity: '0.3' }],
      '@a/p',
    );
    expect(total).toBe(2.3);
  });
});
