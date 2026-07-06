'use client';

import { ActivityListSkeleton } from '@/modules/user-activity';
import { useEffectiveProfileNav } from '@/modules/user-profile/presentation/components/user-profile-pending-nav-context';
import { getWalletTypeFromSearch } from '@/modules/user-profile/presentation/components/user-profile-subnav';

import { HiveWalletSummarySkeleton } from '../hive/hive-wallet-summary-skeleton';
import { EngineWalletSummarySkeleton } from '../engine/engine-wallet-summary-skeleton';
import { WaivWalletSummarySkeleton } from '../waiv/waiv-wallet-summary-skeleton';

export function TransfersWalletLoadingFallback() {
  return (
    <div aria-busy="true" aria-label="Loading wallet" className="space-y-4">
      <WaivWalletSummarySkeleton />
    </div>
  );
}

export function TransfersWalletLoadingSkeleton() {
  const { search } = useEffectiveProfileNav();
  const walletType = getWalletTypeFromSearch(search);

  if (walletType === 'HIVE') {
    return (
      <div aria-busy="true" aria-label="Loading wallet" className="space-y-4">
        <HiveWalletSummarySkeleton />
        <ActivityListSkeleton />
      </div>
    );
  }

  if (walletType === 'ENGINE') {
    return (
      <div aria-busy="true" aria-label="Loading wallet" className="space-y-4">
        <EngineWalletSummarySkeleton />
        <ActivityListSkeleton />
      </div>
    );
  }

  return <TransfersWalletLoadingFallback />;
}
