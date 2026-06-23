import { HIVE_OPERATION_INDEX } from '../hive-account-history/operation-indices';
import { HIVE_OP } from '../hive-account-history/operation-types';

/** Hive operation types included in the advanced wallet report (legacy ADVANCED_WALLET_TYPES). */
export const ADVANCED_REPORT_HIVE_OPS = [
  HIVE_OP.TRANSFER,
  HIVE_OP.TRANSFER_TO_VESTING,
  HIVE_OP.CLAIM_REWARD_BALANCE,
  HIVE_OP.LIMIT_ORDER_CANCEL,
  HIVE_OP.FILL_ORDER,
  HIVE_OP.PROPOSAL_PAY,
  HIVE_OP.FILL_VESTING_WITHDRAW,
  HIVE_OP.INTEREST,
] as const;

export type AdvancedReportHiveOp = (typeof ADVANCED_REPORT_HIVE_OPS)[number];

const ADVANCED_REPORT_OP_SET = new Set<string>(ADVANCED_REPORT_HIVE_OPS);

const ADVANCED_REPORT_OP_TO_INDEX: Record<string, number> = {
  [HIVE_OP.TRANSFER]: HIVE_OPERATION_INDEX.transfer,
  [HIVE_OP.TRANSFER_TO_VESTING]: HIVE_OPERATION_INDEX.transfer_to_vesting,
  [HIVE_OP.CLAIM_REWARD_BALANCE]: HIVE_OPERATION_INDEX.claim_reward_balance,
  [HIVE_OP.LIMIT_ORDER_CANCEL]: HIVE_OPERATION_INDEX.limit_order_cancel,
  [HIVE_OP.FILL_ORDER]: HIVE_OPERATION_INDEX.fill_order,
  [HIVE_OP.PROPOSAL_PAY]: HIVE_OPERATION_INDEX.proposal_pay,
  [HIVE_OP.FILL_VESTING_WITHDRAW]: HIVE_OPERATION_INDEX.fill_vesting_withdraw,
  [HIVE_OP.INTEREST]: HIVE_OPERATION_INDEX.interest,
};

export function isAdvancedReportOperation(operationType: string): boolean {
  return ADVANCED_REPORT_OP_SET.has(operationType);
}

/** Hive protocol indices for advanced-report RPC bitmask. */
export function getAdvancedReportOperationIndices(): readonly number[] {
  return [...new Set(Object.values(ADVANCED_REPORT_OP_TO_INDEX))];
}
