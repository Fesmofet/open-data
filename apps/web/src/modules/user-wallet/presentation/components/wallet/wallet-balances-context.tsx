'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';

type WalletBalancesContextValue = {
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
};

const WalletBalancesContext = createContext<WalletBalancesContextValue | null>(
  null,
);

export type WalletBalancesProviderProps = {
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  children: ReactNode;
};

export function WalletBalancesProvider({
  waivSummary,
  hiveSummary,
  children,
}: WalletBalancesProviderProps) {
  const value = useMemo(
    () => ({ waivSummary, hiveSummary }),
    [waivSummary, hiveSummary],
  );
  return (
    <WalletBalancesContext.Provider value={value}>
      {children}
    </WalletBalancesContext.Provider>
  );
}

export function useWalletBalances(): WalletBalancesContextValue {
  const ctx = useContext(WalletBalancesContext);
  if (!ctx) {
    throw new Error('useWalletBalances must be used within WalletBalancesProvider');
  }
  return ctx;
}
