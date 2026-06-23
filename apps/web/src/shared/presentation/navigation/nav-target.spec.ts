import {
  isNavTargetReached,
  parseNavHref,
} from '@/shared/presentation/navigation/nav-target';

describe('parseNavHref', () => {
  it('parses pathname only', () => {
    expect(parseNavHref('/@alice/threads')).toEqual({
      pathname: '/@alice/threads',
      search: '',
    });
  });

  it('parses pathname and search', () => {
    expect(parseNavHref('/@alice/transfers?type=HIVE')).toEqual({
      pathname: '/@alice/transfers',
      search: 'type=HIVE',
    });
  });
});

describe('isNavTargetReached', () => {
  it('matches pathname when pending has no search', () => {
    const pending = parseNavHref('/@alice/threads');
    const current = parseNavHref('/@alice/threads');
    expect(isNavTargetReached(pending, current)).toBe(true);
  });

  it('requires search match when pending specifies search', () => {
    const pending = parseNavHref('/@alice/transfers?type=WAIV');
    expect(
      isNavTargetReached(pending, parseNavHref('/@alice/transfers?type=WAIV')),
    ).toBe(true);
    expect(
      isNavTargetReached(pending, parseNavHref('/@alice/transfers?type=HIVE')),
    ).toBe(false);
  });

  it('returns false when pathname differs', () => {
    const pending = parseNavHref('/@alice/threads');
    const current = parseNavHref('/@alice/comments');
    expect(isNavTargetReached(pending, current)).toBe(false);
  });
});
