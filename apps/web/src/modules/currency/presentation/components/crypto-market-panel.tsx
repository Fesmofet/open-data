'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { CurrencyMarketPanelData } from '../../domain/currency-market.types';
import { fetchCurrencyMarketPanelClient } from '../../infrastructure/clients/currency-market.browser.client';
import { CryptoMarketRow } from './crypto-market-row';
import { CryptoMarketPanelSkeleton } from './crypto-market-panel-skeleton';

const MARKET_PANEL_CARD_CLASS =
  'min-w-0 overflow-x-hidden rounded-card border border-border bg-surface/60 p-card-padding';

const REFRESH_INTERVAL_MS = 60_000;

type CryptoMarketPanelProps = {
  initialData?: CurrencyMarketPanelData | null;
};

export function CryptoMarketPanel({ initialData = null }: CryptoMarketPanelProps) {
  const { t } = useI18n();
  const [data, setData] = useState<CurrencyMarketPanelData | null>(initialData);
  const [loadError, setLoadError] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [isLoading, setIsLoading] = useState(initialData == null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const outcome = await fetchCurrencyMarketPanelClient();

      if (!outcome.ok) {
        setData((current) => {
          if (current == null) {
            setLoadError(true);
            setRefreshError(false);
          } else {
            setRefreshError(true);
          }

          return current;
        });
        setIsLoading(false);
        return;
      }

      setData(outcome.data);
      setLoadError(false);
      setRefreshError(false);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (initialData == null) {
      refresh();
    }
  }, [initialData, refresh]);

  useEffect(() => {
    let timer: number | undefined;

    const scheduleInterval = () => {
      if (timer != null) {
        window.clearInterval(timer);
        timer = undefined;
      }

      if (document.visibilityState !== 'visible') {
        return;
      }

      timer = window.setInterval(() => {
        refresh();
      }, REFRESH_INTERVAL_MS);
    };

    scheduleInterval();
    document.addEventListener('visibilitychange', scheduleInterval);

    return () => {
      if (timer != null) {
        window.clearInterval(timer);
      }

      document.removeEventListener('visibilitychange', scheduleInterval);
    };
  }, [refresh]);

  if (isLoading && !data) {
    return <CryptoMarketPanelSkeleton />;
  }

  return (
    <div className={MARKET_PANEL_CARD_CLASS}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-section font-weight-strong text-fg">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-muted"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 18h16M6 14l3-4 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('market')}
        </h2>
        <button
          type="button"
          className="rounded-btn border border-border bg-surface-control px-2 py-1 text-caption text-fg"
          onClick={refresh}
          disabled={isPending}
          aria-label={t('currency_market_refresh')}
        >
          {isPending ? '…' : '↻'}
        </button>
      </div>

      {refreshError && data ? (
        <p className="mb-2 text-caption text-muted" role="status">
          {t('currency_market_load_error')}
        </p>
      ) : null}

      {loadError && !data ? (
        <p className="text-caption text-error" role="alert">
          {t('currency_market_load_error')}
        </p>
      ) : null}

      {data ? (
        <div className="min-w-0 space-y-3">
          {data.tokens.map((row) => (
            <CryptoMarketRow key={row.symbol} row={row} />
          ))}
        </div>
      ) : !loadError ? (
        <p className="text-caption text-muted">—</p>
      ) : null}
    </div>
  );
}
