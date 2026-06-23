export type DailyHiveRate = {
  ymd: string;
  hiveUsd: number;
  hbdUsd: number;
};

export function utcYmdFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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
