'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { buildDelegateVestingSharesOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import { formatEngineTokenQuantity } from '../../../domain/engine-token-amount';
import type { EngineTokenDelegationsView } from '../../../domain/types/waiv-wallet-view';
import type { HiveHpDelegationsView } from '../../../domain/types/hive-wallet-view';
import { listWalletMainAssetOptions } from '../../../domain/wallet-modal-balances';
import type {
  WalletMainAsset,
  WalletManageDelegationsModalState,
} from '../../../domain/wallet-modal-types';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenDelegationUserCard } from '../engine-token/engine-token-delegation-user-card';
import { useWalletBalances } from './wallet-balances-context';

export type WalletManageDelegationsModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: WalletManageDelegationsModalState;
};

export function WalletManageDelegationsModal({
  open,
  onClose,
  account,
  state,
}: WalletManageDelegationsModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { waivSummary, hiveSummary, engineSummary } = useWalletBalances();
  const engineBroadcast = useEngineTokenBroadcast(account);
  const hiveBroadcast = useHiveBroadcast(account);

  const [asset, setAsset] = useState<WalletMainAsset>(state.asset);
  const [waivData, setWaivData] = useState<EngineTokenDelegationsView | null>(null);
  const [hiveData, setHiveData] = useState<HiveHpDelegationsView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const assetOptions = useMemo(
    () => listWalletMainAssetOptions(waivSummary, hiveSummary, engineSummary),
    [engineSummary, hiveSummary, waivSummary],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAsset(state.asset);
  }, [open, state.asset]);

  const loadDelegations = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(false);
      try {
        if (asset === 'WAIV') {
          const res = await fetch(
            `/api/users/${encodeURIComponent(account)}/wallet/engine/WAIV/delegations`,
            { signal, cache: 'no-store' },
          );
          if (!res.ok) {
            setLoadError(true);
            setWaivData(null);
            return;
          }
          setWaivData((await res.json()) as EngineTokenDelegationsView);
          return;
        }

        const res = await fetch(
          `/api/users/${encodeURIComponent(account)}/wallet/hive/delegations`,
          { signal, cache: 'no-store' },
        );
        if (!res.ok) {
          setLoadError(true);
          setHiveData(null);
          return;
        }
        setHiveData((await res.json()) as HiveHpDelegationsView);
      } catch {
        if (!signal?.aborted) {
          setLoadError(true);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [account, asset],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const ac = new AbortController();
    void loadDelegations(ac.signal);
    return () => ac.abort();
  }, [open, loadDelegations]);

  const pending = engineBroadcast.pending || hiveBroadcast.pending;
  const error = engineBroadcast.error ?? hiveBroadcast.error;

  const onUndelegateWaiv = async (to: string, quantity: string) => {
    const parsed = Number.parseFloat(quantity);
    const quantityPayload = Number.isFinite(parsed)
      ? formatEngineTokenQuantity(parsed)
      : quantity;
    const ok = await engineBroadcast.broadcast('undelegate', {
      symbol: 'WAIV',
      to,
      quantity: quantityPayload,
    });
    if (ok) {
      await loadDelegations();
    }
  };

  const onUndelegateHive = async (delegatee: string) => {
    const op = buildDelegateVestingSharesOp({
      delegator: account,
      delegatee,
      vestingShares: '0.000000 VESTS',
    });
    const ok = await hiveBroadcast.broadcast([op]);
    if (ok) {
      await loadDelegations();
    }
  };

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="p-card-padding">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-section font-weight-strong text-fg">
            {t('manage_delegations')}
          </h2>
          <AppModalCloseButton onClose={onClose} />
        </div>
        {assetOptions.length > 1 ? (
          <div className="mb-4">
            <label className="sr-only" htmlFor={`${titleId}-asset`}>
              {t('object_edit_wallet_symbol')}
            </label>
            <select
              id={`${titleId}-asset`}
              className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-body text-fg"
              value={asset}
              onChange={(e) => setAsset(e.target.value as WalletMainAsset)}
            >
              {assetOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'WAIV' ? 'WAIV' : 'HIVE'}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {loading ? (
          <AppLoader layout="center" label={t('wallet_delegations_loading')} />
        ) : loadError ? (
          <p className="text-body-sm text-error" role="alert">
            {t('unavailable')}
          </p>
        ) : asset === 'WAIV' && waivData ? (
          <DelegationLists
            incoming={waivData.incoming.map((row) => ({
              key: `in-${row.from}`,
              username: row.from,
              quantity: row.quantity,
              symbol: row.symbol,
            }))}
            outgoing={waivData.outgoing.map((row) => ({
              key: `out-${row.to}`,
              username: row.to,
              quantity: row.quantity,
              symbol: row.symbol,
              onUndelegate: () => void onUndelegateWaiv(row.to, row.quantity),
            }))}
            pending={pending}
            t={t}
          />
        ) : asset === 'HIVE' && hiveData ? (
          <DelegationLists
            incoming={hiveData.incoming.map((row) => ({
              key: `in-${row.delegator}`,
              username: row.delegator,
              quantity: row.hp,
              symbol: 'HP',
            }))}
            outgoing={hiveData.outgoing.map((row) => ({
              key: `out-${row.delegatee}`,
              username: row.delegatee,
              quantity: row.hp,
              symbol: 'HP',
              onUndelegate: () => void onUndelegateHive(row.delegatee),
            }))}
            pending={pending}
            t={t}
          />
        ) : null}
        {error ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {t(engineTokenBroadcastErrorMessageKey(error))}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-btn border border-border px-4 py-2 text-body font-weight-label text-fg"
          onClick={onClose}
        >
          {t('close')}
        </button>
      </div>
    </AppModal>
  );
}

function DelegationLists({
  incoming,
  outgoing,
  pending,
  t,
}: {
  incoming: Array<{
    key: string;
    username: string;
    quantity: string;
    symbol: string;
  }>;
  outgoing: Array<{
    key: string;
    username: string;
    quantity: string;
    symbol: string;
    onUndelegate: () => void;
  }>;
  pending: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      {incoming.length > 0 ? (
        <section>
          <h3 className="mb-2 text-body font-weight-label text-fg">{t('received')}</h3>
          <ul className="space-y-0">
            {incoming.map((row) => (
              <li key={row.key}>
                <EngineTokenDelegationUserCard
                  username={row.username}
                  quantity={row.quantity}
                  symbol={row.symbol}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {outgoing.length > 0 ? (
        <section>
          <h3 className="mb-2 text-body font-weight-label text-fg">{t('delegate')}</h3>
          <ul className="space-y-0">
            {outgoing.map((row) => (
              <li key={row.key}>
                <EngineTokenDelegationUserCard
                  username={row.username}
                  quantity={row.quantity}
                  symbol={row.symbol}
                  action={
                    <button
                      type="button"
                      className="rounded-btn border border-accent px-2 py-1 text-body-sm font-weight-label text-accent disabled:opacity-50"
                      disabled={pending}
                      onClick={row.onUndelegate}
                    >
                      {t('undelegate')}
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {incoming.length === 0 && outgoing.length === 0 ? (
        <p className="text-body-sm text-muted">{t('your_list_is_empty')}</p>
      ) : null}
    </div>
  );
}
