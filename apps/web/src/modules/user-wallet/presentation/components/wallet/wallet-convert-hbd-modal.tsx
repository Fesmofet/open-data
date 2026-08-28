'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import {
  buildCollateralizedConvertOp,
  toHiveUint32RequestId,
} from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import {
  computeEstimatedHbdFromHiveConvert,
  computeImmediateHbdFromHiveConvert,
  deriveHbdPerHiveFromRates,
} from '../../../domain/hive-convert-hbd';
import {
  hiveWalletFormValidationMessageKey,
  validateHiveWalletAmount,
} from '../../../domain/hive-wallet-form-validation';
import { parseHiveAmount } from '../../../domain/hive-wallet-amount';
import type { WalletConvertHbdModalState } from '../../../domain/wallet-modal-types';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

export type WalletConvertHbdModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletConvertHbdModalState;
};

export function WalletConvertHbdModal({
  open,
  onClose,
  account,
}: WalletConvertHbdModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { hiveSummary } = useWalletBalances();
  const hiveBroadcast = useHiveBroadcast(account);

  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const maxAmount = hiveSummary?.balance.liquidHive ?? '0';
  const hiveAssetOptions = useMemo(
    () => [{ value: 'HIVE' as const, label: 'HIVE', balance: maxAmount }],
    [maxAmount],
  );
  const hbdAssetOptions = useMemo(
    () => [
      {
        value: 'HBD' as const,
        label: 'HBD',
        balance: hiveSummary?.balance.hbdLiquid ?? '0',
      },
    ],
    [hiveSummary?.balance.hbdLiquid],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAmount('');
    setValidationError(null);
    hiveBroadcast.setError(null);
  }, [open, account]);

  const parsedAmount = parseHiveAmount(amount);
  const hiveUsd = hiveSummary?.rates.hiveUsd ?? 0;

  const estimatedHbd = useMemo(() => {
    if (parsedAmount === null || parsedAmount <= 0 || !hiveSummary) {
      return '0.00';
    }
    const value = computeEstimatedHbdFromHiveConvert(
      parsedAmount,
      hiveSummary.rates.hiveUsd,
      hiveSummary.rates.hbdUsd,
    );
    return value === null ? '0.00' : value.toFixed(2);
  }, [amount, hiveSummary, parsedAmount]);

  const estimatedUsd = useMemo(() => {
    if (parsedAmount === null || parsedAmount <= 0 || hiveUsd <= 0) {
      return '0.00';
    }
    return (parsedAmount * hiveUsd).toFixed(2);
  }, [parsedAmount, hiveUsd]);

  const immediateHbd = useMemo(() => {
    if (!hiveSummary || parsedAmount === null || parsedAmount <= 0) {
      return '0.00';
    }
    const hbdPerHive = deriveHbdPerHiveFromRates(
      hiveSummary.rates.hiveUsd,
      hiveSummary.rates.hbdUsd,
    );
    if (hbdPerHive === null) {
      return '0.00';
    }
    return computeImmediateHbdFromHiveConvert(parsedAmount, hbdPerHive).toFixed(2);
  }, [parsedAmount, hiveSummary]);

  const canSubmit = useMemo(() => {
    return validateHiveWalletAmount(amount, maxAmount) === null;
  }, [amount, maxAmount]);

  const onSubmit = async () => {
    hiveBroadcast.setError(null);
    const amountError = validateHiveWalletAmount(amount, maxAmount);
    if (amountError) {
      setValidationError(t(hiveWalletFormValidationMessageKey(amountError)));
      return;
    }
    const parsed = parseHiveAmount(amount);
    if (parsed === null) {
      return;
    }
    setValidationError(null);
    const ok = await hiveBroadcast.broadcast([
      buildCollateralizedConvertOp({
        owner: account,
        requestid: toHiveUint32RequestId(),
        amount: parsed,
      }),
    ]);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('wallet_convert_hbd_modal_title')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <p className="text-body-sm text-muted">{t('wallet_convert_hbd_notice')}</p>

        <div className="mt-4 space-y-4">
          <div>
            <WalletModalFieldLabel>{t('from')}</WalletModalFieldLabel>
            <WalletAssetAmountField
              value={amount}
              onChange={setAmount}
              asset="HIVE"
              onAssetChange={() => undefined}
              options={hiveAssetOptions}
              assetDisabled
              maxAmount={maxAmount}
            />
            <WalletModalBalanceLine
              amount={maxAmount}
              symbol="HIVE"
              onSelect={() => setAmount(maxAmount)}
              labelKey="your_balance"
            />
          </div>

          <div>
            <WalletModalFieldLabel>{t('to')}</WalletModalFieldLabel>
            <WalletAssetAmountField
              value={estimatedHbd}
              onChange={() => undefined}
              asset="HBD"
              onAssetChange={() => undefined}
              options={hbdAssetOptions}
              assetDisabled
              maxAmount="0"
              amountReadOnly
              showMaxButton={false}
            />
          </div>
        </div>

        <p className="mt-4 text-body-sm text-muted">
          {t('estimated_transaction_value')}: {estimatedUsd} USD
        </p>
        <p className="mt-2 text-body-sm text-muted">
          {interpolateMessage(t('wallet_convert_hbd_immediate'), {
            amount: immediateHbd,
          })}
        </p>

        {validationError ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {validationError}
          </p>
        ) : null}
        {hiveBroadcast.error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(hiveBroadcast.error)}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-btn border border-border bg-surface-control px-4 py-2 text-body font-weight-strong text-fg"
            onClick={onClose}
            disabled={hiveBroadcast.pending}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg disabled:opacity-50"
            disabled={!canSubmit || hiveBroadcast.pending}
            onClick={() => void onSubmit()}
          >
            {t('submit')}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
