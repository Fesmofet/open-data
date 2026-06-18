'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActivityFilterKey } from '@opden-data-layer/core/hive-account-history';

import { ActivityFeed } from '@/modules/user-activity';
import { serializeActivityFilterKeys } from '@/modules/user-activity/domain/activity-filters-url';
import { fetchUserActivityPageClient } from '@/modules/user-activity/infrastructure/clients/activity.browser.client';
import type { ActivityLoadError, ActivityPageView } from '@/modules/user-activity';

import { useActivityFiltersFromUrl } from '@/modules/user-activity/presentation/hooks/use-activity-filters-from-url';

const EMPTY_PAGE: ActivityPageView = {
  items: [],
  cursor: null,
  hasMore: false,
  chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
};

type ActivityFeedClientProps = {
  accountName: string;
  initialPage: ActivityPageView;
  initialError?: ActivityLoadError | null;
  initialFilters?: ActivityFilterKey[];
};

export function ActivityFeedClient({
  accountName,
  initialPage,
  initialError = null,
  initialFilters = [],
}: ActivityFeedClientProps) {
  const activityFilters = useActivityFiltersFromUrl();
  const filtersKey = serializeActivityFilterKeys(activityFilters);
  const loadedFiltersKeyRef = useRef(
    serializeActivityFilterKeys(initialFilters),
  );
  const abortRef = useRef<AbortController | null>(null);

  const [page, setPage] = useState(initialPage);
  const [loadError, setLoadError] = useState<ActivityLoadError | null>(
    initialError,
  );
  const [loadingFilters, setLoadingFilters] = useState(false);

  useEffect(() => {
    if (filtersKey === loadedFiltersKeyRef.current) {
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingFilters(true);
    setLoadError(null);
    setPage(EMPTY_PAGE);

    void (async () => {
      const result = await fetchUserActivityPageClient(
        accountName,
        { filters: activityFilters },
        ac.signal,
      );
      if (ac.signal.aborted) {
        return;
      }
      loadedFiltersKeyRef.current = filtersKey;
      if (!result) {
        setLoadError('unavailable');
        setPage(EMPTY_PAGE);
      } else {
        setLoadError(result.error);
        setPage(result.page);
      }
      setLoadingFilters(false);
    })();

    return () => {
      ac.abort();
    };
  }, [accountName, activityFilters, filtersKey]);

  const loadMoreAction = useCallback(
    async (name: string, cursor: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const result = await fetchUserActivityPageClient(
        name,
        { cursor, filters: activityFilters },
        ac.signal,
      );
      if (ac.signal.aborted || !result) {
        return { page: EMPTY_PAGE, error: 'unavailable' as const };
      }
      return result;
    },
    [activityFilters],
  );

  return (
    <ActivityFeed
      accountName={accountName}
      page={page}
      loading={loadingFilters}
      loadError={loadError}
      loadMoreAction={loadMoreAction}
    />
  );
}
