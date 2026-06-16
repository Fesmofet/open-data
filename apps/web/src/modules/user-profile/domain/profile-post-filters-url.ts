import { getSegmentsAfterAccount } from '../presentation/components/profile-path';

export type ProfilePostFiltersSearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParamAll(source: ProfilePostFiltersSearchParamsSource, key: string): string[] {
  if (source instanceof URLSearchParams) {
    return source.getAll(key);
  }
  const value = source[key];
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function parseProfilePostObjectIds(
  raw: string | string[] | undefined,
): string[] {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const id = item.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseProfilePostFilters(
  source: ProfilePostFiltersSearchParamsSource,
): { objectIds: string[] } {
  const objectsRaw = readSearchParamAll(source, 'objects');
  const objectIds = parseProfilePostObjectIds(
    objectsRaw.length > 0 ? objectsRaw : undefined,
  );
  return { objectIds };
}

export function buildProfilePostsHref(accountName: string, objectIds: readonly string[]): string {
  const base = `/@${encodeURIComponent(accountName)}`;
  const sp = new URLSearchParams();
  for (const id of objectIds) {
    const trimmed = id.trim();
    if (trimmed) {
      sp.append('objects', trimmed);
    }
  }
  const qs = sp.toString();
  return qs.length > 0 ? `${base}?${qs}` : base;
}

export function toggleProfilePostObjectFilter(
  currentObjectIds: readonly string[],
  objectId: string,
  checked: boolean,
): string[] {
  const id = objectId.trim();
  if (!id) {
    return [...currentObjectIds];
  }
  if (checked) {
    return currentObjectIds.includes(id) ? [...currentObjectIds] : [...currentObjectIds, id];
  }
  return currentObjectIds.filter((x) => x !== id);
}

/** Posts tab is `/@name` with no path segment after the account. */
export function isUserProfilePostsTab(pathname: string): boolean {
  return getSegmentsAfterAccount(pathname).length === 0;
}
