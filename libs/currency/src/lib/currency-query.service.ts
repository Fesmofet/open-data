import { Injectable, Logger } from '@nestjs/common';

import type { CurrencyStatisticsRow } from '@opden-data-layer/core';

import {
  ENGINE_BASE_WAIV,
} from './currency.constants';
import {
  buildDailyHiveTimeline,
  currencyRatesRowYmd,
  parseCurrencyRateValue,
  resolveFiatCrossByDates,
  resolveHiveHistoricalUsdByDates,
  resolveEngineHistoricalUsdByDates,
} from './currency-historical-rates';
import { CurrencyRepository } from './currency.repository';

/** Chart window: days back + whether to read daily aggregates vs ordinary snapshots. */
const CHART_WINDOWS: Record<string, { days: number; useDailyRows: boolean }> = {
  '1d': { days: 1, useDailyRows: false },
  '7d': { days: 7, useDailyRows: false },
  '1m': { days: 31, useDailyRows: true },
  '3m': { days: 93, useDailyRows: true },
  '6m': { days: 186, useDailyRows: true },
  '1y': { days: 372, useDailyRows: true },
  '2y': { days: 744, useDailyRows: true },
  all: { days: 0, useDailyRows: true },
};

const START_PRICE_WAIV_USD = 0.005;
const START_PRICE_WAIV_HIVE = 0.01;

type EngineRates = { HIVE: number; USD: number };

type EnginePoint = {
  dateString: string;
  base: string;
  rates: EngineRates;
  change24h?: EngineRates;
};

type LegacyEngineChartPoint = {
  dateString: string;
  rates: EngineRates;
};

const CHART_KEYS = { all: 'all' } as const;

export type LegacyTokenPrices = {
  usd: number;
  btc: number;
  usd_24h_change: number;
  btc_24h_change: number;
};

type SimplePriceTokenRow = {
  usd: number;
  usd_24h_change: number;
  btc: number;
  btc_24h_change: number;
};

type SimplePricePayload = {
  hive: SimplePriceTokenRow;
  hive_dollar: SimplePriceTokenRow;
};

@Injectable()
export class CurrencyQueryService {
  private readonly logger = new Logger(CurrencyQueryService.name);

  constructor(private readonly repo: CurrencyRepository) {}

  async marketInfo(params: {
    idsComma?: string | undefined;
    currenciesComma?: string | undefined;
  }): Promise<{
    current: Record<string, unknown>;
    weekly: Record<string, unknown>[];
  }> {
    void params.idsComma;
    void params.currenciesComma;

    const lastOrd = await this.repo.getLatestStatistic(false);

    if (!lastOrd || !(Number(lastOrd.hive_usd) > 0)) {
      this.logger.warn('marketInfo: no currency_statistics ordinary row');
      return { current: {}, weekly: [] };
    }

    const cg = simplePricePayloadFromPgOrdinary(lastOrd);

    const now = new Date();

    const current: Record<string, unknown> = {
      hive: mapCoingeckoBlock(cg.hive),
      hive_dollar: mapCoingeckoBlock(cg.hive_dollar),
      type: 'ordinaryData',
      createdAt: now,
      updatedAt: now,
    };

    const dailiesDesc = await this.repo.listDailyStatisticsLimitDesc(7);

    /** Oldest-first for weekly tail (excluding current handled separately). */
    const dailiesAscChrono = [...dailiesDesc].reverse();

    const weekly: Record<string, unknown>[] = dailiesAscChrono.map((row) =>
      dailyDocFromPgRow(row),
    );

    weekly.unshift(current);

    return { current, weekly };
  }

  legacyRateLatest(baseStr: string, symbolsComma: string) {
    return this.repo.getLegacyLatestRates({
      base: baseStr.toUpperCase(),
      symbolsComma,
    });
  }

