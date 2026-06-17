import 'server-only';

import { cache } from 'react';

import {
  FAVORITES_PAGE_SIZE,
  favoritesTypesResponseSchema,
  type FavoritesObjectsPage,
  type FavoritesTypesResponse,
} from '../../domain/types/favorites';
import {
  fetchFavoritesObjects,
  fetchFavoritesTypes,
} from '../../infrastructure/clients/favorites.client';

async function getFavoritesTypesQueryUncached(
  accountName: string,
): Promise<FavoritesTypesResponse> {
  const raw = await fetchFavoritesTypes(accountName);
  if (raw == null) {
    return { types: [] };
  }
  const parsed = favoritesTypesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[getFavoritesTypesQuery] unexpected response shape:', parsed.error.flatten());
    return { types: [] };
  }
  return parsed.data;
}

export const getFavoritesTypesQuery = cache(getFavoritesTypesQueryUncached);

export async function getFavoritesObjectsPageQuery(
  accountName: string,
  objectType: string | undefined,
  viewer?: string | null,
  skip = 0,
): Promise<FavoritesObjectsPage> {
  const page = await fetchFavoritesObjects(
    accountName,
    {
      objectType,
      skip,
      limit: FAVORITES_PAGE_SIZE,
    },
    { viewer },
  );
  return page ?? { items: [], total: 0, hasMore: false };
}
