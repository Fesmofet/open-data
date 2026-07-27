'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import type { HiveEngineCustomJsonPayload } from '@opden-data-layer/hive-broadcast';

import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import type { EngineWithdrawListApiResponse } from '../../../application/dto/engine-swap-api.schema';
import { formatHiveAmount } from '../../../domain/hive-wallet-amount';
import { validateEngineTokenAmount } from '../../../domain/engine-token-form-validation';
import {
  matchQrSchemeToWithdrawPair,
  parsePaymentQrUri,
} from '../../../domain/payment-qr-uri';
import { solveWithdrawInputForTargetReceive } from '../../../domain/solve-withdraw-input-for-target-receive';
import { findEngineTokenUsdRate } from '../../../domain/wallet-engine-usd-rate';
import type { WalletWithdrawModalState } from '../../../domain/wallet-modal-types';
import {
  findWithdrawPair,
  resolveInitialWithdrawSymbols,
  uniqueWithdrawInputOptions,
  withdrawOutputOptions,
} from '../../../domain/withdraw-modal-defaults';
import {
  fetchEngineWithdrawList,
  fetchEngineWithdrawQuote,
} from '../../../infrastructure/clients/engine-swap.client';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import {
  formatWithdrawMinimumHint,
  withdrawQuoteErrorMessage,
} from '../../utils/withdraw-quote-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';
import { WalletQrScannerModal } from './wallet-qr-scanner-modal';

const WITHDRAW_FEE_PERCENT = 0.75;
const HIVE_WALLET_OUTPUTS = new Set(['HIVE', 'HBD']);

type WithdrawToken = EngineWithdrawListApiResponse['tokens'][number];

function formatWithdrawReceiveAmount(
  amount: number,
  outputSymbol: string,
): string {
  if (outputSymbol === 'HIVE' || outputSymbol === 'HBD') {
    return formatHiveAmount(amount, 3);
  }
  return String(amount);
}

export type WalletWithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletWithdrawModalState;
};

