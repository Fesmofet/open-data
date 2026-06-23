import { HIVE_OP } from '../hive-account-history/operation-types';
import { isMutualTransaction, type AdvancedReportRecord } from './is-mutual-transaction';

export type WithdrawDepositKind = 'd' | 'w' | '';

export type ClassifyWithdrawDepositParams = {
  type: string;
  record: AdvancedReportRecord;
  userName: string;
  filterAccounts: readonly string[];
};

function powerDepositWithdraw(
  record: AdvancedReportRecord,
  userName: string,
): WithdrawDepositKind {
  const from = (record.from ?? '').trim().toLowerCase();
  const to = (record.to ?? '').trim().toLowerCase();
  const user = userName.trim().toLowerCase();
  if (from === user && to !== user) {
    return 'w';
  }
  if (from !== user && to === user) {
    return 'd';
  }
  return '';
}

/**
 * Classifies a row for deposit/withdraw totals (`d` / `w` / excluded `''`).
 */
export function classifyWithdrawDeposit(
  params: ClassifyWithdrawDepositParams,
): WithdrawDepositKind {
  const { type, record, userName, filterAccounts } = params;

  if (
    isMutualTransaction({
      record: { ...record, type },
      userName,
      filterAccounts,
    })
  ) {
    return '';
  }

  switch (type) {
    case HIVE_OP.TRANSFER:
      return (record.to ?? '').trim().toLowerCase() === userName.trim().toLowerCase()
        ? 'd'
        : 'w';
    case HIVE_OP.TRANSFER_TO_VESTING:
    case HIVE_OP.FILL_VESTING_WITHDRAW:
      return powerDepositWithdraw(record, userName);
    case HIVE_OP.CLAIM_REWARD_BALANCE:
    case HIVE_OP.INTEREST:
      return 'd';
    case HIVE_OP.PROPOSAL_PAY:
      return 'w';
    default:
      return '';
  }
}
