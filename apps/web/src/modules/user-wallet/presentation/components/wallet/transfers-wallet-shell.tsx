import type { HiveWalletLoadError, HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { EngineWalletLoadError, EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import type { WaivWalletLoadError, WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { TransfersEngineWalletView } from './transfers-engine-wallet-view';
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
  engineSummary?: EngineWalletSummaryView | null;
  engineError?: EngineWalletLoadError | null;
};

export function TransfersWalletShell({
  accountName,
  viewerUsername,
  walletType,
  waivSummary,
  waivError,
  hiveSummary,
  hiveError,
  engineSummary,
  engineError,
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
        hiveSummary={hiveSummary}
        hiveError={hiveError}
      />
    );
  }

  if (walletType === 'ENGINE') {
    return (
      <TransfersEngineWalletView
        accountName={accountName}
        engineSummary={engineSummary ?? null}
        engineError={engineError ?? null}
      />
    );
  }

  return null;
}
