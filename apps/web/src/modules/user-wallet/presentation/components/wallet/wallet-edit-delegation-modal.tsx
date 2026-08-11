'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { buildDelegateVestingSharesOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton, APP_MODAL_Z_INDEX } from '@/shared/presentation';

import {
  formatEngineTokenUsdEstimate,
} from '../../../domain/engine-token-amount';
import {
  engineTokenFormValidationMessageKey,
} from '../../../domain/engine-token-form-validation';
import {
  getHiveDelegationMinimumHp,
  hiveWalletFormValidationMessageKey,
  validateHiveDelegationAmount,
} from '../../../domain/hive-wallet-form-validation';
import {
  estimateHiveUsdValue,
  formatHiveAmount,
  hpToVestingShares,
} from '../../../domain/hive-wallet-amount';
import type { HiveHpDelegationsView } from '../../../domain/types/hive-wallet-view';
import type { EngineTokenDelegationsView } from '../../../domain/types/waiv-wallet-view';
import {
  getWalletEditDelegationMaxAmount,
  hasHpDelegationEditChanged,
  parseHpEditDelegationAmount,
  resolveWaivDelegationEditOp,
  validateEditDelegationAmount,
} from '../../../domain/wallet-edit-delegation';
import { getWalletDelegateBalanceConfig } from '../../../domain/wallet-modal-balances';
import { getWalletDelegateAmountAssetLabel } from '../../../domain/wallet-power-labels';
import type { WalletMainAsset } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

export type WalletEditDelegationTarget = {
  asset: WalletMainAsset;
  delegatee: string;
  currentQuantity: string;
};

export type WalletEditDelegationModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  target: WalletEditDelegationTarget;
  waivData: EngineTokenDelegationsView | null;
  hiveData: HiveHpDelegationsView | null;
  onUpdated: () => Promise<void>;
};

