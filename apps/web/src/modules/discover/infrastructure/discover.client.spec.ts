import { buildDiscoverTagCategoriesSearchParams } from './discover.client';

describe('buildDiscoverTagCategoriesSearchParams', () => {
  it('includes object_type and tags', () => {
    const sp = buildDiscoverTagCategoriesSearchParams('product', [
      'Cuisine:Asian',
      'Features:Outdoor',
    ]);
    expect(sp.get('object_type')).toBe('product');
    expect(sp.getAll('tags')).toEqual(['Cuisine:Asian', 'Features:Outdoor']);
  });

  it('omits empty tags', () => {
    const sp = buildDiscoverTagCategoriesSearchParams('product', ['  ', '']);
    expect(sp.getAll('tags')).toEqual([]);
  });

  it('includes q when non-empty', () => {
    const sp = buildDiscoverTagCategoriesSearchParams('product', [], 'burger');
    expect(sp.get('q')).toBe('burger');
  });

  it('omits blank q', () => {
    const sp = buildDiscoverTagCategoriesSearchParams('product', [], '   ');
    expect(sp.get('q')).toBeNull();
  });
});
