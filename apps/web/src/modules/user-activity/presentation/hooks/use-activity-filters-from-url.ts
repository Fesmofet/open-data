'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ActivityFilterKey } from '@opden-data-layer/core/hive-account-history';

import {
  ACTIVITY_FILTERS_URL_CHANGE_EVENT,
  parseActivityFilters,
} from '../../domain/activity-filters-url';

function readFiltersFromWindow(): ActivityFilterKey[] {
  if (typeof window === 'undefined') {
    return [];
  }
  return parseActivityFilters(new URLSearchParams(window.location.search));
}

/** Activity filter keys from URL; updates on `replaceState` without RSC navigation. */
export function useActivityFiltersFromUrl(): ActivityFilterKey[] {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ActivityFilterKey[]>(() =>
    parseActivityFilters(searchParams),
  );

  useEffect(() => {
    setFilters(parseActivityFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const sync = () => {
      setFilters(readFiltersFromWindow());
    };
    window.addEventListener('popstate', sync);
    window.addEventListener(ACTIVITY_FILTERS_URL_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(ACTIVITY_FILTERS_URL_CHANGE_EVENT, sync);
    };
  }, []);

  return filters;
}
