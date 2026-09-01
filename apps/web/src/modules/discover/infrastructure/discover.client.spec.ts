import { buildDiscoverTagCategoriesSearchParams, fetchDiscoverObjects } from './discover.client';

describe('fetchDiscoverObjects', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('omits object_type when mixed selection is active', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], cursor: null, hasMore: false }),
    }) as typeof fetch;

    await fetchDiscoverObjects({ objectType: 'all', q: 'x' });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/api/discover/objects?');
    expect(url).toContain('q=x');
    expect(url).not.toContain('object_type');
  });

  it('sends box to the objects endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], cursor: null, hasMore: false }),
    }) as typeof fetch;

    await fetchDiscoverObjects({
      objectType: 'restaurant',
      box: { swLng: -123.2, swLat: 49.1, neLng: -123.0, neLat: 49.3 },
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('box=-123.2%2C49.1%2C-123%2C49.3');
  });

  it('scopes request to chosen object type', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], cursor: null, hasMore: false }),
    }) as typeof fetch;

    await fetchDiscoverObjects({
      objectType: 'restaurant',
      tags: ['Cuisine:Sushi'],
      sort: 'newest',
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('object_type=restaurant');
    expect(url).toContain('tags=Cuisine%3ASushi');
    expect(url).toContain('sort=newest');
  });
});

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

  it('includes box when applied', () => {
    const sp = buildDiscoverTagCategoriesSearchParams(
      'restaurant',
      ['Cuisine:Japanese'],
      'sushi',
      { swLng: -123.2, swLat: 49.1, neLng: -123.0, neLat: 49.3 },
    );
    expect(sp.get('object_type')).toBe('restaurant');
    expect(sp.getAll('tags')).toEqual(['Cuisine:Japanese']);
    expect(sp.get('q')).toBe('sushi');
    expect(sp.get('box')).toBe('-123.2,49.1,-123,49.3');
  });
});
