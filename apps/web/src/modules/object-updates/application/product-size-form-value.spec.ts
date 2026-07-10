import { sanitizeProductSizeFormValue } from './product-size-form-value';

describe('sanitizeProductSizeFormValue', () => {
  it('coerces numeric dimensions and valid unit', () => {
    expect(
      sanitizeProductSizeFormValue({
        length: '11',
        width: '20',
        depth: '3',
        unit: 'μm',
      }),
    ).toEqual({
      length: 11,
      width: 20,
      depth: 3,
      unit: 'μm',
    });
  });
});
