'use client';

import {
  useEffectiveNav,
  usePendingNavControls,
  type NavTarget,
} from '@/shared/presentation';

export type { NavTarget as ProfileNavTarget } from '@/shared/presentation';
export {
  getAccountFromPathname,
  isPendingNavReached,
  normalizeProfileNavTarget,
  parseProfileNavHref,
  PENDING_NAV_TIMEOUT_MS,
} from './user-profile-pending-nav';

/** @deprecated Use {@link usePendingNavControls} from `@/shared/presentation` */
export function usePendingNavSetter(): Pick<
  ReturnType<typeof usePendingNavControls>,
  'setPendingTarget'
> {
  const { setPendingTarget } = usePendingNavControls();
  return { setPendingTarget };
}

/** Pathname + search for nav active state; keeps pending target until the router URL catches up. */
export function useEffectiveProfileNav(): NavTarget {
  return useEffectiveNav();
}

// Re-export shared provider controls for existing imports
export { usePendingNavControls } from '@/shared/presentation';
