import * as fs from 'fs';
import * as path from 'path';
import { pipeline as streamPipeline } from 'node:stream/promises';

import streamArray from 'stream-json/streamers/stream-array.js';

import { parseMongoCreatedAt, mongoIdToString } from '../objects/utils';
import { dateFromMongoObjectIdHex } from '../mongo-object-id-date';
import type { MongoId } from '../objects/types';
import {
  FIAT_RATE_BASE_USD,
  USD_PAIR_TO_COLUMN,
  ZERO_FIAT_ROW,
} from '../../../libs/currency/src/lib/currency.constants';
import type {
  NewCurrencyRatesRow,
  NewCurrencyStatisticsRow,
  NewHiveEngineRatesRow,
} from '../../../libs/core/src/db';

export const BATCH = 5000;

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

export function num(x: unknown): number {
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function mongoDate(value: unknown, fallback?: Date): Date | undefined {
  return parseMongoCreatedAt(value) ?? fallback;
}

export function mongoDateOrNow(value: unknown): Date {
  return parseMongoCreatedAt(value) ?? new Date();
}

export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapToken(b: unknown): {
  usd: number;
  usd_24h_change: number;
  btc: number;
  btc_24h_change: number;
} {
  if (!b || typeof b !== 'object') {
    return { usd: 0, usd_24h_change: 0, btc: 0, btc_24h_change: 0 };
  }
  const o = b as Record<string, unknown>;
  return {
    usd: num(o.usd),
    usd_24h_change: num(o.usd_24h_change),
    btc: num(o.btc),
    btc_24h_change: num(o.btc_24h_change),
  };
}

export function mongoStatToRow(
  d: Record<string, unknown>,
): Omit<NewCurrencyStatisticsRow, 'id'> | null {
  const hive = mapToken(d.hive);
  const hbd = mapToken(d.hive_dollar ?? d.hive_Dollar);
  const t = String(d.type ?? '');
  const isDaily =
    Boolean(d.is_daily) ||
    Boolean(d.isDaily) ||
    t.toLowerCase().includes('daily');
  const ts = mongoDate(d.createdAt ?? d.updatedAt ?? d.created_at);
  if (!ts) {
    return null;
  }
  return {
    is_daily: isDaily,
    hive_usd: hive.usd,
    hive_usd_24h_change: hive.usd_24h_change,
    hive_btc: hive.btc,
    hive_btc_24h_change: hive.btc_24h_change,
    hbd_usd: hbd.usd,
    hbd_usd_24h_change: hbd.usd_24h_change,
    hbd_btc: hbd.btc,
    hbd_btc_24h_change: hbd.btc_24h_change,
    created_at: ts,
  };
}

export function mongoEngineToRow(
  d: Record<string, unknown>,
): Omit<NewHiveEngineRatesRow, 'id'> | null {
  const mongoType = String(d.type ?? '');
  const isDaily =
    mongoType === 'dailyData' ||
    Boolean(d.is_daily) ||
    Boolean(d.isDaily) ||
    String(d.period ?? '') === 'daily';

  const dt = d.dateString ?? d.date ?? d.day ?? d.ymd;
  let dateStr: string;
  if (typeof dt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dt)) {
    dateStr = dt.slice(0, 10);
  } else {
    const fromOid = dateFromMongoObjectIdHex(
      mongoIdToString(d._id as MongoId | undefined),
    );
    if (!fromOid) {
      return null;
    }
    dateStr = ymd(fromOid);
  }

  const rates =
    d.rates && typeof d.rates === 'object' ?
      (d.rates as Record<string, unknown>)
    : null;
  const change24h =
    d.change24h && typeof d.change24h === 'object' ?
      (d.change24h as Record<string, unknown>)
    : d.change_24h && typeof d.change_24h === 'object' ?
      (d.change_24h as Record<string, unknown>)
    : null;

  const docBase = String(d.base ?? d.baseToken ?? 'WAIV').trim().toUpperCase();

  let tokenBase = 'WAIV';
  let rateHive = 0;
  let rateUsd = 0;

  if (rates) {
    if ('HIVE' in rates || 'USD' in rates) {
      tokenBase = docBase === 'USD' ? 'WAIV' : (docBase || 'WAIV');
      rateHive = num(rates.HIVE ?? rates.hive);
      rateUsd = num(rates.USD ?? rates.usd);
    } else if ('WAIV' in rates) {
      tokenBase = 'WAIV';
      rateUsd = num(rates.WAIV);
    }
  }

  if (!(rateHive > 0)) {
    rateHive = num(d.rate_hive ?? d.rateHive ?? d.hive);
  }
  if (!(rateUsd > 0)) {
    rateUsd = num(d.rate_usd ?? d.rateUsd ?? d.usd);
  }

  if (!(rateHive > 0) && !(rateUsd > 0)) {
    return null;
  }

  const ch =
    change24h?.HIVE ??
    change24h?.hive ??
    d.change_24h_hive ??
    d.change24hHive;
  const cu =
    change24h?.USD ??
    change24h?.usd ??
    d.change_24h_usd ??
    d.change24hUsd;

  const createdAt =
    mongoDate(d.createdAt ?? d.updatedAt ?? d.created_at) ??
    dateFromMongoObjectIdHex(mongoIdToString(d._id as MongoId | undefined)) ??
    new Date();

  return {
    base: tokenBase,
    is_daily: isDaily,
    date: dateStr,
    rate_hive: rateHive,
    rate_usd: rateUsd,
    change_24h_hive:
      ch === undefined || ch === null ? null : (Number.isFinite(Number(ch)) ? Number(ch) : null),
    change_24h_usd:
      cu === undefined || cu === null ? null : (Number.isFinite(Number(cu)) ? Number(cu) : null),
    created_at: createdAt,
  };
}

