import { UPDATE_ADDRESS } from '@opden-data-layer/core/update-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { getJsonFieldDescriptors } from './update-value-form.utils';
import {
  labelForJsonFieldKey,
  orderJsonFieldDescriptors,
} from './address-json-field-labels';

describe('address-json-field-labels', () => {
  const t = (key: string) =>
    (
      {
        object_edit_address_line1: 'Address 1',
        object_edit_address_line2: 'Address 2',
        location_city: 'City',
        stateProvince: 'State/Province',
        postalCode: 'Postal code',
        location_country: 'Country',
      } as Record<string, string>
    )[key] ?? key;

  it('orders address fields for forms', () => {
    const fields = getJsonFieldDescriptors(UPDATE_ADDRESS.schema)!;
    expect(orderJsonFieldDescriptors(fields, UPDATE_TYPES.ADDRESS).map((f) => f.key)).toEqual([
      'street',
      'suite',
      'locality',
      'state',
      'postal_code',
      'country',
    ]);
  });

  it('labelForJsonFieldKey maps address schema keys to i18n labels', () => {
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'street', t)).toBe('Address 1');
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'suite', t)).toBe('Address 2');
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'locality', t)).toBe('City');
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'state', t)).toBe('State/Province');
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'postal_code', t)).toBe('Postal code');
    expect(labelForJsonFieldKey(UPDATE_TYPES.ADDRESS, 'country', t)).toBe('Country');
  });

  it('labelForJsonFieldKey leaves non-address keys unchanged', () => {
    expect(labelForJsonFieldKey(UPDATE_TYPES.NAME, 'street', t)).toBe('street');
  });
});
