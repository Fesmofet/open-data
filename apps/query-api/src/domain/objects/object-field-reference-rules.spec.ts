import {
  FIELD_REFERENCE_RULES,
  getFieldReferenceRule,
  isAllowedFieldReferenceObjectType,
  isFieldReferenceSourceType,
} from './object-field-reference-rules';

describe('object-field-reference-rules', () => {
  it('identifies person and business as source types', () => {
    expect(isFieldReferenceSourceType('person')).toBe(true);
    expect(isFieldReferenceSourceType('business')).toBe(true);
    expect(isFieldReferenceSourceType('book')).toBe(false);
  });

  it('maps person to books via author', () => {
    expect(getFieldReferenceRule('person')).toEqual(FIELD_REFERENCE_RULES.person);
    expect(isAllowedFieldReferenceObjectType('person', 'book')).toBe(true);
    expect(isAllowedFieldReferenceObjectType('person', 'product')).toBe(false);
  });

  it('maps business to products and books via commerce fields', () => {
    expect(getFieldReferenceRule('business')?.referenceObjectTypes).toEqual([
      'product',
      'book',
    ]);
    expect(isAllowedFieldReferenceObjectType('business', 'product')).toBe(true);
    expect(isAllowedFieldReferenceObjectType('business', 'book')).toBe(true);
    expect(isAllowedFieldReferenceObjectType('business', 'person')).toBe(false);
  });

  it('returns null for unsupported source types', () => {
    expect(getFieldReferenceRule('product')).toBeNull();
  });
});
