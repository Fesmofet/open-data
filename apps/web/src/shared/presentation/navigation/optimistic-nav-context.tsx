'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  isNavTargetReached,
  PENDING_NAV_TIMEOUT_MS,
  type NavTarget,
} from './nav-target';

export type { NavTarget } from './nav-target';
export { parseNavHref, isNavTargetReached, PENDING_NAV_TIMEOUT_MS } from './nav-target';

type IsTargetReachedFn = (pending: NavTarget, current: NavTarget) => boolean;

type PendingNavControlsContextValue = {
  setPendingTarget: (target: NavTarget) => void;
  clearPendingTarget: () => void;
};

const PendingNavTargetContext = createContext<NavTarget | null>(null);
export const PendingNavControlsContext = createContext<PendingNavControlsContextValue | null>(
  null,
);
const IsTargetReachedContext = createContext<IsTargetReachedFn>(isNavTargetReached);

type OptimisticNavProviderProps = {
  children: ReactNode;
  /** Override default pathname/search matching (e.g. profile segment normalization). */
  isTargetReached?: IsTargetReachedFn;
};

export function OptimisticNavProvider({
  children,
  isTargetReached = isNavTargetReached,
}: OptimisticNavProviderProps) {
  const [pendingTarget, setPendingTargetState] = useState<NavTarget | null>(null);

  const controls = useMemo(
    (): PendingNavControlsContextValue => ({
      setPendingTarget: (target) => {
        setPendingTargetState(target);
      },
      clearPendingTarget: () => {
        setPendingTargetState(null);
      },
    }),
    [],
  );

  return (
    <IsTargetReachedContext.Provider value={isTargetReached}>
      <PendingNavControlsContext.Provider value={controls}>
        <PendingNavTargetContext.Provider value={pendingTarget}>
          {children}
        </PendingNavTargetContext.Provider>
      </PendingNavControlsContext.Provider>
    </IsTargetReachedContext.Provider>
  );
}

export function usePendingNavControls(): PendingNavControlsContextValue {
  const ctx = useContext(PendingNavControlsContext);
  if (!ctx) {
    throw new Error('usePendingNavControls must be used within OptimisticNavProvider');
  }
  return ctx;
}

/** Pathname + search for nav active state; keeps pending target until the router URL catches up. */
export function useEffectiveNav(): NavTarget {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useContext(PendingNavTargetContext);
  const isTargetReached = useContext(IsTargetReachedContext);
  const currentTarget = useMemo(
    (): NavTarget => ({ pathname, search }),
    [pathname, search],
  );

  if (!pending || isTargetReached(pending, currentTarget)) {
    return currentTarget;
  }

  return pending;
}

/**
 * Syncs router URL with pending nav target. Must render inside a Suspense boundary
 * (uses `useSearchParams`).
 */
export function OptimisticNavSync() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useContext(PendingNavTargetContext);
  const isTargetReached = useContext(IsTargetReachedContext);
  const { clearPendingTarget } = usePendingNavControls();
  const currentTarget = useMemo(
    (): NavTarget => ({ pathname, search }),
    [pathname, search],
  );
  const prevRouterRef = useRef(currentTarget);

  useEffect(() => {
    if (!pending) {
      prevRouterRef.current = currentTarget;
      return;
    }

    if (isTargetReached(pending, currentTarget)) {
      clearPendingTarget();
      prevRouterRef.current = currentTarget;
      return;
    }

    const prev = prevRouterRef.current;
    const routerChanged =
      prev.pathname !== currentTarget.pathname || prev.search !== currentTarget.search;

    if (routerChanged) {
      clearPendingTarget();
    }

    prevRouterRef.current = currentTarget;
  }, [clearPendingTarget, currentTarget, isTargetReached, pending]);

  useEffect(() => {
    if (!pending) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      clearPendingTarget();
    }, PENDING_NAV_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [clearPendingTarget, pending]);

  return null;
}
