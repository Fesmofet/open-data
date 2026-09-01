import { buildDiscoverHrefFromSearch } from './search-nav-list';
import { resolveSearchEnterTarget } from './resolve-search-enter-target';

describe('buildDiscoverHrefFromSearch', () => {
  it('points the all chip at mixed-results discover', () => {
    expect(buildDiscoverHrefFromSearch('all', 'sushi')).toBe('/discover?q=sushi&type=all');
  });

  it('points the users chip at users mode without type', () => {
    expect(buildDiscoverHrefFromSearch('users', 'alice')).toBe('/discover?q=alice&users=1');
  });

  it('points object type chip at typed discover', () => {
    expect(buildDiscoverHrefFromSearch('restaurant', 'pizza')).toBe(
      '/discover?q=pizza&type=restaurant',
    );
  });
});

describe('resolveSearchEnterTarget', () => {
  it('opens highlighted user when keyboard selection was used', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: true,
        highlighted: { kind: 'user', item: { name: 'alice' } as never },
        selectedType: null,
        query: 'alice',
        users: ['alice'],
        resultsLoading: false,
      }),
    ).toEqual({ kind: 'profile', href: '/@alice' });
  });

  it('searches inside selected object type', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: 'restaurant',
        query: 'sushi',
        users: [],
        resultsLoading: false,
      }),
    ).toEqual({
      kind: 'discover',
      href: '/discover?q=sushi&type=restaurant',
    });
  });

  it('searches inside mixed-results type=all selection', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: 'all',
        query: 'sushi',
        users: [],
        resultsLoading: false,
      }),
    ).toEqual({
      kind: 'discover',
      href: '/discover?q=sushi&type=all',
    });
  });

  it('opens profile on exact username match', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: 'alice',
        users: ['alice', 'alicia'],
        resultsLoading: false,
      }),
    ).toEqual({ kind: 'profile', href: '/@alice' });
  });

  it('falls back to mixed discover results', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: 'sushi',
        users: ['alice'],
        resultsLoading: false,
      }),
    ).toEqual({
      kind: 'discover',
      href: '/discover?q=sushi&type=all',
    });
  });

  it('ignores Enter while results are loading', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: 'sushi',
        users: [],
        resultsLoading: true,
      }),
    ).toBeNull();
  });

  it('ignores Enter for empty query', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: '   ',
        users: [],
        resultsLoading: false,
      }),
    ).toBeNull();
  });

  it('requires full username match, not prefix', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: 'ali',
        users: ['alice'],
        resultsLoading: false,
      }),
    ).toEqual({
      kind: 'discover',
      href: '/discover?q=ali&type=all',
    });
  });

  it('matches usernames case-insensitively', () => {
    expect(
      resolveSearchEnterTarget({
        highlightTouched: false,
        highlighted: null,
        selectedType: null,
        query: 'Alice',
        users: ['alice'],
        resultsLoading: false,
      }),
    ).toEqual({ kind: 'profile', href: '/@alice' });
  });
});
