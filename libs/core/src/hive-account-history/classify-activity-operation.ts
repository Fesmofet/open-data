import { parseCustomJsonOp } from './parse-custom-json';
import { CUSTOM_JSON_ID, HIVE_OP } from './operation-types';

export type ActivityRowKind =
  | 'hidden'
  | 'vote'
  | 'comment'
  | 'delete_comment'
  | 'custom_follow'
  | 'custom_reblog'
  | 'custom_follow_object'
  | 'account_create'
  | 'account_update'
  | 'reward_author'
  | 'reward_curation'
  | 'witness_vote'
  | 'wallet_transfer'
  | 'wallet_power_up'
  | 'wallet_savings'
  | 'wallet_claim_rewards'
  | 'wallet_delegate'
  | 'wallet_power_down'
  | 'wallet_convert'
  | 'wallet_fill_order'
  | 'wallet_limit_order'
  | 'generic';

export function classifyActivityOperation(
  operationType: string,
  payload: Record<string, unknown>,
): ActivityRowKind {
  if (operationType === HIVE_OP.EFFECTIVE_COMMENT_VOTE) {
    return 'hidden';
  }

  switch (operationType) {
    case HIVE_OP.VOTE:
      return 'vote';
    case HIVE_OP.COMMENT:
      return 'comment';
    case HIVE_OP.DELETE_COMMENT:
      return 'delete_comment';
    case HIVE_OP.ACCOUNT_CREATE:
    case HIVE_OP.ACCOUNT_CREATE_WITH_DELEGATION:
      return 'account_create';
    case HIVE_OP.ACCOUNT_UPDATE:
    case HIVE_OP.ACCOUNT_UPDATE2:
      return 'account_update';
    case HIVE_OP.AUTHOR_REWARD:
      return 'reward_author';
    case HIVE_OP.CURATION_REWARD:
      return 'reward_curation';
    case HIVE_OP.ACCOUNT_WITNESS_VOTE:
      return 'witness_vote';
    case HIVE_OP.TRANSFER:
      return 'wallet_transfer';
    case HIVE_OP.TRANSFER_TO_VESTING:
      return 'wallet_power_up';
    case HIVE_OP.TRANSFER_TO_SAVINGS:
    case HIVE_OP.TRANSFER_FROM_SAVINGS:
    case HIVE_OP.CANCEL_TRANSFER_FROM_SAVINGS:
    case HIVE_OP.FILL_TRANSFER_FROM_SAVINGS:
    case HIVE_OP.TRANSFER_TO_VESTING_COMPLETED:
    case HIVE_OP.INTEREST:
      return 'wallet_savings';
    case HIVE_OP.CLAIM_REWARD_BALANCE:
      return 'wallet_claim_rewards';
    case HIVE_OP.DELEGATE_VESTING_SHARES:
      return 'wallet_delegate';
    case HIVE_OP.WITHDRAW_VESTING:
    case HIVE_OP.SET_WITHDRAW_VESTING_ROUTE:
    case HIVE_OP.FILL_VESTING_WITHDRAW:
      return 'wallet_power_down';
    case HIVE_OP.CONVERT:
    case HIVE_OP.FILL_CONVERT_REQUEST:
    case HIVE_OP.COLLATERALIZED_CONVERT:
    case HIVE_OP.FILL_COLLATERALIZED_CONVERT_REQUEST:
      return 'wallet_convert';
    case HIVE_OP.FILL_ORDER:
      return 'wallet_fill_order';
    case HIVE_OP.LIMIT_ORDER:
      return 'wallet_limit_order';
    case HIVE_OP.CUSTOM_JSON: {
      const id = typeof payload['id'] === 'string' ? payload['id'] : '';
      const json = typeof payload['json'] === 'string' ? payload['json'] : '';
      const parsed = parseCustomJsonOp(id, json);
      if (parsed.kind === 'reblog') {
        return 'custom_reblog';
      }
      if (parsed.kind === 'follow') {
        return 'custom_follow';
      }
      if (parsed.kind === 'follow_object') {
        return 'custom_follow_object';
      }
      if (id === CUSTOM_JSON_ID.WOBJ_RATING) {
        return 'generic';
      }
      return 'generic';
    }
    default:
      return 'generic';
  }
}
