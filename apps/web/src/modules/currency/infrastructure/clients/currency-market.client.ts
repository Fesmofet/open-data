import 'server-only';

import { queryApiFetchOutcome } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import {
  currencyEngineRatesResponseSchema,
  currencyMarketResponseSchema,
  type CurrencyEngineRatesApiResponse,
  type CurrencyMarketApiResponse,
} from '../schemas/currency-market-api.schema';

const CURRENCY_MARKET_CACHE_TAGS = ['query-api:currency:market'] as const;
const CURRENCY_ENGINE_RATES_CACHE_TAGS = ['query-api:currency:engine-rates'] as const;

export type CurrencyMarketFetchResult = {
  market: CurrencyMarketApiResponse | null;
  engine: CurrencyEngineRatesApiResponse | null;
  error: 'unavailable' | null;
};

export async function fetchCurrencyMarket(): Promise<CurrencyMarketApiResponse | null> {
  const outcome = await queryApiFetchOutcome<unknown>('/query/v1/currency/market', {
    cacheTags: [...CURRENCY_MARKET_CACHE_TAGS],
  });

  if (!outcome.ok) {
    return null;
  }

  const parsed = currencyMarketResponseSchema.safeParse(outcome.data);

  return parsed.success ? parsed.data : null;
}

export async function fetchCurrencyEngineRates(): Promise<CurrencyEngineRatesApiResponse | null> {
  const outcome = await queryApiFetchOutcome<unknown>(
    '/query/v1/currency/engine/rates?base=WAIV',
    {
      cacheTags: [...CURRENCY_ENGINE_RATES_CACHE_TAGS],
    },
  );

  if (!outcome.ok) {
    return null;
  }

  const parsed = currencyEngineRatesResponseSchema.safeParse(outcome.data);

  return parsed.success ? parsed.data : null;
}

export async function fetchCurrencyMarketSources(): Promise<CurrencyMarketFetchResult> {
  const [market, engine] = await Promise.all([
    fetchCurrencyMarket(),
    fetchCurrencyEngineRates(),
  ]);

  if (!market) {
    return { market: null, engine, error: 'unavailable' };
  }

  return { market, engine, error: null };
}