  /**
   * WAIV current + trailing daily window from `hive_engine_rates` (Postgres).
   * Scheduler refreshes ordinary rows every ~5 min — no live Hive Engine RPC on this path.
   */
  async engineRates(baseToken = ENGINE_BASE_WAIV) {
    const last = (
      await this.repo.listHiveEngineRates({
        base: baseToken,
        isDaily: false,
        limit: 1,
        orderAsc: false,
      })
    ).at(0);

    const snapshot: EnginePoint | null = last
      ? {
          dateString: String(last.date),
          base: baseToken,
          rates: {
            HIVE: Number(last.rate_hive),
            USD: Number(last.rate_usd),
          },
        }
      : null;

    if (!snapshot) {
      return { current: null, weekly: [] as Record<string, unknown>[], error: 'no_data' };
    }

    const sinceDaily = utcYmdAddUtcDays(utcYmd(new Date()), -6);

    const weeklyRows = (
      await this.repo.listHiveEngineRates({
        base: baseToken,
        isDaily: true,
        sinceDateInclusive: sinceDaily,
        limit: undefined,
        orderAsc: false,
      })
    ).map(
      (r): EnginePoint => ({
        base: baseToken,
        dateString: String(r.date),
        rates: {
          HIVE: Number(r.rate_hive),
          USD: Number(r.rate_usd),
        },
      }),
    );

    const tail = weeklyRows.at(-1);

    const current = Object.assign(snapshot, {
      change24h: computeEnginePctChange(snapshot.rates, tail?.rates ?? null),
    });

    const weeklyBodies: Record<string, unknown>[] = [...weeklyRows];
    weeklyBodies.unshift(current);

    return { current, weekly: weeklyBodies };
  }

  async engineCurrent(baseToken = ENGINE_BASE_WAIV): Promise<
    Record<string, number> | undefined
  > {
    return this.engineLatestStored(baseToken);
  }

  /**
   * Latest stored WAIV/Hive + WAIV/USD rate from `hive_engine_rates` (no live RPC).
   * Scheduler refreshes the ordinary row every ~5 min; use this on hot read paths
   * (e.g. post-reward enrichment) where a slightly stale spot is acceptable and an
   * external Hive Engine round-trip per request is not.
   */
  async engineLatestStored(
    baseToken = ENGINE_BASE_WAIV,
  ): Promise<Record<string, number> | undefined> {
    const lastRow = (
      await this.repo.listHiveEngineRates({
        base: baseToken,
        isDaily: false,
        limit: 1,
        orderAsc: false,
      })
    ).at(0);

    return lastRow
      ? { HIVE: Number(lastRow.rate_hive), USD: Number(lastRow.rate_usd) }
      : undefined;
  }

