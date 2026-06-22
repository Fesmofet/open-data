'use client';

import { useCallback, useEffect, useId, useState } from 'react';

import { buildUndelegateRcOp } from '@opden-data-layer/hive-broadcast';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton } from '@/shared/presentation';

import type { HiveRcDelegationsView } from '../../../domain/types/hive-wallet-view';
import { formatRcDelegationBillions } from '../../../domain/wallet-modal-format';
import { useHiveBroadcast } from '../../hooks/use-hive-broadcast';
import { engineTokenBroadcastErrorMessageKey } from '../../utils/engine-token-broadcast-error-message';
import { EngineTokenDelegationUserCard } from '../engine-token/engine-token-delegation-user-card';

export type HiveManageRcDelegationsModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
};

export function HiveManageRcDelegationsModal({
  open,
  onClose,
  account,
}: HiveManageRcDelegationsModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { broadcast, pending, error } = useHiveBroadcast(account);
  const [data, setData] = useState<HiveRcDelegationsView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadDelegations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(account)}/wallet/hive/rc-delegations`,
        { signal, cache: 'no-store' },
      );
      if (!res.ok) {
        setLoadError(true);
        setData(null);
        return;
      }
      const json = (await res.json()) as HiveRcDelegationsView;
      setData(json);
    } catch {
      if (!signal?.aborted) {
        setLoadError(true);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [account]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const ac = new AbortController();
    void loadDelegations(ac.signal);
    return () => ac.abort();
  }, [open, loadDelegations]);

  const onUndelegate = async (to: string, rc: number) => {
    const op = buildUndelegateRcOp({ from: account, to, rc });
    const ok = await broadcast([op]);
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
        {loading ? (
          <p className="text-body-sm text-muted">{t('wallet_delegations_loading')}</p>
        ) : loadError ? (
          <p className="text-body-sm text-error" role="alert">
            {t('wallet_delegations_load_error')}
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
                    <li key={`in-${row.from}-${row.delegatedRc}`}>
                      <EngineTokenDelegationUserCard
                        username={row.from}
                        quantity={formatRcDelegationBillions(row.delegatedRc)}
                        symbol="b RC"
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
                    <li key={`out-${row.to}-${row.delegatedRc}`}>
                      <EngineTokenDelegationUserCard
                        username={row.to}
                        quantity={formatRcDelegationBillions(row.delegatedRc)}
                        symbol="b RC"
                        action={
                          <button
                            type="button"
                            className="rounded-btn border border-accent px-2 py-1 text-body-sm font-weight-label text-accent disabled:opacity-50"
                            disabled={pending}
                            onClick={() => void onUndelegate(row.to, row.delegatedRc)}
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
