'use client';

import type { ReactNode } from 'react';

import { WalletModalProvider } from '@/modules/user-wallet/presentation/components/wallet/wallet-modal-context';

/** Shared wallet modal context for transfers sidebar + main column. */
export function ProfileMainWalletModalShell({ children }: { children: ReactNode }) {
  return <WalletModalProvider>{children}</WalletModalProvider>;
}
