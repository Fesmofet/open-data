'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import { EngineWalletBalanceRow } from './engine-wallet-balance-row';

export type EngineWalletSummaryProps = {
  summary: EngineWalletSummaryView;
};

export function EngineWalletSummary({ summary }: EngineWalletSummaryProps) {
  const { t, locale } = useI18n();
  const combined = [...summary.pinnedTokens, ...summary.tokens];
  const estValue = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(summary.estimatedAccountValueUsd);

  return (
    <section className="rounded-card border border-border bg-surface/80 p-card-padding">
      <div className="divide-y divide-border">
        {combined.map((token) => (
          <EngineWalletBalanceRow key={token.symbol} token={token} />
        ))}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-body-sm text-muted">
        {t('est_account_value')}:{' '}
        <span className="font-weight-strong text-fg">{estValue}</span>
      </p>
    </section>
  );
}
