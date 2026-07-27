'use client';

import { useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
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
import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';
import { formatPowerDownUnlockPreview } from '../../../domain/wallet-power-schedule';
import { getWalletPowerAmountAssetLabel, getWalletPowerReceiveSuffix } from '../../../domain/wallet-power-labels';
import { findPowerEligibleEngineRow } from '../../../domain/wallet-modal-balances';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalReadonlyAmountRow } from '../shared/wallet-modal-readonly-amount-row';
import { WalletPowerNotice } from '../shared/wallet-power-notice';
import { useWalletBalances } from '../wallet/wallet-balances-context';
import { EngineTokenAmountField } from './engine-token-amount-field';
import type { EngineTokenPowerModalState } from './engine-token-modal-context';
import type { WalletMainAsset } from '../../../domain/wallet-modal-types';

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
  const { engineSummary } = useWalletBalances();
  const { broadcast, pending, error, setError } = useEngineTokenBroadcast(account);
  const maxAmount =
    state.mode === 'up' ? (state.maxLiquid ?? '0') : (state.maxStake ?? '0');
  const balanceSymbol =
    state.mode === 'up'
      ? state.symbol
      : getWalletPowerReceiveSuffix(state.symbol as WalletMainAsset);
  const assetSuffix = getWalletPowerAmountAssetLabel(
    state.symbol as WalletMainAsset,
    state.mode,
  );
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => validateEngineTokenAmount(amount, maxAmount) === null,
    [amount, maxAmount],
  );

  const previewReceiveValue = useMemo(() => {
    if (state.mode !== 'up') {
      return '';
    }
    const parsed = parseEngineTokenAmount(amount);
    if (parsed === null || parsed <= 0) {
      return '';
    }
    return formatWalletModalBalanceDisplay(String(parsed));
  }, [amount, state.mode]);

  const previewUnlockValue = useMemo(() => {
    if (state.mode !== 'down') {
      return '';
    }
    const parsed = parseEngineTokenAmount(amount);
    return formatPowerDownUnlockPreview({
      asset: state.symbol as WalletMainAsset,
      parsedAmount: parsed,
      liquidSymbol: state.symbol,
      engineMeta: findPowerEligibleEngineRow(engineSummary, state.symbol),
      translate: t,
      interpolate: interpolateMessage,
    });
  }, [amount, engineSummary, state.mode, state.symbol, t]);

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
          placeholder={t('amount')}
          assetSuffix={assetSuffix}
        />
        <WalletModalBalanceLine
          amount={maxAmount}
          symbol={balanceSymbol}
          onSelect={() => setAmount(maxAmount)}
          labelKey="available"
        />
        {state.mode === 'up' ? (
          <WalletModalReadonlyAmountRow
            label={t('wallet_power_you_receive')}
            value={previewReceiveValue}
            suffix={getWalletPowerReceiveSuffix(state.symbol as WalletMainAsset)}
          />
        ) : (
          <WalletModalReadonlyAmountRow
            label={t('wallet_power_unlock_schedule')}
            value={previewUnlockValue}
            suffix={state.symbol}
          />
        )}
        <WalletPowerNotice mode={state.mode} />
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
