import { getFavoritesTypesQuery, FavoritesTypeNav } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string; objectType: string }>;
};

export default async function UserFavoritesByTypeLeftSidebarPage({ params }: PageProps) {
  const { name, objectType } = await params;
  const accountName = decodeURIComponent(name);
  const decodedType = decodeURIComponent(objectType);
  const { types } = await getFavoritesTypesQuery(accountName);

  return (
    <FavoritesTypeNav
      accountName={accountName}
      types={types}
      activeType={decodedType}
    />
  );
}
