import {
  getRatingDimensionNamesForObjectType,
  getTagCategoryNamesForObjectType,
  listDiscoverObjectTypes,
  objectTypeHasTagCategoryFilters,
} from './discover-registry';

describe('discover-registry', () => {
  it('lists object types from registry', () => {
    const types = listDiscoverObjectTypes();
    expect(types).toContain('product');
    expect(types.length).toBeGreaterThan(10);
  });

  it('product has tag category filters', () => {
    expect(objectTypeHasTagCategoryFilters('product')).toBe(true);
    expect(getTagCategoryNamesForObjectType('product')).toEqual([
      'Category',
      'Pros',
      'Cons',
    ]);
  });

  it('hashtag has no tag category filters', () => {
    expect(objectTypeHasTagCategoryFilters('hashtag')).toBe(false);
  });

  it('returns false for null, all, and unknown types', () => {
    expect(objectTypeHasTagCategoryFilters(null)).toBe(false);
    expect(objectTypeHasTagCategoryFilters('all')).toBe(false);
    expect(objectTypeHasTagCategoryFilters('not-a-type')).toBe(false);
  });

  it('restaurant has tag category filters', () => {
    expect(objectTypeHasTagCategoryFilters('restaurant')).toBe(true);
  });

  it('product has rating dimensions from supposed_updates', () => {
    expect(getRatingDimensionNamesForObjectType('product')).toEqual(['Quality', 'Value']);
  });

  it('unknown type has no rating dimensions', () => {
    expect(getRatingDimensionNamesForObjectType('not-a-type')).toEqual([]);
  });

  it('hashtag has no rating dimensions in supposed_updates', () => {
    expect(getRatingDimensionNamesForObjectType('hashtag')).toEqual([]);
  });
});