  async engineChart(periodRaw: string, baseToken = ENGINE_BASE_WAIV) {
    const win = normalizeChartWindow(periodRaw);

    const fallbackHead = (
      await this.repo.listHiveEngineRates({
        base: baseToken,
        isDaily: false,
        limit: 1,
        orderAsc: false,
      })
    ).at(0);

    const headPt: LegacyEngineChartPoint = fallbackHead
      ? {
          dateString: String(fallbackHead.date),
          rates: {
            HIVE: Number(fallbackHead.rate_hive),
            USD: Number(fallbackHead.rate_usd),
          },
        }
      : {
          dateString: utcYmd(new Date()),
          rates: { HIVE: 0, USD: 0 },
        };

    const sinceIso =
      win.days <= 0
        ? undefined
        : utcYmdAddUtcDays(utcYmd(new Date()), -win.days);

    const bulk = (
      await this.repo.listHiveEngineRates({
        base: baseToken,
        isDaily: win.useDailyRows,
        sinceDateInclusive: sinceIso,
        limit: undefined,
        orderAsc: true,
      })
    ).map(
      (r): LegacyEngineChartPoint => ({
        dateString: String(r.date),
        rates: {
          HIVE: Number(r.rate_hive),
          USD: Number(r.rate_usd),
        },
      }),
    );

    const mergedSeen = new Set<string>();

    mergedSeen.add(headPt.dateString);

    /** Live head first, oldest tail last after sort desc. */

    bulk.sort((pointA, pointB) => pointA.dateString.localeCompare(pointB.dateString));

    const mergedDescending: LegacyEngineChartPoint[] = [headPt];

    for (const pointBulk of [...bulk].reverse()) {
      if (!mergedSeen.has(pointBulk.dateString)) {
        mergedSeen.add(pointBulk.dateString);

        mergedDescending.push(pointBulk);
      }
    }

    mergedDescending.sort((pointA, pointB) =>
      pointB.dateString.localeCompare(pointA.dateString),
    );

    let lowUsd = Math.min(
      ...mergedDescending.map((each) => Number(each.rates.USD ?? 0)),
      Number.POSITIVE_INFINITY,
    );

    if (!(Number.isFinite(lowUsd))) {
      lowUsd = START_PRICE_WAIV_USD;
    }

    const earliest = mergedDescending.at(-1);
    const headPoint = mergedDescending[0];
    const change =
      earliest && headPoint
        ? {
            HIVE: pctBetween(
              headPoint.rates.HIVE,
              earliest.rates.HIVE,
              START_PRICE_WAIV_HIVE,
            ),
            USD: pctBetween(
              headPoint.rates.USD,
              earliest.rates.USD,
              START_PRICE_WAIV_USD,
            ),
          }
        : { HIVE: 0, USD: 0 };

    let highUsd = Math.max(
      ...mergedDescending.map((each) => Number(each.rates.USD ?? 0)),
    );

    if (!(highUsd > 0) || !(Number.isFinite(highUsd))) {
      highUsd = START_PRICE_WAIV_USD;
    }

    return {
      result: mergedDescending,
      change,

      lowUSD:
        normalizeChartRaw(periodRaw) === CHART_KEYS.all
          ? START_PRICE_WAIV_USD
          : Number.isFinite(lowUsd)
            ? lowUsd
            : START_PRICE_WAIV_USD,

      highUSD: highUsd,
    };
  }

  async enginePoolsUsdCsv(csvSymbols: string): Promise<
    Array<{ symbol: string; USD: number }>
  > {
    const symbols = [...new Set(csvSymbols.split(',').map((s) => s.trim()))].filter(
      Boolean,
    );

    if (symbols.length === 0) {
      return [];
    }

    const rows = await this.repo.listSwapPoolUsdBySymbols(symbols);

    return rows.map((row) => ({
      symbol: row.symbol,
      USD: Number(row.usd),
    }));
  }

