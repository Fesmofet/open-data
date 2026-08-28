'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import { buildHiveChangellyWithdrawTransferOps } from '../../../domain/build-hive-changelly-withdraw-ops';
import {
  HIVE_CHANGELLY_OUTPUT_COINS,
  HIVE_CHANGELLY_TRACKING_HIVE_RESERVE,
  HIVE_CHANGELLY_WITHDRAW_USD_CAP,
  type HiveChangellyOutputCoin,
} from '../../../domain/hive-changelly-withdraw.constants';
import {
  hiveWalletFormValidationMessageKey,
  validateHiveWalletAmount,
} from '../../../domain/hive-wallet-form-validation';
import { parseHiveAmount } from '../../../domain/hive-wallet-amount';
import { parsePaymentQrUri } from '../../../domain/payment-qr-uri';
import { isValidChangellyWithdrawAddress } from '../../../domain/validate-changelly-address';
import type { WalletHiveChangellyWithdrawModalState } from '../../../domain/wallet-modal-types';
import {
  fetchHiveChangellyWithdrawCreate,
  fetchHiveChangellyWithdrawEstimate,
  fetchHiveChangellyWithdrawRange,
} from '../../../infrastructure/clients/hive-changelly-withdraw.client';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';
import { WalletQrScannerModal } from './wallet-qr-scanner-modal';

export type WalletHiveChangellyWithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletHiveChangellyWithdrawModalState;
};

function coinLabel(coin: HiveChangellyOutputCoin): string {
  return coin.toUpperCase();
}

