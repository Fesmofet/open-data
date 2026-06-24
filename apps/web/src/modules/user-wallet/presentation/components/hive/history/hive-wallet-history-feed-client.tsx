'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { fetchUserActivityPageClient } from '@/modules/user-activity/infrastructure/clients/activity.browser.client';
import type {
  ActivityLoadError,
  ActivityPageQueryResult,
  ActivityPageView,
} from '@/modules/user-activity/domain/types/activity-row-view';

import {
  HiveWalletHistoryFeed,
  loadHiveWalletHistoryPage,
} from './hive-wallet-history-feed';

const EMPTY_PAGE: ActivityPageView = {
  items: [],
  cursor: null,
  hasMore: false,
  chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
};

type HiveWalletHistoryFeedClientProps = {
  accountName: string;
};

/**
 * Wallet transaction history loads after the HIVE balance summary (client fetch via BFF).
 */
export function HiveWalletHistoryFeedClient({
  accountName,
}: HiveWalletHistoryFeedClientProps) {
  const abortRef = useRef<AbortController | null>(null);
  const [page, setPage] = useState<ActivityPageView>(EMPTY_PAGE);
  const [loadError, setLoadError] = useState<ActivityLoadError | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingInitial(true);
    setLoadError(null);
    setPage(EMPTY_PAGE);

    void (async () => {
      const result = await fetchUserActivityPageClient(
        accountName,
        {
          filters: ['wallet'],
          limit: ACTIVITY_DISPLAY_PAGE_SIZE,
        },
        ac.signal,
      );
      if (ac.signal.aborted) {
        return;
      }
      if (!result) {
        setLoadError('unavailable');
        setPage(EMPTY_PAGE);
      } else {
        setLoadError(result.error);
        setPage(result.page);
      }
      setLoadingInitial(false);
    })();

    return () => {
      ac.abort();
    };
  }, [accountName]);

  const loadMoreAction = useCallback(
    (name: string, cursor: string): Promise<ActivityPageQueryResult> =>
      loadHiveWalletHistoryPage(name, cursor),
    [],
  );

  return (
    <HiveWalletHistoryFeed
      accountName={accountName}
      page={page}
      loading={loadingInitial}
      loadError={loadError}
      loadMoreAction={loadMoreAction}
    />
  );
}
