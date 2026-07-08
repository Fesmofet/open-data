import {
  currencyMarketPanelResponseSchema,
  type CurrencyMarketPanelApiResponse,
} from '../schemas/currency-market-api.schema';

export type CurrencyMarketPanelClientResult =
  | { ok: true; data: CurrencyMarketPanelApiResponse }
  | { ok: false; status: number | 'network' };

export async function fetchCurrencyMarketPanelClient(): Promise<CurrencyMarketPanelClientResult> {
  try {
    const response = await fetch('/api/currency/market-panel', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const json: unknown = await response.json();
    const parsed = currencyMarketPanelResponseSchema.safeParse(json);

    if (!parsed.success) {
      return { ok: false, status: 500 };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, status: 'network' };
  }
}
