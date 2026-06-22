'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import {
  buildTransferFromSavingsOp,
  buildTransferOp,
  buildTransferToSavingsOp,
  formatHiveAssetAmount,
} from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserRefSearchField } from '@/modules/object-updates/presentation/components/user-ref-search-field';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import {
  engineTokenFormValidationMessageKey,
  validateEngineTokenAmount,
  validateEngineTokenRecipient,
} from '../../../domain/engine-token-form-validation';
import {
  formatEngineTokenQuantity,
  formatEngineTokenUsdEstimate,
  parseEngineTokenAmount,
} from '../../../domain/engine-token-amount';
import {
  hiveWalletFormValidationMessageKey,
  validateHiveWalletAmount,
  validateHiveWalletRecipient,
} from '../../../domain/hive-wallet-form-validation';
import {
  estimateHiveUsdValue,
  parseHiveAmount,
} from '../../../domain/hive-wallet-amount';
import {
  getWalletTransferBalanceConfig,
  listWalletTransferAssetOptions,
} from '../../../domain/wallet-modal-balances';
import type { WalletTransferAsset } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import type { WalletTransferModalState } from '../../../domain/wallet-modal-types';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

export type WalletTransferModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletTransferModalState;
};

export function WalletTransferModal({
  open,
  onClose,
  account,
  state,
}: WalletTransferModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const memoId = useId();
  const { waivSummary, hiveSummary } = useWalletBalances();
  const engineBroadcast = useEngineTokenBroadcast(account);
  const hiveBroadcast = useHiveBroadcast(account);

  const savingsMode = state.fromSavings ? 'from' : state.toSavings ? 'to' : 'none';
  const assetLocked = savingsMode !== 'none';

  const [asset, setAsset] = useState<WalletTransferAsset>(state.asset);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setAsset(state.asset);
    setTo('');
    setAmount('');
    setMemo('');
    setValidationError(null);
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);
  }, [open, state.asset, account]);

  const balanceConfig = useMemo(
    () => getWalletTransferBalanceConfig(asset, savingsMode, waivSummary, hiveSummary),
    [asset, savingsMode, waivSummary, hiveSummary],
  );

  const assetOptions = useMemo(() => {
    return listWalletTransferAssetOptions(savingsMode, waivSummary, hiveSummary).map(
      (value) => {
        const config = getWalletTransferBalanceConfig(
          value,
          savingsMode,
          waivSummary,
          hiveSummary,
        );
        return {
          value,
          label: value,
          balance: config?.maxAmount ?? '0',
        };
      },
    );
  }, [savingsMode, waivSummary, hiveSummary]);

  const title = state.fromSavings
    ? t('transfer_from_savings_title')
    : state.toSavings
      ? t('transfer_to_savings_title')
      : t('transfer_modal_title');

  const estimatedUsdLabel = useMemo(() => {
    const estimate =
      balanceConfig?.validation === 'hive'
        ? `${estimateHiveUsdValue(amount, balanceConfig.tokenUsdRate)} USD`
        : `${formatEngineTokenUsdEstimate(amount, balanceConfig?.tokenUsdRate ?? 0)} USD`;
    return interpolateMessage(t('estimated_value'), { estimate });
  }, [amount, balanceConfig, t]);

  const canSubmit = useMemo(() => {
    if (!balanceConfig) {
      return false;
    }
    const recipientOk =
      asset === 'WAIV'
        ? validateEngineTokenRecipient(to) === null
        : validateHiveWalletRecipient(to) === null;
    const amountOk =
      balanceConfig.validation === 'hive'
        ? validateHiveWalletAmount(amount, balanceConfig.maxAmount) === null
        : validateEngineTokenAmount(amount, balanceConfig.maxAmount) === null;
    return recipientOk && amountOk;
  }, [amount, asset, balanceConfig, to]);

  const pending = engineBroadcast.pending || hiveBroadcast.pending;
  const error = engineBroadcast.error ?? hiveBroadcast.error;

  const onSubmit = async () => {
    engineBroadcast.setError(null);
    hiveBroadcast.setError(null);

    if (!balanceConfig) {
      return;
    }

    const recipientError =
      asset === 'WAIV'
        ? validateEngineTokenRecipient(to)
        : validateHiveWalletRecipient(to);
    if (recipientError) {
      const key =
        asset === 'WAIV'
          ? engineTokenFormValidationMessageKey(recipientError)
          : hiveWalletFormValidationMessageKey(recipientError);
      setValidationError(t(key));
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
    const recipient = to.trim().toLowerCase();

    if (asset === 'WAIV') {
      const parsed = parseEngineTokenAmount(amount);
      if (parsed === null) {
        return;
      }
      const ok = await engineBroadcast.broadcast('transfer', {
        symbol: 'WAIV',
        quantity: formatEngineTokenQuantity(parsed),
        to: recipient,
        memo: memo.trim(),
      });
      if (ok) {
        onClose();
      }
      return;
    }

    const parsed = parseHiveAmount(amount);
    if (parsed === null) {
      return;
    }
    const formatted = formatHiveAssetAmount(parsed, asset);
    let op;
    if (state.fromSavings) {
      op = buildTransferFromSavingsOp({
        from: account,
        to: recipient,
        amount: formatted,
        memo: memo.trim(),
      });
    } else if (state.toSavings) {
      op = buildTransferToSavingsOp({
        from: account,
        to: recipient,
        amount: formatted,
        memo: memo.trim(),
      });
    } else {
      op = buildTransferOp({
        from: account,
        to: recipient,
        amount: formatted,
        memo: memo.trim(),
      });
    }
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
            {title}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        <div className="space-y-4">
          <div>
            <WalletModalFieldLabel>{t('to')}</WalletModalFieldLabel>
            <div className="mt-1">
              <UserRefSearchField
                value={to}
                onChange={(name) => {
                  setTo(name);
                  setValidationError(null);
                }}
                excludeAccountNames={[account]}
                fieldLabel={t('to')}
              />
            </div>
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
            assetDisabled={assetLocked}
            maxAmount={balanceConfig?.maxAmount ?? '0'}
            placeholder={t('amount_placeholder')}
          />
          <p className="text-body-sm text-muted">{estimatedUsdLabel}</p>
          {balanceConfig ? (
            <WalletModalBalanceLine
              amount={balanceConfig.maxAmount}
              symbol={balanceConfig.symbol}
              onSelect={() => setAmount(balanceConfig.maxAmount)}
            />
          ) : null}
          <div>
            <WalletModalFieldLabel>{t('memo_optional')}</WalletModalFieldLabel>
            <textarea
              id={memoId}
              rows={3}
              className="mt-1 w-full resize-y rounded-btn border border-border bg-bg px-3 py-2 text-body text-fg"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('memo_placeholder')}
            />
          </div>
        </div>
        <p className="mt-4 text-body-sm text-muted">{t('transfer_modal_info')}</p>
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
          {pending ? '…' : t('transfer')}
        </button>
      </div>
    </AppModal>
  );
}
