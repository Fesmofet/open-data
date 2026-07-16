'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useInfiniteScroll } from '@/shared/presentation';

import type { OblCursorPage } from '../../domain/obl-pagination.types';
import type { RelationshipTab } from '../../domain/relationship-tab-url';
import {
  fetchOblLedgerTabPage,
  loadMoreOblLedgerTabAction,
} from '../../infrastructure/actions/load-more-obl.server';

type TabListState = {
  items: unknown[];
  hasMore: boolean;
  cursor: string | null;
};

function emptyTabState(): TabListState {
  return { items: [], hasMore: false, cursor: null };
}

function fromPage(page: OblCursorPage<unknown> | undefined): TabListState {
  if (!page) {
    return emptyTabState();
  }
  return {
    items: page.items,
    hasMore: page.hasMore,
    cursor: page.nextCursor,
  };
}

export function useOblLedgerTabLists(input: {
  accountA: string;
  accountB: string;
  activeTab: RelationshipTab;
  initialPages: Partial<Record<RelationshipTab, OblCursorPage<unknown>>>;
}) {
  const [pending, startTransition] = useTransition();
  const loadedTabsRef = useRef(
    new Set<RelationshipTab>(
      (Object.entries(input.initialPages) as Array<[RelationshipTab, OblCursorPage<unknown> | undefined]>)
        .filter(([, page]) => (page?.items.length ?? 0) > 0)
        .map(([tabId]) => tabId),
    ),
  );
  const [lists, setLists] = useState<Record<RelationshipTab, TabListState>>(() => ({
    payments: fromPage(input.initialPages.payments),
    contracts: fromPage(input.initialPages.contracts),
    invoices: fromPage(input.initialPages.invoices),
    disputes: fromPage(input.initialPages.disputes),
  }));

  useEffect(() => {
    setLists({
      payments: fromPage(input.initialPages.payments),
      contracts: fromPage(input.initialPages.contracts),
      invoices: fromPage(input.initialPages.invoices),
      disputes: fromPage(input.initialPages.disputes),
    });
  }, [input.initialPages]);

  useEffect(() => {
    if (loadedTabsRef.current.has(input.activeTab)) {
      return;
    }
    startTransition(async () => {
      const page = await fetchOblLedgerTabPage(
        input.accountA,
        input.accountB,
        input.activeTab,
      );
      loadedTabsRef.current.add(input.activeTab);
      setLists((prev) => ({
        ...prev,
        [input.activeTab]: fromPage(page),
      }));
    });
  }, [input.accountA, input.accountB, input.activeTab]);

  const loadMore = useCallback(
    (tab: RelationshipTab) => {
      const current = lists[tab];
      if (!current.hasMore || !current.cursor || pending) {
        return;
      }
      startTransition(async () => {
        const page = await loadMoreOblLedgerTabAction({
          accountA: input.accountA,
          accountB: input.accountB,
          tab,
          cursor: current.cursor!,
        });
        setLists((prev) => ({
          ...prev,
          [tab]: {
            items: [...prev[tab].items, ...page.items],
            hasMore: page.hasMore,
            cursor: page.nextCursor,
          },
        }));
      });
    },
    [input.accountA, input.accountB, lists, pending],
  );

  const { sentinelRef } = useInfiniteScroll({
    hasMore: lists[input.activeTab].hasMore,
    isLoading: pending,
    onLoadMore: () => loadMore(input.activeTab),
  });

  return { lists, pending, sentinelRef };
}
