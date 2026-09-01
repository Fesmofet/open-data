import {
  buildDiscoverHref,
  decodeTagFilter,
  encodeTagFilter,
  DISCOVER_ALL_OBJECT_TYPES,
  formatDiscoverBoxParam,
  formatDiscoverMapParam,
  parseDiscoverBoxParam,
  parseDiscoverMapParam,
  parseDiscoverPageState,
  parseDiscoverTagsParam,
  type DiscoverBox,
  type DiscoverMapView,
} from './discover-url';

const SAMPLE_BOX: DiscoverBox = { swLng: -123.2, swLat: 49.1, neLng: -123.0, neLat: 49.3 };
const SAMPLE_MAP: DiscoverMapView = { latitude: 49.2, longitude: -123.1, zoom: 12 };

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
      box: null,
      map: null,
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

  it('includes box when area search is applied', () => {
    const href = buildDiscoverHref({
      type: 'restaurant',
      q: 'sushi',
      tags: ['Cuisine:Japanese'],
      sort: 'newest',
      box: SAMPLE_BOX,
    });
    const url = new URL(href, 'http://local');
    expect(url.searchParams.get('type')).toBe('restaurant');
    expect(url.searchParams.get('q')).toBe('sushi');
    expect(url.searchParams.getAll('tags')).toEqual(['Cuisine:Japanese']);
    expect(url.searchParams.get('sort')).toBe('newest');
    expect(url.searchParams.get('box')).toBe(formatDiscoverBoxParam(SAMPLE_BOX));
    expect(url.searchParams.get('map')).toBeNull();
  });

  it('includes map camera when set', () => {
    const href = buildDiscoverHref({
      type: 'restaurant',
      box: SAMPLE_BOX,
      map: SAMPLE_MAP,
    });
    const url = new URL(href, 'http://local');
    expect(url.searchParams.get('map')).toBe(formatDiscoverMapParam(SAMPLE_MAP));
    expect(url.searchParams.get('box')).toBe(formatDiscoverBoxParam(SAMPLE_BOX));
  });

  it('omits box when no area is applied', () => {
    const href = buildDiscoverHref({ type: 'restaurant' });
    expect(new URL(href, 'http://local').searchParams.get('box')).toBeNull();
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

describe('parseDiscoverBoxParam', () => {
  it('parses a well-formed box param', () => {
    expect(parseDiscoverBoxParam('-123.2,49.1,-123.0,49.3')).toEqual(SAMPLE_BOX);
  });

  it('rejects wrong coordinate count', () => {
    expect(parseDiscoverBoxParam('-123.2,49.1,-123.0')).toBeNull();
    expect(parseDiscoverBoxParam('-123.2,49.1,-123.0,49.3,5')).toBeNull();
  });

  it('rejects non-numeric coordinates', () => {
    expect(parseDiscoverBoxParam('-123.2,abc,-123.0,49.3')).toBeNull();
  });

  it('rejects coordinates outside WGS84 range', () => {
    expect(parseDiscoverBoxParam('-123.2,49.1,-123.0,91')).toBeNull();
    expect(parseDiscoverBoxParam('-181,49.1,-123.0,49.3')).toBeNull();
  });

  it('rejects inverted latitude bounds', () => {
    expect(parseDiscoverBoxParam('-123.2,49.5,-123.0,49.1')).toBeNull();
  });

  it('accepts coordinates on WGS84 limits', () => {
    expect(parseDiscoverBoxParam('-180,-90,180,90')).toEqual({
      swLng: -180,
      swLat: -90,
      neLng: 180,
      neLat: 90,
    });
  });

  it('rejects coordinates just past WGS84 limits', () => {
    expect(parseDiscoverBoxParam('-180.0001,-90,180,90')).toBeNull();
    expect(parseDiscoverBoxParam('-180,-90.0001,180,90')).toBeNull();
  });
});

describe('parseDiscoverMapParam', () => {
  it('parses a well-formed map param', () => {
    expect(parseDiscoverMapParam('49.2,-123.1,12')).toEqual(SAMPLE_MAP);
  });

  it('rejects wrong part count', () => {
    expect(parseDiscoverMapParam('49.2,-123.1')).toBeNull();
    expect(parseDiscoverMapParam('49.2,-123.1,12,3')).toBeNull();
  });

  it('rejects non-numeric coordinates', () => {
    expect(parseDiscoverMapParam('abc,-123.1,12')).toBeNull();
  });

  it('rejects coordinates outside WGS84 range', () => {
    expect(parseDiscoverMapParam('91,-123.1,12')).toBeNull();
    expect(parseDiscoverMapParam('49.2,181,12')).toBeNull();
  });

  it('rejects invalid zoom', () => {
    expect(parseDiscoverMapParam('49.2,-123.1,abc')).toBeNull();
    expect(parseDiscoverMapParam('49.2,-123.1,-1')).toBeNull();
    expect(parseDiscoverMapParam('49.2,-123.1,20')).toBeNull();
    expect(parseDiscoverMapParam('49.2,-123.1,12.5')).toBeNull();
  });

  it('accepts zoom limits', () => {
    expect(parseDiscoverMapParam('0,0,0')).toEqual({ latitude: 0, longitude: 0, zoom: 0 });
    expect(parseDiscoverMapParam('0,0,19')).toEqual({ latitude: 0, longitude: 0, zoom: 19 });
  });
});

describe('formatDiscoverMapParam', () => {
  it('round-trips through parseDiscoverMapParam', () => {
    const formatted = formatDiscoverMapParam(SAMPLE_MAP);
    expect(parseDiscoverMapParam(formatted)).toEqual(SAMPLE_MAP);
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
      box: null,
      map: null,
    });
  });

  it('forces null object type in users mode', () => {
    expect(parseDiscoverPageState({ users: '1', type: 'restaurant' })).toEqual({
      usersMode: true,
      objectType: null,
      q: '',
      tags: [],
      sort: 'rank',
      box: null,
      map: null,
    });
  });

  it('parses mixed-results type=all', () => {
    expect(parseDiscoverPageState({ type: 'all' })).toEqual({
      usersMode: false,
      objectType: 'all',
      q: '',
      tags: [],
      sort: 'rank',
      box: null,
      map: null,
    });
  });

  it('treats whitespace-only type as no selection', () => {
    expect(parseDiscoverPageState({ type: '  ' })).toEqual({
      usersMode: false,
      objectType: null,
      q: '',
      tags: [],
      sort: 'rank',
      box: null,
      map: null,
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
      box: null,
      map: null,
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
      box: null,
      map: null,
    });
  });

  it('parses box from URLSearchParams', () => {
    const params = new URLSearchParams(
      `type=restaurant&box=${encodeURIComponent(formatDiscoverBoxParam(SAMPLE_BOX))}`,
    );
    expect(parseDiscoverPageState(params).box).toEqual(SAMPLE_BOX);
  });

  it('parses map from URLSearchParams', () => {
    const params = new URLSearchParams(
      `type=restaurant&map=${encodeURIComponent(formatDiscoverMapParam(SAMPLE_MAP))}`,
    );
    expect(parseDiscoverPageState(params).map).toEqual(SAMPLE_MAP);
  });

  it('round-trips type, query, tags, sort, box, and map through the URL', () => {
    const href = buildDiscoverHref({
      type: 'restaurant',
      q: 'sushi',
      tags: ['Cuisine:Sushi', 'Features:WiFi'],
      sort: 'newest',
      box: SAMPLE_BOX,
      map: SAMPLE_MAP,
    });
    const parsed = parseDiscoverPageState(new URL(href, 'http://local').searchParams);
    expect(parsed).toEqual({
      usersMode: false,
      objectType: 'restaurant',
      q: 'sushi',
      tags: ['Cuisine:Sushi', 'Features:WiFi'],
      sort: 'newest',
      box: SAMPLE_BOX,
      map: SAMPLE_MAP,
    });
  });
});
