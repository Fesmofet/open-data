'use client';

import { OptimisticNavSync } from '@/shared/presentation';

/**
 * Syncs router URL with pending nav target. Must render inside a Suspense boundary
 * (uses `useSearchParams`).
 */
export function UserProfilePendingNavSync() {
  return <OptimisticNavSync />;
}
