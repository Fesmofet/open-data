'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton } from '@/shared/presentation/components/app-modal';

export type WalletSavingsWithdrawProgressModalProps = {
  open: boolean;
  onClose: () => void;
  amount: string;
  asset: 'HIVE' | 'HBD';
  daysRemaining?: number | null;
};

export function WalletSavingsWithdrawProgressModal({
  open,
  onClose,
  amount,
  asset,
  daysRemaining,
}: WalletSavingsWithdrawProgressModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const progressDays =
    daysRemaining === null || daysRemaining === undefined
      ? null
      : Math.max(0, Math.min(3, 3 - daysRemaining));
  const progressPercent =
    progressDays === null ? null : Math.round((progressDays / 3) * 100);

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex items-start justify-between gap-4 p-card-padding">
        <h2 id={titleId} className="text-heading-sm font-weight-strong text-fg">
          {t('withdraw')}
        </h2>
        <AppModalCloseButton onClose={onClose} />
      </div>
      <div className="space-y-3 px-card-padding pb-card-padding text-body-sm text-fg">
        <p>
          <span className="font-weight-strong">{t('wallet_amount')}:</span> {amount} {asset}
        </p>
        {daysRemaining !== null && daysRemaining !== undefined ? (
          <p>
            {daysRemaining <= 0
              ? t('wallet_savings_withdraw_completes_today')
              : interpolateMessage(t('wallet_savings_withdraw_completes_in_days'), {
                  days: String(daysRemaining),
                })}
          </p>
        ) : (
          <p>{t('wallet_hive_savings_period')}</p>
        )}
        {progressPercent !== null ? (
          <div
            className="h-2 overflow-hidden rounded-full bg-muted/40"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-accent transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
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