export function WalletWithdrawModal({
  open,
  onClose,
  account,
  state,
}: WalletWithdrawModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const broadcast = useEngineTokenBroadcast(account);
  const { waivSummary, engineSummary } = useWalletBalances();

  const [withdrawList, setWithdrawList] = useState<WithdrawToken[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [inputSymbol, setInputSymbol] = useState('');
  const [outputSymbol, setOutputSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [predictiveAmount, setPredictiveAmount] = useState<number | null>(null);
  const [customJson, setCustomJson] = useState<HiveEngineCustomJsonPayload[]>([]);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSolving, setQrSolving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    void fetchEngineWithdrawList(account)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setWithdrawList(result.tokens);
        const initial = resolveInitialWithdrawSymbols(
          result.tokens,
          state.inputSymbol,
          state.outputSymbol,
        );
        setInputSymbol(initial.inputSymbol);
        setOutputSymbol(initial.outputSymbol);
      })
      .catch(() => {
        if (!cancelled) {
          setListError(t('wallet_withdraw_quote_failed'));
          setWithdrawList([]);
          setInputSymbol('');
          setOutputSymbol('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setListLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, account, state.inputSymbol, state.outputSymbol, t]);

  const selectedPair = useMemo(
    () => findWithdrawPair(withdrawList, inputSymbol, outputSymbol),
    [withdrawList, inputSymbol, outputSymbol],
  );

  const payOptions = useMemo(
    () => uniqueWithdrawInputOptions(withdrawList),
    [withdrawList],
  );

  const receiveOptions = useMemo(
    () => withdrawOutputOptions(withdrawList, inputSymbol),
    [withdrawList, inputSymbol],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuantity('');
    setAddress('');
    setPredictiveAmount(null);
    setCustomJson([]);
    setQuoteError(null);
    broadcast.setError(null);
  }, [open, inputSymbol, outputSymbol, account]);

  const externalAddress = selectedPair?.requiresExternalAddress
    ? address.trim()
    : '';
  const previewOnly = Boolean(
    selectedPair?.requiresExternalAddress && !externalAddress,
  );

  const quoteAddress = selectedPair?.requiresExternalAddress
    ? externalAddress
    : account;

  useEffect(() => {
    if (!open || !selectedPair || !quantity) {
      setPredictiveAmount(null);
      setCustomJson([]);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const amountError = validateEngineTokenAmount(quantity, selectedPair.balance);
    if (amountError) {
      setPredictiveAmount(null);
      setCustomJson([]);
      setQuoteError(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    const handle = window.setTimeout(() => {
      void fetchEngineWithdrawQuote(account, {
        inputSymbol: selectedPair.inputSymbol,
        outputSymbol: selectedPair.outputSymbol,
        quantity,
        address: quoteAddress,
        previewOnly,
      })
        .then((result) => {
          if (cancelled) {
            return;
          }
          setPredictiveAmount(result.predictiveAmount);
          setCustomJson(result.customJsonPayload as HiveEngineCustomJsonPayload[]);
          setQuoteError(withdrawQuoteErrorMessage(t, result));
        })
        .catch(() => {
          if (!cancelled) {
            setQuoteError(t('wallet_withdraw_quote_failed'));
            setPredictiveAmount(null);
            setCustomJson([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setQuoteLoading(false);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    open,
    account,
    selectedPair,
    quantity,
    quoteAddress,
    previewOnly,
    t,
  ]);

  const insufficientFunds = selectedPair
    ? validateEngineTokenAmount(quantity, selectedPair.balance) !== null
    : false;
  const isSwapHiveToHive =
    selectedPair?.inputSymbol === 'SWAP.HIVE' &&
    selectedPair.outputSymbol === 'HIVE';
  const lowSwapHiveBalance =
    isSwapHiveToHive && Number.parseFloat(selectedPair.balance) < 0.001;

  const receiveValue = useMemo(() => {
    if (predictiveAmount !== null) {
      return formatWithdrawReceiveAmount(
        predictiveAmount,
        selectedPair?.outputSymbol ?? '',
      );
    }
    if (quoteLoading) {
      return '';
    }
    if (selectedPair?.inputSymbol === 'WAIV' || quoteError) {
      return '';
    }
    if (!quantity) {
      return '';
    }
    const parsed = Number.parseFloat(quantity);
    if (!Number.isFinite(parsed)) {
      return '';
    }
    return formatWithdrawReceiveAmount(
      Math.max(0, parsed * (1 - WITHDRAW_FEE_PERCENT / 100)),
      selectedPair?.outputSymbol ?? '',
    );
  }, [quoteLoading, predictiveAmount, selectedPair, quantity, quoteError]);

  const waivUsd = waivSummary?.rates.waivUsd ?? 0;
  const estimatedUsd = useMemo(() => {
    const parsed = Number.parseFloat(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0 || !selectedPair) {
      return 0;
    }
    const rate = findEngineTokenUsdRate(
      selectedPair.balanceSymbol,
      waivUsd,
      engineSummary,
    );
    return parsed * rate;
  }, [quantity, selectedPair, waivUsd, engineSummary]);

  const minimumHint = selectedPair
    ? formatWithdrawMinimumHint(t, selectedPair)
    : null;

  const canSubmit =
    Boolean(selectedPair) &&
    Boolean(quantity) &&
    (!selectedPair?.requiresExternalAddress || Boolean(externalAddress)) &&
    !insufficientFunds &&
    !lowSwapHiveBalance &&
    !quoteError &&
    predictiveAmount !== null &&
    predictiveAmount > 0 &&
    customJson.length > 0 &&
    !quoteLoading &&
    !previewOnly &&
    !qrSolving;

  const handleSubmit = async () => {
    if (!selectedPair || !canSubmit) {
      return;
    }
    const ok = await broadcast.broadcastCustomJson(customJson);
    if (ok) {
      onClose();
    }
  };

  const handleQrAccept = useCallback(
    async (raw: string) => {
      const parsed = parsePaymentQrUri(raw);
      if (parsed.address) {
        setAddress(parsed.address);
      }
      const schemeMatch = matchQrSchemeToWithdrawPair(
        parsed.scheme,
        withdrawList,
      );
      if (schemeMatch) {
        setInputSymbol(schemeMatch.inputSymbol);
        setOutputSymbol(schemeMatch.outputSymbol);
      }
      if (parsed.amount === null || !Number.isFinite(parsed.amount)) {
        return;
      }
      const pair =
        schemeMatch !== null
          ? findWithdrawPair(
              withdrawList,
              schemeMatch.inputSymbol,
              schemeMatch.outputSymbol,
            )
          : selectedPair;
      if (!pair) {
        return;
      }
      const addrForQuote = pair.requiresExternalAddress
        ? parsed.address.trim()
        : account;
      if (pair.requiresExternalAddress && !addrForQuote) {
        return;
      }
      setQrSolving(true);
      try {
        const maxInput = Number.parseFloat(pair.balance);
        const solved = await solveWithdrawInputForTargetReceive({
          targetReceive: parsed.amount,
          maxInput,
          fetchQuote: async (q) => {
            const result = await fetchEngineWithdrawQuote(account, {
              inputSymbol: pair.inputSymbol,
              outputSymbol: pair.outputSymbol,
              quantity: q,
              address: addrForQuote,
              previewOnly: false,
            });
            return {
              predictiveAmount: result.predictiveAmount,
              error: result.error,
            };
          },
        });
        if (solved.ok) {
          setQuantity(solved.quantity);
        }
      } finally {
        setQrSolving(false);
      }
    },
    [account, withdrawList, selectedPair],
  );

  const showQrButton =
    selectedPair && !HIVE_WALLET_OUTPUTS.has(selectedPair.outputSymbol);

  return (
    <>
      <AppModal open={open} onClose={onClose} labelledBy={titleId}>
        <div className="p-card-padding">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-section font-weight-strong text-fg">
              {t('withdraw')}
            </h2>
            <AppModalCloseButton onClose={onClose} />
          </div>

          <div className="space-y-2 text-body-sm text-muted">
            <p>
              {t('wallet_withdraw_processed_by')}{' '}
              <a
                href="https://hive-engine.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                Hive-Engine.com
              </a>
              .
            </p>
            <p>{t('wallet_withdraw_fee_line')}</p>
          </div>

          <div className="mt-6 space-y-4">
            {listLoading ? (
              <AppLoader layout="center" label={t('activity_loading')} />
            ) : null}
            {listError ? (
              <p className="text-body-sm text-error">{listError}</p>
            ) : null}
            {!listLoading && !listError && withdrawList.length === 0 ? (
              <p className="text-body-sm text-muted">{t('wallet_withdraw_no_pairs')}</p>
            ) : null}

            {selectedPair ? (
              <>
                <div>
                  <WalletModalFieldLabel>
                    {t('wallet_you_pay')}
                  </WalletModalFieldLabel>
                  <WalletAssetAmountField
                    value={quantity}
                    onChange={setQuantity}
                    asset={inputSymbol}
                    onAssetChange={(nextInput) => {
                      setInputSymbol(nextInput);
                      const outputs = withdrawOutputOptions(
                        withdrawList,
                        nextInput,
                      );
                      setOutputSymbol(outputs[0]?.value ?? '');
                    }}
                    options={payOptions}
                    assetDisabled={listLoading || payOptions.length === 0}
                    searchableAsset
                    maxAmount={selectedPair.balance}
                    placeholder={t('amount_placeholder')}
                  />
                  <WalletModalBalanceLine
                    amount={selectedPair.balance}
                    symbol={selectedPair.balanceSymbol}
                    onSelect={() => setQuantity(selectedPair.balance)}
                  />
                  {insufficientFunds ? (
                    <p className="text-body-sm text-error">
                      {t('amount_error_funds')}
                    </p>
                  ) : null}
                  {lowSwapHiveBalance ? (
                    <p className="text-body-sm text-error">
                      {t('wallet_withdraw_min_swap_hive')}
                    </p>
                  ) : null}
                </div>

                <div>
                  <WalletModalFieldLabel>
                    {t('wallet_you_receive')}
                  </WalletModalFieldLabel>
                  <WalletAssetAmountField
                    value={receiveValue}
                    onChange={() => undefined}
                    asset={outputSymbol}
                    onAssetChange={(nextOutput) => {
                      setOutputSymbol(nextOutput);
                    }}
                    options={receiveOptions}
                    assetDisabled={
                      listLoading || receiveOptions.length === 0
                    }
                    searchableAsset
                    maxAmount="0"
                    amountReadOnly
                    showMaxButton={false}
                  />
                  {quoteLoading || qrSolving ? (
                    <AppLoader
                      size="sm"
                      label={t('activity_loading')}
                      className="mt-2"
                    />
                  ) : null}
                  <p className="mt-2 text-body-sm text-muted">
                    {interpolateMessage(t('wallet_withdraw_value_usd'), {
                      amount: estimatedUsd.toFixed(2),
                    })}
                  </p>
                </div>

                {minimumHint ? (
                  <p className="text-body-sm text-muted">{minimumHint}</p>
                ) : null}

                <div>
                  <WalletModalFieldLabel>
                    {t('destination_address')}
                  </WalletModalFieldLabel>
                  {HIVE_WALLET_OUTPUTS.has(selectedPair.outputSymbol) ? (
                    <div className="mt-1 rounded-btn border border-border bg-surface px-3 py-2 text-body">
                      @{account}
                    </div>
                  ) : (
                    <div className="mt-1 flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-btn border border-border bg-bg px-3 py-2 text-body"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t('wallet_withdraw_address_placeholder')}
                      />
                      {showQrButton ? (
                        <button
                          type="button"
                          className="shrink-0 rounded-btn border border-border bg-surface px-3 py-2 text-body-sm font-weight-strong text-fg"
                          onClick={() => setQrOpen(true)}
                        >
                          {t('qr_scanner')}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {quoteError ? (
              <p className="text-body-sm text-error">{quoteError}</p>
            ) : null}
            {broadcast.error ? (
              <p className="text-body-sm text-error">
                {t(engineTokenBroadcastErrorMessageKey(broadcast.error))}
              </p>
            ) : null}
          </div>

          <p className="mt-4 text-body-sm text-muted">
            {t('wallet_withdraw_hivesigner_note')}
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-btn border border-border bg-surface px-4 py-2 text-body font-weight-strong text-fg"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg disabled:opacity-50"
              disabled={!canSubmit || broadcast.pending}
              onClick={() => void handleSubmit()}
            >
              {broadcast.pending ? '…' : t('withdraw')}
            </button>
          </div>
        </div>
      </AppModal>

      <WalletQrScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onAccept={(raw) => void handleQrAccept(raw)}
      />
    </>
  );
}
