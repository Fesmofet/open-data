'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type {
  EngineWalletLoadError,
  EngineWalletSummaryView,
} from '../../../domain/types/engine-wallet-view';
import { EngineWalletSummary } from '../engine/engine-wallet-summary';
import { EngineWalletHistoryFeedClient } from '../engine/history/engine-wallet-history-feed-client';

export type TransfersEngineWalletViewProps = {
  accountName: string;
  engineSummary: EngineWalletSummaryView | null;
  engineError: EngineWalletLoadError | null;
};

export function TransfersEngineWalletView({
  accountName,
  engineSummary,
  engineError,
}: TransfersEngineWalletViewProps) {
  const { t } = useI18n();

  return (
    <>
      {engineError || !engineSummary ? (
        <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
          {engineError === 'invalid_response'
            ? t('activity_error')
            : t('unavailable')}
        </p>
      ) : (
        <EngineWalletSummary summary={engineSummary} />
      )}
      <EngineWalletHistoryFeedClient accountName={accountName} />
    </>
  );
}
