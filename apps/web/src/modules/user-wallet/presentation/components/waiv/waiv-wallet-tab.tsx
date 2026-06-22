'use client';

import type {
  WaivWalletLoadError,
  WaivWalletSummaryView,
} from '../../../domain/types/waiv-wallet-view';
import { TransfersWaivWalletView } from '../wallet/transfers-waiv-wallet-view';

export type WaivWalletTabProps = {
  accountName: string;
  viewerUsername: string | null;
  summary: WaivWalletSummaryView | null;
  error: WaivWalletLoadError | null;
};

export function WaivWalletTab({
  accountName,
  viewerUsername,
  summary,
  error,
}: WaivWalletTabProps) {
  return (
    <TransfersWaivWalletView
      accountName={accountName}
      viewerUsername={viewerUsername}
      waivSummary={summary!}
      waivError={error}
      hiveSummary={null}
    />
  );
}
