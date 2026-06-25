import {
  divideNumericStrings,
  multiplyNumericStrings,
  WAIV_FRACTION_PRECISION,
} from './numeric-string';

describe('numeric-string', () => {
  it('divides with truncation toward zero', () => {
    expect(divideNumericStrings('1', '4.048', WAIV_FRACTION_PRECISION)).toBe(
      '0.24703557',
    );
  });

  it('multiplies decimal strings', () => {
    expect(multiplyNumericStrings('2.5', '4', 8)).toBe('10');
  });

  it('returns null for invalid or zero divisor', () => {
    expect(divideNumericStrings('1', '0', 8)).toBeNull();
    expect(divideNumericStrings('x', '2', 8)).toBeNull();
  });
});
