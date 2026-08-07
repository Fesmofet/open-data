'use client';

import type { ReactNode } from 'react';

import { useHydrateWalletProvider } from '@/modules/auth';

import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { WalletModalsGate } from './unified-wallet-modal-host';
import { WalletBalancesSync } from './wallet-balances-context';

export type TransfersWalletPageClientProps = {
  accountName: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  engineSummary?: EngineWalletSummaryView | null;
  children: ReactNode;
};

export function TransfersWalletPageClient({
  accountName,
  viewerUsername,
  waivSummary,
  hiveSummary,
  engineSummary = null,
  children,
}: TransfersWalletPageClientProps) {
  useHydrateWalletProvider();
  const canManage =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();

  return (
    <>
      <WalletBalancesSync
        waivSummary={waivSummary}
        hiveSummary={hiveSummary}
        engineSummary={engineSummary}
      />
      {children}
      {canManage ? <WalletModalsGate account={accountName} /> : null}
    </>
  );
}
