'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { CategoryNavData } from '../../domain/types/category-nav';
import {
  buildProfileShopHref,
  parseProfileShopFilters,
} from '../../domain/profile-shop-filters-url';
import { UNCATEGORIZED_SHOP_PATH_SEGMENT } from './category-nav-path';
import { CategoryNavList } from './category-nav-list';

export type CategoryNavChromeProps = {
  data: CategoryNavData;
  basePath: string;
  sectionKey: 'user-shop' | 'recipe';
  lineageSegments: string[];
};

export function CategoryNavChrome({
  data,
  basePath,
  sectionKey,
  lineageSegments,
}: CategoryNavChromeProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseProfileShopFilters(searchParams), [searchParams]);

  const upPath =
    lineageSegments.length <= 1
      ? basePath
      : `${basePath}/${lineageSegments
          .slice(0, -1)
          .map((s) => encodeURIComponent(s))
          .join('/')}`;

  return (
    <>
      {lineageSegments.length > 0 ? (
        <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-caption">
          <Link
            href={buildProfileShopHref(upPath, filters)}
            suppressHydrationWarning
            className="text-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {t('profile_categories_up')}
          </Link>
          <Link
            href={buildProfileShopHref(basePath, filters)}
            suppressHydrationWarning
            className="text-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {t('profile_categories_all')}
          </Link>
        </p>
      ) : null}
      {!data || data.items.length === 0 ? (
        <p className="mt-2 text-body-sm text-muted">{t('profile_categories_empty')}</p>
      ) : (
        <CategoryNavList
          items={data.items}
          basePath={basePath}
          sectionKey={sectionKey}
          filters={filters}
        />
      )}
      {data && data.uncategorized_count > 0 ? (
        <Link
          href={buildProfileShopHref(
            `${basePath}/${encodeURIComponent(UNCATEGORIZED_SHOP_PATH_SEGMENT)}`,
            filters,
          )}
          suppressHydrationWarning
          className={[
            'mt-3 block border-t border-border pt-2 text-caption underline-offset-2 hover:text-fg hover:underline',
            lineageSegments.length === 1 && lineageSegments[0] === UNCATEGORIZED_SHOP_PATH_SEGMENT
              ? 'font-weight-label text-fg'
              : 'text-muted',
          ].join(' ')}
          aria-current={
            lineageSegments.length === 1 && lineageSegments[0] === UNCATEGORIZED_SHOP_PATH_SEGMENT
              ? 'page'
              : undefined
          }
        >
          {t('profile_categories_uncategorized')}
        </Link>
      ) : null}
    </>
  );
}
