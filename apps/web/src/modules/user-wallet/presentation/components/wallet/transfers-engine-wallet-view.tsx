'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useEffectiveViewerUsername } from '@/modules/object-updates/application/use-effective-viewer-username';

import type {
  EngineWalletLoadError,
  EngineWalletSummaryView,
} from '../../../domain/types/engine-wallet-view';
import { EngineWalletSummary } from '../engine/engine-wallet-summary';
import { EngineWalletHistoryFeedClient } from '../engine/history/engine-wallet-history-feed-client';

export type TransfersEngineWalletViewProps = {
  accountName: string;
  viewerUsername: string | null;
  engineSummary: EngineWalletSummaryView | null;
  engineError: EngineWalletLoadError | null;
};

export function TransfersEngineWalletView({
  accountName,
  viewerUsername,
  engineSummary,
  engineError,
}: TransfersEngineWalletViewProps) {
  const { t } = useI18n();
  const viewerAccount = useEffectiveViewerUsername(viewerUsername);
  const canManageWallet =
    viewerAccount?.trim().toLowerCase() === accountName.trim().toLowerCase();
  const summaryAvailable = engineError === null && engineSummary !== null;
  const canManageWithSummary = canManageWallet && summaryAvailable;

  return (
    <>
      {engineError || !engineSummary ? (
        <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {engineError === 'invalid_response'
            ? t('activity_error')
            : t('unavailable')}
        </p>
      ) : (
        <EngineWalletSummary
          summary={engineSummary}
          canManageWallet={canManageWithSummary}
        />
      )}
      <EngineWalletHistoryFeedClient accountName={accountName} />
    </>
  );
}
