import { notFound } from 'next/navigation';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import {
  getFavoritesObjectsPageQuery,
  getFavoritesTypesQuery,
} from '../../application/queries/get-favorites.query';
import { FavoritesObjectList } from './favorites-object-list';
import { FavoritesEmptyMain } from './favorites-empty-main';

export type ProfileFavoritesMainContentProps = {
  accountName: string;
  /** From URL segment; omit on bare `/@name/favorites`. */
  routeObjectType?: string;
};

export async function ProfileFavoritesMainContent({
  accountName,
  routeObjectType,
}: ProfileFavoritesMainContentProps) {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewerUsername = user?.username ?? null;

  const { types } = await getFavoritesTypesQuery(accountName);

  if (types.length === 0) {
    return <FavoritesEmptyMain />;
  }

  const trimmedRoute = routeObjectType?.trim();
  if (trimmedRoute && trimmedRoute.length > 0 && !types.includes(trimmedRoute)) {
    notFound();
  }

  const effectiveType = trimmedRoute && trimmedRoute.length > 0 ? trimmedRoute : types[0];

  const initialPage = await getFavoritesObjectsPageQuery(
    accountName,
    effectiveType,
    viewerUsername,
  );

  return (
    <FavoritesObjectList
      key={effectiveType}
      accountName={accountName}
      objectType={effectiveType}
      initialPage={initialPage}
      viewerUsername={viewerUsername}
    />
  );
}
