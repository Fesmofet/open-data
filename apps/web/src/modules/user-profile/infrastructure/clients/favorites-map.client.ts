import 'server-only';

import {
  favoritesMapPageSchema,
  type FavoritesMapPage,
  type MapBoundingBox,
} from '../../domain/types/favorites-map';
import { queryApiFetch } from './query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

function viewerHeaders(viewer?: string | null): Record<string, string> | undefined {
  const v = viewer?.trim();
  if (!v) {
    return undefined;
  }
  return { 'X-Viewer': v };
}

export type FetchFavoritesMapParams = {
  box: MapBoundingBox;
  skip?: number;
  limit?: number;
};

export async function fetchFavoritesMap(
  username: string,
  params: FetchFavoritesMapParams,
  init?: { viewer?: string | null },
): Promise<FavoritesMapPage | null> {
  const name = username.trim();
  if (name.length === 0) {
    return null;
  }
  const path = `/query/v1/users/${encodeURIComponent(name)}/favorites/map`;
  const headers = {
    'Content-Type': 'application/json',
    ...viewerHeaders(init?.viewer ?? null),
  };
  const raw = await queryApiFetch<unknown>(path, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      box: params.box,
      skip: params.skip ?? 0,
      limit: params.limit,
    }),
    cacheTags: [queryApiCacheTags.userFavoritesMap(name)],
  });
  if (raw == null) {
    return null;
  }
  const parsed = favoritesMapPageSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[fetchFavoritesMap] unexpected response', parsed.error.flatten());
    return null;
  }
  return parsed.data;
}
