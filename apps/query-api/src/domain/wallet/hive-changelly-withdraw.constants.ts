export const HIVE_CHANGELLY_OUTPUT_COINS = ['btc', 'ltc', 'eth'] as const;

export type HiveChangellyOutputCoin =
  (typeof HIVE_CHANGELLY_OUTPUT_COINS)[number];

/** Legacy frontend cap for liquid HIVE → external crypto via Changelly. */
export const HIVE_CHANGELLY_WITHDRAW_USD_CAP = 100;

/** Self-transfer memo tracking amount (legacy WithDraw.js). */
export const HIVE_CHANGELLY_TRACKING_HIVE_RESERVE = 0.001;

export function normalizeHiveChangellyOutputCoin(
  value: string,
): HiveChangellyOutputCoin | null {
  const normalized = value.trim().toLowerCase();
  return (HIVE_CHANGELLY_OUTPUT_COINS as readonly string[]).includes(normalized)
    ? (normalized as HiveChangellyOutputCoin)
    : null;
}

export function parseLiquidHiveBalance(balance: string): number {
  const parsed = Number.parseFloat(balance.replace(/\s+HIVE$/i, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isHiveWithdrawAmountWithinUsdCap(input: {
  amountHive: number;
  hiveUsd: number;
  capUsd?: number;
}): boolean {
  const cap = input.capUsd ?? HIVE_CHANGELLY_WITHDRAW_USD_CAP;
  if (!Number.isFinite(input.hiveUsd) || input.hiveUsd <= 0) {
    return false;
  }
  return input.amountHive * input.hiveUsd <= cap;
}

export function isHiveWithdrawAmountWithinPairLimits(input: {
  amount: number;
  min: number;
  max: number;
}): boolean {
  return input.amount >= input.min && input.amount <= input.max;
}

export function hasHiveBalanceForChangellyWithdraw(input: {
  liquidHive: number;
  amount: number;
  trackingReserve?: number;
}): boolean {
  const reserve = input.trackingReserve ?? HIVE_CHANGELLY_TRACKING_HIVE_RESERVE;
  return input.liquidHive >= input.amount + reserve;
}
