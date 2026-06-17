'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ShopSectionsPage } from '../../domain/types/shop-objects';
import type { ProfileShopFiltersState } from '../../domain/profile-shop-filters-url';
import {
  buildProfileShopHref,
  parseProfileShopFilters,
  profileShopFiltersActive,
} from '../../domain/profile-shop-filters-url';
import { ObjectCard } from '@/modules/feed/presentation';
import { FeedColumn } from '@/shared/presentation/layout';

import { useLoginModal } from '@/modules/auth';

import { loadMoreShopSectionsAction } from '@/app/(app)/user-profile/[name]/shop-feed.actions';
import { ProfileShopFilteredEmpty } from './profile-shop-filtered-empty';

export type ShopSectionsProps = {
  accountName: string;
  initialSections: ShopSectionsPage;
  types: readonly string[];
  basePath: string;
  /** Lineage to current nav node (URL segments). */
  lineageSegments: string[];
  /** Category API drill-down: parent department (undefined at root). */
  navName?: string;
  /** Ancestors before `navName`. */
  navPath: string[];
  shopFilters?: ProfileShopFiltersState;
  viewerUsername?: string | null;
  sectionKey?: 'user-shop' | 'recipe';
};

const EMPTY_SHOP_FILTERS: ProfileShopFiltersState = { tags: [], rating: null };

function sectionPath(basePath: string, lineageSegments: string[], categoryName: string): string {
  const segments = [...lineageSegments, categoryName].map((s) => encodeURIComponent(s));
  return `${basePath}/${segments.join('/')}`;
}

export function ShopSections({
  accountName,
  initialSections,
  types,
  basePath,
  lineageSegments,
  navName,
  navPath,
  shopFilters = EMPTY_SHOP_FILTERS,
  viewerUsername,
  sectionKey = 'user-shop',
}: ShopSectionsProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(() => parseProfileShopFilters(searchParams), [searchParams]);
  const [sections, setSections] = useState(initialSections.sections);
  const [cursor, setCursor] = useState(initialSections.cursor);
  const [hasMore, setHasMore] = useState(initialSections.hasMore);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSections(initialSections.sections);
    setCursor(initialSections.cursor);
    setHasMore(initialSections.hasMore);
  }, [initialSections.cursor, initialSections.hasMore, initialSections.sections]);

  const emptyTitle =
    sectionKey === 'recipe' ? t('user_profile_recipe') : t('profile_shop_title');

  if (sections.length === 0) {
    if (profileShopFiltersActive(shopFilters)) {
      return <ProfileShopFilteredEmpty />;
    }
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="shop-sections-empty"
      >
        <h2 id="shop-sections-empty" className="text-body-lg font-weight-strong font-display text-fg">
          {emptyTitle}
        </h2>
        <p className="mt-2 text-body-sm text-muted">{t('profile_shop_sections_empty')}</p>
      </section>
    );
  }

  return (
    <FeedColumn>
      <div className="flex flex-col gap-8">
        {sections.map((sec) => (
          <section
            key={sec.categoryName}
            aria-labelledby={`shop-section-${sec.categoryName}`}
            className="rounded-card border border-border bg-surface/60 p-card-padding"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`shop-section-${sec.categoryName}`} className="text-heading font-label text-body-lg">
                <Link
                  href={buildProfileShopHref(
                    sectionPath(basePath, lineageSegments, sec.categoryName),
                    urlFilters,
                  )}
                  suppressHydrationWarning
                  className="text-fg underline-offset-2 hover:underline"
                >
                  {sec.categoryName}
                </Link>
              </h2>
              <p className="text-caption text-fg-secondary tabular-nums">
                {t('profile_shop_object_count').replace('{count}', String(sec.totalObjects))}
              </p>
            </div>
            {sec.items.length === 0 ? (
              <p className="mt-3 text-body-sm text-muted">{t('profile_shop_no_preview')}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-card-padding">
                {sec.items.map((o) => (
                  <ObjectCard
                    key={`${sec.categoryName}-${o.object_id}`}
                    object={o}
                    viewerUsername={viewerUsername}
                    onRequireLogin={openLogin}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-btn border border-border bg-surface-control px-4 py-2 text-body-sm font-weight-label text-fg hover:bg-surface-control-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
            disabled={pending || !cursor}
            onClick={() => {
              if (!cursor) {
                return;
              }
              startTransition(async () => {
                const next = await loadMoreShopSectionsAction(
                  accountName,
                  [...types],
                  navName,
                  [...navPath],
                  cursor,
                  shopFilters.tags,
                  shopFilters.rating,
                );
                setSections((prev) => [...prev, ...next.sections]);
                setCursor(next.cursor);
                setHasMore(next.hasMore);
              });
            }}
          >
            {pending ? t('profile_shop_loading') : t('profile_shop_load_more_sections')}
          </button>
        </div>
      ) : null}
    </FeedColumn>
  );
}