export function WalletEditDelegationModal({
  open,
  onClose,
  account,
  target,
  waivData,
  hiveData,
  onUpdated,
}: WalletEditDelegationModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { waivSummary, hiveSummary, engineSummary } = useWalletBalances();
  const engineBroadcast = useEngineTokenBroadcast(account);
  const hiveBroadcast = useHiveBroadcast(account);

  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const assetLabel = getWalletDelegateAmountAssetLabel(target.asset);
  const balanceSymbol = assetLabel;

  const maxAmount = useMemo(
    () =>
      getWalletEditDelegationMaxAmount(
        target.asset,
        target.delegatee,
        waivSummary,
        hiveSummary,
        waivData,
        hiveData,
      ),
    [
      hiveData,
      hiveSummary,
      target.asset,
      target.delegatee,
      waivData,
      waivSummary,
    ],
  );

  const balanceConfig = useMemo(
    () =>
      getWalletDelegateBalanceConfig(
        target.asset,
        waivSummary,
        hiveSummary,
        engineSummary,
      ),
    [engineSummary, hiveSummary, target.asset, waivSummary],
  );

  const estimatedUsdAmount = useMemo(() => {
    if (!balanceConfig) {
      return '0.00';
    }
    if (balanceConfig.validation === 'hive') {
      const rate =
        balanceConfig.tokenUsdRate > 0
          ? balanceConfig.tokenUsdRate
          : (hiveSummary?.rates.hiveUsd ?? engineSummary?.rates.hiveUsd ?? 0);
      return estimateHiveUsdValue(amount, rate);
    }
    return formatEngineTokenUsdEstimate(amount, balanceConfig.tokenUsdRate);
  }, [amount, balanceConfig, engineSummary?.rates.hiveUsd, hiveSummary?.rates.hiveUsd]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAmount(target.currentQuantity);
    setValidationError(null);
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);
  }, [open, target.currentQuantity]);

  const pending = engineBroadcast.pending || hiveBroadcast.pending;
  const error = engineBroadcast.error ?? hiveBroadcast.error;

  const canSubmit = useMemo(() => {
    const amountError = validateEditDelegationAmount(amount, maxAmount);
    if (amountError) {
      return false;
    }
    if (target.asset === 'WAIV') {
      return (
        resolveWaivDelegationEditOp(
          target.delegatee,
          target.currentQuantity,
          amount,
        ) !== null
      );
    }
    if (target.asset === 'HIVE') {
      const parsed = parseHpEditDelegationAmount(amount);
      if (parsed === null) {
        return false;
      }
      if (!hasHpDelegationEditChanged(target.currentQuantity, amount)) {
        return false;
      }
      if (parsed === 0) {
        return true;
      }
      return (
        hiveSummary &&
        validateHiveDelegationAmount(amount, maxAmount, hiveSummary.chain) === null
      );
    }
    return false;
  }, [amount, hiveSummary, maxAmount, target.asset, target.currentQuantity, target.delegatee]);

  const onSubmit = async () => {
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);

    const amountError = validateEditDelegationAmount(amount, maxAmount);
    if (amountError) {
      setValidationError(t(engineTokenFormValidationMessageKey(amountError)));
      return;
    }

    if (target.asset === 'WAIV') {
      const op = resolveWaivDelegationEditOp(
        target.delegatee,
        target.currentQuantity,
        amount,
      );
      if (!op) {
        return;
      }
      const ok = await engineBroadcast.broadcast(op.action, {
        symbol: 'WAIV',
        ...(op.action === 'delegate'
          ? { to: op.to, quantity: op.quantity }
          : { from: op.from, quantity: op.quantity }),
      });
      if (ok) {
        await onUpdated();
        onClose();
      }
      return;
    }

    if (!hiveSummary) {
      return;
    }

    const parsed = parseHpEditDelegationAmount(amount);
    if (parsed === null) {
      setValidationError(t(hiveWalletFormValidationMessageKey('amount_invalid')));
      return;
    }

    if (!hasHpDelegationEditChanged(target.currentQuantity, amount)) {
      return;
    }

    if (parsed > 0) {
      const hiveAmountError = validateHiveDelegationAmount(
        amount,
        maxAmount,
        hiveSummary.chain,
      );
      if (hiveAmountError) {
        const key = hiveWalletFormValidationMessageKey(hiveAmountError);
        setValidationError(
          hiveAmountError === 'delegation_below_minimum'
            ? interpolateMessage(t(key), {
                minHp: formatHiveAmount(
                  getHiveDelegationMinimumHp(hiveSummary.chain),
                ),
              })
            : t(key),
        );
        return;
      }
    }

    setValidationError(null);
    const vestingShares =
      parsed === 0
        ? '0.000000 VESTS'
        : hpToVestingShares(
            parsed,
            hiveSummary.chain.totalVestingShares,
            hiveSummary.chain.totalVestingFundSteem,
          );
    const ok = await hiveBroadcast.broadcast([
      buildDelegateVestingSharesOp({
        delegator: account,
        delegatee: target.delegatee,
        vestingShares,
      }),
    ]);
    if (ok) {
      await onUpdated();
      onClose();
    }
  };

  const assetOptions = useMemo(
    () => [{ value: target.asset, label: assetLabel, balance: maxAmount }],
    [assetLabel, maxAmount, target.asset],
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      zIndex={APP_MODAL_Z_INDEX + 1}
    >
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('wallet_edit_delegation_title')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <div className="space-y-4">
          <div>
            <WalletModalFieldLabel>{t('target_account')}</WalletModalFieldLabel>
            <div className="mt-1 rounded-btn border border-border bg-surface px-3 py-2 text-body text-fg">
              @{target.delegatee}
            </div>
          </div>
          <WalletAssetAmountField
            label={t('amount_to_delegate')}
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setValidationError(null);
            }}
            asset={target.asset}
            onAssetChange={() => undefined}
            options={assetOptions}
            assetDisabled
            maxAmount={maxAmount}
            showTokenOnlyOnAssetTrigger={false}
          />
          <p className="text-body-sm text-muted">
            {interpolateMessage(t('wallet_transfer_value_usd'), {
              amount: estimatedUsdAmount,
            })}
          </p>
          <WalletModalBalanceLine
            amount={maxAmount}
            symbol={balanceSymbol}
            onSelect={() => setAmount(maxAmount)}
            labelKey="available"
          />
        </div>
        {balanceConfig ? (
          <p className="mt-4 text-body-sm text-muted">
            {interpolateMessage(t('wallet_delegate_timing'), {
              symbol: balanceConfig.balanceSymbol,
              days: String(balanceConfig.returnDays),
            })}
          </p>
        ) : null}
        <p className="mt-2 text-body-sm text-muted">
          {t('wallet_broadcast_approval_note')}
        </p>
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
          {pending ? '…' : t('wallet_edit_delegation_update')}
        </button>
      </div>
    </AppModal>
  );
}
