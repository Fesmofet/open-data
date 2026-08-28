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
import { validateHiveWalletAmount } from '../../../domain/hive-wallet-form-validation';
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
import { WalletQrScannerModal } from './wallet-qr-scanner-modal';

export type WalletHiveChangellyWithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletHiveChangellyWithdrawModalState;
};

const CHANGELLY_COIN_LABEL_KEYS: Record<HiveChangellyOutputCoin, string> = {
  btc: 'wallet_changelly_coin_btc',
  ltc: 'wallet_changelly_coin_ltc',
  eth: 'wallet_changelly_coin_eth',
};

function QrScannerIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm15 0h3v3h-3v-3zm-3 3h3v3h-3v-3zM15 15h3v3h-3v-3z" />
    </svg>
  );
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
  const receiveDisplay = estimateLoading ? null : cryptoAmount || '0';
  const usdDisplay = usdEstimate > 0 ? usdEstimate.toFixed(2) : '0.00';

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

          <div className="space-y-4">
            <div>
              <WalletModalFieldLabel>{t('send')}</WalletModalFieldLabel>
              <div className="mt-1 flex items-stretch overflow-hidden rounded-btn border border-border bg-bg">
                <input
                  type="text"
                  inputMode="decimal"
                  value={hiveAmount}
                  onChange={(event) => setHiveAmount(event.target.value)}
                  placeholder="0"
                  disabled={pending}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-body text-fg outline-none focus:ring-0"
                />
                <div className="flex shrink-0 items-center border border-accent px-3 py-2 text-body-sm font-weight-strong text-accent">
                  HIVE
                </div>
              </div>
              {!rangeLoading && minAmount > 0 ? (
                <p
                  className={[
                    'mt-2 text-body-sm',
                    hiveAmount.trim() !== '' && belowMin ? 'text-error' : 'text-muted',
                  ].join(' ')}
                  role={hiveAmount.trim() !== '' && belowMin ? 'alert' : undefined}
                >
                  {interpolateMessage(t('wallet_changelly_min_amount'), {
                    min: String(minAmount),
                  })}
                </p>
              ) : null}
              <WalletModalBalanceLine
                amount={maxHive}
                symbol="HIVE"
                onSelect={() => setHiveAmount(maxHive)}
                labelKey="your_balance"
              />
            </div>

            <div>
              <WalletModalFieldLabel>{t('receive')}</WalletModalFieldLabel>
              <div className="mt-1 flex flex-wrap items-stretch gap-0 overflow-hidden rounded-btn border border-border bg-surface-control">
                <div className="flex min-w-[5rem] flex-1 items-center px-3 py-2 text-body text-muted">
                  {estimateLoading ? (
                    <AppLoader size="sm" />
                  ) : (
                    receiveDisplay
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1 border-l border-border p-1">
                  {HIVE_CHANGELLY_OUTPUT_COINS.map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      className={[
                        'rounded-btn border px-2 py-1.5 text-body-sm font-weight-strong transition-colors',
                        coin === outputCoinType
                          ? 'border-accent text-accent'
                          : 'border-transparent text-fg hover:text-accent',
                      ].join(' ')}
                      onClick={() => setOutputCoinType(coin)}
                      disabled={pending}
                    >
                      {t(CHANGELLY_COIN_LABEL_KEYS[coin])}
                    </button>
                  ))}
                </div>
              </div>
              <p
                className={[
                  'mt-2 text-body-sm',
                  exceedsUsdCap ? 'text-error' : 'text-muted',
                ].join(' ')}
                role={exceedsUsdCap ? 'alert' : undefined}
              >
                {interpolateMessage(t('est_account_value_withdraw'), {
                  amount: usdDisplay,
                })}
              </p>
            </div>

            <div>
              <WalletModalFieldLabel>{t('destination_address')}</WalletModalFieldLabel>
              <div className="mt-1 flex gap-2">
                <input
                  id={addressId}
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder={t('enter_address')}
                  className="min-w-0 flex-1 rounded-btn border border-border bg-bg px-3 py-2 text-body text-fg"
                  disabled={pending}
                />
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 rounded-btn border border-border bg-surface-control px-3 py-2 text-body-sm font-weight-strong text-fg"
                  onClick={() => setQrOpen(true)}
                  disabled={pending}
                >
                  <QrScannerIcon />
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
          </div>

          <p className="mt-4 text-body-sm text-fg">
            <span className="font-weight-strong">{t('notice')}:</span>{' '}
            {t('wallet_changelly_notice')}{' '}
            <a
              href="https://changelly.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-accent"
            >
              Changelly.
            </a>
          </p>

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
              {t('withdraw')}
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
