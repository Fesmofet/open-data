import {
  isPendingNavReached,
  normalizeProfileNavTarget,
  parseProfileNavHref,
} from './user-profile-pending-nav';

describe('parseProfileNavHref', () => {
  it('splits pathname and search', () => {
    expect(parseProfileNavHref('/@alice/transfers?type=HIVE')).toEqual({
      pathname: '/@alice/transfers',
      search: 'type=HIVE',
    });
    expect(parseProfileNavHref('/@alice')).toEqual({
      pathname: '/@alice',
      search: '',
    });
  });
});

describe('normalizeProfileNavTarget', () => {
  it('treats public and internal profile URLs as equivalent', () => {
    const publicUrl = normalizeProfileNavTarget({
      pathname: '/@alice/favorites',
      search: '',
    });
    const internalUrl = normalizeProfileNavTarget({
      pathname: '/user-profile/alice/favorites',
      search: '',
    });
    expect(publicUrl).toEqual(internalUrl);
  });
});

describe('isPendingNavReached', () => {
  it('reaches when pathname matches and pending link had no query', () => {
    expect(
      isPendingNavReached(
        { pathname: '/@alice', search: '' },
        { pathname: '/@alice', search: 'objects=waivio' },
      ),
    ).toBe(true);
  });

  it('does not reach when wallet query differs', () => {
    expect(
      isPendingNavReached(
        { pathname: '/@alice/transfers', search: 'type=HIVE' },
        { pathname: '/@alice/transfers', search: 'type=WAIV' },
      ),
    ).toBe(false);
  });

  it('does not reach across profile sections', () => {
    expect(
      isPendingNavReached(
        { pathname: '/@alice', search: '' },
        { pathname: '/@alice/favorites', search: '' },
      ),
    ).toBe(false);
  });

  it('reaches across /@ and /user-profile path prefixes', () => {
    expect(
      isPendingNavReached(
        { pathname: '/@alice/threads', search: '' },
        { pathname: '/user-profile/alice/threads', search: '' },
      ),
    ).toBe(true);
  });

  it('reaches wallet tab when query matches', () => {
    expect(
      isPendingNavReached(
        { pathname: '/@alice/transfers', search: 'type=ENGINE' },
        { pathname: '/@alice/transfers', search: 'type=ENGINE' },
      ),
    ).toBe(true);
  });
});
