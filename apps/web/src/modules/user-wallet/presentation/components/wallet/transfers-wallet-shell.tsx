import type { HiveWalletLoadError, HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletLoadError, WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { TransfersHiveWalletView } from './transfers-hive-wallet-view';
import { TransfersWaivWalletView } from './transfers-waiv-wallet-view';

export type TransfersWalletShellProps = {
  accountName: string;
  viewerUsername: string | null;
  walletType: 'WAIV' | 'HIVE' | 'ENGINE' | 'rebalancing';
  waivSummary: WaivWalletSummaryView | null;
  waivError: WaivWalletLoadError | null;
  hiveSummary: HiveWalletSummaryView | null;
  hiveError: HiveWalletLoadError | null;
};

export function TransfersWalletShell({
  accountName,
  viewerUsername,
  walletType,
  waivSummary,
  waivError,
  hiveSummary,
  hiveError,
}: TransfersWalletShellProps) {
  if (walletType === 'WAIV') {
    return (
      <TransfersWaivWalletView
        accountName={accountName}
        viewerUsername={viewerUsername}
        waivSummary={waivSummary!}
        waivError={waivError}
        hiveSummary={hiveSummary}
      />
    );
  }

  if (walletType === 'HIVE') {
    return (
      <TransfersHiveWalletView
        accountName={accountName}
        viewerUsername={viewerUsername}
        waivSummary={waivSummary}
        hiveSummary={hiveSummary!}
        hiveError={hiveError}
      />
    );
  }

  return null;
}
