import { serializeHiveJsonMetadata } from './hive-chain-context.service';

describe('serializeHiveJsonMetadata', () => {
  it('keeps JSON strings as-is', () => {
    expect(serializeHiveJsonMetadata('{"beneficiaries":[]}')).toBe(
      '{"beneficiaries":[]}',
    );
  });

  it('stringifies objects instead of [object Object]', () => {
    expect(serializeHiveJsonMetadata({ beneficiaries: [] })).toBe(
      '{"beneficiaries":[]}',
    );
  });

  it('returns empty string for nullish', () => {
    expect(serializeHiveJsonMetadata(null)).toBe('');
    expect(serializeHiveJsonMetadata(undefined)).toBe('');
  });
});
