'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import type { HiveEngineCustomJsonPayload } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import { fetchEngineSwapList, fetchEngineSwapQuote } from '../../../infrastructure/clients/engine-swap.client';
import type { EngineSwapListApiResponse } from '../../../application/dto/engine-swap-api.schema';
import { validateEngineTokenAmount } from '../../../domain/engine-token-form-validation';
import { parseEngineTokenAmount } from '../../../domain/engine-token-amount';
import {
  isDoubleSwapToWaiv,
  resolveInitialSwapSymbols,
  SWAP_IMPACT_PERCENT_OPTIONS,
} from '../../../domain/swap-modal-defaults';
import type { WalletSwapModalState } from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { WalletModalBalanceLine } from '../shared/wallet-modal-balance-line';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletBalances } from './wallet-balances-context';
import { WalletAssetAmountField } from './wallet-asset-amount-field';

type EngineSwapListToken = EngineSwapListApiResponse['tokens'][number];

import { findEngineTokenUsdRate } from '../../../domain/wallet-engine-usd-rate';

export type WalletSwapModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletSwapModalState;
};

export function WalletSwapModal({ open, onClose, account, state }: WalletSwapModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const broadcast = useEngineTokenBroadcast(account);
  const { waivSummary, engineSummary } = useWalletBalances();

  const [tokens, setTokens] = useState<EngineSwapListToken[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [fromSymbol, setFromSymbol] = useState('');
  const [toSymbol, setToSymbol] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [priceImpact, setPriceImpact] = useState('0');
  const [maxImpact, setMaxImpact] = useState<number>(SWAP_IMPACT_PERCENT_OPTIONS[0]);
  const [customJson, setCustomJson] = useState<HiveEngineCustomJsonPayload[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValidationError(null);
    setFromAmount('');
    setToAmount('');
    setPriceImpact('0');
    setMaxImpact(SWAP_IMPACT_PERCENT_OPTIONS[0]);
    setCustomJson([]);
    setListLoading(true);

    let cancelled = false;
    void fetchEngineSwapList(account)
      .then((list) => {
        if (cancelled) {
          return;
        }
        setTokens(list.tokens);
        if (list.tokens.length === 0) {
          setFromSymbol('');
          setToSymbol('');
          return;
        }
        const initial = resolveInitialSwapSymbols(
          list.tokens,
          state.fromSymbol,
          state.toSymbol,
        );
        setFromSymbol(initial.fromSymbol);
        setToSymbol(initial.toSymbol);
      })
      .catch(() => {
        if (!cancelled) {
          setTokens([]);
          setFromSymbol('');
          setToSymbol('');
          setValidationError(t('wallet_engine_unavailable'));
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
  }, [open, account, state.fromSymbol, state.toSymbol, t]);

  const fromToken = useMemo(
    () => tokens.find((token) => token.symbol === fromSymbol) ?? null,
    [tokens, fromSymbol],
  );

  const toToken = useMemo(
    () => tokens.find((token) => token.symbol === toSymbol) ?? null,
    [tokens, toSymbol],
  );

  const fromOptions = useMemo(
    () =>
      tokens.map((token) => ({
        value: token.symbol,
        label: token.symbol,
        balance: token.balance,
      })),
    [tokens],
  );

  const toOptions = useMemo(() => {
    if (!fromToken) {
      return [];
    }
    const options = fromToken.pairs.map((pair) => {
      const token = tokens.find((row) => row.symbol === pair.symbol);
      return {
        value: pair.symbol,
        label: pair.symbol,
        balance: token?.balance ?? '0',
      };
    });
    if (
      isDoubleSwapToWaiv(fromSymbol, toSymbol) &&
      !options.some((option) => option.value === toSymbol)
    ) {
      const waivToken = tokens.find((row) => row.symbol === toSymbol);
      options.push({
        value: toSymbol,
        label: toSymbol,
        balance: waivToken?.balance ?? '0',
      });
    }
    return options;
  }, [fromToken, fromSymbol, toSymbol, tokens]);

  useEffect(() => {
    if (!open || !fromSymbol || !toSymbol) {
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (!fromAmount) {
        if (!cancelled) {
          setToAmount('');
          setCustomJson([]);
          setPriceImpact('0');
        }
        return;
      }
      if (!cancelled) {
        setQuoteLoading(true);
      }
      void fetchEngineSwapQuote(account, {
        fromSymbol,
        toSymbol,
        amountIn: fromAmount,
        direction: 'exactInput',
      })
        .then((quote) => {
          if (cancelled) {
            return;
          }
          setToAmount(quote.amountOut);
          setPriceImpact(quote.priceImpact);
          setCustomJson(quote.customJson as HiveEngineCustomJsonPayload[]);
          setValidationError(null);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setToAmount('');
          setCustomJson([]);
          setValidationError(t('wallet_swap_quote_failed'));
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
  }, [fromAmount, fromSymbol, toSymbol, open, account, t]);

  const waivUsd = waivSummary?.rates.waivUsd ?? 0;
  const estimatedUsd = useMemo(() => {
    const parsed = Number.parseFloat(fromAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    const rate = findEngineTokenUsdRate(fromSymbol, waivUsd, engineSummary);
    return parsed * rate;
  }, [fromAmount, fromSymbol, waivUsd, engineSummary]);

  const insufficientFunds =
    fromToken !== null &&
    parseEngineTokenAmount(fromAmount) !== null &&
    Number.parseFloat(fromAmount) > Number.parseFloat(fromToken.balance);

  const directionLocked = isDoubleSwapToWaiv(fromSymbol, toSymbol);
  const impactNumeric = Number.parseFloat(priceImpact);
  const selectedMaxImpact =
    SWAP_IMPACT_PERCENT_OPTIONS.find((value) => value >= impactNumeric) ??
    SWAP_IMPACT_PERCENT_OPTIONS[SWAP_IMPACT_PERCENT_OPTIONS.length - 1];

  useEffect(() => {
    if (Number.isFinite(impactNumeric) && impactNumeric > maxImpact) {
      setMaxImpact(selectedMaxImpact);
    }
  }, [impactNumeric, maxImpact, selectedMaxImpact]);

  const handleSubmit = async () => {
    if (!fromToken || customJson.length === 0) {
      return;
    }
    const amountError = validateEngineTokenAmount(fromAmount, fromToken.balance);
    if (amountError) {
      setValidationError(t('amount_error_format'));
      return;
    }
    if (impactNumeric > maxImpact) {
      setValidationError(t('wallet_swap_impact_too_high'));
      return;
    }
    const ok = await broadcast.broadcastCustomJson(customJson);
    if (ok) {
      onClose();
    }
  };

  const canSubmit =
    !listLoading &&
    !quoteLoading &&
    !broadcast.pending &&
    Boolean(fromAmount) &&
    Boolean(toAmount) &&
    !insufficientFunds &&
    customJson.length > 0;

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('swap_tokens')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <div className="space-y-4">
          {listLoading ? (
            <AppLoader layout="center" label={t('activity_loading')} />
          ) : (
            <>
          <div>
            <WalletModalFieldLabel>{t('wallet_you_pay')}</WalletModalFieldLabel>
            <WalletAssetAmountField
              value={fromAmount}
              onChange={(value) => {
                setFromAmount(value);
                setValidationError(null);
              }}
              asset={fromSymbol}
              onAssetChange={(nextFrom) => {
                setFromSymbol(nextFrom);
                const nextToken = tokens.find((token) => token.symbol === nextFrom);
                setToSymbol(nextToken?.pairs[0]?.symbol ?? '');
                setFromAmount('');
                setValidationError(null);
              }}
              options={fromOptions}
              assetDisabled={listLoading || fromOptions.length === 0}
              searchableAsset
              maxAmount={fromToken?.balance ?? '0'}
            />
            {fromToken ? (
              <WalletModalBalanceLine
                amount={fromToken.balance}
                symbol={fromToken.symbol}
                onSelect={() => setFromAmount(fromToken.balance)}
                labelKey="available"
              />
            ) : null}
          </div>

          <div className="flex justify-center text-muted" aria-hidden>
            ↓
          </div>

          <div>
            <WalletModalFieldLabel>{t('wallet_you_receive')}</WalletModalFieldLabel>
            <WalletAssetAmountField
              value={toAmount}
              onChange={() => undefined}
              asset={toSymbol}
              onAssetChange={(nextTo) => {
                setToSymbol(nextTo);
                setValidationError(null);
              }}
              options={toOptions}
              assetDisabled={listLoading || directionLocked || toOptions.length === 0}
              searchableAsset
              maxAmount="0"
              amountReadOnly
              showMaxButton={false}
            />
            {toToken ? (
              <WalletModalBalanceLine
                amount={toToken.balance}
                symbol={toToken.symbol}
                onSelect={() => undefined}
                labelKey="current_balance"
                interactive={false}
              />
            ) : null}
          </div>

          <div className="space-y-1 text-body-sm text-muted">
            <p>
              {interpolateMessage(t('wallet_swap_transaction_value'), {
                amount: estimatedUsd.toFixed(2),
              })}
            </p>
            <p>
              {t('wallet_swap_price_impact')}: {priceImpact}%
            </p>
          </div>

          <div className="space-y-2">
            <WalletModalFieldLabel>
              {t('wallet_swap_max_price_impact_label')}
            </WalletModalFieldLabel>
            <div className="flex flex-wrap gap-2">
              {SWAP_IMPACT_PERCENT_OPTIONS.map((imp) => (
                <button
                  key={imp}
                  type="button"
                  className={[
                    'rounded-btn px-3 py-1 text-body-sm',
                    maxImpact === imp
                      ? 'border-2 border-accent bg-surface text-fg'
                      : 'border border-border bg-surface text-fg',
                  ].join(' ')}
                  disabled={impactNumeric > imp}
                  onClick={() => setMaxImpact(imp)}
                >
                  {imp}%
                </button>
              ))}
            </div>
            <p className="text-body-sm text-muted">
              {t('wallet_swap_price_impact_helper')}
            </p>
          </div>

          <p className="text-body-sm text-muted">
            {t('wallet_broadcast_approval_note')}
          </p>

          {validationError ? (
            <p className="text-body-sm text-error" role="alert">
              {validationError}
            </p>
          ) : null}
          {insufficientFunds ? (
            <p className="text-body-sm text-error" role="alert">
              {t('amount_error_funds')}
            </p>
          ) : null}
          {broadcast.error ? (
            <p className="text-body-sm text-error" role="alert">
              {t(engineTokenBroadcastErrorMessageKey(broadcast.error))}
            </p>
          ) : null}
          {quoteLoading ? (
            <AppLoader size="sm" label={t('activity_loading')} />
          ) : null}
            </>
          )}
        </div>

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
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {t('swap_tokens')}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
