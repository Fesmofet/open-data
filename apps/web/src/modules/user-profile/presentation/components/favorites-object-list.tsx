'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ObjectCard } from '@/modules/feed/presentation';
import { FeedColumn } from '@/shared/presentation/layout';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import { useLoginModal } from '@/modules/auth';

import { loadMoreFavoritesObjectsAction } from '@/app/(app)/user-profile/[name]/favorites-feed.actions';

import type { FavoritesObjectsPage } from '../../domain/types/favorites';

export type FavoritesObjectListProps = {
  accountName: string;
  objectType: string;
  initialPage: FavoritesObjectsPage;
  viewerUsername?: string | null;
};

export function FavoritesObjectList({
  accountName,
  objectType,
  initialPage,
  viewerUsername,
}: FavoritesObjectListProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const { items, setItems, hasMore, setHasMore } = useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreFavoritesObjectsAction(accountName, objectType, items.length);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
    });
  }, [accountName, hasMore, items.length, objectType, pending, setHasMore, setItems]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="favorites-objects-empty"
      >
        <h2 id="favorites-objects-empty" className="text-body-lg font-weight-strong font-display text-fg">
          {t('favorites')}
        </h2>
        <p className="mt-2 text-body-sm text-muted">{t('favorites_empty')}</p>
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
        <div className="mt-4 flex flex-col items-center gap-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            disabled={pending}
            onClick={onLoadMore}
          >
            {t('drafts_load_more')}
          </button>
        </div>
      ) : null}
    </FeedColumn>
  );
}
