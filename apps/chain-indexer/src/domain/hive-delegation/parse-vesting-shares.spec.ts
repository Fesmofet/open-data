import { parseVestingSharesFromOperation } from './parse-vesting-shares';

describe('parseVestingSharesFromOperation', () => {
  it('parses Hive asset strings', () => {
    expect(parseVestingSharesFromOperation('46.130000 VESTS')).toBe(46.13);
  });

  it('returns 0 for zero or invalid values', () => {
    expect(parseVestingSharesFromOperation('0.000000 VESTS')).toBe(0);
    expect(parseVestingSharesFromOperation('')).toBe(0);
    expect(parseVestingSharesFromOperation(undefined)).toBe(0);
  });

  it('accepts numeric input', () => {
    expect(parseVestingSharesFromOperation(12.5)).toBe(12.5);
  });
});
