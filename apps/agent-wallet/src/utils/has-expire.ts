/** Convert HAS expire timestamp to unix seconds for auth-api verify. */
export function hasExpireToVerifyUnix(expireMs: number): number {
  const normalized =
    expireMs < 1_000_000_000_000 ? expireMs * 1000 : expireMs;
  return Math.floor(normalized / 1000);
}
