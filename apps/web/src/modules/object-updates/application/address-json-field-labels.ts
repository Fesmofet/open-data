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

const LINK_JSON_FIELD_LABEL_KEYS: Record<string, string> = {
  type: 'object_edit_link_platform',
  value: 'object_edit_link_profile',
};

const STATUS_JSON_FIELD_LABEL_KEYS: Record<string, string> = {
  title: 'object_edit_status_category',
  link: 'object_edit_status_relisted_object',
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
  const labelKeys =
    updateType === UPDATE_TYPES.ADDRESS
      ? ADDRESS_JSON_FIELD_LABEL_KEYS
      : updateType === UPDATE_TYPES.LINK
        ? LINK_JSON_FIELD_LABEL_KEYS
        : updateType === UPDATE_TYPES.STATUS
          ? STATUS_JSON_FIELD_LABEL_KEYS
          : null;
  if (labelKeys) {
    const i18nKey = labelKeys[fieldKey];
    if (i18nKey) {
      return t(i18nKey);
    }
  }
  return fieldKey;
}
