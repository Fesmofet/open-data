'use client';

import { useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { TokenMarketRow } from '../../domain/currency-market.types';
import { CryptoPriceDisplay } from './crypto-price-display';
import { LineChartSvg } from './line-chart-svg';

type CryptoMarketRowProps = {
  row: TokenMarketRow;
};

export function CryptoMarketRow({ row }: CryptoMarketRowProps) {
  const { t } = useI18n();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  const minimumFractionDigits = row.symbol === 'WAIV' ? 3 : 2;

  return (
    <div className="min-w-0 overflow-x-hidden border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-body font-weight-strong text-fg">{row.symbol}</span>
        <button
          type="button"
          className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center text-body leading-none text-link"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="sr-only">
            {expanded ? t('currency_market_collapse') : t('currency_market_expand')}
          </span>
          <span aria-hidden className="block text-section">
            {expanded ? '▴' : '▾'}
          </span>
        </button>
      </div>

      <div className="mt-1 min-w-0">
        <CryptoPriceDisplay
          usdPrice={row.usdPrice}
          usdChangePercent={row.usdChangePercent}
          showUsdChangePercent={row.showUsdChangePercent}
          minimumFractionDigits={minimumFractionDigits}
          secondary={row.secondary}
          align="start"
        />
      </div>

      {expanded ? (
        <div id={panelId} className="relative z-30 mt-2 min-w-0 overflow-visible">
          <LineChartSvg points={row.sparkline} />
        </div>
      ) : null}
    </div>
  );
}