export function mongoFiatToRow(
  d: Record<string, unknown>,
): Omit<NewCurrencyRatesRow, 'id'> | null {
  const base =
    String(d.base ?? FIAT_RATE_BASE_USD).toUpperCase() || FIAT_RATE_BASE_USD;
  const dt = d.date ?? d.day ?? d.dateString;
  const dateStr =
    typeof dt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dt) ?
      dt.slice(0, 10)
    : ymd(mongoDateOrNow(dt));

  const out: Omit<NewCurrencyRatesRow, 'id'> = {
    base,
    date: dateStr,
    ...ZERO_FIAT_ROW,
    created_at: mongoDateOrNow(d.createdAt ?? d.updatedAt ?? new Date()),
  };

  const quotes = d.quotes && typeof d.quotes === 'object' ? d.quotes : null;
  const rates =
    d.rates && typeof d.rates === 'object' ?
      (d.rates as Record<string, unknown>)
    : null;
  const src: Record<string, unknown> =
    quotes ?? (typeof d === 'object' ? d : {});

  for (const [k, col] of Object.entries(USD_PAIR_TO_COLUMN)) {
    const mongoKeyLc = k.toLowerCase();
    const alt = mongoKeyLc.replace(/^usd/, '').toUpperCase();
    let raw =
      src[k] ?? src[mongoKeyLc] ?? src[alt.toLowerCase()] ?? src[alt];

    const colName = col as keyof typeof ZERO_FIAT_ROW;

    raw ??=
      quotes && typeof quotes === 'object' ?
        (quotes as Record<string, unknown>)[k]
      : undefined;

    raw ??= rates?.[alt] ?? rates?.[alt.toLowerCase()];

    if (typeof raw !== 'undefined' && raw !== null) {
      out[colName] = num(raw);
    }
  }

  return out;
}

export async function streamJsonArrayFile(
  filePath: string,
  sink: import('node:stream').Writable,
): Promise<void> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    fail(`File not found: ${resolved}`);
  }
  console.log(`Streaming ${resolved}`);
  await streamPipeline(
    fs.createReadStream(resolved, { encoding: 'utf8' }),
    streamArray.withParserAsStream(),
    sink,
  );
}

export function parseDryRun(argv: string[]): boolean {
  return argv.includes('--dry-run');
}

export function parseSkipIndexes(argv: string[]): boolean {
  return argv.includes('--skip-indexes');
}

export function parseRecreateIndexesOnly(argv: string[]): boolean {
  return argv.includes('--recreate-indexes-only');
}

export function parseStatsDailyOnly(argv: string[]): boolean {
  return argv.includes('--stats-daily-only');
}

export function requireFilePath(argv: string[], usage: string): string {
  if (parseRecreateIndexesOnly(argv)) {
    return '';
  }
  const positionals = argv.filter((a) => !a.startsWith('--'));
  const filePath = positionals[0]?.trim();
  if (!filePath) {
    fail(usage);
  }
  return filePath;
}
