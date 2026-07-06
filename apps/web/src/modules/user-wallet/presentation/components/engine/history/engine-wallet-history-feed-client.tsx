'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { fetchEngineWalletHistoryPageClient } from '@/modules/user-wallet/infrastructure/clients/engine-wallet-history.browser.client';
import type {
  EngineWalletHistoryLoadError,
  EngineWalletHistoryPageQueryResult,
  EngineWalletHistoryPageView,
} from '@/modules/user-wallet/domain/types/engine-wallet-view';

import {
  EngineWalletHistoryFeed,
  loadEngineWalletHistoryPage,
} from './engine-wallet-history-feed';

const EMPTY_PAGE: EngineWalletHistoryPageView = {
  items: [],
  cursor: null,
  hasMore: false,
};

type EngineWalletHistoryFeedClientProps = {
  accountName: string;
};

export function EngineWalletHistoryFeedClient({
  accountName,
}: EngineWalletHistoryFeedClientProps) {
  const abortRef = useRef<AbortController | null>(null);
  const [page, setPage] = useState<EngineWalletHistoryPageView>(EMPTY_PAGE);
  const [loadError, setLoadError] = useState<EngineWalletHistoryLoadError | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingInitial(true);
    setLoadError(null);
    setPage(EMPTY_PAGE);

    void (async () => {
      const result = await fetchEngineWalletHistoryPageClient(
        accountName,
        {
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
    (name: string, cursor: string): Promise<EngineWalletHistoryPageQueryResult> =>
      loadEngineWalletHistoryPage(name, cursor),
    [],
  );

  return (
    <EngineWalletHistoryFeed
      accountName={accountName}
      page={page}
      loading={loadingInitial}
      loadError={loadError}
      loadMoreAction={loadMoreAction}
    />
  );
}
