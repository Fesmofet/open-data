import { buildDiscoverHrefFromSearch } from './search-nav-list';

describe('buildDiscoverHrefFromSearch', () => {
  it('builds discover URL for all object types', () => {
    expect(buildDiscoverHrefFromSearch('all', 'test')).toBe('/discover?q=test');
  });

  it('builds discover URL for object type', () => {
    expect(buildDiscoverHrefFromSearch('product', 'test')).toBe(
      '/discover?q=test&type=product',
    );
  });

  it('builds discover URL for users', () => {
    expect(buildDiscoverHrefFromSearch('users', 'test')).toBe(
      '/discover?q=test&users=1',
    );
  });
});
