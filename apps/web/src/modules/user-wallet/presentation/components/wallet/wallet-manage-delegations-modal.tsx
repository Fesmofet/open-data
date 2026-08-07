'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import type { EngineTokenDelegationsView } from '../../../domain/types/waiv-wallet-view';
import type { HiveHpDelegationsView } from '../../../domain/types/hive-wallet-view';
import {
  formatDelegationTabTotal,
  sortDelegationsByQuantityDesc,
} from '../../../domain/wallet-delegations-format';
import { listWalletManageDelegationsAssetOptions } from '../../../domain/wallet-modal-balances';
import {
  getWalletDelegateAmountAssetLabel,
  getWalletManageDelegationsAssetLabel,
} from '../../../domain/wallet-power-labels';
import type {
  WalletMainAsset,
  WalletManageDelegationsModalState,
} from '../../../domain/wallet-modal-types';
import { EngineTokenDelegationUserCard } from '../engine-token/engine-token-delegation-user-card';
import {
  WalletEditDelegationModal,
  type WalletEditDelegationTarget,
} from './wallet-edit-delegation-modal';
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
  const { waivSummary, hiveSummary } = useWalletBalances();

  const [asset, setAsset] = useState<WalletMainAsset>(state.asset);
  const [waivData, setWaivData] = useState<EngineTokenDelegationsView | null>(null);
  const [hiveData, setHiveData] = useState<HiveHpDelegationsView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [editTarget, setEditTarget] = useState<WalletEditDelegationTarget | null>(
    null,
  );

  const assetOptions = useMemo(
    () => listWalletManageDelegationsAssetOptions(waivSummary, hiveSummary),
    [hiveSummary, waivSummary],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const initialAsset = assetOptions.includes(state.asset)
      ? state.asset
      : (assetOptions[0] ?? state.asset);
    setAsset(initialAsset);
    setEditTarget(null);
  }, [open, state.asset, assetOptions]);

  const loadDelegations = useCallback(async (signal?: AbortSignal) => {
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
  }, [account, asset]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const ac = new AbortController();
    void loadDelegations(ac.signal);
    return () => ac.abort();
  }, [open, loadDelegations]);

  const outgoingRows = useMemo(() => {
    if (asset === 'WAIV' && waivData) {
      return sortDelegationsByQuantityDesc(
        waivData.outgoing.map((row) => ({
          key: `out-${row.to}`,
          username: row.to,
          quantity: row.quantity,
          symbol: row.symbol,
        })),
      );
    }
    if (asset === 'HIVE' && hiveData) {
      return sortDelegationsByQuantityDesc(
        hiveData.outgoing.map((row) => ({
          key: `out-${row.delegatee}`,
          username: row.delegatee,
          quantity: row.hp,
          symbol: 'HP',
        })),
      );
    }
    return [];
  }, [asset, hiveData, waivData]);

  const delegatedTotal = formatDelegationTabTotal(
    outgoingRows.map((row) => row.quantity),
  );
  const amountSuffix = getWalletDelegateAmountAssetLabel(asset);

  const handleManageClose = () => {
    if (editTarget) {
      return;
    }
    onClose();
  };

  return (
    <>
      <AppModal
        open={open}
        onClose={handleManageClose}
        labelledBy={titleId}
        panelClassName="flex max-h-[calc(100dvh-2rem)] flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col p-card-padding">
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
            <h2 id={titleId} className="text-section font-weight-strong text-fg">
              {t('manage_delegations')}
            </h2>
            <AppModalCloseButton onClose={handleManageClose} />
          </div>
          {assetOptions.length > 1 ? (
            <div className="mb-4 shrink-0">
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
                    {getWalletManageDelegationsAssetLabel(value, t)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {loading ? (
            <AppLoader layout="center" label={t('wallet_delegations_loading')} />
          ) : loadError ? (
            <p className="text-body-sm text-error" role="alert">
              {t('wallet_delegations_load_error')}
            </p>
          ) : (
            <>
              <p className="mb-3 shrink-0 text-body-sm text-muted">
                {t('wallet_delegations_delegated')}: {delegatedTotal} {amountSuffix}
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {outgoingRows.length > 0 ? (
                  <ul className="space-y-0">
                    {outgoingRows.map((row) => (
                      <li key={row.key}>
                        <EngineTokenDelegationUserCard
                          username={row.username}
                          quantity={row.quantity}
                          symbol={row.symbol}
                          action={
                            <button
                              type="button"
                              className="rounded-btn border border-accent px-2 py-1 text-body-sm font-weight-label text-accent"
                              onClick={() =>
                                setEditTarget({
                                  asset,
                                  delegatee: row.username,
                                  currentQuantity: row.quantity,
                                })
                              }
                            >
                              {t('edit')}
                            </button>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-sm text-muted">{t('your_list_is_empty')}</p>
                )}
              </div>
            </>
          )}
          <button
            type="button"
            className="mt-6 w-full shrink-0 rounded-btn border border-border px-4 py-2 text-body font-weight-label text-fg"
            onClick={handleManageClose}
          >
            {t('close')}
          </button>
        </div>
      </AppModal>
      {editTarget ? (
        <WalletEditDelegationModal
          open
          onClose={() => setEditTarget(null)}
          account={account}
          target={editTarget}
          waivData={waivData}
          hiveData={hiveData}
          onUpdated={loadDelegations}
        />
      ) : null}
    </>
  );
}
