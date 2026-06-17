import {
  profileShopFiltersResponseSchema,
  type ProfileShopFiltersResponse,
} from '../domain/profile-shop-filters-response.schema';

export type FetchProfileShopFiltersParams = {
  types: readonly string[];
  categoryPath: string[];
  uncategorizedOnly?: boolean;
  tags?: readonly string[];
  signal?: AbortSignal;
};

function buildSearchParams(params: FetchProfileShopFiltersParams): string {
  const sp = new URLSearchParams();
  for (const t of params.types) {
    sp.append('types', t);
  }
  for (const segment of params.categoryPath) {
    if (segment.trim().length > 0) {
      sp.append('categoryPath', segment);
    }
  }
  if (params.uncategorizedOnly === true) {
    sp.set('uncategorizedOnly', 'true');
  }
  for (const tag of params.tags ?? []) {
    const trimmed = tag.trim();
    if (trimmed) {
      sp.append('tags', trimmed);
    }
  }
  return sp.toString();
}

export async function fetchProfileShopFilters(
  accountName: string,
  params: FetchProfileShopFiltersParams,
): Promise<ProfileShopFiltersResponse | null> {
  const name = accountName.trim();
  if (name.length === 0) {
    return null;
  }

  const qs = buildSearchParams(params);
  const path = `/api/users/${encodeURIComponent(name)}/shop/filters${qs.length > 0 ? `?${qs}` : ''}`;

  try {
    const res = await fetch(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: params.signal,
    });
    if (!res.ok) {
      return null;
    }
    const parsed = profileShopFiltersResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}
