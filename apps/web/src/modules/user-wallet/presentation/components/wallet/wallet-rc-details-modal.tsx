'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation/components/app-modal';

import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';

function formatRcCount(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return '0';
  }
  return parsed.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export type WalletRcDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  rc: NonNullable<HiveWalletSummaryView['rc']>;
};

export function WalletRcDetailsModal({
  open,
  onClose,
  rc,
}: WalletRcDetailsModalProps) {
  const { t } = useI18n();
  const titleId = useId();

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex items-start justify-between gap-4 p-card-padding">
        <h2 id={titleId} className="text-heading-sm font-weight-strong text-fg">
          {t('resource_credits')}
        </h2>
        <AppModalCloseButton onClose={onClose} />
      </div>
      <div className="space-y-3 px-card-padding pb-card-padding text-body-sm text-fg">
        <p>
          <span className="font-weight-strong">{t('wallet_rc_total_owned')}:</span>{' '}
          {formatRcCount(rc.totalOwned)} RC
        </p>
        <p>
          <span className="font-weight-strong">{t('wallet_rc_max_capacity')}:</span>{' '}
          {formatRcCount(rc.maxCapacity)} RC
        </p>
        <p>
          <span className="font-weight-strong">{t('wallet_rc_available')}:</span>{' '}
          {formatRcCount(rc.currentMana)} RC
        </p>
      </div>
      <div className="flex justify-end border-t border-border px-card-padding py-3">
        <button
          type="button"
          className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-on-accent hover:bg-accent/90"
          onClick={onClose}
        >
          {t('ok')}
        </button>
      </div>
    </AppModal>
  );
}
