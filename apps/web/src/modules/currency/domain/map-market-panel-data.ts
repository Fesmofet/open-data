import type { CurrencyEngineRatesApiResponse } from '../infrastructure/schemas/currency-market-api.schema';
import type { CurrencyMarketApiResponse } from '../infrastructure/schemas/currency-market-api.schema';
import type {
  ChartPoint,
  CurrencyMarketPanelData,
  TokenMarketRow,
} from './currency-market.types';

function pickIsoDateSlice(value: unknown): string {
  if (value == null) {
    return '';
  }

  const str = String(value);

  if (str.length < 10) {
    return '';
  }

  const slice = str.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : '';
}

function pickMarketRowDateLabel(row: {
  updatedAt?: unknown;
  createdAt?: unknown;
}): string {
  const fromUpdated = pickIsoDateSlice(row.updatedAt);

  if (fromUpdated) {
    return fromUpdated;
  }

  return pickIsoDateSlice(row.createdAt);
}

function chronologicalWeekly<T>(weekly: T[]): T[] {
  if (weekly.length <= 1) {
    return weekly;
  }

  return [...weekly.slice(1), weekly[0]];
}

function hiveSparklineFromMarketWeekly(
  weekly: CurrencyMarketApiResponse['weekly'],
  pickUsd: (row: (typeof weekly)[number]) => number,
  pickLabel: (row: (typeof weekly)[number]) => string,
): ChartPoint[] {
  return chronologicalWeekly(weekly)
    .map((row) => ({
      label: pickLabel(row),
      value: pickUsd(row),
    }))
    .filter((point) => Number.isFinite(point.value));
}

function waivSparklineFromEngineWeekly(
  weekly: CurrencyEngineRatesApiResponse['weekly'],
): ChartPoint[] {
  const points: ChartPoint[] = [];

  for (const row of chronologicalWeekly(weekly)) {
    const rates = row.rates as { USD?: number } | undefined;
    const usd = rates?.USD;
    const label =
      typeof row.dateString === 'string' && row.dateString.length > 0
        ? row.dateString
        : '';

    if (typeof usd === 'number' && Number.isFinite(usd)) {
      points.push({ label, value: usd });
    }
  }

  return points;
}

function buildHiveRow(
  market: CurrencyMarketApiResponse,
): TokenMarketRow {
  const { current, weekly } = market;

  return {
    symbol: 'HIVE',
    usdPrice: current.hive.usd,
    usdChangePercent: current.hive.usd_24h_change,
    showUsdChangePercent: true,
    secondary: {
      currency: 'BTC',
      price: current.hive.btc,
      changePercent: current.hive.btc_24h_change,
    },
    sparkline: hiveSparklineFromMarketWeekly(
      weekly,
      (row) => row.hive.usd,
      (row) => pickMarketRowDateLabel(row),
    ),
  };
}

function buildHbdRow(
  market: CurrencyMarketApiResponse,
): TokenMarketRow {
  const { current, weekly } = market;

  return {
    symbol: 'HBD',
    usdPrice: current.hive_dollar.usd,
    usdChangePercent: current.hive_dollar.usd_24h_change,
    showUsdChangePercent: false,
    secondary: null,
    sparkline: hiveSparklineFromMarketWeekly(
      weekly,
      (row) => row.hive_dollar.usd,
      (row) => pickMarketRowDateLabel(row),
    ),
  };
}

function buildWaivRow(
  engine: CurrencyEngineRatesApiResponse,
): TokenMarketRow {
  if (engine.error === 'no_data' || !engine.current) {
    return {
      symbol: 'WAIV',
      usdPrice: null,
      usdChangePercent: null,
      showUsdChangePercent: true,
      secondary: null,
      sparkline: [],
    };
  }

  const { current, weekly } = engine;

  return {
    symbol: 'WAIV',
    usdPrice: current.rates.USD,
    usdChangePercent: current.change24h?.USD ?? null,
    showUsdChangePercent: true,
    secondary: {
      currency: 'HIVE',
      price: current.rates.HIVE,
      changePercent: current.change24h?.HIVE ?? 0,
    },
    sparkline: waivSparklineFromEngineWeekly(weekly),
  };
}

export function mapMarketPanelData(
  market: CurrencyMarketApiResponse,
  engine: CurrencyEngineRatesApiResponse,
): CurrencyMarketPanelData {
  return {
    tokens: [
      buildWaivRow(engine),
      buildHiveRow(market),
      buildHbdRow(market),
    ],
    fetchedAt: new Date().toISOString(),
  };
}
