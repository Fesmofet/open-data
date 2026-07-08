import {
  currencyEngineRatesResponseSchema,
  currencyMarketPanelResponseSchema,
  currencyMarketResponseSchema,
} from './currency-market-api.schema';

const validMarketPayload = {
  current: {
    hive: {
      usd: 0.25,
      btc: 0.000004,
      usd_24h_change: 2.5,
      btc_24h_change: 1.1,
    },
    hive_dollar: {
      usd: 1,
      btc: 0.000016,
      usd_24h_change: 0.1,
      btc_24h_change: 0.2,
    },
    type: 'ordinaryData',
    updatedAt: '2026-07-07T12:00:00.000Z',
  },
  weekly: [],
};

const validEnginePayload = {
  current: {
    dateString: '2026-07-07',
    base: 'WAIV',
    rates: { HIVE: 0.12, USD: 0.03 },
    change24h: { HIVE: 1.5, USD: -2.2 },
  },
  weekly: [
    {
      dateString: '2026-07-07',
      base: 'WAIV',
      rates: { HIVE: 0.12, USD: 0.03 },
    },
  ],
};

describe('currencyMarketResponseSchema', () => {
  it('accepts a valid market payload', () => {
    expect(currencyMarketResponseSchema.safeParse(validMarketPayload).success).toBe(true);
  });

  it('rejects market payload missing hive prices', () => {
    const result = currencyMarketResponseSchema.safeParse({
      current: { hive_dollar: validMarketPayload.current.hive_dollar, type: 'x' },
      weekly: [],
    });

    expect(result.success).toBe(false);
  });
});

describe('currencyEngineRatesResponseSchema', () => {
  it('accepts a valid engine rates payload', () => {
    expect(currencyEngineRatesResponseSchema.safeParse(validEnginePayload).success).toBe(
      true,
    );
  });

  it('accepts no_data error with null current', () => {
    const result = currencyEngineRatesResponseSchema.safeParse({
      current: null,
      weekly: [],
      error: 'no_data',
    });

    expect(result.success).toBe(true);
  });

  it('rejects engine payload with non-numeric USD rate', () => {
    const result = currencyEngineRatesResponseSchema.safeParse({
      current: {
        rates: { HIVE: 0.1, USD: 'bad' },
      },
      weekly: [],
    });

    expect(result.success).toBe(false);
  });
});

describe('currencyMarketPanelResponseSchema', () => {
  it('accepts a normalized panel payload', () => {
    const result = currencyMarketPanelResponseSchema.safeParse({
      tokens: [
        {
          symbol: 'WAIV',
          usdPrice: 0.03,
          usdChangePercent: -2.2,
          showUsdChangePercent: true,
          secondary: { currency: 'HIVE', price: 0.12, changePercent: 1.5 },
          sparkline: [{ label: '2026-07-06', value: 0.029 }],
        },
        {
          symbol: 'HIVE',
          usdPrice: 0.25,
          usdChangePercent: 2.5,
          showUsdChangePercent: true,
          secondary: { currency: 'BTC', price: 0.000004, changePercent: 1.1 },
          sparkline: [],
        },
        {
          symbol: 'HBD',
          usdPrice: 1,
          usdChangePercent: 0.1,
          showUsdChangePercent: false,
          secondary: null,
          sparkline: [],
        },
      ],
      fetchedAt: '2026-07-08T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects panel with unknown token symbol', () => {
    const result = currencyMarketPanelResponseSchema.safeParse({
      tokens: [
        {
          symbol: 'BTC',
          usdPrice: 1,
          usdChangePercent: null,
          showUsdChangePercent: true,
          secondary: null,
          sparkline: [],
        },
      ],
      fetchedAt: '2026-07-08T10:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
