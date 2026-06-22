'use client';

import { useCallback } from 'react';

import type {
  ActivityLoadError,
  ActivityPageView,
} from '@/modules/user-activity/domain/types/activity-row-view';

import {
  HiveWalletHistoryFeed,
  loadHiveWalletHistoryPage,
} from './hive-wallet-history-feed';

type HiveWalletHistoryFeedClientProps = {
  accountName: string;
  initialPage: ActivityPageView;
  initialError?: ActivityLoadError | null;
};

export function HiveWalletHistoryFeedClient({
  accountName,
  initialPage,
  initialError = null,
}: HiveWalletHistoryFeedClientProps) {
  const loadMoreAction = useCallback(
    (name: string, cursor: string) => loadHiveWalletHistoryPage(name, cursor),
    [],
  );

  return (
    <HiveWalletHistoryFeed
      accountName={accountName}
      page={initialPage}
      loadError={initialError}
      loadMoreAction={loadMoreAction}
    />
  );
}
