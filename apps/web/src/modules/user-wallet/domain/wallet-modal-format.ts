export const WALLET_MODAL_BALANCE_DISPLAY_DECIMALS = 3;

/** Rounds modal balance labels down to 3 decimal places (legacy PowerSwitcher). */
export function formatWalletModalBalanceDisplay(value: string): string {
  const numeric = value.trim().split(/\s+/)[0] ?? value;
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  const factor = 10 ** WALLET_MODAL_BALANCE_DISPLAY_DECIMALS;
  const truncated = Math.floor(parsed * factor) / factor;
  return truncated.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: WALLET_MODAL_BALANCE_DISPLAY_DECIMALS,
  });
}

const RC_BILLION = 1_000_000_000;

/** RC delegation list quantity in billions (legacy: `1.23` with `b RC` symbol). */
export function formatRcDelegationBillions(rc: number): string {
  return (rc / RC_BILLION).toFixed(2);
}

/** RC modal balance label in billions (legacy: `430.218b RC`). */
export function formatHiveRcBillionsDisplay(rawRc: string): string {
  const parsed = Number.parseFloat(rawRc);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '0';
  }
  const billions = parsed / RC_BILLION;
  const factor = 10 ** WALLET_MODAL_BALANCE_DISPLAY_DECIMALS;
  const truncated = Math.floor(billions * factor) / factor;
  return truncated.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: WALLET_MODAL_BALANCE_DISPLAY_DECIMALS,
  });
}
