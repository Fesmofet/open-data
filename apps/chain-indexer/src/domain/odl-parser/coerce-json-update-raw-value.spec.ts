import { UPDATE_INGREDIENTS } from '@opden-data-layer/core/update-registry';

import { coerceJsonUpdateRawValue } from './coerce-json-update-raw-value';

describe('coerceJsonUpdateRawValue', () => {
  it('parses JSON string payloads', () => {
    expect(
      coerceJsonUpdateRawValue(
        UPDATE_INGREDIENTS,
        '["flour","sugar"]',
      ),
    ).toEqual(['flour', 'sugar']);
  });

  it('splits newline text for root string array updates', () => {
    expect(
      coerceJsonUpdateRawValue(UPDATE_INGREDIENTS, 'flour\nsugar\n'),
    ).toEqual(['flour', 'sugar']);
  });

  it('passes through non-string values', () => {
    const value = { cid: 'QmTest' };
    expect(coerceJsonUpdateRawValue(UPDATE_INGREDIENTS, value)).toBe(value);
  });
});
