import {
  buildProfilePostsHref,
  parseProfilePostFilters,
  parseProfilePostObjectIds,
  toggleProfilePostObjectFilter,
} from './profile-post-filters-url';

describe('parseProfilePostObjectIds', () => {
  it('dedupes and trims', () => {
    expect(parseProfilePostObjectIds([' a ', 'a', '', 'b'])).toEqual(['a', 'b']);
  });
});

describe('buildProfilePostsHref', () => {
  it('builds public profile URL with repeated objects', () => {
    const href = buildProfilePostsHref('alice', ['waivio', 'ai']);
    const url = new URL(href, 'http://local');
    expect(url.pathname).toBe('/@alice');
    expect(url.searchParams.getAll('objects')).toEqual(['waivio', 'ai']);
  });

  it('omits query when no filters', () => {
    expect(buildProfilePostsHref('alice', [])).toBe('/@alice');
  });
});

describe('parseProfilePostFilters', () => {
  it('reads objects from URLSearchParams', () => {
    const sp = new URLSearchParams();
    sp.append('objects', 'waivio');
    sp.append('objects', 'ai');
    expect(parseProfilePostFilters(sp)).toEqual({ objectIds: ['waivio', 'ai'] });
  });
});

describe('toggleProfilePostObjectFilter', () => {
  it('adds and removes object ids', () => {
    expect(toggleProfilePostObjectFilter([], 'a', true)).toEqual(['a']);
    expect(toggleProfilePostObjectFilter(['a'], 'a', false)).toEqual([]);
    expect(toggleProfilePostObjectFilter(['a'], 'b', true)).toEqual(['a', 'b']);
  });
});
