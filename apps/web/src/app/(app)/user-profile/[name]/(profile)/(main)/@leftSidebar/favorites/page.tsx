import { getFavoritesTypesQuery, FavoritesTypeNav } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string }>;
};

export default async function UserFavoritesLeftSidebarPage({ params }: PageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);
  const { types } = await getFavoritesTypesQuery(accountName);

  return <FavoritesTypeNav accountName={accountName} types={types} />;
}
