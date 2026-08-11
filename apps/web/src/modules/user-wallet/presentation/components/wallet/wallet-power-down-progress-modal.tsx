'use client';

import { useId, useMemo } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton } from '@/shared/presentation/components/app-modal';

import { resolvePowerDownProgress } from '../../../domain/hive-wallet-amount';

export type WalletPowerDownProgressModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: string;
  symbol: string;
  nextDateLabel?: string | null;
  weeksRemaining?: number;
  weeksTotal?: number;
  /** Active unstake entry index (legacy shows "Power down #1"). */
  installmentIndex?: number;
};

type PowerDownWeekStepsProps = {
  completed: number;
  total: number;
};

function PowerDownWeekSteps({ completed, total }: PowerDownWeekStepsProps) {
  const steps = useMemo(
    () => Array.from({ length: total + 1 }, (_, index) => index),
    [total],
  );
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div
      className="pt-2"
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="relative mx-0.5">
        <div
          className="absolute inset-x-0 top-[5px] h-px bg-border"
          aria-hidden
        />
        <div
          className="absolute left-0 top-[5px] h-px bg-accent transition-[width]"
          style={{ width: `${progressPercent}%` }}
          aria-hidden
        />
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isPast = step < completed;
            const isCurrent = step === completed;

            return (
              <div key={step} className="flex flex-col items-center gap-1.5">
                <div
                  className={
                    isPast
                      ? 'size-2.5 rounded-circle bg-accent'
                      : isCurrent
                        ? 'size-3 rounded-circle border-2 border-accent bg-surface'
                        : 'size-2.5 rounded-circle border border-border bg-surface'
                  }
                />
                <span className="text-caption text-muted">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WalletPowerDownProgressModal({
  open,
  onClose,
  title,
  amount,
  symbol,
  nextDateLabel,
  weeksRemaining,
  weeksTotal,
  installmentIndex = 1,
}: WalletPowerDownProgressModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const progress = useMemo(() => {
    if (
      weeksRemaining === undefined ||
      weeksTotal === undefined ||
      weeksTotal <= 0
    ) {
      return null;
    }
    return resolvePowerDownProgress(weeksRemaining, weeksTotal);
  }, [weeksRemaining, weeksTotal]);

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex items-start justify-between gap-4 p-card-padding">
        <h2 id={titleId} className="text-heading-sm font-weight-strong text-fg">
          {title}
        </h2>
        <AppModalCloseButton onClose={onClose} />
      </div>
      <div className="space-y-1 px-card-padding pb-card-padding text-body-sm">
        {progress ? (
          <p className="font-weight-strong text-fg">
            {interpolateMessage(t('wallet_power_down_installment'), {
              number: String(installmentIndex),
            })}
          </p>
        ) : null}
        <p className="text-muted">
          {t('wallet_amount')}: {amount} {symbol}
        </p>
        {nextDateLabel ? (
          <p className="text-muted">
            {t('next_power_down')} {nextDateLabel}
          </p>
        ) : null}
        {progress ? (
          <div className="space-y-3 pt-1">
            <p className="text-muted">
              {interpolateMessage(t('wallet_power_down_remaining'), {
                remaining: String(progress.remaining),
                total: String(progress.total),
              })}
            </p>
            <PowerDownWeekSteps completed={progress.completed} total={progress.total} />
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
