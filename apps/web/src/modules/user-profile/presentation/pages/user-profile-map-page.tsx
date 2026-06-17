import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { getFavoritesTypesQuery } from '../../application/queries/get-favorites.query';
import { hasMapEligibleFavoriteTypes } from '../../domain/types/favorites-map';
import { ProfileMapEmpty } from '../components/profile-map-empty';
import { ProfileMapView } from '../components/profile-map-view';

type UserProfileMapPageProps = {
  params: Promise<{ name: string }>;
};

export async function UserProfileMapPage({ params }: UserProfileMapPageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name).trim();
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();

  const typesResponse = await getFavoritesTypesQuery(accountName);
  if (!hasMapEligibleFavoriteTypes(typesResponse.types)) {
    return <ProfileMapEmpty />;
  }

  return (
    <ProfileMapView
      accountName={accountName}
      viewerUsername={user?.username ?? null}
    />
  );
}
