'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, AppLoader } from '@/shared/presentation';

import type { EngineTokenDelegationsView } from '../../../domain/types/waiv-wallet-view';
import type { HiveHpDelegationsView, HiveRcDelegationsView } from '../../../domain/types/hive-wallet-view';
import { formatRcDelegationBillions } from '../../../domain/wallet-modal-format';
import { EngineTokenDelegationUserCard } from '../engine-token/engine-token-delegation-user-card';

export type WalletDelegationsListVariant = 'hiveHp' | 'hiveRc' | 'waiv';

export type WalletDelegationsListModalProps = {
  open: boolean;
  onClose: () => void;
  account: string;
  variant: WalletDelegationsListVariant;
};

type DelegationTab = 'received' | 'delegated';

function parseDelegationAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDelegationTabTotal(
  values: string[],
  { isRc }: { isRc: boolean },
): string {
  const sum = values.reduce((acc, value) => acc + parseDelegationAmount(value), 0);
  return sum.toLocaleString('en-US', {
    minimumFractionDigits: isRc ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function sortByQuantityDesc<T extends { quantity: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => parseDelegationAmount(b.quantity) - parseDelegationAmount(a.quantity),
  );
}

function WalletDelegationTabs({
  receivedLabel,
  delegatedLabel,
  showReceived,
  showDelegated,
  activeTab,
  onTabChange,
  receivedContent,
  delegatedContent,
}: {
  receivedLabel: string;
  delegatedLabel: string;
  showReceived: boolean;
  showDelegated: boolean;
  activeTab: DelegationTab;
  onTabChange: (tab: DelegationTab) => void;
  receivedContent: ReactNode;
  delegatedContent: ReactNode;
}) {
  if (!showReceived && !showDelegated) {
    return null;
  }

  const tabClass = (tab: DelegationTab) =>
    [
      'px-1 pb-2 text-body-sm font-weight-label transition-colors',
      activeTab === tab
        ? 'border-b-2 border-accent text-accent'
        : 'border-b-2 border-transparent text-muted hover:text-fg',
    ].join(' ');

  return (
    <>
      <div className="mb-4 flex gap-6 border-b border-border" role="tablist">
        {showReceived ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'received'}
            className={tabClass('received')}
            onClick={() => onTabChange('received')}
          >
            {receivedLabel}
          </button>
        ) : null}
        {showDelegated ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'delegated'}
            className={tabClass('delegated')}
            onClick={() => onTabChange('delegated')}
          >
            {delegatedLabel}
          </button>
        ) : null}
      </div>
      <div role="tabpanel">
        {activeTab === 'received' ? receivedContent : delegatedContent}
      </div>
    </>
  );
}

