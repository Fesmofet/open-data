import type { SearchFlatEntry } from './search-nav-list';
import { buildDiscoverHrefFromSearch } from './search-nav-list';

export type SearchEnterTarget =
  | { kind: 'object'; href: string }
  | { kind: 'profile'; href: string }
  | { kind: 'discover'; href: string }
  | null;

export type ResolveSearchEnterTargetInput = {
  highlightTouched: boolean;
  highlighted: SearchFlatEntry | null;
  selectedType: string | null;
  query: string;
  users: readonly string[];
  resultsLoading: boolean;
};

function findExactUsernameMatch(
  query: string,
  users: readonly string[],
): string | null {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return null;
  }
  const match = users.find((name) => name.toLowerCase() === needle);
  return match ?? null;
}

/** Resolve header search Enter navigation target. */
export function resolveSearchEnterTarget(
  input: ResolveSearchEnterTargetInput,
): SearchEnterTarget {
  const query = input.query.trim();
  if (!query || input.resultsLoading) {
    return null;
  }

  if (input.highlightTouched && input.highlighted) {
    if (input.highlighted.kind === 'object') {
      return {
        kind: 'object',
        href: `/object/${encodeURIComponent(input.highlighted.item.object_id)}`,
      };
    }
    return {
      kind: 'profile',
      href: `/@${encodeURIComponent(input.highlighted.item.name)}`,
    };
  }

  if (input.selectedType) {
    return {
      kind: 'discover',
      href: buildDiscoverHrefFromSearch(input.selectedType, query),
    };
  }

  const exactUser = findExactUsernameMatch(query, input.users);
  if (exactUser) {
    return {
      kind: 'profile',
      href: `/@${encodeURIComponent(exactUser)}`,
    };
  }

  return {
    kind: 'discover',
    href: buildDiscoverHrefFromSearch('all', query),
  };
}
