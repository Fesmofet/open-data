import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { getCategoryNav } from '../../infrastructure/clients/categories.client';
import { getShopObjectsQuery } from '../../application/queries/get-shop-objects.query';
import { getShopSectionsQuery } from '../../application/queries/get-shop-sections.query';
import type { ProfileShopFiltersState } from '../../domain/profile-shop-filters-url';
import { profileShopFiltersActive } from '../../domain/profile-shop-filters-url';
import { apiNavContextFromLineage, UNCATEGORIZED_SHOP_PATH_SEGMENT } from './category-nav-path';
import { ProfileShopFilterChips } from './profile-shop-filter-chips';
import { ProfileShopFilteredEmpty } from './profile-shop-filtered-empty';
import { ShopObjectList } from './shop-object-list';
import { ShopSections } from './shop-sections';

export type ProfileShopMainContentProps = {
  accountName: string;
  types: readonly string[];
  basePath: string;
  lineageSegments: string[];
  shopFilters?: ProfileShopFiltersState;
};

const EMPTY_SHOP_FILTERS: ProfileShopFiltersState = { tags: [], rating: null };

/**
 * Resolves category nav for the current URL; leaf routes render an infinite object list,
 * intermediate routes render section groups (child categories × preview objects).
 * Active tag/rating filters always use a flat object list so facet counts match visible rows.
 */
export async function ProfileShopMainContent({
  accountName,
  types,
  basePath,
  lineageSegments,
  shopFilters = EMPTY_SHOP_FILTERS,
}: ProfileShopMainContentProps) {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewerUsername = user?.username ?? null;
  const filterQuery = {
    tags: shopFilters.tags,
    rating: shopFilters.rating,
  };

  const chips = <ProfileShopFilterChips filters={shopFilters} />;
  const listKey = `${shopFilters.tags.join('|')}-${shopFilters.rating ?? ''}`;

  const uncategorizedOnly =
    lineageSegments.length === 1 && lineageSegments[0] === UNCATEGORIZED_SHOP_PATH_SEGMENT;

  if (uncategorizedOnly || profileShopFiltersActive(shopFilters)) {
    const page = await getShopObjectsQuery(
      accountName,
      {
        types,
        categoryPath: uncategorizedOnly ? [] : lineageSegments,
        uncategorizedOnly,
        limit: 20,
        ...filterQuery,
      },
      viewerUsername,
    );

    return (
      <>
        {chips}
        {page.items.length === 0 && profileShopFiltersActive(shopFilters) ? (
          <ProfileShopFilteredEmpty />
        ) : (
          <ShopObjectList
            key={listKey}
            accountName={accountName}
            initialPage={page}
            types={types}
            categoryPath={uncategorizedOnly ? [] : lineageSegments}
            uncategorizedOnly={uncategorizedOnly}
            shopFilters={shopFilters}
            viewerUsername={viewerUsername}
          />
        )}
      </>
    );
  }

  const { parentName, path } = apiNavContextFromLineage(lineageSegments);
  const nav = await getCategoryNav(accountName, types, {
    name: parentName,
    path,
  });
  const isLeaf = nav === null || nav.items.length === 0;

  if (isLeaf) {
    const page = await getShopObjectsQuery(
      accountName,
      {
        types,
        categoryPath: lineageSegments,
        limit: 20,
        ...filterQuery,
      },
      viewerUsername,
    );

    return (
      <>
        {chips}
        <ShopObjectList
          key={listKey}
          accountName={accountName}
          initialPage={page}
          types={types}
          categoryPath={lineageSegments}
          shopFilters={shopFilters}
          viewerUsername={viewerUsername}
        />
      </>
    );
  }

  const sections = await getShopSectionsQuery(
    accountName,
    {
      types,
      name: parentName,
      path,
      sectionLimit: 3,
      ...filterQuery,
    },
    viewerUsername,
  );

  return (
    <>
      {chips}
      <ShopSections
        accountName={accountName}
        initialSections={sections}
        types={types}
        basePath={basePath}
        lineageSegments={lineageSegments}
        navName={parentName}
        navPath={path}
        shopFilters={shopFilters}
        viewerUsername={viewerUsername}
      />
    </>
  );
}
