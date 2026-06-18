import {
  buildProfileActivityHref,
  isUserProfileActivityTab,
  parseActivityFilterKeys,
  parseActivityFilters,
  serializeActivityFilterKeys,
  toggleActivityFilter,
} from './activity-filters-url';

describe('activity-filters-url', () => {
  it('parses comma-separated activity filter keys', () => {
    expect(parseActivityFilterKeys('upvoted,transfer,invalid')).toEqual([
      'upvoted',
      'transfer',
    ]);
  });

  it('parses from search params', () => {
    expect(
      parseActivityFilters({ activity: 'received,transfer' }),
    ).toEqual(['received', 'transfer']);
  });

  it('builds activity href with filters', () => {
    expect(
      buildProfileActivityHref('alice', ['transfer', 'upvoted']),
    ).toBe('/@alice/activity?activity=transfer%2Cupvoted');
  });

  it('serializes filters in sorted order', () => {
    expect(serializeActivityFilterKeys(['transfer', 'upvoted'])).toBe(
      'transfer,upvoted',
    );
  });

  it('toggles filters', () => {
    expect(toggleActivityFilter(['upvoted'], 'transfer', true)).toEqual([
      'upvoted',
      'transfer',
    ]);
    expect(toggleActivityFilter(['upvoted', 'transfer'], 'upvoted', false)).toEqual([
      'transfer',
    ]);
  });

  it('detects activity tab pathname', () => {
    expect(isUserProfileActivityTab('/@alice/activity')).toBe(true);
    expect(isUserProfileActivityTab('/@alice/threads')).toBe(false);
  });
});
