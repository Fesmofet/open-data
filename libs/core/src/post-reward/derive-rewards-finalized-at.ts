/**
 * Derives rewards_finalized_at for historical posts at import time.
 * Root posts past cashout are treated as already finalized.
 */
export function deriveRewardsFinalizedAt(
  cashoutTime: string | null | undefined,
  depth: number | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (depth != null && depth > 0) {
    return null;
  }
  const trimmed = cashoutTime?.trim();
  if (!trimmed) {
    return null;
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms) || ms >= nowMs) {
    return null;
  }
  return new Date(ms).toISOString();
}
