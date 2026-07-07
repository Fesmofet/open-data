'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import type { HiveEngineCustomJsonPayload } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import type { EngineWithdrawListApiResponse } from '../../../application/dto/engine-swap-api.schema';
import { formatHiveAmount } from '../../../domain/hive-wallet-amount';
import { validateEngineTokenAmount } from '../../../domain/engine-token-form-validation';
import {
  fetchEngineWithdrawList,
  fetchEngineWithdrawQuote,
} from '../../../infrastructure/clients/engine-swap.client';
import type { WalletWithdrawModalState } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import {
  formatWithdrawMinimumHint,
  withdrawQuoteErrorMessage,
} from '../../utils/withdraw-quote-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

const WITHDRAW_FEE_PERCENT = 0.75;
const HIVE_WALLET_OUTPUTS = new Set(['HIVE', 'HBD']);

type WithdrawToken = EngineWithdrawListApiResponse['tokens'][number];

function pairKey(token: WithdrawToken): string {
  return `${token.inputSymbol}:${token.outputSymbol}`;
}

function resolveInitialPairKey(
  tokens: WithdrawToken[],
  inputSymbol?: string,
  outputSymbol?: string,
): string {
  if (inputSymbol && outputSymbol) {
    const preferred = `${inputSymbol.trim().toUpperCase()}:${outputSymbol.trim().toUpperCase()}`;
    const match = tokens.find((item) => pairKey(item) === preferred);
    if (match) {
      return pairKey(match);
    }
  }
  return tokens[0] ? pairKey(tokens[0]) : '';
}

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

  const [withdrawList, setWithdrawList] = useState<WithdrawToken[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [predictiveAmount, setPredictiveAmount] = useState<number | null>(null);
  const [customJson, setCustomJson] = useState<HiveEngineCustomJsonPayload[]>([]);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

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
        setSelectedKey(
          resolveInitialPairKey(
            result.tokens,
            state.inputSymbol,
            state.outputSymbol,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setListError(t('wallet_withdraw_quote_failed'));
          setWithdrawList([]);
          setSelectedKey('');
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
    () => withdrawList.find((item) => pairKey(item) === selectedKey) ?? null,
    [withdrawList, selectedKey],
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
  }, [open, selectedKey, account]);

  const externalAddress = selectedPair?.requiresExternalAddress ? address.trim() : '';
  const previewOnly = Boolean(selectedPair?.requiresExternalAddress && !externalAddress);

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
        address: selectedPair.requiresExternalAddress ? externalAddress : account,
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
    externalAddress,
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
    !previewOnly;

  const handleSubmit = async () => {
    if (!selectedPair || !canSubmit) {
      return;
    }
    const ok = await broadcast.broadcastCustomJson(customJson);
    if (ok) {
      onClose();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('withdraw')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <div className="space-y-3 text-body-sm text-muted">
          <p>
            {t('withdraw_info_part1')}{' '}
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
          <p>
            {t('there_is_a')} {WITHDRAW_FEE_PERCENT}% {t('fee_on_withdrawals')}.
          </p>
          <p>{t('withdraw_info_part2')}</p>
        </div>

        <div className="mt-6 space-y-4">
          {listLoading ? (
            <AppLoader layout="center" label={t('activity_loading')} />
          ) : null}
          {listError ? <p className="text-body-sm text-error">{listError}</p> : null}
          {!listLoading && !listError && withdrawList.length === 0 ? (
            <p className="text-body-sm text-muted">{t('wallet_withdraw_no_pairs')}</p>
          ) : null}

          {selectedPair ? (
            <>
              <div>
                <WalletModalFieldLabel>{t('withdraw')}</WalletModalFieldLabel>
                <select
                  className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-body"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  {withdrawList.map((item) => (
                    <option key={pairKey(item)} value={pairKey(item)}>
                      {item.label} ({item.balance} {item.balanceSymbol})
                    </option>
                  ))}
                </select>
              </div>

              <WalletAssetAmountField
                label={t('amount')}
                value={quantity}
                onChange={setQuantity}
                asset={selectedPair.balanceSymbol}
                onAssetChange={() => undefined}
                options={[
                  {
                    value: selectedPair.balanceSymbol,
                    label: selectedPair.balanceSymbol,
                    balance: selectedPair.balance,
                  },
                ]}
                assetDisabled
                maxAmount={selectedPair.balance}
                placeholder={t('amount_placeholder')}
              />
              <WalletModalBalanceLine
                amount={selectedPair.balance}
                symbol={selectedPair.balanceSymbol}
                onSelect={() => setQuantity(selectedPair.balance)}
              />
              {insufficientFunds ? (
                <p className="text-body-sm text-error">{t('amount_error_funds')}</p>
              ) : null}
              {lowSwapHiveBalance ? (
                <p className="text-body-sm text-error">
                  {t('wallet_withdraw_min_swap_hive')}
                </p>
              ) : null}

              <div>
                <WalletModalFieldLabel>{t('receive')}</WalletModalFieldLabel>
                <div className="mt-1 flex gap-2">
                  <input
                    disabled
                    readOnly
                    className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body disabled:cursor-not-allowed disabled:opacity-70"
                    value={receiveValue}
                  />
                  <div className="rounded-btn border border-border bg-surface px-3 py-2 text-body">
                    {selectedPair.outputSymbol}
                  </div>
                </div>
                {quoteLoading ? (
                  <AppLoader size="sm" label={t('activity_loading')} className="mt-2" />
                ) : null}
              </div>

              {minimumHint ? (
                <p className="text-body-sm text-muted">{minimumHint}</p>
              ) : null}

              <div>
                <WalletModalFieldLabel>{t('destination_address')}</WalletModalFieldLabel>
                {HIVE_WALLET_OUTPUTS.has(selectedPair.outputSymbol) ? (
                  <div className="mt-1 rounded-btn border border-border bg-surface px-3 py-2 text-body">
                    @{account}
                  </div>
                ) : (
                  <input
                    className="mt-1 w-full rounded-btn border border-border bg-bg px-3 py-2 text-body"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('enter_address')}
                  />
                )}
              </div>
            </>
          ) : null}

          {quoteError ? <p className="text-body-sm text-error">{quoteError}</p> : null}
          {previewOnly && quantity && !quoteError && !quoteLoading ? (
            <p className="text-body-sm text-muted">{t('enter_address')}</p>
          ) : null}
          {broadcast.error ? (
            <p className="text-body-sm text-error">
              {t(engineTokenBroadcastErrorMessageKey(broadcast.error))}
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-body-sm text-muted">{t('withdraw_info_part3')}</p>

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
  );
}
