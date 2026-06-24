'use client';

import type { ReactNode } from 'react';

import { useInstantNavigation } from '@/shared/presentation';

import { TransfersWalletLoadingSkeleton } from './transfers-wallet-loading-skeleton';

export function TransfersWalletPageClient({ children }: { children: ReactNode }) {
  const { isNavigating } = useInstantNavigation();

  if (isNavigating) {
    return <TransfersWalletLoadingSkeleton />;
  }

  return children;
}
