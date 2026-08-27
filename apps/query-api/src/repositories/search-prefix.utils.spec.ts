import {
  prefixUpperBound,
  shouldSearchObjectIdSubstring,
  shouldSearchPrefix,
} from './search-prefix.utils';

describe('prefixUpperBound', () => {
  it('increments last character for btree prefix upper bound', () => {
    expect(prefixUpperBound('grampo')).toBe('grampp');
  });

  it('handles dotted Hive account prefixes', () => {
    expect(prefixUpperBound('shadow.hunter')).toBe('shadow.huntes');
  });

  it('returns empty string unchanged', () => {
    expect(prefixUpperBound('')).toBe('');
  });

  it('increments last character for object_id prefix (kvu → kvv)', () => {
    expect(prefixUpperBound('kvu')).toBe('kvv');
  });

  it('increments trailing hyphen to dot (kvu- → kvu.); object_id SQL must COLLATE C', () => {
    expect(prefixUpperBound('kvu-')).toBe('kvu.');
  });
});

describe('shouldSearchPrefix', () => {
  it('returns true for three-character queries', () => {
    expect(shouldSearchPrefix('kvu')).toBe(true);
    expect(shouldSearchPrefix('abc')).toBe(true);
  });

  it('returns false below three characters after trim', () => {
    expect(shouldSearchPrefix('ab')).toBe(false);
    expect(shouldSearchPrefix('  ab  ')).toBe(false);
  });

  it('uses trimmed length', () => {
    expect(shouldSearchPrefix('  kvu')).toBe(true);
    expect(shouldSearchPrefix('kvu  ')).toBe(true);
  });
});

describe('shouldSearchObjectIdSubstring', () => {
  it('returns false for short text queries without hyphen', () => {
    expect(shouldSearchObjectIdSubstring('grampo')).toBe(false);
    expect(shouldSearchObjectIdSubstring('flowmaster')).toBe(false);
    expect(shouldSearchObjectIdSubstring('kvu')).toBe(false);
  });

  it('returns true for id-shaped queries', () => {
    expect(shouldSearchObjectIdSubstring('abc-12345-uuid')).toBe(true);
    expect(shouldSearchObjectIdSubstring('kvu-kisa')).toBe(true);
  });

  it('returns false when hyphen present but too short', () => {
    expect(shouldSearchObjectIdSubstring('ab-c')).toBe(false);
  });
});