export function WalletHiveChangellyWithdrawModal({
  open,
  onClose,
  account,
  state,
}: WalletHiveChangellyWithdrawModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const addressId = useId();
  const { hiveSummary } = useWalletBalances();
  const hiveBroadcast = useHiveBroadcast(account);

  const [outputCoinType, setOutputCoinType] = useState<HiveChangellyOutputCoin>(
    state.outputCoinType,
  );
  const [hiveAmount, setHiveAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [address, setAddress] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const maxHive = hiveSummary?.balance.liquidHive ?? '0';
  const hiveAssetOptions = useMemo(
    () => [{ value: 'HIVE' as const, label: 'HIVE', balance: maxHive }],
    [maxHive],
  );
  const liquidHive = parseHiveAmount(maxHive) ?? 0;
  const hiveUsd = hiveSummary?.rates.hiveUsd ?? 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    setOutputCoinType(state.outputCoinType);
    setHiveAmount('');
    setCryptoAmount('');
    setAddress('');
    setValidationError(null);
    setRangeError(null);
    hiveBroadcast.setError(null);
  }, [open, state.outputCoinType, account]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setRangeLoading(true);
    setRangeError(null);
    void fetchHiveChangellyWithdrawRange(account, outputCoinType)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setMinAmount(Number.parseFloat(result.min));
        setMaxAmount(Number.parseFloat(result.max));
      })
      .catch(() => {
        if (!cancelled) {
          setRangeError(t('wallet_changelly_unavailable'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRangeLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, account, outputCoinType, t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const parsed = parseHiveAmount(hiveAmount);
    if (parsed === null || parsed <= 0 || parsed < minAmount) {
      setCryptoAmount('');
      return;
    }
    let cancelled = false;
    setEstimateLoading(true);
    const handle = window.setTimeout(() => {
      void fetchHiveChangellyWithdrawEstimate(account, {
        amount: parsed,
        outputCoinType,
      })
        .then((result) => {
          if (!cancelled) {
            setCryptoAmount(result.result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCryptoAmount('');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setEstimateLoading(false);
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, account, hiveAmount, outputCoinType, minAmount]);

  const addressValid = isValidChangellyWithdrawAddress(outputCoinType, address);

  const parsedHiveAmount = parseHiveAmount(hiveAmount);
  const usdEstimate =
    parsedHiveAmount !== null && parsedHiveAmount > 0
      ? parsedHiveAmount * hiveUsd
      : 0;
  const exceedsUsdCap = usdEstimate > HIVE_CHANGELLY_WITHDRAW_USD_CAP;
  const belowMin =
    parsedHiveAmount !== null && minAmount > 0 && parsedHiveAmount < minAmount;
  const aboveMax =
    parsedHiveAmount !== null && maxAmount > 0 && parsedHiveAmount > maxAmount;
  const needsTrackingReserve =
    parsedHiveAmount !== null &&
    liquidHive < parsedHiveAmount + HIVE_CHANGELLY_TRACKING_HIVE_RESERVE;

  const canSubmit = useMemo(() => {
    if (
      !addressValid ||
      !parsedHiveAmount ||
      parsedHiveAmount <= 0 ||
      !cryptoAmount ||
      exceedsUsdCap ||
      belowMin ||
      aboveMax ||
      needsTrackingReserve ||
      validateHiveWalletAmount(hiveAmount, maxHive) !== null ||
      rangeLoading ||
      estimateLoading ||
      rangeError !== null
    ) {
      return false;
    }
    return true;
  }, [
    addressValid,
    parsedHiveAmount,
    cryptoAmount,
    exceedsUsdCap,
    belowMin,
    aboveMax,
    needsTrackingReserve,
    hiveAmount,
    maxHive,
    rangeLoading,
    estimateLoading,
    rangeError,
  ]);

  const handleQrAccept = useCallback((raw: string) => {
    const parsed = parsePaymentQrUri(raw);
    if (parsed.address) {
      setAddress(parsed.address);
    }
  }, []);

  const onSubmit = async () => {
    if (!parsedHiveAmount || !canSubmit) {
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const createResult = await fetchHiveChangellyWithdrawCreate(account, {
        amount: parsedHiveAmount,
        outputCoinType,
        address: address.trim(),
      });
      const ops = buildHiveChangellyWithdrawTransferOps({
        account,
        createResult: {
          ...createResult,
          outputCoinType,
        },
      });
      const ok = await hiveBroadcast.broadcast(ops);
      if (ok) {
        onClose();
      }
    } catch {
      setValidationError(t('wallet_changelly_unavailable'));
    } finally {
      setSubmitting(false);
    }
  };

  const pending = submitting || hiveBroadcast.pending;

  return (
    <>
      <AppModal open={open} onClose={onClose} labelledBy={titleId}>
        <div className="p-card-padding">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-section font-weight-strong text-fg">
              {t('wallet_changelly_withdraw_title')}
            </h2>
            <AppModalCloseButton onClose={onClose} />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {HIVE_CHANGELLY_OUTPUT_COINS.map((coin) => (
              <button
                key={coin}
                type="button"
                className={[
                  'rounded-btn border px-3 py-1.5 text-body-sm font-weight-strong',
                  coin === outputCoinType
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-surface-control text-fg',
                ].join(' ')}
                onClick={() => setOutputCoinType(coin)}
                disabled={pending}
              >
                {coinLabel(coin)}
              </button>
            ))}
          </div>
          <WalletModalBalanceLine
            amount={maxHive}
            symbol="HIVE"
            onSelect={() => setHiveAmount(maxHive)}
            labelKey="available"
          />
          <WalletAssetAmountField
            label={t('amount')}
            asset="HIVE"
            value={hiveAmount}
            onChange={setHiveAmount}
            onAssetChange={() => undefined}
            options={hiveAssetOptions}
            assetDisabled
            maxAmount={maxHive}
          />
          <div className="mt-4">
            <WalletModalFieldLabel>{t('wallet_changelly_receive')}</WalletModalFieldLabel>
            <div className="mt-1 flex min-h-[2.5rem] items-center rounded-btn border border-border bg-surface-control px-3 text-body text-fg">
              {estimateLoading ? <AppLoader size="sm" /> : cryptoAmount || '—'}{' '}
              {coinLabel(outputCoinType)}
            </div>
          </div>
          <div className="mt-4">
            <WalletModalFieldLabel>{t('wallet_changelly_destination')}</WalletModalFieldLabel>
            <div className="mt-1 flex gap-2">
              <input
                id={addressId}
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="min-w-0 flex-1 rounded-btn border border-border bg-surface-control px-3 py-2 text-body text-fg"
                disabled={pending}
              />
              <button
                type="button"
                className="rounded-btn border border-border bg-surface-control px-3 py-2 text-body-sm font-weight-strong text-fg"
                onClick={() => setQrOpen(true)}
                disabled={pending}
              >
                {t('qr_scanner')}
              </button>
            </div>
            {address ? (
              <p
                className={[
                  'mt-1 text-body-sm',
                  addressValid ? 'text-muted' : 'text-error',
                ].join(' ')}
                role={addressValid ? undefined : 'alert'}
              >
                {addressValid ? t('address_valid') : t('address_not_valid')}
              </p>
            ) : null}
          </div>
          {rangeLoading ? (
            <div className="mt-3">
              <AppLoader size="sm" />
            </div>
          ) : null}
          {rangeError ? (
            <p className="mt-3 text-body-sm text-error" role="alert">
              {rangeError}
            </p>
          ) : null}
          {!rangeLoading && minAmount > 0 ? (
            <p className="mt-3 text-body-sm text-muted">
              {interpolateMessage(t('wallet_changelly_min_amount'), {
                min: String(minAmount),
              })}
            </p>
          ) : null}
          {exceedsUsdCap ? (
            <p className="mt-2 text-body-sm text-error" role="alert">
              {t('wallet_changelly_usd_cap')}
            </p>
          ) : null}
          {needsTrackingReserve ? (
            <p className="mt-2 text-body-sm text-error" role="alert">
              {interpolateMessage(t('wallet_changelly_tracking_reserve'), {
                amount: String(HIVE_CHANGELLY_TRACKING_HIVE_RESERVE),
              })}
            </p>
          ) : null}
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
              disabled={pending}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg disabled:opacity-50"
              disabled={!canSubmit || pending}
              onClick={() => void onSubmit()}
            >
              {t('confirm')}
            </button>
          </div>
        </div>
      </AppModal>
      <WalletQrScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onAccept={handleQrAccept}
      />
    </>
  );
}
