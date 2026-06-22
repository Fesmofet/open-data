'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletLoadError, WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { WaivWalletSummary } from '../waiv/waiv-wallet-summary';
import { UnifiedWalletModalHost } from './unified-wallet-modal-host';

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
  hiveSummary,
}: TransfersWaivWalletViewProps) {
  const { t } = useI18n();
  const canManageWallet =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();

  if (waivError) {
    return (
      <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
        {waivError === 'invalid_response'
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
      <WaivWalletSummary
        summary={waivSummary}
        canManageWallet={canManageWallet}
        defaultAsset="WAIV"
      />
    </UnifiedWalletModalHost>
  );
}
