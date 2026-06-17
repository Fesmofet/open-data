import { ProfileShopMainContent } from '@/modules/user-profile';
import { parseProfileShopFilters } from '@/modules/user-profile/domain/profile-shop-filters-url';

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserProfileUserShopPage({ params, searchParams }: PageProps) {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const accountName = decodeURIComponent(name);
  const basePath = `/@${accountName}/user-shop`;
  const shopFilters = parseProfileShopFilters(resolvedSearchParams);

  return (
    <ProfileShopMainContent
      accountName={accountName}
      types={['book', 'product']}
      basePath={basePath}
      lineageSegments={[]}
      shopFilters={shopFilters}
      sectionKey="user-shop"
    />
  );
}
