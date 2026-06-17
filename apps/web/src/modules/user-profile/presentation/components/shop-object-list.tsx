'use client';

import { useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ShopObjectsPage } from '../../domain/types/shop-objects';
import type { ProfileShopFiltersState } from '../../domain/profile-shop-filters-url';
import { ObjectCard } from '@/modules/feed/presentation';
import { FeedColumn } from '@/shared/presentation/layout';
import { useSyncedPaginatedList } from '@/shared/presentation';

import { useLoginModal } from '@/modules/auth';

import { loadMoreShopObjectsAction } from '@/app/(app)/user-profile/[name]/shop-feed.actions';

export type ShopObjectListProps = {
  accountName: string;
  initialPage: ShopObjectsPage;
  types: readonly string[];
  categoryPath: string[];
  uncategorizedOnly?: boolean;
  shopFilters?: ProfileShopFiltersState;
  viewerUsername?: string | null;
  /** `'user-shop'` or `'recipe'` — empty state title. */
  sectionKey?: 'user-shop' | 'recipe';
};

const EMPTY_SHOP_FILTERS: ProfileShopFiltersState = { tags: [], rating: null };

export function ShopObjectList({
  accountName,
  initialPage,
  types,
  categoryPath,
  uncategorizedOnly = false,
  shopFilters = EMPTY_SHOP_FILTERS,
  viewerUsername,
  sectionKey = 'user-shop',
}: ShopObjectListProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();

  const emptyTitle =
    sectionKey === 'recipe' ? t('user_profile_recipe') : t('profile_shop_title');

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="shop-objects-empty"
      >
        <h2 id="shop-objects-empty" className="text-body-lg font-weight-strong font-display text-fg">
          {emptyTitle}
        </h2>
        <p className="mt-2 text-body-sm text-muted">{t('profile_shop_empty_category')}</p>
      </section>
    );
  }

  return (
    <FeedColumn>
      <ul className="flex flex-col gap-card-padding">
        {items.map((o) => (
          <ObjectCard
            key={o.object_id}
            object={o}
            viewerUsername={viewerUsername}
            onRequireLogin={openLogin}
          />
        ))}
      </ul>
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
                const next = await loadMoreShopObjectsAction(
                  accountName,
                  [...types],
                  [...categoryPath],
                  cursor,
                  uncategorizedOnly ? true : undefined,
                  shopFilters.tags,
                  shopFilters.rating,
                );
                setItems((prev) => [...prev, ...next.items]);
                setCursor(next.cursor);
                setHasMore(next.hasMore);
              });
            }}
          >
            {pending ? t('profile_shop_loading') : t('profile_shop_load_more')}
          </button>
        </div>
      ) : null}
    </FeedColumn>
  );
}
