import { sanitizeProductWeightFormValue } from './product-weight-form-value';

describe('sanitizeProductWeightFormValue', () => {
  it('coerces numeric value and valid unit', () => {
    expect(sanitizeProductWeightFormValue({ value: '12', unit: 'st' })).toEqual({
      value: 12,
      unit: 'st',
    });
  });

  it('falls back to the first registry unit when unit is invalid', () => {
    expect(sanitizeProductWeightFormValue({ value: 1, unit: 'invalid' })).toEqual({
      value: 1,
      unit: 't',
    });
  });
});
