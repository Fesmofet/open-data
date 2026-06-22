'use client';

import { useId } from 'react';

import { buildCancelTransferFromSavingsOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';

import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import type { WalletCancelSavingsWithdrawModalState } from '../../../domain/wallet-modal-types';

export type HiveCancelSavingsWithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletCancelSavingsWithdrawModalState;
};

export function HiveCancelSavingsWithdrawModal({
  open,
  onClose,
  account,
  state,
}: HiveCancelSavingsWithdrawModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error } = useHiveBroadcast(account);

  const onSubmit = async () => {
    const op = buildCancelTransferFromSavingsOp({
      from: account,
      requestId: state.requestId,
    });
    const ok = await broadcast([op]);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('cancel_transfer_from_savings')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <p className="text-body-sm text-muted">
          {interpolateMessage(t('withdraw_from_savings'), {
            requestId: String(state.requestId),
          })}{' '}
          — {state.amount}
        </p>
        {error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(engineTokenBroadcastErrorMessageKey(error))}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-btn bg-accent px-4 py-2 text-body font-weight-label text-accent-fg disabled:opacity-50"
          disabled={pending}
          onClick={() => void onSubmit()}
        >
          {pending ? '…' : t('cancel')}
        </button>
      </div>
    </AppModal>
  );
}
