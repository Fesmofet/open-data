/**
 * @jest-environment jsdom
 */
import { act, render } from '@testing-library/react';

import {
  useInfiniteScroll,
  type UseInfiniteScrollOptions,
} from './use-infinite-scroll';

type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: IntersectionObserverCallback | null = null;
let disconnectMock: jest.Mock;

function InfiniteScrollTestHarness({
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const { sentinelRef } = useInfiniteScroll({ hasMore, isLoading, onLoadMore });
  return <div ref={sentinelRef} data-testid="sentinel" />;
}

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    observerCallback?.([
      { isIntersecting } as IntersectionObserverEntry,
    ]);
  });
}

beforeEach(() => {
  disconnectMock = jest.fn();
  observerCallback = null;

  global.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    observerCallback = callback;
    return {
      observe: jest.fn(),
      disconnect: disconnectMock,
      unobserve: jest.fn(),
      takeRecords: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    };
  }) as unknown as typeof IntersectionObserver;
});

describe('useInfiniteScroll', () => {
  it('calls onLoadMore when sentinel intersects and more pages exist', () => {
    const onLoadMore = jest.fn();

    render(
      <InfiniteScrollTestHarness
        hasMore
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    triggerIntersection(true);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not call onLoadMore while loading', () => {
    const onLoadMore = jest.fn();

    render(
      <InfiniteScrollTestHarness
        hasMore
        isLoading
        onLoadMore={onLoadMore}
      />,
    );

    triggerIntersection(true);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore when hasMore is false', () => {
    const onLoadMore = jest.fn();

    render(
      <InfiniteScrollTestHarness
        hasMore={false}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    triggerIntersection(true);

    expect(onLoadMore).not.toHaveBeenCalled();
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('disconnects observer when hasMore becomes false', () => {
    const onLoadMore = jest.fn();

    const { rerender } = render(
      <InfiniteScrollTestHarness
        hasMore
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    rerender(
      <InfiniteScrollTestHarness
        hasMore={false}
        isLoading={false}
        onLoadMore={onLoadMore}
      />,
    );

    expect(disconnectMock).toHaveBeenCalled();
  });
});
