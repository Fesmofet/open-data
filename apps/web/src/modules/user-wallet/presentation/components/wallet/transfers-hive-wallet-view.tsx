'use client';

import Link from 'next/link';

import { useEffectiveViewerUsername } from '@/modules/object-updates/application/use-effective-viewer-username';
import { useI18n } from '@/i18n/providers/i18n-provider';

import type { HiveWalletLoadError, HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { HiveWalletSummary } from '../hive/hive-wallet-summary';
import { HiveWalletHistoryFeedClient } from '../hive/history/hive-wallet-history-feed-client';

export type TransfersHiveWalletViewProps = {
  accountName: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  hiveError: HiveWalletLoadError | null;
};

export function TransfersHiveWalletView({
  accountName,
  viewerUsername,
  waivSummary: _waivSummary,
  hiveSummary,
  hiveError,
}: TransfersHiveWalletViewProps) {
  const { t } = useI18n();
  const viewerAccount = useEffectiveViewerUsername(viewerUsername);
  const canManageWallet =
    viewerAccount?.trim().toLowerCase() === accountName.trim().toLowerCase();
  const summaryAvailable = hiveSummary !== null && hiveError === null;
  const canManageWithSummary = canManageWallet && summaryAvailable;

  return (
    <>
      {hiveError ? (
        <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {hiveError === 'invalid_response'
            ? t('activity_error')
            : t('unavailable')}
        </p>
      ) : hiveSummary ? (
        <HiveWalletSummary
          summary={hiveSummary}
          canManageWallet={canManageWithSummary}
          accountName={accountName}
          defaultAsset="HIVE"
        />
      ) : null}
      <div className="mt-4 flex justify-end">
        <Link
          href={`/@${encodeURIComponent(accountName)}/transfers/table`}
          className="text-link text-body-sm"
          suppressHydrationWarning
        >
          {t('table_view')}
        </Link>
      </div>
      <HiveWalletHistoryFeedClient accountName={accountName} />
    </>
  );
}
