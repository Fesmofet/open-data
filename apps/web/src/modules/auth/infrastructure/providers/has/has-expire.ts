const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Normalize HAS auth expiry to milliseconds (legacy Cookie `auth.expire`). */
export function normalizeHasExpireTimestamp(expire: number): number {
  return expire < 1_000_000_000_000 ? expire * 1000 : expire;
}

export function defaultHasSessionExpireMs(): number {
  return Date.now() + THIRTY_DAYS_MS;
}

/** Backend verify/hiveauth expects UNIX seconds. */
export function hasExpireToVerifyUnix(expireMs: number): number {
  return Math.floor(expireMs / 1000);
}
