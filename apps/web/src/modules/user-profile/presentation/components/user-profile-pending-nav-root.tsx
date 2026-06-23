'use client';

import type { ReactNode } from 'react';

import { OptimisticNavProvider } from '@/shared/presentation';

import { isPendingNavReached } from './user-profile-pending-nav';

export function UserProfilePendingNavRoot({ children }: { children: ReactNode }) {
  return (
    <OptimisticNavProvider isTargetReached={isPendingNavReached}>
      {children}
    </OptimisticNavProvider>
  );
}
