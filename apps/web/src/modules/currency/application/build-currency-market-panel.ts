import { mapMarketPanelData } from '../domain/map-market-panel-data';
import type { CurrencyMarketPanelData } from '../domain/currency-market.types';
import { fetchCurrencyMarketSources } from '../infrastructure/clients/currency-market.client';
import { currencyMarketPanelResponseSchema } from '../infrastructure/schemas/currency-market-api.schema';

export type BuildCurrencyMarketPanelResult =
  | { ok: true; data: CurrencyMarketPanelData }
  | { ok: false; error: 'unavailable' | 'invalid_payload' };

export async function buildCurrencyMarketPanel(): Promise<BuildCurrencyMarketPanelResult> {
  const sources = await fetchCurrencyMarketSources();

  if (!sources.market) {
    return { ok: false, error: 'unavailable' };
  }

  const payload = mapMarketPanelData(
    sources.market,
    sources.engine ?? { current: null, weekly: [], error: 'no_data' },
  );

  const parsed = currencyMarketPanelResponseSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false, error: 'invalid_payload' };
  }

  return { ok: true, data: parsed.data };
}
