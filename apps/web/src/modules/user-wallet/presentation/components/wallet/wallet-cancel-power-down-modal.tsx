'use client';

import { useId } from 'react';

import { buildCancelPowerDownOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { WalletCancelPowerDownModalState } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';

export type WalletCancelPowerDownModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletCancelPowerDownModalState;
};

export function WalletCancelPowerDownModal({
  open,
  onClose,
  account,
  state,
}: WalletCancelPowerDownModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const engineBroadcast = useEngineTokenBroadcast(account);
  const hiveBroadcast = useHiveBroadcast(account);

  const pending = engineBroadcast.pending || hiveBroadcast.pending;
  const error = engineBroadcast.error ?? hiveBroadcast.error;

  const onSubmit = async () => {
    if (state.asset === 'WAIV') {
      const ok = await engineBroadcast.broadcast('cancelUnstake', { symbol: 'WAIV' });
      if (ok) {
        onClose();
      }
      return;
    }

    const ok = await hiveBroadcast.broadcast([buildCancelPowerDownOp(account)]);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('power_down')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <p className="text-body-sm text-muted">{t('cancel_power_down_confirm')}</p>
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
          {pending ? '…' : state.asset === 'HIVE' ? t('cancel') : t('confirm')}
        </button>
      </div>
    </AppModal>
  );
}
