import {
  WAIV_ADVANCED_REPORT_PG_AIRDROP_OP,
  WAIV_ADVANCED_REPORT_PG_SWAP_OP,
} from './waiv-advanced-report-ops';
import {
  isWaivMutualTransaction,
  type WaivAdvancedReportRecord,
} from './is-waiv-mutual-transaction';
import type { WithdrawDepositKind } from '../hive-advanced-report/classify-withdraw-deposit';

export type ClassifyWaivWithdrawDepositParams = {
  type: string;
  record: WaivAdvancedReportRecord & {
    symbolOut?: string;
    to?: string;
    from?: string;
  };
  userName: string;
  filterAccounts: readonly string[];
  waivSymbol?: string;
};

function normalizeAccount(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Classifies a WAIV advanced-report row for deposit/withdraw totals.
 * Legacy parity: `getWalletAdvancedReport.js` `withdrawDeposit`.
 */
export function classifyWaivWithdrawDeposit(
  params: ClassifyWaivWithdrawDepositParams,
): WithdrawDepositKind {
  const { type, record, userName, filterAccounts } = params;
  const waivSymbol = (params.waivSymbol ?? 'WAIV').trim().toUpperCase();
  const user = normalizeAccount(userName);

  if (
    isWaivMutualTransaction({
      record: { type, from: record.from, to: record.to },
      userName,
      filterAccounts,
    })
  ) {
    return '';
  }

  switch (type) {
    case 'tokens_transfer':
      return normalizeAccount(record.to) === user ? 'd' : 'w';
    case 'tokens_stake': {
      const from = normalizeAccount(record.from);
      const to = normalizeAccount(record.to);
      if (from !== user) {
        return 'd';
      }
      if (to === user) {
        return '';
      }
      return 'w';
    }
    case 'comments_authorReward':
    case 'comments_beneficiaryReward':
    case 'comments_curationReward':
      return normalizeAccount(record.to) === user ? 'd' : 'w';
    case 'mining_lottery':
    case 'tokens_issue':
    case WAIV_ADVANCED_REPORT_PG_AIRDROP_OP:
      return 'd';
    case WAIV_ADVANCED_REPORT_PG_SWAP_OP:
      return (record.symbolOut ?? '').trim().toUpperCase() === waivSymbol
        ? 'd'
        : 'w';
    case 'market_buy':
      return 'd';
    case 'market_sell':
      return 'w';
    default:
      return '';
  }
}
