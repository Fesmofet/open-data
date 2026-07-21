'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { EngineWalletSummaryView } from '../../../domain/types/engine-wallet-view';
import { WalletSummaryHeader } from '../shared/wallet-summary-header';
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
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <WalletSummaryHeader
        tone="engine"
        title={t('hive_engine_tokens')}
        subtitle={t('hive_engine_tokens_info')}
        estAccountValueLabel={t('est_account_value')}
        estAccountValue={estValue}
      />
      <div className="divide-y divide-border p-card-padding">
        {combined.map((token) => (
          <EngineWalletBalanceRow key={token.symbol} token={token} />
        ))}
      </div>
    </section>
  );
}
