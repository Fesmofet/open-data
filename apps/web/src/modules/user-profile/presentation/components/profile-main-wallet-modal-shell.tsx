'use client';

import type { ReactNode } from 'react';

import {
  WalletBalancesProvider,
} from '@/modules/user-wallet/presentation/components/wallet/wallet-balances-context';
import { WalletModalProvider } from '@/modules/user-wallet/presentation/components/wallet/wallet-modal-context';

/** Shared wallet modal + balances context for transfers sidebar + main column. */
export function ProfileMainWalletModalShell({ children }: { children: ReactNode }) {
  return (
    <WalletModalProvider>
      <WalletBalancesProvider>{children}</WalletBalancesProvider>
    </WalletModalProvider>
  );
}
