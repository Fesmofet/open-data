'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatEngineTokenAmountDisplay } from '../../../domain/engine-token-amount';
import type { EngineTokenBalanceRowView } from '../../../domain/types/engine-wallet-view';
import { EngineWalletTokenIcon } from './engine-wallet-token-icon';

function formatUsdEstimate(value: number, locale: string): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type EngineWalletBalanceRowProps = {
  token: EngineTokenBalanceRowView;
};

export function EngineWalletBalanceRow({ token }: EngineWalletBalanceRowProps) {
  const { t, locale } = useI18n();
  const stake = formatEngineTokenAmountDisplay(token.stake);
  const balance = formatEngineTokenAmountDisplay(token.balance);
  const hasStake =
    token.stakingEnabled && stake !== '0' && stake.length > 0;

  return (
    <div className="flex gap-3 py-3">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface">
        <EngineWalletTokenIcon symbol={token.symbol} iconUrl={token.iconUrl} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-body-sm">
            {token.symbol}{' '}
            <span className="text-muted">
              ({formatUsdEstimate(token.usdEstimate, locale)})
            </span>
          </p>
          <p className="shrink-0 text-right text-body-sm font-weight-strong">
            {hasStake ? (
              <span className="text-caption text-muted">
                {t('wallet_liquid_short')}{' '}
              </span>
            ) : null}
            {balance} {token.symbol}
          </p>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <p className="text-caption text-muted">{token.name}</p>
          {hasStake ? (
            <p className="shrink-0 text-right text-body-sm">
              <span className="text-caption text-muted">
                {t('wallet_staked_short')}{' '}
              </span>
              <span className="font-weight-strong">
                {stake} {token.symbol}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
