'use client';

import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInfiniteScroll } from '@/shared/presentation';
import { FeedColumn } from '@/shared/presentation/layout';

import type {
  ActivityLoadError,
  ActivityPageQueryResult,
  ActivityPageView,
  ActivityRowView,
} from '../../domain/types/activity-row-view';
import { ActivityListSkeleton } from './activity-list-skeleton';
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
  page: ActivityPageView;
  loading?: boolean;
  loadError?: ActivityLoadError | null;
  loadMoreAction: (
    accountName: string,
    cursor: string,
  ) => Promise<ActivityPageQueryResult>;
};

export function ActivityFeed({
  accountName,
  page,
  loading = false,
  loadError = null,
  loadMoreAction,
}: ActivityFeedProps) {
  const { t } = useI18n();
  const [items, setItems] = useState(page.items);
  const [cursor, setCursor] = useState(page.cursor);
  const [hasMore, setHasMore] = useState(page.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  useEffect(() => {
    setItems(page.items);
    setCursor(page.cursor);
    setHasMore(page.hasMore);
    setLoadMoreError(false);
  }, [page]);

  const handleLoadMore = useCallback(() => {
    if (!cursor || loadingMore || loading) {
      return;
    }
    setLoadingMore(true);
    setLoadMoreError(false);
    void loadMoreAction(accountName, cursor)
      .then((next) => {
        if (next.error) {
          setHasMore(false);
          setLoadMoreError(true);
          return;
        }
        let stopPaging = false;
        setItems((prev) => {
          stopPaging = prev.length > 0 && next.page.items.length === 0;
          return mergeUniqueActivityRows(prev, next.page.items);
        });
        setHasMore(stopPaging ? false : next.page.hasMore);
        setCursor(next.page.cursor);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [accountName, cursor, loadMoreAction, loading, loadingMore]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasMore && !loading && !loadMoreError,
    isLoading: loadingMore,
    onLoadMore: handleLoadMore,
  });

  useEffect(() => {
    if (loading || loadError) {
      return;
    }
    if (items.length === 0 && hasMore && cursor && !loadingMore) {
      handleLoadMore();
    }
  }, [items.length, hasMore, cursor, loadingMore, loading, loadError, handleLoadMore]);

  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite" aria-label={t('activity_loading')}>
        <ActivityListSkeleton />
      </div>
    );
  }

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
          <p className="mt-2 text-body-sm text-muted">
            {hasMore || loadingMore ? t('activity_loading') : t('activity_empty')}
          </p>
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
      {loadMoreError ? (
        <p className="py-2 text-center text-body-sm text-muted" role="alert">
          {t('activity_error')}
        </p>
      ) : null}
    </FeedColumn>
  );
}
