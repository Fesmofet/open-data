import { CASHOUT_OFFSET_DAYS } from './thread-accounts';

const HAS_TZ_SUFFIX = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

/**
 * Hive block timestamps are UTC but often omit a `Z` suffix.
 * Without normalization, `Date.parse` treats them as local time.
 */
export function normalizeHiveBlockTimestampUtc(timestamp: string): string {
  const trimmed = timestamp.trim();
  if (HAS_TZ_SUFFIX.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}Z`;
}

export function hiveBlockTimestampToMillis(timestamp: string): number {
  const ms = Date.parse(normalizeHiveBlockTimestampUtc(timestamp));
  if (Number.isNaN(ms)) {
    return 0;
  }
  return ms;
}

export function hiveBlockTimestampToDate(timestamp: string): Date {
  return new Date(hiveBlockTimestampToMillis(timestamp));
}

/** Parse Hive block `timestamp` string to Unix seconds (UTC). */
export function blockTimestampToUnixSeconds(timestamp: string): number {
  return Math.floor(hiveBlockTimestampToMillis(timestamp) / 1000);
}

/** `YYYY-MM-DDTHH:mm:ss` (UTC) for Hive-style text fields. */
export function formatHiveDateTime(isoTimestamp: string): string {
  const ms = hiveBlockTimestampToMillis(isoTimestamp);
  if (ms === 0) {
    return '';
  }
  return new Date(ms).toISOString().slice(0, 19);
}

export function cashoutTimeFromBlock(blockIso: string): string {
  const d = hiveBlockTimestampToDate(blockIso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  d.setUTCDate(d.getUTCDate() + CASHOUT_OFFSET_DAYS);
  return d.toISOString().slice(0, 19);
}
