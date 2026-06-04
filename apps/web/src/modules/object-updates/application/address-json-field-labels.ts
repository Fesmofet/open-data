import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { JsonFieldDescriptor } from './update-value-form.utils';

/** Display order for structured address (`address` update) in create + edit forms. */
export const ADDRESS_JSON_FIELD_ORDER = [
  'street',
  'suite',
  'locality',
  'state',
  'postal_code',
  'country',
] as const;

const ADDRESS_JSON_FIELD_LABEL_KEYS: Record<string, string> = {
  street: 'object_edit_address_line1',
  suite: 'object_edit_address_line2',
  locality: 'location_city',
  state: 'stateProvince',
  postal_code: 'postalCode',
  country: 'location_country',
};

export function orderJsonFieldDescriptors(
  fields: JsonFieldDescriptor[],
  updateType: string,
): JsonFieldDescriptor[] {
  if (updateType !== UPDATE_TYPES.ADDRESS) {
    return fields;
  }
  const byKey = new Map(fields.map((f) => [f.key, f]));
  return ADDRESS_JSON_FIELD_ORDER.map((key) => byKey.get(key)).filter(
    (f): f is JsonFieldDescriptor => f !== undefined,
  );
}

export function labelForJsonFieldKey(
  updateType: string,
  fieldKey: string,
  t: (key: string) => string,
): string {
  if (updateType === UPDATE_TYPES.ADDRESS) {
    const i18nKey = ADDRESS_JSON_FIELD_LABEL_KEYS[fieldKey];
    if (i18nKey) {
      return t(i18nKey);
    }
  }
  return fieldKey;
}
