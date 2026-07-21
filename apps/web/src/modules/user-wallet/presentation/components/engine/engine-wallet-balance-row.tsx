'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatEngineTokenAmountDisplay } from '../../../domain/engine-token-amount';
import type { EngineTokenBalanceRowView } from '../../../domain/types/engine-wallet-view';
import { EngineWalletTokenIcon } from './engine-wallet-token-icon';

function formatUsdEstimate(value: number, locale: string): string {
  const amount = Number.isFinite(value) && value > 0 ? value : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const usd = formatUsdEstimate(token.usdEstimate, locale);

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface">
        <EngineWalletTokenIcon symbol={token.symbol} iconUrl={token.iconUrl} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body font-weight-strong text-fg">{token.symbol}</p>
        <p className="text-body-sm text-muted">{token.name}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <p className="text-body-sm text-muted tabular-nums">
          {hasStake ? (
            <span className="text-caption">
              {t('wallet_liquid_short')}{' '}
            </span>
          ) : null}
          {balance}
        </p>
        <p className="text-body font-weight-strong text-fg tabular-nums">{usd}</p>
        {hasStake ? (
          <p className="text-body-sm tabular-nums">
            <span className="text-caption text-muted">
              {t('wallet_staked_short')}{' '}
            </span>
            <span className="font-weight-strong text-fg">{stake}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
