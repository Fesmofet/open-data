'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type {
  WaivWalletLoadError,
  WaivWalletSummaryView,
} from '../../../domain/types/waiv-wallet-view';
import { WalletModalHost } from '../engine-token/wallet-modal-host';
import { WaivWalletSummary } from './waiv-wallet-summary';

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
  const { t } = useI18n();
  const canManageWallet =
    viewerUsername?.trim().toLowerCase() === accountName.trim().toLowerCase();

  if (error || !summary) {
    return (
      <p className="rounded-card border border-border bg-bg p-card-padding text-body-sm text-muted">
        {error === 'invalid_response'
          ? t('activity_error')
          : t('unavailable')}
      </p>
    );
  }

  return (
    <WalletModalHost account={accountName} viewerUsername={viewerUsername}>
      <WaivWalletSummary summary={summary} canManageWallet={canManageWallet} />
    </WalletModalHost>
  );
}
