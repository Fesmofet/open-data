import {
  buildProfileShopHref,
  parseProfileShopFilters,
  setProfileShopRatingFilter,
  toggleProfileShopTagFilter,
} from './profile-shop-filters-url';

describe('profile-shop-filters-url', () => {
  it('parseProfileShopFilters reads tags and rating', () => {
    const sp = new URLSearchParams();
    sp.append('tags', 'Pros:coffee');
    sp.set('rating', '8');
    expect(parseProfileShopFilters(sp)).toEqual({
      tags: ['Pros:coffee'],
      rating: 8,
    });
  });

  it('buildProfileShopHref preserves pathname', () => {
    expect(
      buildProfileShopHref('/@alice/user-shop', { tags: ['Pros:coffee'], rating: 10 }),
    ).toBe('/@alice/user-shop?tags=Pros%3Acoffee&rating=10');
  });

  it('toggleProfileShopTagFilter adds and removes tags', () => {
    expect(toggleProfileShopTagFilter([], 'Pros:coffee', true)).toEqual(['Pros:coffee']);
    expect(toggleProfileShopTagFilter(['Pros:coffee'], 'Pros:coffee', false)).toEqual([]);
  });

  it('setProfileShopRatingFilter is single-select', () => {
    expect(setProfileShopRatingFilter(null, 10, true)).toBe(10);
    expect(setProfileShopRatingFilter(10, 8, true)).toBe(8);
    expect(setProfileShopRatingFilter(10, 10, false)).toBeNull();
  });
});
