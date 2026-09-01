import type { SearchObjectResult, SearchResponse, SearchUserResult } from './search-response.schema';

/** Discover filter key for header search chips (all object hits, a specific `object_type`, or users-only). */
export type SearchDiscoverChip = 'all' | 'users' | string;

export const HEADER_SEARCH_ALL_CHIP = 'all' as const satisfies SearchDiscoverChip;

export function buildDiscoverHrefFromSearch(
  chip: SearchDiscoverChip,
  query: string,
): string {
  const q = query.trim();
  const sp = new URLSearchParams();
  if (q) {
    sp.set('q', q);
  }
  if (chip === 'users') {
    sp.set('users', '1');
  } else if (chip === HEADER_SEARCH_ALL_CHIP) {
    sp.set('type', 'all');
  } else {
    sp.set('type', chip);
  }
  const qs = sp.toString();
  return qs.length > 0 ? `/discover?${qs}` : '/discover';
}

export type SearchFlatEntry =
  | { kind: 'object'; item: SearchObjectResult }
  | { kind: 'user'; item: SearchUserResult };

/** Linear order for keyboard nav: all objects then users. */
export function buildSearchFlatList(results: SearchResponse): SearchFlatEntry[] {
  const objects = results.objects.map((item) => ({ kind: 'object' as const, item }));
  const users = results.users.map((item) => ({ kind: 'user' as const, item }));
  return [...objects, ...users];
}

export function formatObjectTypeLabel(objectType: string): string {
  if (!objectType) {
    return objectType;
  }
  const normalized = objectType.replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
