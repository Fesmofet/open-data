'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import {
  buildTransferToVestingOp,
  buildWithdrawVestingOp,
  formatHiveAssetAmount,
} from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import {
  engineTokenFormValidationMessageKey,
  validateEngineTokenAmount,
} from '../../../domain/engine-token-form-validation';
import {
  formatEngineTokenQuantity,
  parseEngineTokenAmount,
} from '../../../domain/engine-token-amount';
import {
  hiveWalletFormValidationMessageKey,
  validateHiveWalletAmount,
} from '../../../domain/hive-wallet-form-validation';
import {
  hpToVestingShares,
  parseHiveAmount,
} from '../../../domain/hive-wallet-amount';
import {
  getWalletPowerBalanceConfig,
  listWalletMainAssetOptions,
} from '../../../domain/wallet-modal-balances';
import type { WalletMainAsset, WalletPowerModalState } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenPowerNotice } from '../engine-token/engine-token-power-notice';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

export type WalletPowerModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletPowerModalState;
};

export function WalletPowerModal({
  open,
  onClose,
  account,
  state,
}: WalletPowerModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { waivSummary, hiveSummary } = useWalletBalances();
  const engineBroadcast = useEngineTokenBroadcast(account);
  const hiveBroadcast = useHiveBroadcast(account);

  const [asset, setAsset] = useState<WalletMainAsset>(state.asset);
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAsset(state.asset);
    setAmount('');
    setValidationError(null);
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);
  }, [open, state.asset]);

  const balanceConfig = useMemo(
    () => getWalletPowerBalanceConfig(asset, state.mode, waivSummary, hiveSummary),
    [asset, state.mode, waivSummary, hiveSummary],
  );

  const assetOptions = useMemo(() => {
    return listWalletMainAssetOptions(waivSummary, hiveSummary).map((value) => {
      const config = getWalletPowerBalanceConfig(
        value,
        state.mode,
        waivSummary,
        hiveSummary,
      );
      const powerLabel = value === 'WAIV' ? 'WP' : 'HP';
      return {
        value,
        label: state.mode === 'down' ? powerLabel : value,
        balance: config?.maxAmount ?? '0',
      };
    });
  }, [hiveSummary, state.mode, waivSummary]);

  const canSubmit = useMemo(() => {
    if (!balanceConfig) {
      return false;
    }
    return balanceConfig.validation === 'hive'
      ? validateHiveWalletAmount(amount, balanceConfig.maxAmount) === null
      : validateEngineTokenAmount(amount, balanceConfig.maxAmount) === null;
  }, [amount, balanceConfig]);

  const pending = engineBroadcast.pending || hiveBroadcast.pending;
  const error = engineBroadcast.error ?? hiveBroadcast.error;

  const onSubmit = async () => {
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);

    if (!balanceConfig) {
      return;
    }

    const amountError =
      balanceConfig.validation === 'hive'
        ? validateHiveWalletAmount(amount, balanceConfig.maxAmount)
        : validateEngineTokenAmount(amount, balanceConfig.maxAmount);
    if (amountError) {
      const key =
        balanceConfig.validation === 'hive'
          ? hiveWalletFormValidationMessageKey(amountError)
          : engineTokenFormValidationMessageKey(amountError);
      setValidationError(t(key));
      return;
    }

    setValidationError(null);

    if (asset === 'WAIV') {
      const parsed = parseEngineTokenAmount(amount);
      if (parsed === null) {
        return;
      }
      const quantity = formatEngineTokenQuantity(parsed);
      const ok = await engineBroadcast.broadcast(
        state.mode === 'up' ? 'stake' : 'unstake',
        { symbol: 'WAIV', quantity },
      );
      if (ok) {
        onClose();
      }
      return;
    }

    const parsed = parseHiveAmount(amount);
    if (parsed === null || !hiveSummary) {
      return;
    }

    const op =
      state.mode === 'up'
        ? buildTransferToVestingOp({
            from: account,
            to: account,
            amount: formatHiveAssetAmount(parsed, 'HIVE'),
          })
        : buildWithdrawVestingOp({
            account,
            vestingShares: hpToVestingShares(
              parsed,
              hiveSummary.chain.totalVestingShares,
              hiveSummary.chain.totalVestingFundSteem,
            ),
          });
    const ok = await hiveBroadcast.broadcast([op]);
    if (ok) {
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
        <WalletAssetAmountField
          label={t('amount')}
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setValidationError(null);
          }}
          asset={asset}
          onAssetChange={(nextAsset) => {
            setAsset(nextAsset);
            setAmount('');
            setValidationError(null);
          }}
          options={assetOptions}
          maxAmount={balanceConfig?.maxAmount ?? '0'}
          placeholder={`0.000 ${balanceConfig?.balanceSymbol ?? asset}`}
        />
        {balanceConfig ? (
          <WalletModalBalanceLine
            amount={balanceConfig.maxAmount}
            symbol={balanceConfig.balanceSymbol}
            onSelect={() => setAmount(balanceConfig.maxAmount)}
          />
        ) : null}
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
