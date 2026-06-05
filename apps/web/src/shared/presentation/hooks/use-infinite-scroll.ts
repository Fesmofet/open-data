'use client';

import { useEffect, useRef, type RefObject } from 'react';

const DEFAULT_ROOT_MARGIN = '200px';

export type UseInfiniteScrollOptions = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: UseInfiniteScrollOptions): { sentinelRef: RefObject<HTMLDivElement | null> } {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || isLoading) {
          return;
        }
        onLoadMoreRef.current();
      },
      { rootMargin },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, rootMargin]);

  return { sentinelRef };
}
