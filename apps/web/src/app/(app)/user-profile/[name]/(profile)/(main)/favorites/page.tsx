import { ProfileFavoritesMainContent } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string }>;
};

export default async function UserProfileFavoritesPage({ params }: PageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);

  return <ProfileFavoritesMainContent accountName={accountName} />;
}
