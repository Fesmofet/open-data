import { formatWalletModalBalanceDisplay } from './wallet-modal-format';
import type { WalletMainAsset } from './wallet-modal-types';

export const WAIV_POWER_DOWN_WEEKS = 4;
export const HIVE_POWER_DOWN_WEEKS = 13;

export function getWalletPowerDownWeeks(asset: WalletMainAsset): number {
  if (asset === 'HIVE') {
    return HIVE_POWER_DOWN_WEEKS;
  }
  return WAIV_POWER_DOWN_WEEKS;
}

export function computeWeeklyPowerDownUnlock(
  parsedAmount: number | null,
  weeks: number,
): string | null {
  if (parsedAmount === null || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return null;
  }
  if (!Number.isFinite(weeks) || weeks <= 0) {
    return null;
  }
  const weekly = parsedAmount / weeks;
  return formatWalletModalBalanceDisplay(String(weekly));
}
