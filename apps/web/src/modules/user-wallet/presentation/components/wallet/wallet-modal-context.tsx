'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { WalletModalState } from '../../../domain/wallet-modal-types';

type WalletModalContextValue = {
  modal: WalletModalState;
  openModal: (state: Exclude<WalletModalState, null>) => void;
  closeModal: () => void;
};

const WalletModalContext = createContext<WalletModalContextValue | null>(null);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<WalletModalState>(null);
  const openModal = useCallback((state: Exclude<WalletModalState, null>) => {
    setModal(state);
  }, []);
  const closeModal = useCallback(() => setModal(null), []);
  const value = useMemo(
    () => ({ modal, openModal, closeModal }),
    [modal, openModal, closeModal],
  );
  return (
    <WalletModalContext.Provider value={value}>
      {children}
    </WalletModalContext.Provider>
  );
}

export function useWalletModal(): WalletModalContextValue {
  const ctx = useContext(WalletModalContext);
  if (!ctx) {
    throw new Error('useWalletModal must be used within WalletModalProvider');
  }
  return ctx;
}
