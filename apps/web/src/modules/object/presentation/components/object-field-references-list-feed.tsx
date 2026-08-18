'use client';

import { useCallback, useMemo, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';
import { ObjectCard } from '@/modules/feed/presentation/components/object-card';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

export type ObjectFieldReferencesListFeedProps = {
  objectId: string;
  referenceObjectType: string;
  initialItems: ProjectedObjectView[];
  initialCursor: string | null;
  initialHasMore: boolean;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  loadMoreAction: (
    objectId: string,
    referenceObjectType: string,
    cursor: string | null,
  ) => Promise<{ items: ProjectedObjectView[]; hasMore: boolean; cursor: string | null }>;
};

export function ObjectFieldReferencesListFeed({
  objectId,
  referenceObjectType,
  initialItems,
  initialCursor,
  initialHasMore,
  viewerUsername,
  onRequireLogin,
  loadMoreAction,
}: ObjectFieldReferencesListFeedProps) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const initialPage = useMemo(
    () => ({
      items: initialItems,
      hasMore: initialHasMore,
      cursor: initialCursor,
    }),
    [initialItems, initialHasMore, initialCursor],
  );
  const { items, hasMore, cursor, setItems, setHasMore, setCursor } =
    useSyncedPaginatedList(initialPage);

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending) {
      return;
    }
    startTransition(async () => {
      const page = await loadMoreAction(objectId, referenceObjectType, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setCursor(page.cursor);
    });
  }, [
    cursor,
    hasMore,
    loadMoreAction,
    objectId,
    pending,
    referenceObjectType,
    setCursor,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
        {t('object_ref_list_empty')}
      </p>
    );
  }

  return (
    <section>
      <ul className="divide-y divide-border rounded-card border border-border bg-surface">
        {items.map((o) => (
          <ObjectCard
            key={o.object_id}
            layout="catalog"
            object={o}
            viewerUsername={viewerUsername}
            onRequireLogin={onRequireLogin}
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
            {t('object_right_show_more')}
          </button>
          {pending ? (
            <p className="text-body-sm text-muted" aria-live="polite">
              {t('drafts_loading')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
