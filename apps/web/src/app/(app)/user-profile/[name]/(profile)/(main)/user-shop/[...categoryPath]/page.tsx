import { decodeCategoryPathSegment, ProfileShopMainContent } from '@/modules/user-profile';
import { parseProfileShopFilters } from '@/modules/user-profile/domain/profile-shop-filters-url';

type PageProps = {
  params: Promise<{ name: string; categoryPath: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserProfileUserShopCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { name, categoryPath } = await params;
  const resolvedSearchParams = await searchParams;
  const accountName = decodeURIComponent(name);
  const lineageSegments = categoryPath.map(decodeCategoryPathSegment);
  const basePath = `/@${accountName}/user-shop`;
  const shopFilters = parseProfileShopFilters(resolvedSearchParams);

  return (
    <ProfileShopMainContent
      accountName={accountName}
      types={['book', 'product']}
      basePath={basePath}
      lineageSegments={lineageSegments}
      shopFilters={shopFilters}
      sectionKey="user-shop"
    />
  );
}
