'use client';

import { useHydrateWalletProvider } from '@/modules/auth';
import type { EngineWalletSummaryView } from '@/modules/user-wallet/domain/types/engine-wallet-view';
import type { HiveWalletSummaryView } from '@/modules/user-wallet/domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '@/modules/user-wallet/domain/types/waiv-wallet-view';
import { WalletModalsGate } from '@/modules/user-wallet/presentation/components/wallet/unified-wallet-modal-host';
import { WalletBalancesProvider } from '@/modules/user-wallet/presentation/components/wallet/wallet-balances-context';
import {
  WalletModalProvider,
} from '@/modules/user-wallet/presentation/components/wallet/wallet-modal-context';

import type { UserAccountSidebarView } from '../../domain/types/user-account-sidebar-view';
import { ProfileAccountSidebar } from './profile-account-sidebar';

export type ProfileAccountSidebarShellProps = {
  accountName: string;
  viewerUsername: string | null;
  viewerWaivSummary: WaivWalletSummaryView | null;
  viewerHiveSummary: HiveWalletSummaryView | null;
  viewerEngineSummary?: EngineWalletSummaryView | null;
  model: UserAccountSidebarView;
};

function ProfileAccountSidebarShellInner({
  accountName,
  viewerUsername,
  viewerWaivSummary,
  viewerHiveSummary,
  viewerEngineSummary = null,
  model,
}: ProfileAccountSidebarShellProps) {
  useHydrateWalletProvider();
  const viewerAccount = viewerUsername?.trim() ?? null;

  return (
    <WalletBalancesProvider
      waivSummary={viewerWaivSummary}
      hiveSummary={viewerHiveSummary}
      engineSummary={viewerEngineSummary}
    >
      <ProfileAccountSidebar
        accountName={accountName}
        viewerUsername={viewerAccount}
        model={model}
      />
      {viewerAccount ? <WalletModalsGate account={viewerAccount} /> : null}
    </WalletBalancesProvider>
  );
}

export function ProfileAccountSidebarShell(props: ProfileAccountSidebarShellProps) {
  return (
    <WalletModalProvider>
      <ProfileAccountSidebarShellInner {...props} />
    </WalletModalProvider>
  );
}
