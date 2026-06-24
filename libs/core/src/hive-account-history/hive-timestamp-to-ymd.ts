const HIVE_TIMESTAMP_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

/** Parse Hive chain timestamp (`2020-06-18T15:10:30`, UTC) to `YYYY-MM-DD`. */
export function hiveTimestampToYmd(timestamp: string): string | null {
  const trimmed = timestamp.trim();
  if (trimmed === '') {
    return null;
  }

  const match = HIVE_TIMESTAMP_RE.exec(trimmed);
  if (match) {
    return match[1] ?? null;
  }

  const normalized = trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`;
  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) {
    return null;
  }

  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Earliest UTC calendar date among ISO `YYYY-MM-DD` strings. */
export function minYmd(values: readonly (string | null | undefined)[]): string | null {
  let min: string | null = null;
  for (const value of values) {
    const ymd = value?.trim();
    if (!ymd) {
      continue;
    }
    if (min === null || ymd < min) {
      min = ymd;
    }
  }
  return min;
}
