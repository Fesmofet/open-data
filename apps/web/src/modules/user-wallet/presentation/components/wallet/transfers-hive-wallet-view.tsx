'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ActivityLoadError, ActivityPageView } from '@/modules/user-activity/domain/types/activity-row-view';

import type { HiveWalletLoadError, HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { HiveWalletSummary } from '../hive/hive-wallet-summary';
import { HiveWalletHistoryFeedClient } from '../hive/history/hive-wallet-history-feed-client';
import { UnifiedWalletModalHost } from './unified-wallet-modal-host';

export type TransfersHiveWalletViewProps = {
  accountName: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView | null;
  hiveError: HiveWalletLoadError | null;
  historyPage?: ActivityPageView;
  historyError?: ActivityLoadError | null;
};

const EMPTY_HISTORY_PAGE: ActivityPageView = {
  items: [],
  cursor: null,
  hasMore: false,
  chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
};

export function TransfersHiveWalletView({
  accountName,
  viewerUsername,
  waivSummary,
  hiveSummary,
  hiveError,
  historyPage = EMPTY_HISTORY_PAGE,
  historyError = null,
}: TransfersHiveWalletViewProps) {
  const { t } = useI18n();
  const canManageWallet =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();
  const summaryAvailable = hiveSummary !== null && hiveError === null;
  const canManageWithSummary = canManageWallet && summaryAvailable;

  return (
    <UnifiedWalletModalHost
      account={accountName}
      viewerUsername={summaryAvailable ? viewerUsername : null}
      waivSummary={waivSummary}
      hiveSummary={hiveSummary}
    >
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
      <HiveWalletHistoryFeedClient
        accountName={accountName}
        initialPage={historyPage}
        initialError={historyError}
      />
    </UnifiedWalletModalHost>
  );
}