export function WalletDelegationsListModal({
  open,
  onClose,
  account,
  variant,
}: WalletDelegationsListModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<DelegationTab>('received');
  const [hiveHp, setHiveHp] = useState<HiveHpDelegationsView | null>(null);
  const [hiveRc, setHiveRc] = useState<HiveRcDelegationsView | null>(null);
  const [waiv, setWaiv] = useState<EngineTokenDelegationsView | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(false);
      try {
        const path =
          variant === 'waiv'
            ? `/api/users/${encodeURIComponent(account)}/wallet/engine/WAIV/delegations`
            : variant === 'hiveRc'
              ? `/api/users/${encodeURIComponent(account)}/wallet/hive/rc-delegations`
              : `/api/users/${encodeURIComponent(account)}/wallet/hive/delegations`;
        const res = await fetch(path, { signal, cache: 'no-store' });
        if (!res.ok) {
          setLoadError(true);
          return;
        }
        const data = await res.json();
        if (variant === 'waiv') {
          setWaiv(data as EngineTokenDelegationsView);
        } else if (variant === 'hiveRc') {
          setHiveRc(data as HiveRcDelegationsView);
        } else {
          setHiveHp(data as HiveHpDelegationsView);
        }
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
    [account, variant],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [open, load]);

  const isRc = variant === 'hiveRc';
  const amountSuffix = variant === 'waiv' ? 'WP' : isRc ? 'b RC' : 'HP';
  const cardSymbol = variant === 'waiv' ? 'WAIV' : variant === 'hiveRc' ? 'b RC' : 'HIVE';

  const hiveHpReceived = useMemo(
    () =>
      sortByQuantityDesc(
        (hiveHp?.incoming ?? []).map((row) => ({
          key: row.delegator,
          username: row.delegator,
          quantity: row.hp,
        })),
      ),
    [hiveHp],
  );

  const hiveHpDelegated = useMemo(() => {
    const outgoing = sortByQuantityDesc(
      (hiveHp?.outgoing ?? []).map((row) => ({
        key: row.delegatee,
        username: row.delegatee,
        quantity: row.hp,
        pending: false,
      })),
    );
    const expiring = sortByQuantityDesc(
      (hiveHp?.expirations ?? []).map((row, index) => ({
        key: `expiring-${row.delegator}-${index}`,
        username: undefined,
        quantity: row.hp,
        pending: true,
      })),
    );
    return [...outgoing, ...expiring];
  }, [hiveHp]);

  const hiveRcReceived = useMemo(
    () =>
      sortByQuantityDesc(
        (hiveRc?.incoming ?? []).map((row) => ({
          key: row.from,
          username: row.from,
          quantity: formatRcDelegationBillions(row.delegatedRc),
        })),
      ),
    [hiveRc],
  );

  const hiveRcDelegated = useMemo(
    () =>
      sortByQuantityDesc(
        (hiveRc?.outgoing ?? []).map((row) => ({
          key: row.to,
          username: row.to,
          quantity: formatRcDelegationBillions(row.delegatedRc),
        })),
      ),
    [hiveRc],
  );

  const waivReceived = useMemo(
    () =>
      sortByQuantityDesc(
        (waiv?.incoming ?? []).map((row) => ({
          key: row.from,
          username: row.from,
          quantity: row.quantity,
        })),
      ),
    [waiv],
  );

  const waivDelegated = useMemo(
    () =>
      sortByQuantityDesc(
        (waiv?.outgoing ?? []).map((row) => ({
          key: row.to,
          username: row.to,
          quantity: row.quantity,
        })),
      ),
    [waiv],
  );

  const showReceived =
    variant === 'hiveHp'
      ? hiveHpReceived.length > 0
      : variant === 'hiveRc'
        ? hiveRcReceived.length > 0
        : waivReceived.length > 0;

  const showDelegated =
    variant === 'hiveHp'
      ? hiveHpDelegated.length > 0
      : variant === 'hiveRc'
        ? hiveRcDelegated.length > 0
        : waivDelegated.length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (showReceived) {
      setActiveTab('received');
      return;
    }
    if (showDelegated) {
      setActiveTab('delegated');
    }
  }, [open, showReceived, showDelegated]);

  const receivedLabel = `${t('wallet_delegations_received')}: ${formatDelegationTabTotal(
    variant === 'hiveHp'
      ? hiveHpReceived.map((row) => row.quantity)
      : variant === 'hiveRc'
        ? hiveRcReceived.map((row) => row.quantity)
        : waivReceived.map((row) => row.quantity),
    { isRc },
  )} ${amountSuffix}`;

  const delegatedQuantities =
    variant === 'hiveHp'
      ? hiveHpDelegated.map((row) => row.quantity)
      : variant === 'hiveRc'
        ? hiveRcDelegated.map((row) => row.quantity)
        : waivDelegated.map((row) => row.quantity);

  const delegatedLabel = `${t('wallet_delegations_delegated')}: ${formatDelegationTabTotal(
    delegatedQuantities,
    { isRc },
  )} ${amountSuffix}`;

  const renderCards = (
    rows: Array<{
      key: string;
      username?: string;
      quantity: string;
      pending?: boolean;
    }>,
  ) => (
    <div>
      {rows.map((row) => (
        <EngineTokenDelegationUserCard
          key={row.key}
          username={row.username}
          quantity={row.quantity}
          symbol={cardSymbol}
          pending={row.pending}
          symbolOnly={isRc}
          minimumFractionDigits={isRc ? 0 : 2}
        />
      ))}
    </div>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="max-w-lg"
    >
      <div className="p-card-padding">
        <div className="mb-2 flex items-start justify-end">
          <span id={titleId} className="sr-only">
            {variant === 'waiv'
              ? `${t('waiv_wallet')} ${t('activity_delegation')}`
              : variant === 'hiveRc'
                ? t('wallet_rc_delegations')
                : t('wallet_hive_delegations')}
          </span>
          <AppModalCloseButton onClose={onClose} />
        </div>
        {loading ? (
          <AppLoader layout="center" label={t('wallet_delegations_loading')} />
        ) : loadError ? (
          <p className="text-body-sm text-error">{t('wallet_delegations_load_error')}</p>
        ) : (
          <WalletDelegationTabs
            receivedLabel={receivedLabel}
            delegatedLabel={delegatedLabel}
            showReceived={showReceived}
            showDelegated={showDelegated}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            receivedContent={renderCards(
              variant === 'hiveHp'
                ? hiveHpReceived
                : variant === 'hiveRc'
                  ? hiveRcReceived
                  : waivReceived,
            )}
            delegatedContent={renderCards(
              variant === 'hiveHp'
                ? hiveHpDelegated
                : variant === 'hiveRc'
                  ? hiveRcDelegated
                  : waivDelegated,
            )}
          />
        )}
      </div>
    </AppModal>
  );
}
