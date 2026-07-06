/** Pinned pegged SWAP tokens shown first on the Hive Engine wallet tab. */
export const ENGINE_PINNED_SWAP_SYMBOLS = [
  'SWAP.HIVE',
  'SWAP.LTC',
  'SWAP.BTC',
  'SWAP.ETH',
] as const;

export type EnginePinnedSwapSymbol = (typeof ENGINE_PINNED_SWAP_SYMBOLS)[number];

/** Symbols excluded from the "other tokens" balance list (pinned + WAIV). */
export const ENGINE_WALLET_EXCLUDED_SYMBOLS = [
  'WAIV',
  ...ENGINE_PINNED_SWAP_SYMBOLS,
] as const;

/** Symbols excluded from ENGINE wallet history (WAIV has its own tab). */
export const ENGINE_HISTORY_EXCLUDED_SYMBOLS = ['WAIV'] as const;

/** Minimum liquid or staked balance to show a non-SWAP token row. */
export const ENGINE_WALLET_MIN_DISPLAY_BALANCE = 0.001;
