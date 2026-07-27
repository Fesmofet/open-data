'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import {
  buildTransferToVestingOp,
  buildWithdrawVestingOp,
  formatHiveAssetAmount,
} from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
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
  getWalletPowerAmountAssetLabel,
  getWalletPowerDownLiquidSymbol,
  getWalletPowerReceiveSuffix,
} from '../../../domain/wallet-power-labels';
import { formatPowerDownUnlockPreview } from '../../../domain/wallet-power-schedule';
import { formatWalletModalBalanceDisplay } from '../../../domain/wallet-modal-format';
import {
  findPowerEligibleEngineRow,
  getWalletPowerBalanceConfig,
  listWalletPowerAssetOptions,
} from '../../../domain/wallet-modal-balances';
import type { WalletMainAsset, WalletPowerModalState } from '../../../domain/wallet-modal-types';
import { isEngineTokenAsset } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { WalletPowerNotice } from '../shared/wallet-power-notice';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalReadonlyAmountRow } from '../shared/wallet-modal-readonly-amount-row';
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
  const { waivSummary, hiveSummary, engineSummary } = useWalletBalances();
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
    () =>
      getWalletPowerBalanceConfig(
        asset,
        state.mode,
        waivSummary,
        hiveSummary,
        engineSummary,
      ),
    [asset, state.mode, waivSummary, hiveSummary, engineSummary],
  );

  const assetOptions = useMemo(() => {
    return listWalletPowerAssetOptions(
      state.mode,
      waivSummary,
      hiveSummary,
      engineSummary,
    )
      .map((value) => {
        const config = getWalletPowerBalanceConfig(
          value,
          state.mode,
          waivSummary,
          hiveSummary,
          engineSummary,
        );
        return {
          value,
          label: getWalletPowerAmountAssetLabel(value, state.mode),
          balance: config?.maxAmount ?? '0',
          config,
        };
      })
      .filter(
        (row) =>
          row.config !== null &&
          Number.parseFloat(row.config.maxAmount) > 0,
      )
      .map(({ value, label, balance }) => ({ value, label, balance }));
  }, [engineSummary, hiveSummary, state.mode, waivSummary]);

  const previewReceiveValue = useMemo(() => {
    if (state.mode !== 'up' || !balanceConfig) {
      return '';
    }
    const parsed =
      balanceConfig.validation === 'hive'
        ? parseHiveAmount(amount)
        : parseEngineTokenAmount(amount);
    if (parsed === null || parsed <= 0) {
      return '';
    }
    return formatWalletModalBalanceDisplay(String(parsed));
  }, [amount, balanceConfig, state.mode]);

  const previewUnlockValue = useMemo(() => {
    if (state.mode !== 'down' || !balanceConfig) {
      return '';
    }
    const parsed =
      balanceConfig.validation === 'hive'
        ? parseHiveAmount(amount)
        : parseEngineTokenAmount(amount);
    const liquidSymbol = getWalletPowerDownLiquidSymbol(asset);
    return formatPowerDownUnlockPreview({
      asset,
      parsedAmount: parsed,
      liquidSymbol,
      engineMeta: findPowerEligibleEngineRow(engineSummary, asset),
      translate: t,
      interpolate: interpolateMessage,
    });
  }, [amount, asset, balanceConfig, engineSummary, state.mode, t]);

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

    if (balanceConfig.validation === 'hive') {
      const amountError = validateHiveWalletAmount(
        amount,
        balanceConfig.maxAmount,
      );
      if (amountError) {
        setValidationError(t(hiveWalletFormValidationMessageKey(amountError)));
        return;
      }
    } else {
      const amountError = validateEngineTokenAmount(
        amount,
        balanceConfig.maxAmount,
      );
      if (amountError) {
        setValidationError(
          t(engineTokenFormValidationMessageKey(amountError)),
        );
        return;
      }
    }

    setValidationError(null);

    if (isEngineTokenAsset(asset)) {
      const parsed = parseEngineTokenAmount(amount);
      if (parsed === null) {
        return;
      }
      const quantity = formatEngineTokenQuantity(parsed);
      const ok = await engineBroadcast.broadcast(
        state.mode === 'up' ? 'stake' : 'unstake',
        { symbol: asset, quantity },
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
          placeholder={t('amount')}
          searchableAsset
          showBalanceInAssetMenu
          showTokenOnlyOnAssetTrigger={state.mode === 'up'}
        />
        {balanceConfig ? (
          <WalletModalBalanceLine
            amount={balanceConfig.maxAmount}
            symbol={balanceConfig.balanceSymbol}
            onSelect={() => setAmount(balanceConfig.maxAmount)}
            labelKey="available"
          />
        ) : null}
        {state.mode === 'up' ? (
          <WalletModalReadonlyAmountRow
            label={t('wallet_power_you_receive')}
            value={previewReceiveValue}
            suffix={getWalletPowerReceiveSuffix(asset)}
          />
        ) : (
          <WalletModalReadonlyAmountRow
            label={t('wallet_power_unlock_schedule')}
            value={previewUnlockValue}
            suffix={getWalletPowerDownLiquidSymbol(asset)}
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
