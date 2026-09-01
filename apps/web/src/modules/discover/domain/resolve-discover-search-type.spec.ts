import { resolveDiscoverSearchType } from './resolve-discover-search-type';

describe('resolveDiscoverSearchType', () => {
  it('uses URL type=all on discover without falling back to cookie', () => {
    expect(
      resolveDiscoverSearchType({
        pathname: '/discover',
        search: 'type=all&q=sushi',
        rememberedCookie: 'restaurant',
      }),
    ).toBe('all');
  });

  it('uses explicit URL type over remembered cookie', () => {
    expect(
      resolveDiscoverSearchType({
        pathname: '/discover',
        search: 'type=book',
        rememberedCookie: 'restaurant',
      }),
    ).toBe('book');
  });

  it('falls back to cookie when discover URL has no type', () => {
    expect(
      resolveDiscoverSearchType({
        pathname: '/discover',
        search: 'q=sushi',
        rememberedCookie: 'restaurant',
      }),
    ).toBe('restaurant');
  });

  it('returns null when not on discover and no cookie', () => {
    expect(
      resolveDiscoverSearchType({
        pathname: '/',
        search: '',
        rememberedCookie: null,
      }),
    ).toBeNull();
  });
});
