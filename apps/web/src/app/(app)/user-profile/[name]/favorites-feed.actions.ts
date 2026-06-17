'use server';

import { getFavoritesObjectsPageQuery } from '@/modules/user-profile/application/queries/get-favorites.query';
import type { FavoritesObjectsPage } from '@/modules/user-profile/domain/types/favorites';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function loadMoreFavoritesObjectsAction(
  accountName: string,
  objectType: string,
  skip: number,
): Promise<FavoritesObjectsPage> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  return getFavoritesObjectsPageQuery(accountName, objectType, user?.username ?? null, skip);
}
