/** Token / shield row icons — keep HIVE and WAIV wallet tabs visually aligned. */
export const WALLET_ROW_TOKEN_ICON_PX = 22;

/** Power lightning — slightly larger than token and savings shield icons. */
export const WALLET_ROW_POWER_ICON_WIDTH = 24;
export const WALLET_ROW_POWER_ICON_HEIGHT = 26;

export function WalletPowerLightningIcon() {
  return (
    <svg
      width={WALLET_ROW_POWER_ICON_WIDTH}
      height={WALLET_ROW_POWER_ICON_HEIGHT}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
