'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserWalletAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { ENGINE_WALLET_SETTLEMENT_REFRESH_MS } from '../../constants/wallet-broadcast';

export type WalletBroadcastRefreshOptions = {
  /** Schedule a follow-up refresh for Hive Engine settlement lag. */
  scheduleEngineSettlementRefresh?: boolean;
  bumpWalletEpoch?: () => void;
};

export async function refreshWalletAfterBroadcast(
  router: AppRouterInstance,
  account: string,
  options?: WalletBroadcastRefreshOptions,
): Promise<void> {
  options?.bumpWalletEpoch?.();
  await refreshAfterBroadcast(router, () =>
    revalidateUserWalletAfterBroadcast(account),
  );
  if (options?.scheduleEngineSettlementRefresh) {
    window.setTimeout(
      () => router.refresh(),
      ENGINE_WALLET_SETTLEMENT_REFRESH_MS,
    );
  }
}
