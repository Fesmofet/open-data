'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  AppModal,
  AppModalCloseButton,
} from '@/shared/presentation';

import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import type { EngineTokenCancelPowerDownModalState } from './engine-token-modal-context';

export type EngineTokenCancelPowerDownModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: EngineTokenCancelPowerDownModalState;
};

export function EngineTokenCancelPowerDownModal({
  open,
  onClose,
  account,
  state,
}: EngineTokenCancelPowerDownModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error } = useEngineTokenBroadcast(account);

  const onSubmit = async () => {
    const ok = await broadcast('cancelUnstake', { symbol: state.symbol });
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
          {pending ? '…' : t('confirm')}
        </button>
      </div>
    </AppModal>
  );
}
