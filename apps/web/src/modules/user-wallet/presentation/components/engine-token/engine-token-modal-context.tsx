'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type EngineTokenPowerModalState = {
  kind: 'power';
  mode: 'up' | 'down';
  symbol: string;
  maxLiquid?: string;
  maxStake?: string;
};

export type EngineTokenTransferModalState = {
  kind: 'transfer';
  symbol: string;
  maxLiquid: string;
  tokenUsdRate: number;
};

export type EngineTokenDelegateModalState = {
  kind: 'delegate';
  symbol: string;
  maxStake: string;
};

export type EngineTokenManageModalState = {
  kind: 'manage';
  symbol: string;
};

export type EngineTokenCancelPowerDownModalState = {
  kind: 'cancelPowerDown';
  symbol: string;
};

export type EngineTokenModalState =
  | EngineTokenPowerModalState
  | EngineTokenTransferModalState
  | EngineTokenDelegateModalState
  | EngineTokenManageModalState
  | EngineTokenCancelPowerDownModalState
  | null;

type EngineTokenModalContextValue = {
  modal: EngineTokenModalState;
  openModal: (state: Exclude<EngineTokenModalState, null>) => void;
  closeModal: () => void;
};

const EngineTokenModalContext = createContext<EngineTokenModalContextValue | null>(
  null,
);

export function EngineTokenModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<EngineTokenModalState>(null);
  const openModal = useCallback((state: Exclude<EngineTokenModalState, null>) => {
    setModal(state);
  }, []);
  const closeModal = useCallback(() => setModal(null), []);
  const value = useMemo(
    () => ({ modal, openModal, closeModal }),
    [modal, openModal, closeModal],
  );
  return (
    <EngineTokenModalContext.Provider value={value}>
      {children}
    </EngineTokenModalContext.Provider>
  );
}

export function useEngineTokenModal(): EngineTokenModalContextValue {
  const ctx = useContext(EngineTokenModalContext);
  if (!ctx) {
    throw new Error('useEngineTokenModal must be used within EngineTokenModalProvider');
  }
  return ctx;
}
