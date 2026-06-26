import {
  WAIV_HISTORY_REWARD_OPS,
  WAIV_WALLET_HISTORY_AIRDROP_OP,
  WAIV_WALLET_HISTORY_SWAP_OP,
} from '../hive-engine-history/waiv-wallet-history-ops';

/** RPC ops that can produce classified advanced-report rows (legacy ADVANCED_WALLET_TYPES). */
export const WAIV_ADVANCED_REPORT_BASE_RPC_OPS = [
  'tokens_transfer',
  'tokens_stake',
  'mining_lottery',
  'tokens_issue',
] as const;

export type WaivAdvancedReportBaseRpcOp =
  (typeof WAIV_ADVANCED_REPORT_BASE_RPC_OPS)[number];

export const WAIV_ADVANCED_REPORT_MARKET_RPC_OPS = [
  'market_buy',
  'market_sell',
] as const;

export type WaivAdvancedReportMarketRpcOp =
  (typeof WAIV_ADVANCED_REPORT_MARKET_RPC_OPS)[number];

export const WAIV_ADVANCED_REPORT_PG_SWAP_OP = WAIV_WALLET_HISTORY_SWAP_OP;
export const WAIV_ADVANCED_REPORT_PG_AIRDROP_OP = WAIV_WALLET_HISTORY_AIRDROP_OP;

export function buildWaivAdvancedReportRpcOps(
  includeSwapsAndTrades: boolean,
): string {
  const ops = [
    ...WAIV_ADVANCED_REPORT_BASE_RPC_OPS,
    ...WAIV_HISTORY_REWARD_OPS,
    ...(includeSwapsAndTrades ? WAIV_ADVANCED_REPORT_MARKET_RPC_OPS : []),
  ];
  return ops.join(',');
}

export function isWaivAdvancedReportPgSwapEnabled(
  includeSwapsAndTrades: boolean,
): boolean {
  return includeSwapsAndTrades;
}
