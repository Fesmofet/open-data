/** Pinned pegged SWAP tokens shown first on the Hive Engine wallet tab. */
export const ENGINE_PINNED_SWAP_SYMBOLS = [
  'SWAP.HIVE',
  'SWAP.LTC',
  'SWAP.BTC',
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

/** Pegged SWAP tokens blocked from balance UI and deposit/withdraw/swap. */
export const ENGINE_DISABLED_PEGGED_SWAP_SYMBOLS = ['SWAP.ETH'] as const;

/** L1 symbols blocked for deposit (mint disabled pegged token). */
export const ENGINE_DISABLED_DEPOSIT_L1_SYMBOLS = ['ETH'] as const;

/** L1 withdraw outputs blocked (route through disabled pegged token). */
export const ENGINE_DISABLED_WITHDRAW_L1_SYMBOLS = ['ETH'] as const;

/** Two-hop WAIV routes (excludes SWAP.HIVE and disabled pegged). */
export const ENGINE_DOUBLE_SWAP_TO_WAIV_SYMBOLS = [
  'SWAP.LTC',
  'SWAP.BTC',
] as const;

export function isEngineDisabledPeggedSwapSymbol(symbol: string): boolean {
  const normalized = symbol.trim().toUpperCase();
  return (ENGINE_DISABLED_PEGGED_SWAP_SYMBOLS as readonly string[]).includes(
    normalized,
  );
}

export function isEngineDisabledDepositL1Symbol(symbol: string): boolean {
  const normalized = symbol.trim().toUpperCase();
  return (ENGINE_DISABLED_DEPOSIT_L1_SYMBOLS as readonly string[]).includes(
    normalized,
  );
}

export function isEngineDisabledWithdrawL1Symbol(symbol: string): boolean {
  const normalized = symbol.trim().toUpperCase();
  return (ENGINE_DISABLED_WITHDRAW_L1_SYMBOLS as readonly string[]).includes(
    normalized,
  );
}
