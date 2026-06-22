'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { HiveWalletLoadError, HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { HiveWalletSummary } from '../hive/hive-wallet-summary';
import { UnifiedWalletModalHost } from './unified-wallet-modal-host';

export type TransfersHiveWalletViewProps = {
  accountName: string;
  viewerUsername: string | null;
  waivSummary: WaivWalletSummaryView | null;
  hiveSummary: HiveWalletSummaryView;
  hiveError: HiveWalletLoadError | null;
};

export function TransfersHiveWalletView({
  accountName,
  viewerUsername,
  waivSummary,
  hiveSummary,
  hiveError,
}: TransfersHiveWalletViewProps) {
  const { t } = useI18n();
  const canManageWallet =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();

  if (hiveError) {
    return (
      <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
        {hiveError === 'invalid_response'
          ? t('activity_error')
          : t('unavailable')}
      </p>
    );
  }

  return (
    <UnifiedWalletModalHost
      account={accountName}
      viewerUsername={viewerUsername}
      waivSummary={waivSummary}
      hiveSummary={hiveSummary}
    >
      <HiveWalletSummary
        summary={hiveSummary}
        canManageWallet={canManageWallet}
        accountName={accountName}
        defaultAsset="HIVE"
      />
    </UnifiedWalletModalHost>
  );
}
