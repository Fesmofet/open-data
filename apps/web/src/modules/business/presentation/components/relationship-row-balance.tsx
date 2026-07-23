'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PairBalanceView } from '../../domain/ledger.types';
import {
  DirectionalUsd,
  formatPendingBalanceLine,
  shouldShowPendingWhenSettled,
} from './directional-usd';

export type RelationshipRowBalanceProps = {
  viewer: string;
  counterparty: string;
  balance: PairBalanceView;
};

export function RelationshipRowBalance({
  viewer,
  counterparty,
  balance,
}: RelationshipRowBalanceProps) {
  const { t } = useI18n();
  const showPending = shouldShowPendingWhenSettled(
    viewer,
    balance.accountA,
    balance.accountB,
    balance.confirmed,
    balance.pending,
  );
  const pendingLine = showPending
    ? formatPendingBalanceLine(
        viewer,
        counterparty,
        balance.accountA,
        balance.accountB,
        balance.pending,
        t,
      )
    : '';

  return (
    <div className="mt-1">
      <DirectionalUsd
        viewer={viewer}
        counterparty={counterparty}
        accountA={balance.accountA}
        accountB={balance.accountB}
        bucket={balance.confirmed}
      />
      {pendingLine ? (
        <p className="mt-1 text-caption text-fg-secondary">{pendingLine}</p>
      ) : null}
    </div>
  );
}
