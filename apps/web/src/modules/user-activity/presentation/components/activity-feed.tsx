'use client';

import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';
import { FeedColumn } from '@/shared/presentation/layout';

import type {
  ActivityLoadError,
  ActivityPageQueryResult,
  ActivityPageView,
  ActivityRowView,
} from '../../domain/types/activity-row-view';
import { ActivityRow } from './activity-row';

function mergeUniqueActivityRows(
  prev: ActivityRowView[],
  more: ActivityRowView[],
): ActivityRowView[] {
  const seen = new Set(prev.map((row) => row.id));
  const out = [...prev];
  for (const row of more) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

type ActivityFeedProps = {
  accountName: string;
  initialPage: ActivityPageView;
  initialError?: ActivityLoadError | null;
  loadMoreAction: (
    accountName: string,
    cursor: string,
  ) => Promise<ActivityPageQueryResult>;
};

export function ActivityFeed({
  accountName,
  initialPage,
  initialError = null,
  loadMoreAction,
}: ActivityFeedProps) {
  const { t } = useI18n();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<ActivityLoadError | null>(
    initialError,
  );

  const handleLoadMore = useCallback(() => {
    if (!cursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    void loadMoreAction(accountName, cursor)
      .then((next) => {
        if (next.error) {
          setLoadError(next.error);
          setHasMore(false);
          return;
        }
        setLoadError(null);
        setItems((prev) => mergeUniqueActivityRows(prev, next.page.items));
        setCursor(next.page.cursor);
        setHasMore(next.page.hasMore);
      })
      .catch(() => {
        setLoadError('unavailable');
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [
    accountName,
    cursor,
    loadMoreAction,
    loadingMore,
    setCursor,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  if (loadError && items.length === 0) {
    return (
      <FeedColumn>
        <section
          className="rounded-card border border-border bg-surface/80 p-card-padding"
          aria-labelledby="activity-error-title"
          role="alert"
        >
          <h2
            id="activity-error-title"
            className="text-body-lg font-weight-strong font-display text-fg"
          >
            {t('activity')}
          </h2>
          <p className="mt-2 text-body-sm text-muted">{t('activity_error')}</p>
        </section>
      </FeedColumn>
    );
  }

  if (items.length === 0) {
    return (
      <FeedColumn>
        <section
          className="rounded-card border border-border bg-surface/80 p-card-padding"
          aria-labelledby="activity-empty-title"
        >
          <h2
            id="activity-empty-title"
            className="text-body-lg font-weight-strong font-display text-fg"
          >
            {t('activity')}
          </h2>
          <p className="mt-2 text-body-sm text-muted">{t('activity_empty')}</p>
        </section>
      </FeedColumn>
    );
  }

  return (
    <FeedColumn>
      <ul className="flex flex-col gap-3" aria-label={t('activity')}>
        {items.map((row) => (
          <li key={row.id}>
            <ActivityRow row={row} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            onClick={handleLoadMore}
            disabled={loadingMore || !cursor}
          >
            {t('activity_load_more')}
          </button>
          {loadingMore ? (
            <p className="text-body-sm text-muted" aria-live="polite">
              {t('activity_loading')}
            </p>
          ) : null}
        </div>
      ) : null}
      {loadError && items.length > 0 ? (
        <p className="py-2 text-center text-body-sm text-muted" role="alert">
          {t('activity_error')}
        </p>
      ) : null}
    </FeedColumn>
  );
}
