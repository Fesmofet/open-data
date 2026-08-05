/** Default trade fee multiplier when marketpools params are unavailable. */
export const DEFAULT_TRADE_FEE_MUL = '0.9975';

/** Withdraw predictive amount multiplier (0.75% fee). */
export const DEFAULT_WITHDRAW_FEE_MUL = 0.9925;

/** UI swap default slippage (0.5%). */
export const DEFAULT_SWAP_SLIPPAGE = 0.005;

/** First-hop slippage for withdraw multi-hop swaps. */
export const DEFAULT_WITHDRAW_SLIPPAGE = 0.0001;

/** Subsequent-hop slippage for withdraw multi-hop swaps. */
export const DEFAULT_WITHDRAW_SLIPPAGE_MAX = 0.005;

export const SWAP_IMPACT_PERCENT_OPTIONS = [0.5, 1, 5, 10, 25, 49] as const;

export const AVAILABLE_TOKEN_WITHDRAW: Readonly<Record<string, string>> = {
  BTC: 'SWAP.BTC',
  HIVE: 'SWAP.HIVE',
  LTC: 'SWAP.LTC',
  HBD: 'SWAP.HBD',
};

export type WithdrawOutputSymbol = keyof typeof AVAILABLE_TOKEN_WITHDRAW;
