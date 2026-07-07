'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletLoadError, WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { WaivWalletSummary } from '../waiv/waiv-wallet-summary';
import { WaivWalletHistoryFeedClient } from '../waiv/history/waiv-wallet-history-feed-client';

export type TransfersWaivWalletViewProps = {
  accountName: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView;
  waivError: WaivWalletLoadError | null;
  hiveSummary: HiveWalletSummaryView | null;
};

export function TransfersWaivWalletView({
  accountName,
  viewerUsername,
  waivSummary,
  waivError,
  hiveSummary: _hiveSummary,
}: TransfersWaivWalletViewProps) {
  const { t } = useI18n();
  const canManageWallet =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();
  const summaryAvailable = waivError === null;
  const canManageWithSummary = canManageWallet && summaryAvailable;

  return (
    <>
      {waivError ? (
        <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {waivError === 'invalid_response'
            ? t('activity_error')
            : t('unavailable')}
        </p>
      ) : (
        <WaivWalletSummary
          summary={waivSummary}
          canManageWallet={canManageWithSummary}
          defaultAsset="WAIV"
          hideRowActions={canManageWithSummary}
        />
      )}
      <div className="mt-4 flex justify-end">
        <Link
          href={`/@${encodeURIComponent(accountName)}/transfers/waiv-table`}
          className="text-link text-body-sm"
          suppressHydrationWarning
        >
          {t('table_view')}
        </Link>
      </div>
      <WaivWalletHistoryFeedClient accountName={accountName} />
    </>
  );
}
