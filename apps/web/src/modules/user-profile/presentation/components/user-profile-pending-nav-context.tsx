'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  isPendingNavReached,
  type ProfileNavTarget,
} from './user-profile-pending-nav';

export type { ProfileNavTarget } from './user-profile-pending-nav';
export {
  getAccountFromPathname,
  isPendingNavReached,
  normalizeProfileNavTarget,
  parseProfileNavHref,
  PENDING_NAV_TIMEOUT_MS,
} from './user-profile-pending-nav';

type PendingNavControlsContextValue = {
  setPendingTarget: (target: ProfileNavTarget) => void;
  clearPendingTarget: () => void;
};

export const PendingNavTargetContext = createContext<ProfileNavTarget | null>(null);

const PendingNavControlsContext = createContext<PendingNavControlsContextValue | null>(
  null,
);

/** State-only provider — router hooks live in {@link UserProfilePendingNavSync}. */
export function UserProfilePendingNavProvider({ children }: { children: ReactNode }) {
  const [pendingTarget, setPendingTargetState] = useState<ProfileNavTarget | null>(null);

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
    <PendingNavControlsContext.Provider value={controls}>
      <PendingNavTargetContext.Provider value={pendingTarget}>
        {children}
      </PendingNavTargetContext.Provider>
    </PendingNavControlsContext.Provider>
  );
}

export function usePendingNavControls(): PendingNavControlsContextValue {
  const ctx = useContext(PendingNavControlsContext);
  if (!ctx) {
    throw new Error(
      'usePendingNavControls must be used within UserProfilePendingNavProvider',
    );
  }
  return ctx;
}

/** @deprecated Use {@link usePendingNavControls} */
export function usePendingNavSetter(): Pick<
  PendingNavControlsContextValue,
  'setPendingTarget'
> {
  const { setPendingTarget } = usePendingNavControls();
  return { setPendingTarget };
}

/** Pathname + search for nav active state; keeps pending target until the router URL catches up. */
export function useEffectiveProfileNav(): ProfileNavTarget {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useContext(PendingNavTargetContext);
  const currentTarget = useMemo(
    (): ProfileNavTarget => ({ pathname, search }),
    [pathname, search],
  );

  if (!pending || isPendingNavReached(pending, currentTarget)) {
    return currentTarget;
  }

  return pending;
}
