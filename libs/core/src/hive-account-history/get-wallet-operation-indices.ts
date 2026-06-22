import { HIVE_OPERATION_INDEX } from './operation-indices';
import { HIVE_OP } from './operation-types';

/** Maps wallet operation type strings to Hive protocol operation indices for bit masks. */
const WALLET_OP_TO_INDEX: Record<string, number> = {
  [HIVE_OP.TRANSFER]: HIVE_OPERATION_INDEX.transfer,
  [HIVE_OP.TRANSFER_TO_VESTING]: HIVE_OPERATION_INDEX.transfer_to_vesting,
  [HIVE_OP.WITHDRAW_VESTING]: HIVE_OPERATION_INDEX.withdraw_vesting,
  [HIVE_OP.LIMIT_ORDER]: HIVE_OPERATION_INDEX.limit_order_create,
  [HIVE_OP.LIMIT_ORDER_CREATE2]: HIVE_OPERATION_INDEX.limit_order_create2,
  [HIVE_OP.LIMIT_ORDER_CANCEL]: HIVE_OPERATION_INDEX.limit_order_cancel,
  [HIVE_OP.CONVERT]: HIVE_OPERATION_INDEX.convert,
  [HIVE_OP.SET_WITHDRAW_VESTING_ROUTE]: HIVE_OPERATION_INDEX.set_withdraw_vesting_route,
  [HIVE_OP.TRANSFER_TO_SAVINGS]: HIVE_OPERATION_INDEX.transfer_to_savings,
  [HIVE_OP.TRANSFER_FROM_SAVINGS]: HIVE_OPERATION_INDEX.transfer_from_savings,
  [HIVE_OP.CANCEL_TRANSFER_FROM_SAVINGS]:
    HIVE_OPERATION_INDEX.cancel_transfer_from_savings,
  [HIVE_OP.CLAIM_REWARD_BALANCE]: HIVE_OPERATION_INDEX.claim_reward_balance,
  [HIVE_OP.DELEGATE_VESTING_SHARES]: HIVE_OPERATION_INDEX.delegate_vesting_shares,
  [HIVE_OP.COLLATERALIZED_CONVERT]: HIVE_OPERATION_INDEX.collateralized_convert,
  [HIVE_OP.FILL_CONVERT_REQUEST]: HIVE_OPERATION_INDEX.fill_convert_request,
  [HIVE_OP.INTEREST]: HIVE_OPERATION_INDEX.interest,
  [HIVE_OP.FILL_VESTING_WITHDRAW]: HIVE_OPERATION_INDEX.fill_vesting_withdraw,
  [HIVE_OP.FILL_ORDER]: HIVE_OPERATION_INDEX.fill_order,
  [HIVE_OP.FILL_TRANSFER_FROM_SAVINGS]:
    HIVE_OPERATION_INDEX.fill_transfer_from_savings,
  [HIVE_OP.PROPOSAL_PAY]: HIVE_OPERATION_INDEX.proposal_pay,
  [HIVE_OP.TRANSFER_TO_VESTING_COMPLETED]:
    HIVE_OPERATION_INDEX.transfer_to_vesting_completed,
  [HIVE_OP.FILL_COLLATERALIZED_CONVERT_REQUEST]:
    HIVE_OPERATION_INDEX.fill_collateralized_convert_request,
};

/** All Hive protocol indices for wallet history operations (deduplicated). */
export function getWalletOperationIndices(): readonly number[] {
  return [...new Set(Object.values(WALLET_OP_TO_INDEX))];
}
