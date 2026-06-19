'use client';

import type { ReactNode } from 'react';

import { UserProfilePendingNavProvider } from './user-profile-pending-nav-context';

export function UserProfilePendingNavRoot({ children }: { children: ReactNode }) {
  return <UserProfilePendingNavProvider>{children}</UserProfilePendingNavProvider>;
}
