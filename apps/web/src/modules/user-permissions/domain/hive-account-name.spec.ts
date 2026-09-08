import { isValidHiveAccountName, normalizeHiveAccountName } from './hive-account-name';

describe('hive-account-name', () => {
  it('normalizes @ prefix and casing', () => {
    expect(normalizeHiveAccountName('@Alice')).toBe('alice');
  });

  it('accepts valid Hive account names', () => {
    expect(isValidHiveAccountName('waivio.import')).toBe(true);
    expect(isValidHiveAccountName('waivio-app')).toBe(true);
  });

  it('rejects invalid names', () => {
    expect(isValidHiveAccountName('ab')).toBe(false);
    expect(isValidHiveAccountName('bad name')).toBe(false);
  });
});
