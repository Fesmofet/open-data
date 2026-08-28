export const HIVE_CHANGELLY_OUTPUT_COINS = ['btc', 'ltc', 'eth'] as const;

export type HiveChangellyOutputCoin =
  (typeof HIVE_CHANGELLY_OUTPUT_COINS)[number];

export const HIVE_CHANGELLY_WITHDRAW_USD_CAP = 100;

export const HIVE_CHANGELLY_TRACKING_HIVE_RESERVE = 0.001;

export function normalizeHiveChangellyOutputCoin(
  value: string,
): HiveChangellyOutputCoin | null {
  const normalized = value.trim().toLowerCase();
  return (HIVE_CHANGELLY_OUTPUT_COINS as readonly string[]).includes(normalized)
    ? (normalized as HiveChangellyOutputCoin)
    : null;
}
