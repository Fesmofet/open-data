/** Parses Hive `cashout_time` to Unix seconds, or null when invalid. */
export function parseCashoutToUnix(
  cashoutTime: string | null | undefined,
): number | null {
  const raw = (cashoutTime ?? '').trim();
  if (raw === '') {
    return null;
  }
  const iso = raw.includes('Z') ? raw : `${raw}.000Z`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return null;
  }
  return Math.floor(ms / 1000);
}
