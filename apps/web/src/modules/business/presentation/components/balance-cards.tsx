'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PairBalanceView } from '../../domain/ledger.types';
import { DirectionalUsd, formatDisplayUsd } from './directional-usd';

export type BalanceCardsProps = {
  viewer: string;
  counterparty: string;
  balance: PairBalanceView;
};

function formatNetUsd(netUsd: string): string {
  return formatDisplayUsd(Number(netUsd) || 0);
}

export function BalanceCards({ viewer, counterparty, balance }: BalanceCardsProps) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="rounded-card border border-border bg-surface p-card-padding shadow-card">
        <h3 className="text-caption font-weight-label text-fg-secondary">
          {t('business_balance_confirmed')}
        </h3>
        <div className="mt-2">
          <DirectionalUsd
            viewer={viewer}
            counterparty={counterparty}
            accountA={balance.accountA}
            accountB={balance.accountB}
            bucket={balance.confirmed}
          />
        </div>
        <p className="mt-2 text-caption text-fg-tertiary">
          {t('business_balance_confirmed_hint')}
        </p>
      </section>
      <section className="rounded-card border border-border bg-surface-alt p-card-padding shadow-card">
        <h3 className="text-caption font-weight-label text-fg-secondary">
          {t('business_balance_pending')}
        </h3>
        <p className="mt-2 text-body font-weight-strong text-heading">
          ${formatNetUsd(balance.pending.netUsd)}
        </p>
        <p className="mt-2 text-caption text-fg-tertiary">
          {t('business_balance_pending_hint')}
        </p>
      </section>
      <section className="rounded-card border border-border bg-surface-alt p-card-padding shadow-card">
        <h3 className="text-caption font-weight-label text-fg-secondary">
          {t('business_balance_disputed')}
        </h3>
        <p className="mt-2 text-body font-weight-strong text-heading">
          ${formatNetUsd(balance.disputed.netUsd)}
        </p>
        <p className="mt-2 text-caption text-fg-tertiary">
          {t('business_balance_disputed_hint')}
        </p>
      </section>
    </div>
  );
}
