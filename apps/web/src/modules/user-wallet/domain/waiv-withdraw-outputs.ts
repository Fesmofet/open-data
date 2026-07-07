/** WAIV liquid balance withdraw destinations (Hive Engine converter). */
export const WAIV_WITHDRAW_OUTPUT_SYMBOLS = [
  'LTC',
  'BTC',
  'ETH',
  'HIVE',
  'HBD',
] as const;

export type WaivWithdrawOutputSymbol =
  (typeof WAIV_WITHDRAW_OUTPUT_SYMBOLS)[number];

export function buildWaivWithdrawPairKey(outputSymbol: string): string {
  return `WAIV:${outputSymbol.trim().toUpperCase()}`;
}
