import {
  computeWeeklyPowerDownUnlock,
  getWalletPowerDownWeeks,
  HIVE_POWER_DOWN_WEEKS,
  WAIV_POWER_DOWN_WEEKS,
} from './wallet-power-schedule';

describe('getWalletPowerDownWeeks', () => {
  it('returns 13 for HIVE', () => {
    expect(getWalletPowerDownWeeks('HIVE')).toBe(HIVE_POWER_DOWN_WEEKS);
  });

  it('returns 4 for WAIV and other engine assets', () => {
    expect(getWalletPowerDownWeeks('WAIV')).toBe(WAIV_POWER_DOWN_WEEKS);
    expect(getWalletPowerDownWeeks('BEE')).toBe(WAIV_POWER_DOWN_WEEKS);
  });
});

describe('computeWeeklyPowerDownUnlock', () => {
  it('divides amount by weeks and formats', () => {
    expect(computeWeeklyPowerDownUnlock(100, 4)).toBe('25');
  });

  it('returns null for invalid input', () => {
    expect(computeWeeklyPowerDownUnlock(null, 4)).toBeNull();
    expect(computeWeeklyPowerDownUnlock(0, 4)).toBeNull();
    expect(computeWeeklyPowerDownUnlock(100, 0)).toBeNull();
  });
});
