'use client';

import { useCallback, useEffect, useState } from 'react';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type {
  ActivityLoadError,
  ActivityPageQueryResult,
  ActivityPageView,
  ActivityRowView,
} from '@/modules/user-activity/domain/types/activity-row-view';
import { fetchUserActivityPageClient } from '@/modules/user-activity/infrastructure/clients/activity.browser.client';
import { ActivityListSkeleton } from '@/modules/user-activity/presentation/components/activity-list-skeleton';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import { WalletHistoryRow } from './wallet-history-row';

function mergeUniqueRows(
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

type HiveWalletHistoryFeedProps = {
  accountName: string;
  page: ActivityPageView;
  loading?: boolean;
  loadError?: ActivityLoadError | null;
  loadMoreAction: (
    accountName: string,
    cursor: string,
  ) => Promise<ActivityPageQueryResult>;
};

export function HiveWalletHistoryFeed({
  accountName,
  page,
  loading = false,
  loadError = null,
  loadMoreAction,
}: HiveWalletHistoryFeedProps) {
  const { t } = useI18n();
  const {
    items,
    setItems,
    hasMore,
    setHasMore,
    cursor,
    setCursor,
  } = useSyncedPaginatedList({
    items: page.items,
    hasMore: page.hasMore,
    cursor: page.cursor,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

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
          return mergeUniqueRows(prev, next.page.items);
        });
        setHasMore(stopPaging ? false : next.page.hasMore);
        setCursor(next.page.cursor);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [accountName, cursor, loadMoreAction, loading, loadingMore, setCursor, setHasMore, setItems]);

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
      <div aria-busy="true" aria-live="polite" aria-label={t('wallet_transactions')}>
        <ActivityListSkeleton />
      </div>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <section
        className="mt-4 rounded-card border border-border bg-surface/80 p-card-padding"
        role="alert"
      >
        <p className="text-body-sm text-muted">{t('unavailable')}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mt-4 rounded-card border border-border bg-surface/80 p-card-padding">
        <p className="text-body-sm text-muted">
          {hasMore || loadingMore ? t('activity_loading') : t('wallet_history_empty')}
        </p>
      </section>
    );
  }

  return (
    <div className="mt-4">
      <ul className="flex flex-col gap-3" aria-label={t('wallet_transactions')}>
        {items.map((row) => (
          <li key={row.id}>
            <WalletHistoryRow row={row} accountName={accountName} />
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
    </div>
  );
}

export async function loadHiveWalletHistoryPage(
  accountName: string,
  cursor: string,
): Promise<ActivityPageQueryResult> {
  const result = await fetchUserActivityPageClient(accountName, {
    cursor,
    filters: ['wallet'],
    limit: ACTIVITY_DISPLAY_PAGE_SIZE,
  });
  if (!result) {
    return {
      page: {
        items: [],
        cursor: null,
        hasMore: false,
        chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
      },
      error: 'unavailable',
    };
  }
  return result;
}
