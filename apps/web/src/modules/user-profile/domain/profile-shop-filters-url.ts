import { parseDiscoverTagsParam } from '@/modules/discover/domain/discover-url';

import { getSegmentsAfterAccount } from '../presentation/components/profile-path';

export type ProfileShopFiltersSearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

export type ProfileShopFiltersState = {
  tags: string[];
  rating: number | null;
};

const VALID_SHOP_RATINGS = new Set([6, 8, 10]);

function readSearchParam(source: ProfileShopFiltersSearchParamsSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const value = source[key];
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function readSearchParamAll(source: ProfileShopFiltersSearchParamsSource, key: string): string[] {
  if (source instanceof URLSearchParams) {
    return source.getAll(key);
  }
  const value = source[key];
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function parseProfileShopFilters(
  source: ProfileShopFiltersSearchParamsSource,
): ProfileShopFiltersState {
  const tagsRaw = readSearchParamAll(source, 'tags');
  const tags = parseDiscoverTagsParam(tagsRaw.length > 0 ? tagsRaw : undefined);
  const ratingRaw = readSearchParam(source, 'rating');
  const ratingNum = ratingRaw != null ? Number(ratingRaw) : NaN;
  const rating =
    Number.isFinite(ratingNum) && VALID_SHOP_RATINGS.has(ratingNum) ? ratingNum : null;
  return { tags, rating };
}

export function buildProfileShopHref(
  pathname: string,
  filters: ProfileShopFiltersState,
): string {
  const sp = new URLSearchParams();
  for (const tag of filters.tags) {
    const trimmed = tag.trim();
    if (trimmed) {
      sp.append('tags', trimmed);
    }
  }
  if (filters.rating != null) {
    sp.set('rating', String(filters.rating));
  }
  const qs = sp.toString();
  return qs.length > 0 ? `${pathname}?${qs}` : pathname;
}

export function toggleProfileShopTagFilter(
  currentTags: readonly string[],
  encodedTag: string,
  checked: boolean,
): string[] {
  const tag = encodedTag.trim();
  if (!tag) {
    return [...currentTags];
  }
  if (checked) {
    return currentTags.includes(tag) ? [...currentTags] : [...currentTags, tag];
  }
  return currentTags.filter((t) => t !== tag);
}

export function setProfileShopRatingFilter(
  currentRating: number | null,
  rating: number,
  checked: boolean,
): number | null {
  if (!checked) {
    return currentRating === rating ? null : currentRating;
  }
  return rating;
}

export function isUserProfileShopTab(pathname: string): boolean {
  return getSegmentsAfterAccount(pathname)[0] === 'user-shop';
}

export function isUserProfileRecipeTab(pathname: string): boolean {
  return getSegmentsAfterAccount(pathname)[0] === 'recipe';
}

export function isUserProfileShopOrRecipeTab(pathname: string): boolean {
  return isUserProfileShopTab(pathname) || isUserProfileRecipeTab(pathname);
}

export function profileShopFiltersActive(filters: ProfileShopFiltersState): boolean {
  return filters.tags.length > 0 || filters.rating != null;
}
