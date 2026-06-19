import {
  formatEngineTokenAmountDisplay,
  formatEngineTokenQuantity,
  formatEngineTokenUsdEstimate,
  formatNextPowerDownAt,
  formatNextPowerDownSubtitle,
} from './engine-token-amount';

describe('formatEngineTokenQuantity', () => {
  it('does not pad trailing zeros', () => {
    expect(formatEngineTokenQuantity(0.1)).toBe('0.1');
    expect(formatEngineTokenQuantity(1)).toBe('1');
    expect(formatEngineTokenQuantity(1.23)).toBe('1.23');
    expect(formatEngineTokenQuantity(0.001)).toBe('0.001');
  });
});

describe('formatEngineTokenAmountDisplay', () => {
  it('strips trailing zeros from Hive Engine quantity strings', () => {
    expect(formatEngineTokenAmountDisplay('0.10000000')).toBe('0.1');
    expect(formatEngineTokenAmountDisplay(' 2.50000000 ')).toBe('2.5');
  });
});

describe('formatEngineTokenUsdEstimate', () => {
  it('formats USD estimate with two fraction digits', () => {
    expect(formatEngineTokenUsdEstimate('0.1', 2.5)).toBe('0.25');
    expect(formatEngineTokenUsdEstimate('', 2.5)).toBe('0.00');
  });
});

describe('formatNextPowerDownAt', () => {
  it('formats next unstake timestamp for display', () => {
    const formatted = formatNextPowerDownAt(
      Date.UTC(2026, 5, 26, 15, 10),
      'en-US',
    );
    expect(formatted).toMatch(/6\/26\/2026/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  });
});

describe('formatNextPowerDownSubtitle', () => {
  it('prefixes label with formatted date when timestamp is present', () => {
    const subtitle = formatNextPowerDownSubtitle(
      Date.UTC(2026, 5, 26, 15, 10),
      'en-US',
      'Next power down:',
    );
    expect(subtitle).toMatch(/^Next power down: 6\/26\/2026/);
  });
});
