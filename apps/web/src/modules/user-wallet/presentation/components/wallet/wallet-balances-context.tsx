'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';

export type WalletBalancesState = {
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  engineSummary: EngineWalletSummaryView | null;
};

type WalletBalancesContextValue = WalletBalancesState & {
  walletEpoch: number;
  setSummaries: (summaries: WalletBalancesState) => void;
  bumpWalletEpoch: () => void;
};

const EMPTY_BALANCES: WalletBalancesState = {
  waivSummary: null,
  hiveSummary: null,
  engineSummary: null,
};

const WalletBalancesContext = createContext<WalletBalancesContextValue | null>(
  null,
);

export type WalletBalancesProviderProps = {
  children: ReactNode;
};

export function WalletBalancesProvider({ children }: WalletBalancesProviderProps) {
  const [summaries, setSummariesState] = useState<WalletBalancesState>(EMPTY_BALANCES);
  const [walletEpoch, setWalletEpoch] = useState(0);

  const setSummaries = useCallback((next: WalletBalancesState) => {
    setSummariesState(next);
  }, []);

  const bumpWalletEpoch = useCallback(() => {
    setWalletEpoch((epoch) => epoch + 1);
  }, []);

  const value = useMemo(
    () => ({
      ...summaries,
      walletEpoch,
      setSummaries,
      bumpWalletEpoch,
    }),
    [summaries, walletEpoch, setSummaries, bumpWalletEpoch],
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

export type WalletBalancesSyncProps = WalletBalancesState;

/** Pushes RSC-fetched wallet summaries into the layout-level balances context. */
export function WalletBalancesSync({
  waivSummary,
  hiveSummary,
  engineSummary,
}: WalletBalancesSyncProps) {
  const { setSummaries } = useWalletBalances();

  useEffect(() => {
    setSummaries({ waivSummary, hiveSummary, engineSummary });
  }, [waivSummary, hiveSummary, engineSummary, setSummaries]);

  return null;
}
