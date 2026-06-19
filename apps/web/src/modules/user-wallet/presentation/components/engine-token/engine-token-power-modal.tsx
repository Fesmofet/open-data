'use client';

import { useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  AppModal,
  AppModalCloseButton,
} from '@/shared/presentation';

import {
  engineTokenFormValidationMessageKey,
  validateEngineTokenAmount,
} from '../../../domain/engine-token-form-validation';
import {
  formatEngineTokenQuantity,
  parseEngineTokenAmount,
} from '../../../domain/engine-token-amount';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenAmountField } from './engine-token-amount-field';
import type { EngineTokenPowerModalState } from './engine-token-modal-context';
import { EngineTokenPowerNotice } from './engine-token-power-notice';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';

export type EngineTokenPowerModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: EngineTokenPowerModalState;
};

export function EngineTokenPowerModal({
  open,
  onClose,
  account,
  state,
}: EngineTokenPowerModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error, setError } = useEngineTokenBroadcast(account);
  const maxAmount =
    state.mode === 'up' ? (state.maxLiquid ?? '0') : (state.maxStake ?? '0');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => validateEngineTokenAmount(amount, maxAmount) === null,
    [amount, maxAmount],
  );

  const onSubmit = async () => {
    setError(null);
    const amountError = validateEngineTokenAmount(amount, maxAmount);
    if (amountError) {
      setValidationError(t(engineTokenFormValidationMessageKey(amountError)));
      return;
    }
    setValidationError(null);
    const parsed = parseEngineTokenAmount(amount);
    if (parsed === null) {
      return;
    }
    const quantity = formatEngineTokenQuantity(parsed);
    const ok = await broadcast(
      state.mode === 'up' ? 'stake' : 'unstake',
      { symbol: state.symbol, quantity },
    );
    if (ok) {
      setAmount('');
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {state.mode === 'up' ? t('power_up') : t('power_down')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <EngineTokenAmountField
          label={t('amount')}
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setValidationError(null);
          }}
          maxAmount={maxAmount}
          placeholder={`0.000 ${state.symbol}`}
        />
        <WalletModalBalanceLine
          amount={maxAmount}
          symbol={state.symbol}
          onSelect={() => setAmount(maxAmount)}
        />
        <EngineTokenPowerNotice />
        {validationError ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {validationError}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(engineTokenBroadcastErrorMessageKey(error))}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-btn bg-accent px-4 py-2 text-body font-weight-label text-accent-fg disabled:opacity-50"
          disabled={pending || !canSubmit}
          onClick={() => void onSubmit()}
        >
          {pending ? '…' : state.mode === 'up' ? t('power_up') : t('power_down')}
        </button>
      </div>
    </AppModal>
  );
}
