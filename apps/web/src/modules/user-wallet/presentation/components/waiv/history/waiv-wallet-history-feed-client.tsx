'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ACTIVITY_DISPLAY_PAGE_SIZE } from '@opden-data-layer/core/hive-account-history';

import { fetchWaivWalletHistoryPageClient } from '@/modules/user-wallet/infrastructure/clients/waiv-wallet-history.browser.client';
import type {
  WaivWalletHistoryLoadError,
  WaivWalletHistoryPageQueryResult,
  WaivWalletHistoryPageView,
} from '@/modules/user-wallet/domain/types/waiv-wallet-history-view';
import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  WaivWalletHistoryFeed,
  loadWaivWalletHistoryPage,
} from './waiv-wallet-history-feed';

const EMPTY_PAGE: WaivWalletHistoryPageView = {
  items: [],
  cursor: null,
  hasMore: false,
};

type WaivWalletHistoryFeedClientProps = {
  accountName: string;
};

export function WaivWalletHistoryFeedClient({
  accountName,
}: WaivWalletHistoryFeedClientProps) {
  const { t } = useI18n();
  const abortRef = useRef<AbortController | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [page, setPage] = useState<WaivWalletHistoryPageView>(EMPTY_PAGE);
  const [loadError, setLoadError] = useState<WaivWalletHistoryLoadError | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingInitial(true);
    setLoadError(null);
    setPage(EMPTY_PAGE);

    void (async () => {
      const result = await fetchWaivWalletHistoryPageClient(
        accountName,
        {
          limit: ACTIVITY_DISPLAY_PAGE_SIZE,
          showRewards,
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
  }, [accountName, showRewards]);

  const loadMoreAction = useCallback(
    (name: string, cursor: string, rewards: boolean): Promise<WaivWalletHistoryPageQueryResult> =>
      loadWaivWalletHistoryPage(name, cursor, rewards),
    [],
  );

  return (
    <section className="mt-4">
      <label
        className="mb-3 flex w-full items-center justify-end gap-2 text-body-sm text-fg"
        aria-busy={loadingInitial}
      >
        <input
          type="checkbox"
          className="size-4 shrink-0 rounded-btn border border-border accent-accent"
          checked={showRewards}
          disabled={loadingInitial}
          onChange={(event) => setShowRewards(event.target.checked)}
        />
        {t('show_author_curator')}
      </label>
      <WaivWalletHistoryFeed
        accountName={accountName}
        page={page}
        loading={loadingInitial}
        loadError={loadError}
        showRewards={showRewards}
        loadMoreAction={loadMoreAction}
      />
    </section>
  );
}