  /** Daily HIVE/HBD USD prices keyed by UTC YYYY-MM-DD (today uses spot). */
  async getHiveHistoricalUsdByDates(
    datesYmd: readonly string[],
  ): Promise<Map<string, { hiveUsd: number; hbdUsd: number }>> {
    const unique = [...new Set(datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
    if (unique.length === 0) {
      return new Map();
    }

    const today = utcYmd(new Date());
    const min = unique[0]!;
    const max = unique[unique.length - 1]!;
    const startUtc = new Date(`${min}T00:00:00.000Z`);
    const endUtc = new Date(`${utcYmdAddUtcDays(max, 1)}T00:00:00.000Z`);

    const [rows, anchorBeforeMin] = await Promise.all([
      this.repo.listDailyStatisticsBetween(startUtc, endUtc),
      this.repo.getLatestDailyStatisticOnOrBefore(startUtc),
    ]);

    const timeline = buildDailyHiveTimeline(rows, anchorBeforeMin, today);
    const dailyByYmd = new Map(
      timeline.map((entry) => [entry.ymd, { hiveUsd: entry.hiveUsd, hbdUsd: entry.hbdUsd }]),
    );

    let todayRates: { hiveUsd: number; hbdUsd: number } | null = null;
    if (unique.includes(today)) {
      todayRates = await this.loadHiveSpotRates();
    }

    const out = resolveHiveHistoricalUsdByDates({
      datesYmd: unique,
      timeline,
      todayYmd: today,
      todayRates,
      dailyByYmd,
    });

    for (const d of unique) {
      if (d !== today && (out.get(d)?.hiveUsd ?? 0) <= 0) {
        this.logger.warn(`getHiveHistoricalUsdByDates: no historical rate for ${d}`);
      }
    }

    return out;
  }

  /** Daily WAIV/USD keyed by UTC YYYY-MM-DD (today uses ordinary-row average or latest stored). */
  async getEngineHistoricalUsdByDates(
    datesYmd: readonly string[],
    baseToken = ENGINE_BASE_WAIV,
  ): Promise<Map<string, number>> {
    const unique = [...new Set(datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
    if (unique.length === 0) {
      return new Map();
    }

    const today = utcYmd(new Date());
    const min = unique[0]!;
    const max = unique[unique.length - 1]!;

    const dailyRows = await this.repo.listHiveEngineRates({
      base: baseToken,
      isDaily: true,
      sinceDateInclusive: min,
      limit: undefined,
      orderAsc: true,
    });

    const dailyByYmd = new Map<string, number>();
    for (const row of dailyRows) {
      const ymd = String(row.date).slice(0, 10);
      if (ymd < min || ymd > max) {
        continue;
      }
      const usd = Number(row.rate_usd);
      if (Number.isFinite(usd) && usd > 0) {
        dailyByYmd.set(ymd, usd);
      }
    }

    let todayWaivUsd: number | null = null;
    if (unique.includes(today)) {
      const avg = await this.repo.avgOrdinaryHiveRatesForDay({
        base: baseToken,
        dateIso: today,
      });
      if (avg && avg.rate_usd > 0) {
        todayWaivUsd = avg.rate_usd;
      } else {
        const latest = await this.engineLatestStored(baseToken);
        todayWaivUsd = latest?.USD && latest.USD > 0 ? latest.USD : null;
      }
    }

    const out = resolveEngineHistoricalUsdByDates({
      datesYmd: unique,
      todayYmd: today,
      todayWaivUsd,
      dailyByYmd,
    });

    for (const d of unique) {
      if (d !== today && (out.get(d) ?? 0) <= 0) {
        this.logger.warn(`getEngineHistoricalUsdByDates: no historical rate for ${d}`);
      }
    }

    return out;
  }

  private async loadHiveSpotRates(): Promise<{ hiveUsd: number; hbdUsd: number }> {
    const lastOrd = await this.repo.getLatestStatistic(false);

    return {
      hiveUsd: Number(lastOrd?.hive_usd ?? 0),
      hbdUsd: Number(lastOrd?.hbd_usd ?? 0),
    };
  }

  /**
   * USD → target fiat cross rate by UTC calendar date.
   * Legacy parity (`getCurrencyRates` + `calcWalletRecordRate` on UTC prod):
   * exact `currency_rates.date` match only; missing/zero row → `0` (no carry-back).
   * Today with no stored row falls back to the latest stored USD-base rate (legacy `includeToday`).
   */
  async getFiatCrossRatesByDates(
    datesYmd: readonly string[],
    currency: string,
  ): Promise<Map<string, number>> {
    const target = currency.trim().toUpperCase();
    const unique = [...new Set(datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
    if (unique.length === 0) {
      return new Map();
    }
    if (target === 'USD') {
      return new Map(unique.map((d) => [d, 1]));
    }

    const col = fiatIsoToRatesColumn(target);
    if (!col) {
      return new Map(unique.map((d) => [d, 0]));
    }

    const today = utcYmd(new Date());
    const rows = await this.repo.listCurrencyRatesByDates('USD', unique);

    const exactByYmd = new Map<string, number>();
    for (const row of rows) {
      const ymd = currencyRatesRowYmd(row.date);
      const rate = parseCurrencyRateValue((row as unknown as Record<string, unknown>)[col]);
      exactByYmd.set(ymd, rate);
    }

    let todaySpot: number | null = null;
    if (unique.includes(today) && !exactByYmd.has(today)) {
      const latest = await this.legacyRateLatest('USD', target);
      const spot = Number(latest[target] ?? 0);
      if (spot > 0) {
        todaySpot = spot;
      }
    }

    return resolveFiatCrossByDates({
      datesYmd: unique,
      todayYmd: today,
      todaySpot,
      exactByYmd,
    });
  }
}


function utcYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function fiatIsoToRatesColumn(iso: string): string | null {
  const map: Record<string, string> = {
    CAD: 'cad',
    EUR: 'eur',
    AUD: 'aud',
    MXN: 'mxn',
    GBP: 'gbp',
    JPY: 'jpy',
    CNY: 'cny',
    RUB: 'rub',
    UAH: 'uah',
    CHF: 'chf',
  };
  return map[iso] ?? null;
}

function utcYmdAddUtcDays(ymd: string, deltaDays: number): string {
  const [yStr, moStr = '1', dStr = '1'] = ymd.split('-');
  const ms =
    Date.UTC(Number(yStr), Number(moStr) - 1, Number(dStr)) +
    deltaDays * 86_400_000;
  return utcYmd(new Date(ms));
}

function normalizeChartRaw(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeChartWindow(
  rawPeriod: string,
): { days: number; useDailyRows: boolean } {
  const key = normalizeChartRaw(rawPeriod);
  const fallback = CHART_WINDOWS['1m'];
  if (!fallback) {
    throw new Error('currency-query: chart window fallback 1m is missing');
  }
  return CHART_WINDOWS[key] ?? fallback;
}


function simplePricePayloadFromPgOrdinary(
  row: CurrencyStatisticsRow,
): SimplePricePayload {
  return {
    hive: {
      usd: Number(row.hive_usd),
      usd_24h_change: Number(row.hive_usd_24h_change),
      btc: Number(row.hive_btc),
      btc_24h_change: Number(row.hive_btc_24h_change),
    },
    hive_dollar: {
      usd: Number(row.hbd_usd),
      usd_24h_change: Number(row.hbd_usd_24h_change),
      btc: Number(row.hbd_btc),
      btc_24h_change: Number(row.hbd_btc_24h_change),
    },
  };
}

function mapCoingeckoBlock(
  block: SimplePriceTokenRow | undefined,
): LegacyTokenPrices {
  if (!block) {
    return {
      usd: 0,
      btc: 0,
      usd_24h_change: 0,
      btc_24h_change: 0,
    };
  }
  return {
    usd: Number(block.usd ?? 0),
    btc: Number(block.btc ?? 0),
    usd_24h_change: Number(block.usd_24h_change ?? 0),
    btc_24h_change: Number(block.btc_24h_change ?? 0),
  };
}

function dailyDocFromPgRow(row: CurrencyStatisticsRow): Record<string, unknown> {
  const payload = simplePricePayloadFromPgOrdinary(row);
  return {
    hive: mapCoingeckoBlock(payload.hive),
    hive_dollar: mapCoingeckoBlock(payload.hive_dollar),
    type: 'dailyData',
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

function computeEnginePctChange(
  current: EngineRates,
  anchor: EngineRates | null,
): EngineRates {
  if (!anchor) {
    return { HIVE: 0, USD: 0 };
  }
  return {
    HIVE: pctDelta(current.HIVE, anchor.HIVE),
    USD: pctDelta(current.USD, anchor.USD),
  };
}

function pctDelta(curr: number, prev: number): number {
  if (!prev || !Number.isFinite(prev) || prev === 0) {
    return 0;
  }
  const r = ((curr - prev) / prev) * 100;
  return Number.isFinite(r) ? r : 0;
}

function pctBetween(
  currentVal: number,
  olderVal: number,
  olderFallbackVal: number,
): number {
  const pickPrev =
    Number.isFinite(olderVal) && olderVal !== 0 ? olderVal : olderFallbackVal;
  return pctDelta(currentVal, pickPrev);
}
