import {
  profilePostObjectFiltersResponseSchema,
  type ProfilePostObjectFiltersResponse,
} from '../domain/profile-post-filters-response.schema';

export type FetchProfilePostObjectFiltersParams = {
  objectIds?: readonly string[];
  signal?: AbortSignal;
};

export async function fetchProfilePostObjectFilters(
  accountName: string,
  params: FetchProfilePostObjectFiltersParams = {},
): Promise<ProfilePostObjectFiltersResponse | null> {
  const sp = new URLSearchParams();
  for (const id of params.objectIds ?? []) {
    const trimmed = id.trim();
    if (trimmed) {
      sp.append('objects', trimmed);
    }
  }

  const qs = sp.toString();
  const path = `/api/users/${encodeURIComponent(accountName)}/blog/object-filters${
    qs.length > 0 ? `?${qs}` : ''
  }`;

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
    const raw: unknown = await res.json();
    const parsed = profilePostObjectFiltersResponseSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
