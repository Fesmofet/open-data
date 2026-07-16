import { parsePositiveUsdAmount } from './relationship-modal-fields';

describe('parsePositiveUsdAmount', () => {
  it('rejects junk inside the string', () => {
    expect(parsePositiveUsdAmount('1dfdf.5')).toBe(false);
  });

  it('accepts valid positive decimals', () => {
    expect(parsePositiveUsdAmount('12.5')).toBe(true);
    expect(parsePositiveUsdAmount('1')).toBe(true);
  });

  it('rejects zero and empty values', () => {
    expect(parsePositiveUsdAmount('0')).toBe(false);
    expect(parsePositiveUsdAmount('')).toBe(false);
  });
});
