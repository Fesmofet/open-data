export type DailyHiveRate = {
  ymd: string;
  hiveUsd: number;
  hbdUsd: number;
};

export function utcYmdFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Legacy `moment.unix(ts).format('YYYY-MM-DD')` on UTC servers (Hive chain timestamps). */
export function utcYmdFromUnix(unix: number): string {
  return utcYmdFromDate(new Date(unix * 1000));
}

/** PG `currency_rates.date` may arrive as ISO string or JS Date from node-pg. */
export function currencyRatesRowYmd(date: string | Date): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  return utcYmdFromDate(date);
}

export function parseCurrencyRateValue(raw: unknown): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  const n = typeof raw === 'number' ? raw : Number(String(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Legacy `getCurrencyRates` + `calcWalletRecordRate`: exact `currency_rates.date` /
 * Mongo `dateString` match only. Missing/zero day → `0` (no carry-back). Today with no
 * stored row uses the latest stored rate (`includeToday`).
 */
export function resolveFiatCrossByDates(params: {
  datesYmd: readonly string[];
  todayYmd: string;
  todaySpot: number | null;
  exactByYmd: ReadonlyMap<string, number>;
}): Map<string, number> {
  const unique = [...new Set(params.datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
  const out = new Map<string, number>();

  for (const d of unique) {
    const exact = params.exactByYmd.get(d);
    if (exact && exact > 0) {
      out.set(d, exact);
      continue;
    }

    if (d === params.todayYmd && params.todaySpot && params.todaySpot > 0) {
      out.set(d, params.todaySpot);
      continue;
    }

    out.set(d, 0);
  }

  return out;
}

export function dailyRateFromStatisticRow(row: {
  created_at: Date;
  hive_usd: number;
  hbd_usd: number;
}): DailyHiveRate {
  return {
    ymd: utcYmdFromDate(new Date(row.created_at)),
    hiveUsd: Number(row.hive_usd) || 0,
    hbdUsd: Number(row.hbd_usd) || 0,
  };
}

export function buildDailyHiveTimeline(
  rows: readonly { created_at: Date; hive_usd: number; hbd_usd: number }[],
  anchorBeforeMin: { created_at: Date; hive_usd: number; hbd_usd: number } | null,
  todayYmd: string,
): DailyHiveRate[] {
  const dailyByYmd = new Map<string, DailyHiveRate>();

  if (anchorBeforeMin) {
    const rate = dailyRateFromStatisticRow(anchorBeforeMin);
    dailyByYmd.set(rate.ymd, rate);
  }

  for (const row of rows) {
    const rate = dailyRateFromStatisticRow(row);
    if (rate.ymd === todayYmd) {
      continue;
    }
    dailyByYmd.set(rate.ymd, rate);
  }

  return [...dailyByYmd.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, rate]) => rate);
}

export function resolveNearestDailyHiveRate(
  ymd: string,
  timeline: readonly DailyHiveRate[],
): DailyHiveRate {
  if (timeline.length === 0) {
    return { ymd, hiveUsd: 0, hbdUsd: 0 };
  }

  let carryBack: DailyHiveRate | null = null;
  for (const entry of timeline) {
    if (entry.ymd <= ymd && entry.hiveUsd > 0) {
      carryBack = entry;
      continue;
    }
    if (entry.ymd > ymd) {
      break;
    }
  }
  if (carryBack) {
    return carryBack;
  }

  for (const entry of timeline) {
    if (entry.ymd >= ymd && entry.hiveUsd > 0) {
      return entry;
    }
  }

  return { ymd, hiveUsd: 0, hbdUsd: 0 };
}

export function resolveHiveHistoricalUsdByDates(params: {
  datesYmd: readonly string[];
  timeline: readonly DailyHiveRate[];
  todayYmd: string;
  todayRates: { hiveUsd: number; hbdUsd: number } | null;
  dailyByYmd: ReadonlyMap<string, { hiveUsd: number; hbdUsd: number }>;
}): Map<string, { hiveUsd: number; hbdUsd: number }> {
  const unique = [...new Set(params.datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
  const out = new Map<string, { hiveUsd: number; hbdUsd: number }>();

  for (const d of unique) {
    if (d === params.todayYmd) {
      if (params.todayRates) {
        out.set(d, params.todayRates);
      }
      continue;
    }

    const exact = params.dailyByYmd.get(d);
    if (exact && exact.hiveUsd > 0) {
      out.set(d, { hiveUsd: exact.hiveUsd, hbdUsd: exact.hbdUsd });
      continue;
    }

    const resolved = resolveNearestDailyHiveRate(d, params.timeline);
    out.set(d, { hiveUsd: resolved.hiveUsd, hbdUsd: resolved.hbdUsd });
  }

  return out;
}

/** Exact daily WAIV/USD from engine rate rows (legacy HiveEngineRate daily lookup). */
export function resolveEngineHistoricalUsdByDates(params: {
  datesYmd: readonly string[];
  todayYmd: string;
  todayWaivUsd: number | null;
  dailyByYmd: ReadonlyMap<string, number>;
}): Map<string, number> {
  const unique = [...new Set(params.datesYmd.map((d) => d.trim()).filter(Boolean))].sort();
  const out = new Map<string, number>();

  for (const d of unique) {
    if (d === params.todayYmd) {
      const today = params.todayWaivUsd;
      out.set(d, today && today > 0 ? today : 0);
      continue;
    }
    out.set(d, params.dailyByYmd.get(d) ?? 0);
  }

  return out;
}
