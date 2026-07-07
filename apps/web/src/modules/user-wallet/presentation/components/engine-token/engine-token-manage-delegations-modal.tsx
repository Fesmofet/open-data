'use client';

import { useCallback, useEffect, useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  AppModal,
  AppModalCloseButton,
  AppLoader,
} from '@/shared/presentation';

import { formatEngineTokenQuantity } from '../../../domain/engine-token-amount';
import type { EngineTokenDelegationsView } from '../../../domain/types/waiv-wallet-view';
import { useEngineTokenBroadcast } from '../../hooks/use-engine-token-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import type { EngineTokenManageModalState } from './engine-token-modal-context';
import { EngineTokenDelegationUserCard } from './engine-token-delegation-user-card';

export type EngineTokenManageDelegationsModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  state: EngineTokenManageModalState;
};

export function EngineTokenManageDelegationsModal({
  open,
  onClose,
  account,
  state,
}: EngineTokenManageDelegationsModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error } = useEngineTokenBroadcast(account);
  const [data, setData] = useState<EngineTokenDelegationsView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadDelegations = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(
          `/api/users/${encodeURIComponent(account)}/wallet/engine/${encodeURIComponent(state.symbol)}/delegations`,
          { signal, cache: 'no-store' },
        );
        if (!res.ok) {
          setLoadError(true);
          setData(null);
          return;
        }
        const json = (await res.json()) as EngineTokenDelegationsView;
        setData(json);
      } catch (e) {
        if (!signal?.aborted) {
          setLoadError(true);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [account, state.symbol],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const ac = new AbortController();
    void loadDelegations(ac.signal);
    return () => ac.abort();
  }, [open, loadDelegations]);

  const onUndelegate = async (to: string, quantity: string) => {
    const parsed = Number.parseFloat(quantity);
    const quantityPayload = Number.isFinite(parsed)
      ? formatEngineTokenQuantity(parsed)
      : quantity;
    const ok = await broadcast('undelegate', {
      symbol: state.symbol,
      to,
      quantity: quantityPayload,
    });
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
        <p className="mb-4 text-body-sm text-muted">
          <span className="font-weight-label text-fg">{t('token')}:</span> {state.symbol}
        </p>
        {loading ? (
          <AppLoader layout="center" label={t('wallet_delegations_loading')} />
        ) : loadError ? (
          <p className="text-body-sm text-error" role="alert">
            {t('unavailable')}
          </p>
        ) : data ? (
          <div className="space-y-6">
            {data.incoming.length > 0 ? (
              <section>
                <h3 className="mb-2 text-body font-weight-label text-fg">
                  {t('received')}
                </h3>
                <ul className="space-y-0">
                  {data.incoming.map((row) => (
                    <li key={`in-${row.from}-${row.to}-${row.quantity}`}>
                      <EngineTokenDelegationUserCard
                        username={row.from}
                        quantity={row.quantity}
                        symbol={row.symbol}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {data.outgoing.length > 0 ? (
              <section>
                <h3 className="mb-2 text-body font-weight-label text-fg">
                  {t('delegate')}
                </h3>
                <ul className="space-y-0">
                  {data.outgoing.map((row) => (
                    <li key={`out-${row.from}-${row.to}-${row.quantity}`}>
                      <EngineTokenDelegationUserCard
                        username={row.to}
                        quantity={row.quantity}
                        symbol={row.symbol}
                        action={
                          <button
                            type="button"
                            className="rounded-btn border border-accent px-2 py-1 text-body-sm font-weight-label text-accent disabled:opacity-50"
                            disabled={pending}
                            onClick={() => void onUndelegate(row.to, row.quantity)}
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
            {data.incoming.length === 0 && data.outgoing.length === 0 ? (
              <p className="text-body-sm text-muted">—</p>
            ) : null}
          </div>
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
