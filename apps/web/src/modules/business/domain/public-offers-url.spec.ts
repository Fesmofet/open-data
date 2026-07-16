import {
  buildPublicOffersHref,
  hasPublicOffersFilters,
  parsePublicOffersPageState,
} from './public-offers-url';

describe('parsePublicOffersPageState', () => {
  it('returns empty strings when params are missing', () => {
    expect(parsePublicOffersPageState({})).toEqual({ author: '', q: '' });
  });

  it('trims author and q', () => {
    expect(
      parsePublicOffersPageState({ author: ' flowmaster ', q: ' test ' }),
    ).toEqual({ author: 'flowmaster', q: 'test' });
  });

  it('reads from URLSearchParams', () => {
    const params = new URLSearchParams('author=alice&q=design');
    expect(parsePublicOffersPageState(params)).toEqual({
      author: 'alice',
      q: 'design',
    });
  });
});

describe('hasPublicOffersFilters', () => {
  it('is false when both empty', () => {
    expect(hasPublicOffersFilters({ author: '', q: '' })).toBe(false);
  });

  it('is true when author or q is set', () => {
    expect(hasPublicOffersFilters({ author: 'alice', q: '' })).toBe(true);
    expect(hasPublicOffersFilters({ author: '', q: 'x' })).toBe(true);
  });
});

describe('buildPublicOffersHref', () => {
  it('returns base path without filters', () => {
    expect(buildPublicOffersHref('offer')).toBe('/business/offers');
    expect(buildPublicOffersHref('request')).toBe('/business/requests');
  });

  it('builds query string with author and q', () => {
    const href = buildPublicOffersHref('offer', {
      author: 'flowmaster',
      q: 'design',
    });
    const url = new URL(href, 'http://local');
    expect(url.pathname).toBe('/business/offers');
    expect(url.searchParams.get('author')).toBe('flowmaster');
    expect(url.searchParams.get('q')).toBe('design');
  });

  it('omits empty params', () => {
    expect(buildPublicOffersHref('offer', { author: 'alice', q: '' })).toBe(
      '/business/offers?author=alice',
    );
  });
});
