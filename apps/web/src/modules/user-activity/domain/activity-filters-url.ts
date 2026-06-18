import {
  ACTIVITY_FILTER_KEYS,
  type ActivityFilterKey,
} from '@opden-data-layer/core/hive-account-history';
import { getSegmentsAfterAccount } from '@/modules/user-profile/presentation/components/profile-path';

export const ACTIVITY_FILTERS_SEARCH_PARAM = 'activity';

/** Dispatched after {@link replaceProfileActivityFiltersInUrl} updates the URL. */
export const ACTIVITY_FILTERS_URL_CHANGE_EVENT = 'odl:activity-filters-url-change';

export type ActivityFiltersSearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(source: ActivityFiltersSearchParamsSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const value = source[key];
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? value.join(',') : value;
}

const FILTER_KEY_SET = new Set<string>(ACTIVITY_FILTER_KEYS);

export function isActivityFilterKey(value: string): value is ActivityFilterKey {
  return FILTER_KEY_SET.has(value);
}

export function parseActivityFilterKeys(raw: string | null | undefined): ActivityFilterKey[] {
  if (!raw?.trim()) {
    return [];
  }
  const seen = new Set<ActivityFilterKey>();
  const out: ActivityFilterKey[] = [];
  for (const part of raw.split(',')) {
    const key = part.trim();
    if (!isActivityFilterKey(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function parseActivityFilters(
  source: ActivityFiltersSearchParamsSource,
): ActivityFilterKey[] {
  return parseActivityFilterKeys(readSearchParam(source, ACTIVITY_FILTERS_SEARCH_PARAM));
}

export function serializeActivityFilterKeys(filters: readonly ActivityFilterKey[]): string {
  return [...filters].sort().join(',');
}

export function buildProfileActivityHref(
  accountName: string,
  filters: readonly ActivityFilterKey[],
): string {
  const base = `/@${encodeURIComponent(accountName)}/activity`;
  if (filters.length === 0) {
    return base;
  }
  const sp = new URLSearchParams();
  sp.set(ACTIVITY_FILTERS_SEARCH_PARAM, serializeActivityFilterKeys(filters));
  return `${base}?${sp.toString()}`;
}

/** Update activity filter query string without triggering an App Router navigation. */
export function replaceProfileActivityFiltersInUrl(
  accountName: string,
  filters: readonly ActivityFilterKey[],
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const href = buildProfileActivityHref(accountName, filters);
  window.history.replaceState(window.history.state, '', href);
  window.dispatchEvent(new Event(ACTIVITY_FILTERS_URL_CHANGE_EVENT));
}

export function toggleActivityFilter(
  current: readonly ActivityFilterKey[],
  filter: ActivityFilterKey,
  checked: boolean,
): ActivityFilterKey[] {
  if (checked) {
    return current.includes(filter) ? [...current] : [...current, filter];
  }
  return current.filter((key) => key !== filter);
}

/** Activity tab is `/@name/activity`. */
export function isUserProfileActivityTab(pathname: string): boolean {
  return getSegmentsAfterAccount(pathname)[0] === 'activity';
}
