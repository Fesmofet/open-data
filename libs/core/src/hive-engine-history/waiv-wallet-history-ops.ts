/** Legacy `HISTORY_OPERATION_TYPES` from campaigns-v1. */
export const WAIV_HISTORY_REWARD_OPS = [
  'comments_curationReward',
  'comments_authorReward',
  'comments_beneficiaryReward',
] as const;

export type WaivHistoryRewardOp = (typeof WAIV_HISTORY_REWARD_OPS)[number];

/** Legacy `HISTORY_API_OPS` — Hive Engine accountHistory RPC filter (excludes swaps/airdrops). */
export const WAIV_WALLET_HISTORY_RPC_OPS = [
  'tokenfunds_checkPendingDtfs',
  'tokens_create',
  'tokens_issue',
  'tokens_transfer',
  'tokens_transferToContract',
  'tokens_transferFromContract',
  'tokens_updatePrecision',
  'tokens_updateUrl',
  'tokens_updateMetadata',
  'tokens_transferOwnership',
  'tokens_enableStaking',
  'tokens_enableDelegation',
  'tokens_stake',
  'tokens_unstakeStart',
  'tokens_unstakeDone',
  'tokens_cancelUnstake',
  'tokens_delegate',
  'tokens_undelegateStart',
  'tokens_undelegateDone',
  'tokens_transferFee',
  'market_cancel',
  'market_placeOrder',
  'market_expire',
  'market_buy',
  'market_buyRemaining',
  'market_sell',
  'market_sellRemaining',
  'market_close',
  'mining_lottery',
  'witnesses_proposeRound',
  'hivepegged_buy',
  'hivepegged_withdraw',
] as const;

export type WaivWalletHistoryRpcOp = (typeof WAIV_WALLET_HISTORY_RPC_OPS)[number];

export const WAIV_WALLET_HISTORY_SWAP_OP = 'marketpools_swapTokens' as const;
export const WAIV_WALLET_HISTORY_AIRDROP_OP = 'airdrops_newAirdrop' as const;

export const WAIV_WALLET_HISTORY_BUFFER = 100;

export function buildWaivWalletHistoryRpcOps(showRewards: boolean): string {
  const ops = showRewards
    ? [...WAIV_WALLET_HISTORY_RPC_OPS, ...WAIV_HISTORY_REWARD_OPS]
    : [...WAIV_WALLET_HISTORY_RPC_OPS];
  return ops.join(',');
}

export type WaivWalletHistoryRowKind =
  | 'transfer'
  | 'power_up'
  | 'power_down_start'
  | 'power_down_stop'
  | 'power_down_done'
  | 'delegate'
  | 'undelegate_start'
  | 'undelegate_done'
  | 'market_trade'
  | 'market_order'
  | 'market_cancel'
  | 'market_expire'
  | 'market_close'
  | 'market_partial'
  | 'lottery'
  | 'mining'
  | 'pegged_deposit'
  | 'pegged_withdraw'
  | 'author_reward'
  | 'curation_reward'
  | 'beneficiary_reward'
  | 'swap'
  | 'airdrop'
  | 'generic';

export function classifyWaivEngineOperation(
  operation: string,
): WaivWalletHistoryRowKind {
  switch (operation) {
    case 'tokens_transfer':
      return 'transfer';
    case 'tokens_stake':
      return 'power_up';
    case 'tokens_unstakeStart':
      return 'power_down_start';
    case 'tokens_unstakeDone':
      return 'power_down_done';
    case 'tokens_cancelUnstake':
      return 'power_down_stop';
    case 'tokens_delegate':
      return 'delegate';
    case 'tokens_undelegateStart':
      return 'undelegate_start';
    case 'tokens_undelegateDone':
      return 'undelegate_done';
    case 'market_buy':
    case 'market_sell':
      return 'market_trade';
    case 'market_placeOrder':
      return 'market_order';
    case 'market_cancel':
      return 'market_cancel';
    case 'market_expire':
      return 'market_expire';
    case 'market_close':
      return 'market_close';
    case 'market_buyRemaining':
    case 'market_sellRemaining':
      return 'market_partial';
    case 'tokens_issue':
      return 'mining';
    case 'mining_lottery':
      return 'lottery';
    case 'hivepegged_buy':
      return 'pegged_deposit';
    case 'hivepegged_withdraw':
      return 'pegged_withdraw';
    case 'comments_authorReward':
      return 'author_reward';
    case 'comments_curationReward':
      return 'curation_reward';
    case 'comments_beneficiaryReward':
      return 'beneficiary_reward';
    case WAIV_WALLET_HISTORY_SWAP_OP:
      return 'swap';
    case WAIV_WALLET_HISTORY_AIRDROP_OP:
      return 'airdrop';
    default:
      return 'generic';
  }
}
