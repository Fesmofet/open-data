'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { useInstantNavigation } from '@/shared/presentation';

import { ProfileMainPendingSkeleton } from './profile-main-pending-skeleton';

/**
 * Instant nav overlay for profile center column — keeps submenu/hero responsive
 * while RSC loads the next route (parity with object page center shell).
 */
export function UserProfileMainContentPendingShell({
  children,
}: {
  children: ReactNode;
}) {
  const { isNavigating } = useInstantNavigation();

  return (
    <div className="relative min-h-[12rem] min-w-0">
      <div
        className={isNavigating ? 'pointer-events-none select-none' : undefined}
        aria-hidden={isNavigating ? true : undefined}
      >
        {children}
      </div>
      {isNavigating ? (
        <div
          className="absolute inset-0 z-30 bg-bg px-card-padding pt-2"
          aria-busy="true"
          aria-live="polite"
        >
          <Suspense fallback={null}>
            <ProfileMainPendingSkeleton />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
