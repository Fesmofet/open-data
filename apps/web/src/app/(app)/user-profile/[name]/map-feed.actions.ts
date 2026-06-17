'use server';

import { fetchFavoritesMap } from '@/modules/user-profile/infrastructure/clients/favorites-map.client';
import type {
  FavoritesMapFetchResult,
  MapBoundingBox,
} from '@/modules/user-profile/domain/types/favorites-map';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function fetchFavoritesMapAction(
  accountName: string,
  box: MapBoundingBox,
  skip: number,
  limit: number,
): Promise<FavoritesMapFetchResult> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const page = await fetchFavoritesMap(
    accountName,
    { box, skip, limit },
    { viewer: user?.username ?? null },
  );
  if (page == null) {
    return { ok: false };
  }
  return { ok: true, page };
}

export async function loadMoreFavoritesMapAction(
  accountName: string,
  box: MapBoundingBox,
  skip: number,
  limit: number,
): Promise<FavoritesMapFetchResult> {
  return fetchFavoritesMapAction(accountName, box, skip, limit);
}
