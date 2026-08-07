import {
  formatDelegationTabTotal,
  parseDelegationAmount,
  sortDelegationsByQuantityDesc,
  sumOutgoingDelegationTotal,
} from './wallet-delegations-format';

describe('wallet-delegations-format', () => {
  it('parses delegation amounts with commas', () => {
    expect(parseDelegationAmount('1,234.5')).toBe(1234.5);
    expect(parseDelegationAmount('invalid')).toBe(0);
  });

  it('formats tab totals', () => {
    expect(formatDelegationTabTotal(['1000', '500.5'])).toBe('1,500.50');
    expect(formatDelegationTabTotal(['1.2'], { isRc: true })).toBe('1.2');
  });

  it('sums outgoing delegation quantities', () => {
    expect(
      sumOutgoingDelegationTotal([
        { quantity: '1000' },
        { quantity: '500.25' },
      ]),
    ).toBe(1500.25);
  });

  it('sorts delegations by quantity descending', () => {
    const sorted = sortDelegationsByQuantityDesc([
      { quantity: '10' },
      { quantity: '100' },
      { quantity: '50' },
    ]);
    expect(sorted.map((row) => row.quantity)).toEqual(['100', '50', '10']);
  });
});
