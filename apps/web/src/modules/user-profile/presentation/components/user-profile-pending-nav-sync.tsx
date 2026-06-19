'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useMemo, useRef } from 'react';

import {
  isPendingNavReached,
  PENDING_NAV_TIMEOUT_MS,
  type ProfileNavTarget,
} from './user-profile-pending-nav';
import {
  PendingNavTargetContext,
  usePendingNavControls,
} from './user-profile-pending-nav-context';

/**
 * Syncs router URL with pending nav target. Must render inside a Suspense boundary
 * (uses `useSearchParams`).
 */
export function UserProfilePendingNavSync() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useContext(PendingNavTargetContext);
  const { clearPendingTarget } = usePendingNavControls();
  const currentTarget = useMemo(
    (): ProfileNavTarget => ({ pathname, search }),
    [pathname, search],
  );
  const prevRouterRef = useRef(currentTarget);

  useEffect(() => {
    if (!pending) {
      prevRouterRef.current = currentTarget;
      return;
    }

    if (isPendingNavReached(pending, currentTarget)) {
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
  }, [clearPendingTarget, currentTarget, pending]);

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
