/**
 * Hive protocol operation indices (`libraries/protocol/include/hive/protocol/operations.hpp`).
 * Used for `get_account_history` operation_filter_low / operation_filter_high bitmasks.
 */
export const HIVE_OPERATION_INDEX = {
  vote: 0,
  comment: 1,
  transfer: 2,
  transfer_to_vesting: 3,
  withdraw_vesting: 4,
  limit_order_create: 5,
  limit_order_cancel: 6,
  convert: 8,
  account_create: 9,
  account_update: 10,
  account_witness_vote: 12,
  delete_comment: 17,
  custom_json: 18,
  set_withdraw_vesting_route: 20,
  limit_order_create2: 21,
  transfer_to_savings: 32,
  transfer_from_savings: 33,
  cancel_transfer_from_savings: 34,
  claim_reward_balance: 39,
  delegate_vesting_shares: 40,
  account_create_with_delegation: 41,
  account_update2: 43,
  collateralized_convert: 48,
  /** Virtual ops start after recurrent_transfer (49). */
  fill_convert_request: 50,
  author_reward: 51,
  curation_reward: 52,
  interest: 55,
  fill_vesting_withdraw: 56,
  fill_order: 57,
  fill_transfer_from_savings: 59,
  proposal_pay: 66,
  transfer_to_vesting_completed: 78,
  fill_collateralized_convert_request: 82,
} as const;

export type HiveOperationIndex =
  (typeof HIVE_OPERATION_INDEX)[keyof typeof HIVE_OPERATION_INDEX];
