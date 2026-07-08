import { mapMarketPanelData } from './map-market-panel-data';
import type { CurrencyEngineRatesApiResponse } from '../infrastructure/schemas/currency-market-api.schema';
import type { CurrencyMarketApiResponse } from '../infrastructure/schemas/currency-market-api.schema';

const marketFixture: CurrencyMarketApiResponse = {
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
    createdAt: '2026-07-07T12:00:00.000Z',
    updatedAt: '2026-07-07T12:00:00.000Z',
  },
  weekly: [
    {
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
    {
      hive: {
        usd: 0.24,
        btc: 0.0000039,
        usd_24h_change: 1.5,
        btc_24h_change: 0.8,
      },
      hive_dollar: {
        usd: 0.99,
        btc: 0.000015,
        usd_24h_change: 0,
        btc_24h_change: 0,
      },
      type: 'dailyData',
      updatedAt: '2026-07-06T12:00:00.000Z',
    },
  ],
};

const engineFixture: CurrencyEngineRatesApiResponse = {
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
    {
      dateString: '2026-07-06',
      base: 'WAIV',
      rates: { HIVE: 0.11, USD: 0.029 },
    },
  ],
};

describe('mapMarketPanelData', () => {
  it('maps WAIV, HIVE, and HBD rows', () => {
    const panel = mapMarketPanelData(marketFixture, engineFixture);

    expect(panel.tokens.map((row) => row.symbol)).toEqual(['WAIV', 'HIVE', 'HBD']);
    expect(panel.tokens[0].usdPrice).toBe(0.03);
    expect(panel.tokens[1].usdPrice).toBe(0.25);
    expect(panel.tokens[2].usdPrice).toBe(1);
  });

  it('maps secondary quotes and HBD percent visibility', () => {
    const panel = mapMarketPanelData(marketFixture, engineFixture);

    expect(panel.tokens[0].secondary).toEqual({
      currency: 'HIVE',
      price: 0.12,
      changePercent: 1.5,
    });
    expect(panel.tokens[1].secondary).toEqual({
      currency: 'BTC',
      price: 0.000004,
      changePercent: 1.1,
    });
    expect(panel.tokens[2].showUsdChangePercent).toBe(false);
  });

  it('builds chronological sparkline points', () => {
    const panel = mapMarketPanelData(marketFixture, engineFixture);
    const hiveSparkline = panel.tokens[1].sparkline;

    expect(hiveSparkline).toHaveLength(2);
    expect(hiveSparkline[0].value).toBe(0.24);
    expect(hiveSparkline[1].value).toBe(0.25);
  });

  it('returns degraded WAIV row when engine has no data', () => {
    const panel = mapMarketPanelData(marketFixture, {
      current: null,
      weekly: [],
      error: 'no_data',
    });

    expect(panel.tokens[0]).toMatchObject({
      symbol: 'WAIV',
      usdPrice: null,
      sparkline: [],
    });
  });

  it('uses updatedAt for sparkline labels and coerces non-string dates', () => {
    const panel = mapMarketPanelData(
      {
        ...marketFixture,
        weekly: [
          {
            ...marketFixture.weekly[0],
            updatedAt: 1_754_006_400_000,
          },
          marketFixture.weekly[1],
        ],
      },
      engineFixture,
    );

    expect(panel.tokens[1].sparkline[0].label).toBe('2026-07-06');
  });

  it('returns degraded WAIV row when engine current is null without error', () => {
    const panel = mapMarketPanelData(marketFixture, {
      current: null,
      weekly: [],
    });

    expect(panel.tokens[0]).toMatchObject({
      symbol: 'WAIV',
      usdPrice: null,
      sparkline: [],
    });
  });
});
