import { ProfileShopMainContent } from '@/modules/user-profile';
import { parseProfileShopFilters } from '@/modules/user-profile/domain/profile-shop-filters-url';

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserProfileRecipePage({ params, searchParams }: PageProps) {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const accountName = decodeURIComponent(name);
  const basePath = `/@${accountName}/recipe`;
  const shopFilters = parseProfileShopFilters(resolvedSearchParams);

  return (
    <ProfileShopMainContent
      accountName={accountName}
      types={['recipe']}
      basePath={basePath}
      lineageSegments={[]}
      shopFilters={shopFilters}
    />
  );
}
