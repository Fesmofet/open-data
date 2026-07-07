'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import type { EngineDepositListApiResponse } from '../../../application/dto/engine-swap-api.schema';
import {
  fetchEngineDepositAddress,
  fetchEngineDepositList,
} from '../../../infrastructure/clients/engine-swap.client';
import type { WalletDepositModalState } from '../../../domain/wallet-modal-types';
import { isHiveL1TransferAsset } from '../../../domain/wallet-modal-types';
import { WalletModalFieldLabel } from '../shared/wallet-modal-field-label';
import { useWalletModal } from './wallet-modal-context';

function depositQrCodeUrl(value: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

export type WalletDepositModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletDepositModalState;
};

export function WalletDepositModal({
  open,
  onClose,
  account,
}: WalletDepositModalProps) {
  const { t } = useI18n();
  const { openModal } = useWalletModal();
  const titleId = useId();
  const [depositList, setDepositList] = useState<EngineDepositListApiResponse | null>(
    null,
  );
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [symbol, setSymbol] = useState<string>('HIVE');
  const [accountTarget, setAccountTarget] = useState<string | null>(null);
  const [memo, setMemo] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [pair, setPair] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    setDepositList(null);
    setSymbol('HIVE');
    void fetchEngineDepositList(account)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setDepositList(result);
        const preferred =
          result.tokens.find((token) => token.symbol === 'HIVE') ??
          result.tokens[0];
        if (preferred) {
          setSymbol(preferred.symbol);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListError(t('wallet_deposit_unavailable'));
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
  }, [open, account, t]);

  const selectedToken = useMemo(
    () => depositList?.tokens.find((token) => token.symbol === symbol) ?? null,
    [depositList, symbol],
  );

  useEffect(() => {
    if (!open || !symbol || listError) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAccountTarget(null);
    setMemo(null);
    setAddress(null);
    setPair(null);
    void fetchEngineDepositAddress(account, symbol)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setAccountTarget(result.account);
        setMemo(result.memo);
        setAddress(result.address);
        setPair(result.pair);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('wallet_deposit_unavailable'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, account, symbol, listError, t]);

  const copy = async (value: string | null) => {
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
  };

  const swapSymbol = selectedToken?.swapSymbol ?? `SWAP.${symbol}`;
  const hasInstructions =
    !loading && !error && Boolean(address || accountTarget || memo || pair);
  const canContinue =
    hasInstructions &&
    Boolean(accountTarget && memo && isHiveL1TransferAsset(symbol));
  const canDone = hasInstructions && !canContinue;

  const onContinue = () => {
    if (!canContinue || !accountTarget || !memo) {
      return;
    }
    onClose();
    openModal({
      kind: 'transfer',
      asset: symbol,
      presetTo: accountTarget,
      presetMemo: memo,
      lockAsset: true,
      lockRecipient: true,
    });
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('deposit')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>

        <div className="space-y-4 text-body-sm text-muted">
          <p>
            {t('all_crypto_deposits_are_processed_by')}{' '}
            <a
              href="https://hive-engine.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Hive-Engine.com
            </a>
            . {t('deposit_info')}
          </p>
          <p>{t('fee_on_deposits')}</p>
          <p>{t('pay_standard_network_fees')}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-body-sm font-weight-strong text-fg">
              1. {t('select_the_crypto_token_to_deposit')}
            </p>
            <select
              className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-body"
              value={symbol}
              disabled={listLoading || !depositList?.tokens.length}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {(depositList?.tokens ?? []).map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.displayName} ({item.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-body-sm font-weight-strong text-fg">
              2. {t('follow_the_deposit_instructions')}
            </p>
            {listError ? (
              <p className="mt-2 text-body-sm text-error">{listError}</p>
            ) : null}
            {!listError && listLoading ? (
              <AppLoader
                layout="center"
                size="sm"
                label={t('activity_loading')}
                className="mt-2 py-4"
              />
            ) : null}
            {loading ? (
              <AppLoader size="sm" label={t('activity_loading')} className="mt-2" />
            ) : null}
            {!loading && hasInstructions ? (
              <p className="mt-2 text-body-sm text-muted">
                {t('deposit_instructions_part1')}{' '}
                <span className="font-weight-strong text-fg">{symbol}</span>{' '}
                {t('deposit_instructions_part2')}{' '}
                <span className="font-weight-strong text-fg">{swapSymbol}</span> in the{' '}
                <span className="font-weight-strong text-fg">@{account}</span>{' '}
                {t('deposit_instructions_part3')}
              </p>
            ) : null}

            {address ? (
              <div className="mt-3">
                <WalletModalFieldLabel>{t('wallet_deposit_address')}</WalletModalFieldLabel>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
                    value={address}
                  />
                  <button
                    type="button"
                    className="rounded-btn border border-border px-3 py-2 text-body-sm"
                    onClick={() => void copy(address)}
                    aria-label={t('copy_button')}
                  >
                    {t('copy_button')}
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={depositQrCodeUrl(address)}
                    alt=""
                    width={220}
                    height={220}
                    className="rounded-btn border border-border bg-surface p-2"
                  />
                </div>
              </div>
            ) : null}

            {accountTarget ? (
              <div className="mt-3">
                <WalletModalFieldLabel>{t('deposit_account')}</WalletModalFieldLabel>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
                    value={accountTarget}
                  />
                  <button
                    type="button"
                    className="rounded-btn border border-border px-3 py-2 text-body-sm"
                    onClick={() => void copy(accountTarget)}
                  >
                    {t('copy_button')}
                  </button>
                </div>
              </div>
            ) : null}

            {memo ? (
              <div className="mt-3">
                <WalletModalFieldLabel>
                  {t('memo')} ({t('required_field')})
                </WalletModalFieldLabel>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 text-body-sm"
                    value={memo}
                  />
                  <button
                    type="button"
                    className="rounded-btn border border-border px-3 py-2 text-body-sm"
                    onClick={() => void copy(memo)}
                  >
                    {t('copy_button')}
                  </button>
                </div>
                <p className="mt-2 text-body-sm text-error">{t('memo_attention')}</p>
              </div>
            ) : null}

            {error ? <p className="mt-2 text-body-sm text-error">{error}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-btn border border-border bg-surface px-4 py-2 text-body font-weight-strong text-fg"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          {canContinue ? (
            <button
              type="button"
              className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg"
              onClick={onContinue}
            >
              {t('continue')}
            </button>
          ) : null}
          {canDone ? (
            <button
              type="button"
              className="rounded-btn bg-accent px-4 py-2 text-body font-weight-strong text-accent-fg"
              onClick={onClose}
            >
              {t('done')}
            </button>
          ) : null}
        </div>
      </div>
    </AppModal>
  );
}
