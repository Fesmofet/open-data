import {
  buildDiscoverHref,
  decodeTagFilter,
  encodeTagFilter,
  DISCOVER_ALL_OBJECT_TYPES,
  parseDiscoverPageState,
  parseDiscoverTagsParam,
} from './discover-url';

describe('encodeTagFilter / decodeTagFilter', () => {
  it('round-trips category and value', () => {
    const encoded = encodeTagFilter('Cuisine', 'asian');
    expect(encoded).toBe('Cuisine:asian');
    expect(decodeTagFilter(encoded)).toEqual({ category: 'Cuisine', value: 'asian' });
  });

  it('splits on first colon for categories with spaces', () => {
    const encoded = encodeTagFilter('Meal Type', 'breakfast');
    expect(decodeTagFilter(encoded)).toEqual({ category: 'Meal Type', value: 'breakfast' });
  });

  it('returns null for value-only strings', () => {
    expect(decodeTagFilter('asian')).toBeNull();
    expect(decodeTagFilter(':asian')).toBeNull();
    expect(decodeTagFilter('Cuisine:')).toBeNull();
  });
});

describe('buildDiscoverHref', () => {
  it('builds object type URL with query and tags', () => {
    const href = buildDiscoverHref({
      type: 'product',
      q: 'test',
      tags: ['Flavor:Bitter', 'Type:Backpack'],
      sort: 'newest',
    });
    const url = new URL(href, 'http://local');
    expect(url.pathname).toBe('/discover');
    expect(url.searchParams.get('type')).toBe('product');
    expect(url.searchParams.get('q')).toBe('test');
    expect(url.searchParams.getAll('tags')).toEqual(['Flavor:Bitter', 'Type:Backpack']);
    expect(url.searchParams.get('sort')).toBe('newest');
  });

  it('omits sort when default rank', () => {
    const href = buildDiscoverHref({
      type: 'product',
      sort: 'rank',
    });
    const url = new URL(href, 'http://local');
    expect(url.searchParams.get('sort')).toBeNull();
    expect(href).toBe('/discover?type=product');
  });

  it('builds users mode URL without type', () => {
    expect(buildDiscoverHref({ users: true, type: 'book', q: 'x' })).toBe(
      '/discover?users=1&q=x',
    );
  });

  it('builds mixed-results URL with type=all', () => {
    expect(buildDiscoverHref({ type: DISCOVER_ALL_OBJECT_TYPES, q: 'sushi' })).toBe(
      '/discover?type=all&q=sushi',
    );
  });
});

describe('parseDiscoverTagsParam', () => {
  it('parses array and dedupes empty', () => {
    expect(parseDiscoverTagsParam(['a', '', 'b'])).toEqual(['a', 'b']);
  });

  it('drops blank tag entries', () => {
    expect(parseDiscoverTagsParam(['', ' ', 'Cuisine:Sushi'])).toEqual(['Cuisine:Sushi']);
  });
});

describe('parseDiscoverPageState', () => {
  it('treats bare discover URL as no object type selected', () => {
    expect(parseDiscoverPageState({})).toEqual({
      usersMode: false,
      objectType: null,
      q: '',
      tags: [],
      sort: 'rank',
    });
  });

  it('forces null object type in users mode', () => {
    expect(parseDiscoverPageState({ users: '1', type: 'restaurant' })).toEqual({
      usersMode: true,
      objectType: null,
      q: '',
      tags: [],
      sort: 'rank',
    });
  });

  it('parses mixed-results type=all', () => {
    expect(parseDiscoverPageState({ type: 'all' })).toEqual({
      usersMode: false,
      objectType: 'all',
      q: '',
      tags: [],
      sort: 'rank',
    });
  });

  it('treats whitespace-only type as no selection', () => {
    expect(parseDiscoverPageState({ type: '  ' })).toEqual({
      usersMode: false,
      objectType: null,
      q: '',
      tags: [],
      sort: 'rank',
    });
  });

  it('parses object type, query, tags, and sort from RSC searchParams', () => {
    expect(
      parseDiscoverPageState({
        type: 'restaurant',
        q: ' pizza ',
        tags: ['Cuisine:asian', 'Meal Type:breakfast'],
        sort: 'rank',
      }),
    ).toEqual({
      usersMode: false,
      objectType: 'restaurant',
      q: 'pizza',
      tags: ['Cuisine:asian', 'Meal Type:breakfast'],
      sort: 'rank',
    });
  });

  it('parses users mode from URLSearchParams', () => {
    const params = new URLSearchParams('users=1&q=alice&sort=oldest');
    expect(parseDiscoverPageState(params)).toEqual({
      usersMode: true,
      objectType: null,
      q: 'alice',
      tags: [],
      sort: 'oldest',
    });
  });

  it('round-trips type, query, tags and sort through the URL', () => {
    const href = buildDiscoverHref({
      type: 'restaurant',
      q: 'sushi',
      tags: ['Cuisine:Sushi', 'Features:WiFi'],
      sort: 'newest',
    });
    const parsed = parseDiscoverPageState(new URL(href, 'http://local').searchParams);
    expect(parsed).toEqual({
      usersMode: false,
      objectType: 'restaurant',
      q: 'sushi',
      tags: ['Cuisine:Sushi', 'Features:WiFi'],
      sort: 'newest',
    });
  });
});
