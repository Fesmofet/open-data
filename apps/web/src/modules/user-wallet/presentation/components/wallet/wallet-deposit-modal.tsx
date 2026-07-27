'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { interpolateMessage } from '@/modules/user-activity/presentation/utils/interpolate-message';
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

function WalletDepositInstructionsParagraph({
  variant,
  symbol,
  swapSymbol,
  account,
}: {
  variant: 'account' | 'address';
  symbol: string;
  swapSymbol: string;
  account: string;
}) {
  const { t } = useI18n();
  const leadKey =
    variant === 'account'
      ? 'wallet_deposit_instructions_lead_account'
      : 'wallet_deposit_instructions_lead_address';
  const highlight = 'font-weight-strong text-fg';

  return (
    <p className="mt-2 text-body-sm text-muted">
      <span className={highlight}>
        {interpolateMessage(t(leadKey), { symbol })}
      </span>{' '}
      {t('wallet_deposit_instructions_confirmed_prefix')}{' '}
      <span className={highlight}>{swapSymbol}</span>{' '}
      {t('wallet_deposit_instructions_credited_to')}{' '}
      <span className={highlight}>@{account}</span>.
    </p>
  );
}

function depositQrCodeUrl(value: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

/** Pretty-print JSON memos for display; copy still uses the raw chain memo. */
function formatDepositMemoForDisplay(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw) as unknown, null, 2);
  } catch {
    return raw;
  }
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
  const showDepositInstructions =
    !loading && hasInstructions && Boolean(accountTarget || address);
  const memoDisplay = memo ? formatDepositMemoForDisplay(memo) : '';
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
            {t('wallet_deposit_processed_by')}{' '}
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
          <p>{t('wallet_deposit_swap_explainer')}</p>
          <p>{t('wallet_deposit_fee_line')}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-body-sm font-weight-strong text-fg">
              1. {t('wallet_deposit_step_asset')}
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
              2. {t('wallet_deposit_step_instructions')}
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
            {showDepositInstructions ? (
              <WalletDepositInstructionsParagraph
                variant={accountTarget ? 'account' : 'address'}
                symbol={symbol}
                swapSymbol={swapSymbol}
                account={account}
              />
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
                <WalletModalFieldLabel>{t('wallet_deposit_send_to')}</WalletModalFieldLabel>
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
                  {t('wallet_deposit_required_memo')}
                </WalletModalFieldLabel>
                <div className="mt-1 flex items-start gap-2">
                  <textarea
                    readOnly
                    rows={Math.min(10, Math.max(4, memoDisplay.split('\n').length))}
                    className="min-w-0 flex-1 resize-none whitespace-pre-wrap break-words rounded-btn border border-border bg-surface px-3 py-2 font-mono text-body-sm text-fg"
                    value={memoDisplay}
                  />
                  <button
                    type="button"
                    className="self-start rounded-btn border border-border px-3 py-2 text-body-sm"
                    onClick={() => void copy(memo)}
                  >
                    {t('copy_button')}
                  </button>
                </div>
                <p className="mt-2 text-body-sm text-error">
                  {t('wallet_deposit_memo_warning')}
                </p>
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
