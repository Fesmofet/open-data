import { ProfileFavoritesMainContent } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string; objectType: string }>;
};

export default async function UserProfileFavoritesByTypePage({ params }: PageProps) {
  const { name, objectType } = await params;
  const accountName = decodeURIComponent(name);

  return (
    <ProfileFavoritesMainContent
      accountName={accountName}
      routeObjectType={decodeURIComponent(objectType)}
    />
  );
}
