'use client';

import type {
  HiveWalletLoadError,
  HiveWalletSummaryView,
} from '../../../domain/types/hive-wallet-view';
import { TransfersHiveWalletView } from '../wallet/transfers-hive-wallet-view';

export type HiveWalletTabProps = {
  accountName: string;
  viewerUsername: string | null;
  summary: HiveWalletSummaryView | null;
  error: HiveWalletLoadError | null;
};

export function HiveWalletTab({
  accountName,
  viewerUsername,
  summary,
  error,
}: HiveWalletTabProps) {
  return (
    <TransfersHiveWalletView
      accountName={accountName}
      viewerUsername={viewerUsername}
      waivSummary={null}
      hiveSummary={summary!}
      hiveError={error}
    />
  );
}
