import { OBJECT_TYPES } from '@opden-data-layer/core/object-type-registry';

export const FIELD_REFERENCE_SOURCE_TYPES = [
  OBJECT_TYPES.PERSON,
  OBJECT_TYPES.BUSINESS,
] as const;

export type FieldReferenceSourceType = (typeof FIELD_REFERENCE_SOURCE_TYPES)[number];

/** Allowed target object types per source type (mirrors query-api field-reference rules). */
export const FIELD_REFERENCE_TARGET_TYPES: Record<FieldReferenceSourceType, readonly string[]> = {
  [OBJECT_TYPES.PERSON]: [OBJECT_TYPES.BOOK],
  [OBJECT_TYPES.BUSINESS]: [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK],
};

export function isFieldReferenceSourceType(
  objectType: string,
): objectType is FieldReferenceSourceType {
  return (FIELD_REFERENCE_SOURCE_TYPES as readonly string[]).includes(objectType);
}

export function isAllowedFieldReferenceObjectType(
  sourceObjectType: string,
  referenceObjectType: string,
): boolean {
  if (!isFieldReferenceSourceType(sourceObjectType)) {
    return false;
  }
  return FIELD_REFERENCE_TARGET_TYPES[sourceObjectType].includes(referenceObjectType);
}
