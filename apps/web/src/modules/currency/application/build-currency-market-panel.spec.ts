import { buildCurrencyMarketPanel } from './build-currency-market-panel';
import { mapMarketPanelData } from '../domain/map-market-panel-data';
import { fetchCurrencyMarketSources } from '../infrastructure/clients/currency-market.client';

jest.mock('../infrastructure/clients/currency-market.client', () => ({
  fetchCurrencyMarketSources: jest.fn(),
}));

const fetchCurrencyMarketSourcesMock = jest.mocked(fetchCurrencyMarketSources);

const marketFixture = {
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

const engineFixture = {
  current: {
    dateString: '2026-07-07',
    base: 'WAIV',
    rates: { HIVE: 0.12, USD: 0.03 },
    change24h: { HIVE: 1.5, USD: -2.2 },
  },
  weekly: [],
};

describe('buildCurrencyMarketPanel', () => {
  beforeEach(() => {
    fetchCurrencyMarketSourcesMock.mockReset();
  });

  it('returns unavailable when market fetch fails', async () => {
    fetchCurrencyMarketSourcesMock.mockResolvedValue({
      market: null,
      engine: null,
    });

    await expect(buildCurrencyMarketPanel()).resolves.toEqual({
      ok: false,
      error: 'unavailable',
    });
  });

  it('returns panel data when market is available', async () => {
    fetchCurrencyMarketSourcesMock.mockResolvedValue({
      market: marketFixture,
      engine: engineFixture,
    });

    const outcome = await buildCurrencyMarketPanel();

    expect(outcome.ok).toBe(true);

    if (outcome.ok) {
      expect(outcome.data.tokens.map((row) => row.symbol)).toEqual(['WAIV', 'HIVE', 'HBD']);
      expect(outcome.data.tokens).toEqual(
        mapMarketPanelData(marketFixture, engineFixture).tokens,
      );
      expect(outcome.data.fetchedAt).toEqual(expect.any(String));
    }
  });

  it('falls back to no_data engine when engine fetch is null', async () => {
    fetchCurrencyMarketSourcesMock.mockResolvedValue({
      market: marketFixture,
      engine: null,
    });

    const outcome = await buildCurrencyMarketPanel();

    expect(outcome.ok).toBe(true);

    if (outcome.ok) {
      expect(outcome.data.tokens[0]).toMatchObject({
        symbol: 'WAIV',
        usdPrice: null,
        sparkline: [],
      });
    }
  });
});
